import { GoogleGenAI, Type } from "@google/genai";
import { Task, Project, TeamMember, ProjectGroup } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const breakDownTask = async (taskTitle: string, taskDescription: string): Promise<string[]> => {
  const ai = getAiClient();
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      subtasks: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of actionable subtasks"
      }
    },
    required: ["subtasks"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Break down the project management task "${taskTitle}: ${taskDescription}" into 3-5 concise, actionable subtasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text);
    return data.subtasks || [];
  } catch (error) {
    console.error("Error breaking down task:", error);
    return ["Could not generate subtasks. Please try again."];
  }
};

export const suggestResources = async (query: string): Promise<{ title: string; uri: string }[]> => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find useful resources or documentation for: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const resources: { title: string; uri: string }[] = [];

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          resources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }
    
    // De-duplicate based on URI
    return resources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i).slice(0, 5);
  } catch (error) {
    console.error("Error searching resources:", error);
    return [];
  }
};

export const chatWithProject = async (message: string, currentTasks: Task[]) => {
  const ai = getAiClient();
  
  const systemInstruction = `
    You are Nexus, an intelligent project management assistant integrated with Google Workspace.
    You have access to the current project state: ${JSON.stringify(currentTasks.map(t => ({ title: t.title, status: t.status || 'None', priority: t.priority })))}.
    
    Answer questions about the project status, suggest improvements, or help draft content for tasks.
    If asked to email or chat, explain you can draft the content but the user needs to click the link to send it.
    Be concise, professional, and helpful.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    
    return response.text || "I didn't catch that.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I'm having trouble connecting to the AI service right now.";
  }
};

export const draftUpdateEmail = async (project: Project, tasks: Task[]): Promise<{subject: string, body: string}> => {
  const ai = getAiClient();
  
  const completed = tasks.filter(t => t.completed).map(t => t.title);
  const pending = tasks.filter(t => !t.completed).map(t => t.title);

  const prompt = `
    Draft a professional project update email for project "${project.name}".
    Completed items: ${completed.join(', ')}.
    Pending items: ${pending.join(', ')}.
    Return JSON with 'subject' and 'body' fields. The body should be plain text, suitable for a gmail body parameter.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      body: { type: Type.STRING }
    },
    required: ["subject", "body"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error drafting email:", error);
    return { subject: `Update: ${project.name}`, body: "Here is the latest project status..." };
  }
};

export const generateProjectInsights = async (project: Project, tasks: Task[]): Promise<{
  executiveSummary: string;
  strategicBlockers: string[];
  budgetVelocity: string;
  timelineConfidence: string;
}> => {
  const ai = getAiClient();

  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed);
  const critical = tasks.filter(t => t.priority === 'Critical' && !t.completed);

  const prompt = `
    Act as a Senior Project Manager generating an Executive Brief for Senior Leadership regarding project "${project.name}".
    
    Context:
    - Status: ${project.status}
    - Budget: ${project.budget || 'Unknown'}
    - Tasks Total: ${tasks.length}
    - Overdue: ${overdue.length}
    - Critical Issues: ${critical.length}

    Provide a JSON response with:
    1. 'executiveSummary': A 2-3 sentence high-level health check suitable for a CEO. Focus on outcome and velocity, not just task counts.
    2. 'strategicBlockers': A list of 2 major risks that could derail the project strategy (based on overdue/critical tasks).
    3. 'budgetVelocity': A short phrase describing if we are burning budget too fast, too slow, or on track.
    4. 'timelineConfidence': A percentage (e.g., "High (85%)") and a 5-word explanation.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      executiveSummary: { type: Type.STRING },
      strategicBlockers: { type: Type.ARRAY, items: { type: Type.STRING } },
      budgetVelocity: { type: Type.STRING },
      timelineConfidence: { type: Type.STRING }
    },
    required: ["executiveSummary", "strategicBlockers", "budgetVelocity", "timelineConfidence"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      executiveSummary: "Data insufficient for executive summary.",
      strategicBlockers: ["Unable to calculate risks."],
      budgetVelocity: "Unknown",
      timelineConfidence: "Low (Data Error)"
    };
  }
};

export const analyzeTeamWorkload = async (deptName: string, members: TeamMember[], tasks: Task[]): Promise<string> => {
  const ai = getAiClient();
  
  // Calculate load per member
  const loadSummary = members.map(m => {
    const active = tasks.filter(t => t.assignee === m.id && !t.completed);
    const estHours = active.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
    return `${m.name}: ${active.length} tasks, ${estHours} hours`;
  }).join('\n');

  const prompt = `
    Analyze the workload for the ${deptName} department.
    
    Current Load:
    ${loadSummary}
    
    Provide 3 concise, bulleted recommendations to balance the workload or improve efficiency. 
    Focus on redistribution or capacity alerts.
    Return plain text with bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "Unable to analyze workload.";
  } catch (error) {
    console.error("Workload analysis error", error);
    return "AI service unavailable.";
  }
};

export const generatePortfolioInsights = async (groups: ProjectGroup[], projects: Project[], tasks: Task[]): Promise<{
  portfolioHealth: string;
  topRisks: string[];
  allocationAlerts: string[];
}> => {
  const ai = getAiClient();

  const activeProjects = projects.filter(p => p.status === 'Active');
  const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length;

  const prompt = `
    Act as a Portfolio Director. Analyze this portfolio of ${projects.length} projects (${activeProjects.length} active).
    Total Tasks: ${tasks.length}. Overdue Tasks: ${overdueCount}.
    
    Groups: ${groups.map(g => g.name).join(', ')}.

    Provide a JSON response for a Leadership Report:
    1. 'portfolioHealth': A qualitative statement (2 sentences) on the overall health and velocity of the portfolio.
    2. 'topRisks': 2 specific, high-level risks derived from the data (e.g., "High overdue volume in X").
    3. 'allocationAlerts': 2 concise bullet points about resource allocation or budget pacing (infer from general status).
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      portfolioHealth: { type: Type.STRING },
      topRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
      allocationAlerts: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["portfolioHealth", "topRisks", "allocationAlerts"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Portfolio analysis error", error);
    return {
      portfolioHealth: "Unable to generate health report.",
      topRisks: ["AI Service Unavailable"],
      allocationAlerts: ["Check manual data"]
    };
  }
};