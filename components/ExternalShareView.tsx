import React from 'react';
import { Project, Task, TeamMember, OrganizationSettings, COLUMNS } from '../types';
import { Download, X, Calendar, CheckCircle2, AlertCircle, Clock, Layout, Building2, Globe, Phone, Mail, BarChart2, Check } from 'lucide-react';

// Date helpers
const getDaysDiff = (date1: Date, date2: Date): number => {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// --- Sub-component for Gantt Chart ---
const PrintableGanttChart: React.FC<{ tasks: Task[], project: Project }> = ({ tasks, project }) => {
    const tasksWithDates = tasks
        .filter(t => t.dueDate && t.startDate)
        .sort((a,b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    
    if (tasksWithDates.length === 0) return <p className="text-center text-gray-500 italic">No tasks with start and end dates to display.</p>;
    
    const projectStart = new Date(Math.min(...tasksWithDates.map(t => new Date(t.startDate!).getTime())));
    const projectEnd = new Date(Math.max(...tasksWithDates.map(t => new Date(t.dueDate!).getTime())));
    
    const totalDays = getDaysDiff(projectStart, projectEnd) + 1;
    
    return (
        <div className="space-y-4">
            {tasksWithDates.map(task => {
                const start = new Date(task.startDate!);
                const end = new Date(task.dueDate!);
                
                const offsetDays = getDaysDiff(projectStart, start);
                const durationDays = getDaysDiff(start, end) + 1;
                
                const offsetPercent = (offsetDays / totalDays) * 100;
                const durationPercent = (durationDays / totalDays) * 100;

                const color = task.completed ? 'bg-gray-400' : (new Date() > end ? 'bg-red-500' : 'bg-blue-500');

                return (
                    <div key={task.id} className="grid grid-cols-4 gap-4 items-center">
                        <div className="col-span-1">
                            <div className="truncate text-sm font-medium text-gray-800" title={task.title}>
                                {task.title}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                                {start.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {end.toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                            </div>
                        </div>
                        <div className="col-span-3 h-8 bg-gray-100 rounded-md relative">
                            <div 
                                className={`absolute h-full rounded-md ${color} transition-all`}
                                style={{ left: `${offsetPercent}%`, width: `${durationPercent}%` }}
                            >
                                <div className="absolute inset-0 flex items-center px-2">
                                    <span className={`text-[10px] font-bold text-white truncate ${durationPercent < 5 ? 'hidden' : ''}`}>{task.title}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


interface ExternalShareViewProps {
  project: Project;
  tasks: Task[];
  team: TeamMember[];
  orgSettings: OrganizationSettings;
  onClose: () => void;
}

export const ExternalShareView: React.FC<ExternalShareViewProps> = ({ 
  project, 
  tasks, 
  team, 
  orgSettings, 
  onClose 
}) => {
  // Data Processing
  const projectColumns = project.columns || COLUMNS;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed);
  const criticalTasks = tasks.filter(t => t.priority === 'Critical' && !t.completed);
  
  // Determine Project Health
  let healthStatus: 'On Track' | 'At Risk' | 'Off Track' = 'On Track';
  let healthColor = 'text-green-600 bg-green-50 border-green-200';
  
  if (criticalTasks.length > 0 || overdueTasks.length > 2) {
      healthStatus = 'Off Track';
      healthColor = 'text-red-600 bg-red-50 border-red-200';
  } else if (overdueTasks.length > 0) {
      healthStatus = 'At Risk';
      healthColor = 'text-orange-600 bg-orange-50 border-orange-200';
  }

  // Milestones (High priority or specifically tagged tasks)
  const upcomingMilestones = tasks
    .filter(t => !t.completed && (t.priority === 'High' || t.priority === 'Critical' || t.tags.includes('Milestone')))
    .sort((a,b) => new Date(a.dueDate || '').getTime() - new Date(a.dueDate || '').getTime())
    .slice(0, 5);

  const completedMilestones = tasks
    .filter(t => t.completed && (t.priority === 'High' || t.priority === 'Critical' || t.tags.includes('Milestone')))
    .sort((a,b) => new Date(b.dueDate || '').getTime() - new Date(a.dueDate || '').getTime()) // Newest first
    .slice(0, 3);

  const projectOwner = team.find(t => t.id === project.ownerId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 overflow-auto flex flex-col items-center">
      
      {/* Floating Toolbar (Hidden when printing) */}
      <div className="fixed bottom-6 right-6 flex gap-3 print:hidden z-50">
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-50 font-medium transition-transform hover:-translate-y-1"
        >
          Close
        </button>
        <button 
          onClick={handlePrint}
          className="px-6 py-3 bg-nexus-primary text-white rounded-full shadow-lg hover:bg-indigo-600 font-medium flex items-center gap-2 transition-transform hover:-translate-y-1"
        >
          <Download size={18} /> Download PDF
        </button>
      </div>

      {/* Report Container */}
      <div id="report-content" className="w-full max-w-[850px] bg-white my-8 shadow-2xl print:shadow-none print:my-0 print:w-full print:max-w-none">
        
        {/* Page 1: Summary */}
        <div className="page min-h-[1100px] relative flex flex-col">
            <div className="h-3 w-full bg-gradient-to-r from-nexus-primary via-nexus-purple to-nexus-teal"></div>
            <div className="p-12 space-y-10 flex-1">
                {/* Header Section */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.name}</h1>
                        <p className="text-gray-500 text-lg">Project Status Report</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 font-bold text-gray-800 text-xl mb-1">
                            <Building2 size={20} className="text-nexus-primary"/> {orgSettings.name}
                        </div>
                        <p className="text-gray-400 text-sm">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* Executive Summary & Health */}
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Executive Summary</h3>
                        <p className="text-gray-700 leading-relaxed text-sm">
                            {project.description || "No description provided."} This report outlines the current progress, completed milestones, and upcoming strategic deliverables for the {project.name} initiative.
                        </p>
                        
                        <div className="flex gap-6 pt-4">
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{Math.round(progress)}%</div>
                                <div className="text-xs text-gray-500 font-medium uppercase mt-1">Completion</div>
                            </div>
                            <div className="w-px bg-gray-200"></div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
                                <div className="text-xs text-gray-500 font-medium uppercase mt-1">Total Tasks</div>
                            </div>
                            <div className="w-px bg-gray-200"></div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{new Date(project.dueDate || '').toLocaleDateString()}</div>
                                <div className="text-xs text-gray-500 font-medium uppercase mt-1">Target Launch</div>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-xl p-6 border ${healthColor} flex flex-col items-center justify-center text-center`}>
                        <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Project Health</div>
                        <div className="text-2xl font-bold mb-1">{healthStatus}</div>
                        {healthStatus === 'On Track' ? (
                            <CheckCircle2 size={32} />
                        ) : (
                            <AlertCircle size={32} />
                        )}
                    </div>
                </div>

                {/* Timeline Visual */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Timeline Progress</h3>
                    <div className="relative pt-2">
                        <div className="flex justify-between text-xs text-gray-500 font-medium mb-2">
                            <span>Start: {new Date(project.startDate || '').toLocaleDateString()}</span>
                            <span>Due: {new Date(project.dueDate || '').toLocaleDateString()}</span>
                        </div>
                        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-nexus-primary to-nexus-teal" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Key Updates / Milestones */}
                <div className="grid grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CheckCircle2 size={16}/> Recently Completed
                        </h3>
                        {completedMilestones.length > 0 ? (
                            <div className="space-y-4">
                                {completedMilestones.map(t => (
                                    <div key={t.id} className="flex gap-3 items-start">
                                        <div className="mt-1 min-w-[4px] h-[4px] rounded-full bg-gray-300"></div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800 line-through decoration-gray-300">{t.title}</div>
                                            <div className="text-xs text-gray-400">Completed on {new Date().toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No major milestones completed recently.</p>
                        )}
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-nexus-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Clock size={16}/> Upcoming Deliverables
                        </h3>
                        {upcomingMilestones.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingMilestones.map(t => (
                                    <div key={t.id} className="flex gap-3 items-start bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                        <div className="mt-1"><div className="w-2 h-2 rounded-full bg-nexus-primary"></div></div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">{t.title}</div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2"><Calendar size={10} /> Due {new Date(t.dueDate || '').toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No pending major milestones.</p>
                        )}
                    </div>
                </div>

                {/* Footer / Contact */}
                <div className="mt-auto pt-8 border-t border-gray-100 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Project Contact</h3>
                        {projectOwner ? (
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${projectOwner.color}`}>{projectOwner.initials}</div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{projectOwner.name}</div>
                                    <div className="text-gray-500 text-xs">{projectOwner.role}</div>
                                    <div className="text-nexus-primary text-xs mt-0.5">{projectOwner.email}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">Unassigned</div>
                        )}
                    </div>
                    <div className="text-right space-y-1">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Company Info</h3>
                        <div className="text-sm text-gray-600 flex items-center justify-end gap-2"><Globe size={12}/> {orgSettings.domain}</div>
                        <div className="text-sm text-gray-600 flex items-center justify-end gap-2"><Mail size={12}/> {orgSettings.supportEmail}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Page 2: Gantt Chart */}
        <div className="page break-before min-h-[1100px] relative flex flex-col">
            <div className="h-3 w-full bg-gradient-to-r from-nexus-primary via-nexus-purple to-nexus-teal"></div>
            <div className="p-12 space-y-8 flex-1">
                 <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2 border-b border-gray-100 pb-4">
                    <BarChart2 size={24} className="text-nexus-primary"/> Project Plan & Timeline
                 </h2>
                 <PrintableGanttChart tasks={tasks} project={project} />
            </div>
            <div className="p-12 text-center text-xs text-gray-400">Page 2 of 3</div>
        </div>
        
        {/* Page 3: Task List */}
        <div className="page break-before min-h-[1100px] relative flex flex-col">
            <div className="h-3 w-full bg-gradient-to-r from-nexus-primary via-nexus-purple to-nexus-teal"></div>
            <div className="p-12 space-y-8 flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2 border-b border-gray-100 pb-4">
                    <Layout size={24} className="text-nexus-primary"/> Task Breakdown
                </h2>
                <div className="space-y-8">
                    {projectColumns.map(column => {
                        const columnTasks = tasks.filter(t => t.status === column.id);
                        if (columnTasks.length === 0) return null;

                        const color = column.color || 'gray';
                        const colorClasses = `bg-${color}-100 text-${color}-800 border-${color}-200`;

                        return (
                            <div key={column.id}>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border ${colorClasses}`}>
                                    {column.title}
                                    <span className="text-xs font-mono bg-white text-gray-600 px-1.5 rounded-full">{columnTasks.length}</span>
                                </div>
                                <div className="mt-4 border border-gray-100 rounded-lg">
                                    <div className="divide-y divide-gray-100">
                                    {columnTasks.map(task => {
                                        const assignee = team.find(t => t.id === task.assignee);
                                        return (
                                        <div key={task.id} className="p-4 grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-1 flex justify-center">
                                                {task.completed ? <CheckCircle2 size={20} className="text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>}
                                            </div>
                                            <div className="col-span-6">
                                                <p className={`font-medium text-gray-800 ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                                            </div>
                                            <div className="col-span-3 flex items-center gap-2">
                                                {assignee && (
                                                    <>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${assignee.color}`}>{assignee.initials}</div>
                                                        <span className="text-xs text-gray-600">{assignee.name}</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="col-span-2 text-right text-xs text-gray-500">
                                                {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
                                            </div>
                                        </div>
                                        );
                                    })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="p-12 text-center text-xs text-gray-400">Page 3 of 3</div>
        </div>
        
        <style>{`
            @media print {
                @page { margin: 0; size: A4; }
                html, body { background: white; -webkit-print-color-adjust: exact; color-adjust: exact; }
                #report-content { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
                .page { min-height: 0; }
                .break-before { page-break-before: always; }
                body > *:not(#report-content) { display: none; }
                #report-content, #report-content * { display: block !important; position: static !important; }
            }
        `}</style>
      </div>
    </div>
  );
};