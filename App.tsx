// ... imports ...
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, COLUMNS, Priority, Subtask, Project, TeamMember, PropertyDefinition, Comment, Department, ProjectGroup, BudgetLineItem, IntegrationConfig, Notification, OrganizationSettings, ReportWidget, Dependency, Column, Attachment, Goal } from './types';
import { TaskCard } from './components/TaskCard';
import { NewTaskModal } from './components/NewTaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { AppSidebar } from './components/AppSidebar';
import { ProjectsTable, TeamTable } from './components/SheetViews';
import { AddMemberModal } from './components/AddMemberModal';
import { PropertyManager } from './components/PropertyManager';
import { Dashboard } from './components/Dashboard';
import { ProjectPulse } from './components/ProjectPulse';
import { ProjectBoard } from './components/ProjectBoard';
import { ProjectListView } from './components/ProjectListView';
import { ProjectOverview } from './components/ProjectOverview';
import { ProjectGanttView } from './components/ProjectGanttView';
import { ProjectPlannerView } from './components/ProjectPlannerView';
import { ProjectFiles } from './components/ProjectFiles';
import { ProjectAutomations } from './components/ProjectAutomations';
import { CommandPalette } from './components/CommandPalette';
import { NotificationDrawer } from './components/NotificationDrawer';
import { UserPreferences } from './components/UserPreferences';
import { GoogleIntegrationCard } from './components/GoogleIntegrationCard';
import { InputModal } from './components/InputModal';
import { GlobalBudgetView } from './components/GlobalBudgetView';
import { CustomReports } from './components/CustomReports';
import { ExternalShareView } from './components/ExternalShareView'; // Import
import { GoalsView } from './components/GoalsView';
import { NewGoalModal } from './components/NewGoalModal';
import { BulkAddTaskModal } from './components/BulkAddTaskModal';
import { EditableCell } from './components/EditableCell';
import { Plus, Loader2, Mail, MessageSquare, HardDrive, Activity, Layout, User, BarChart2, Video, FolderOpen, Zap, Bell, Command, Menu, Share2, Lock, Target } from 'lucide-react';

// ... (Date helpers remain the same) ...
const getDaysDiff = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

type ProjectViewTab = 'overview' | 'list' | 'board' | 'pulse' | 'gantt' | 'planner' | 'files' | 'automations';

const App: React.FC = () => {
  // ... (State initialization remains the same: orgSettings, projectGroups, projects, budgetLines, departments, team, tasks, customReports, googleIntegration, theme, notifications, propertyDefinitions) ...
  
  // --- Global Data State ---
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    name: 'Calyx Containers',
    domain: 'calyxcontainers.com',
    fiscalYearStart: 'January',
    currency: 'USD',
    timezone: 'EST',
    supportEmail: 'support@calyxcontainers.com',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    smartKeys: { 
        enabled: true,
        rules: [
            { id: 'default-1', key: '1', actionField: 'dueDate', actionValue: 1 },
            { id: 'default-2', key: '7', actionField: 'dueDate', actionValue: 7 },
            { id: 'default-3', key: 'h', actionField: 'priority', actionValue: 'High' }
        ]
    }
  });
  
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([
    { id: 'g1', name: 'Strategic Initiatives', color: 'bg-accent' },
    { id: 'g2', name: 'Internal Ops', color: 'bg-status-info' }
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', groupId: 'g1', name: 'Website Redesign', description: 'Q4 Brand Refresh', status: 'Active', driveLink: '', chatLink: '', sheetId: 's1', startDate: '2023-10-01', dueDate: '2023-12-15', budget: 15000, automations: [], files: [
        { id: 'f1', name: 'Q4_Specs.pdf', type: 'pdf', url: '#', uploadedAt: '2023-10-05', size: '1.2 MB' },
        { id: 'f2', name: 'Brand_Assets.zip', type: 'other', url: '#', uploadedAt: '2023-10-06', size: '45 MB' }
    ] },
    { id: 'p2', groupId: 'g1', name: 'Mobile App Launch', description: 'iOS and Android release', status: 'Active', driveLink: '', sheetId: 's2', startDate: '2023-09-15', dueDate: '2024-02-20', budget: 45000, automations: [] },
    { id: 'p3', groupId: 'g2', name: 'Internal Audit', description: 'Year-end financial review', status: 'On Hold', driveLink: '', sheetId: 's3', budget: 5000, automations: [] },
  ]);
  
  const [budgetLines, setBudgetLines] = useState<BudgetLineItem[]>([
     { id: 'bl1', projectId: 'p1', name: 'Design Phase', allocated: 5000, actualSpent: 1250, customProperties: { 'prop_vendor': 'Acme Design Co.', 'prop_status': 'Paid' } },
     { id: 'bl2', projectId: 'p1', name: 'Development', allocated: 8000, actualSpent: 3000, customProperties: { 'prop_vendor': 'In-House', 'prop_status': 'Pending' } },
     { id: 'bl3', projectId: 'p1', name: 'QA & Testing', allocated: 2000, actualSpent: 0, customProperties: { 'prop_status': 'Unpaid' } }
  ]);

  const [departments, setDepartments] = useState<Department[]>([
    { id: 'd1', name: 'Engineering', description: 'Software Development and QA', headId: 'tm2' },
    { id: 'd2', name: 'Product', description: 'Product Management and Strategy', headId: 'tm1' },
    { id: 'd3', name: 'Design', description: 'UX/UI and Graphic Design', headId: 'tm3' },
    { id: 'd4', name: 'Marketing', description: 'Growth and Brand Marketing', headId: 'tm4' }
  ]);

  const [team, setTeam] = useState<TeamMember[]>([
    { id: 'tm1', name: 'Alice Chen', email: 'alice@example.com', role: 'Product Owner', initials: 'AC', color: '#8b5cf6', permissionLevel: 'Admin', departmentId: 'd2', customProperties: { 'prop_loc': 'NY', 'prop_job_title': 'Sr. PO' } },
    { id: 'tm2', name: 'Bob Smith', email: 'bob@example.com', role: 'Lead Dev', initials: 'BS', color: '#3b82f6', permissionLevel: 'Standard', departmentId: 'd1', customProperties: { 'prop_loc': 'Remote', 'prop_skills': ['React', 'Node'] } },
    { id: 'tm3', name: 'Charlie Kim', email: 'charlie@example.com', role: 'Designer', initials: 'CK', color: '#ec4899', permissionLevel: 'Viewer', departmentId: 'd3', customProperties: { 'prop_loc': 'SF' } },
    { id: 'tm4', name: 'Sarah Jones', email: 'sarah@example.com', role: 'Marketing Lead', initials: 'SJ', color: '#f97316', permissionLevel: 'Standard', departmentId: 'd4', customProperties: { 'prop_loc': 'NY' } },
    { id: 'tm5', name: 'David Lee', email: 'david@example.com', role: 'Backend Eng', initials: 'DL', color: '#10b981', permissionLevel: 'Standard', departmentId: 'd1', customProperties: { 'prop_loc': 'London' } },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1', projectId: 'p1', title: 'Launch Website Redesign', description: 'Update homepage with new branding.', status: 'In Progress', priority: 'High', dueDate: '2023-11-15', startDate: '2023-11-01', assignee: 'tm1', subtasks: [{ id: 'st1', title: 'Approve mockups', completed: true, dueDate: '2023-11-05' }], tags: ['Design'], completed: false, budgetLineItemId: 'bl1', customProperties: { 'prop_impact': 'High', 'prop_qa_passed': true }, estimatedHours: 40
    },
    {
      id: '2', projectId: 'p3', title: 'Q4 Budget Review', description: 'Analyze Q3 spend.', status: 'Not Started', priority: 'Critical', dueDate: '2023-11-01', startDate: '2023-10-25', subtasks: [], tags: ['Finance'], completed: false, customProperties: { 'prop_impact': 'Critical' }, estimatedHours: 8
    },
    {
      id: '3', projectId: 'p1', title: 'Client Onboarding', description: 'Send welcome packet.', status: 'Completed', priority: 'Medium', dueDate: '2023-10-20', startDate: '2023-10-18', subtasks: [], tags: ['Client'], completed: true, 
      dependencies: [{taskId: '2', type: 'FS'}], estimatedHours: 2
    },
    {
       id: '4', projectId: 'p2', title: 'API Integration', description: 'Connect backend services.', status: 'Not Started', priority: 'High', dueDate: '2023-12-01', startDate: '2023-11-20', assignee: 'tm2', subtasks: [], dependencies: [], tags: [], completed: false, estimatedHours: 20
    }
  ]);

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 'g-comp-1',
      title: 'Launch in European Market by End of Year',
      ownerId: 'tm1',
      timePeriod: 'FY2024',
      status: 'On Track',
      progress: 45,
      progressMethod: 'Subgoals',
      isPrivate: false,
    },
    {
      id: 'g-team-1',
      parentId: 'g-comp-1',
      title: 'Marketing: Generate 5,000 EU Leads',
      ownerId: 'tm4',
      timePeriod: 'Q4 2024',
      status: 'At Risk',
      progress: 30,
      progressMethod: 'Manual',
      isPrivate: false,
    },
    {
      id: 'g-team-2',
      parentId: 'g-comp-1',
      title: 'Product: Localize App for DE, FR, ES',
      ownerId: 'tm1',
      timePeriod: 'Q4 2024',
      status: 'On Track',
      progress: 60,
      progressMethod: 'Projects',
      progressSource: [{ id: 'p1', type: 'project' }],
      isPrivate: false,
    },
    {
      id: 'g-comp-2',
      title: 'Achieve $10M ARR',
      ownerId: 'tm2',
      timePeriod: 'FY2024',
      status: 'On Track',
      progress: 75,
      progressMethod: 'Manual',
      isPrivate: true,
      members: ['tm1', 'tm2'],
    },
  ]);

  const [customReports, setCustomReports] = useState<ReportWidget[]>([
      { id: 'r1', title: 'Tasks by Status', type: 'donut', entity: 'tasks', groupBy: 'status', metric: 'count', description: 'Distribution of tasks across all projects.' },
      { id: 'r2', title: 'Budget by Group', type: 'bar', entity: 'projects', groupBy: 'groupId', metric: 'budget', description: 'Allocated budget per portfolio group.' },
      { id: 'r3', title: 'Tasks by Priority', type: 'donut', entity: 'tasks', groupBy: 'priority', metric: 'count', description: 'Urgency breakdown of active tasks.' },
  ]);

  const [googleIntegration, setGoogleIntegration] = useState<IntegrationConfig>({ 
    isConnected: false, 
    features: { 
      autoDriveFolders: true, 
      taskSync: true, 
      smartAlerts: true,
      autoChatSpace: true
    } 
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // --- Standard Properties State (Expanded) ---
  const [propertyDefinitions, setPropertyDefinitions] = useState<{
    users: PropertyDefinition[];
    tasks: PropertyDefinition[];
    projects: PropertyDefinition[];
    budgetItems: PropertyDefinition[];
  }>({
    users: [
      { id: 'prop_job_title', name: 'Job Title', type: 'text', isSystem: true },
      { id: 'prop_dept', name: 'Department', type: 'dropdown', options: ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'] },
      { id: 'prop_loc', name: 'Location', type: 'dropdown', options: ['New York', 'San Francisco', 'London', 'Remote', 'Berlin', 'Tokyo'] },
      { id: 'prop_skills', name: 'Skills', type: 'multiselect', options: ['React', 'Node.js', 'Python', 'Design', 'Project Management', 'SEO', 'Data Analysis'] },
      { id: 'prop_start_date', name: 'Start Date', type: 'date' },
      { id: 'prop_birthday', name: 'Birthday', type: 'date' },
      { id: 'prop_phone', name: 'Phone Number', type: 'text' },
      { id: 'prop_linkedin', name: 'LinkedIn Profile', type: 'url' },
      { id: 'prop_github', name: 'GitHub Profile', type: 'url' },
      { id: 'prop_manager', name: 'Reports To', type: 'user' },
      { id: 'prop_emp_id', name: 'Employee ID', type: 'text' },
      { id: 'prop_timezone', name: 'Timezone', type: 'text' },
      { id: 'prop_work_hours', name: 'Work Hours', type: 'text' },
      { id: 'prop_bio', name: 'Bio', type: 'text' },
      { id: 'prop_certifications', name: 'Certifications', type: 'multiselect', options: ['PMP', 'Scrum Master', 'AWS Certified', 'Google Cloud', 'CPA'] },
      { id: 'prop_languages', name: 'Languages', type: 'multiselect', options: ['English', 'Spanish', 'French', 'Mandarin', 'German'] },
      { id: 'prop_emergency_contact', name: 'Emergency Contact', type: 'text' },
      { id: 'prop_laptop', name: 'Laptop Model', type: 'text' },
      { id: 'prop_shirt_size', name: 'Shirt Size', type: 'dropdown', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { id: 'prop_diet', name: 'Dietary Restrictions', type: 'text' },
      { id: 'prop_contract', name: 'Contract Type', type: 'dropdown', options: ['Full-Time', 'Part-Time', 'Contractor', 'Intern'] },
      { id: 'prop_remote', name: 'Remote Status', type: 'dropdown', options: ['Fully Remote', 'Hybrid', 'On-Site'] },
    ],
    projects: [
      { id: 'prop_client', name: 'Client Name', type: 'text' },
      { id: 'prop_health', name: 'Health Status', type: 'dropdown', options: ['On Track', 'At Risk', 'Off Track', 'Paused'] },
      { id: 'prop_priority_score', name: 'Priority Score', type: 'rating' },
      { id: 'prop_phase', name: 'Phase', type: 'dropdown', options: ['Planning', 'Development', 'Testing', 'Deployment', 'Maintenance'] },
      { id: 'prop_strategic_goal', name: 'Strategic Goal', type: 'text' },
      { id: 'prop_sponsor', name: 'Executive Sponsor', type: 'user' },
      { id: 'prop_tags', name: 'Tags', type: 'multiselect', options: ['Q4', 'Strategic', 'Internal', 'Client', 'R&D', 'Mobile', 'Web'] },
      { id: 'prop_repo', name: 'Repository URL', type: 'url' },
      { id: 'prop_region', name: 'Region', type: 'dropdown', options: ['NA', 'EMEA', 'APAC', 'LATAM'] },
      { id: 'prop_launch_date', name: 'Target Launch', type: 'date' },
      { id: 'prop_roi', name: 'Estimated ROI', type: 'currency' },
      { id: 'prop_staging', name: 'Staging Link', type: 'url' },
      { id: 'prop_prod', name: 'Production Link', type: 'url' },
      { id: 'prop_figma', name: 'Figma Design', type: 'url' },
      { id: 'prop_slack', name: 'Slack Channel', type: 'text' },
      { id: 'prop_cost_center', name: 'Cost Center', type: 'text' },
      { id: 'prop_methodology', name: 'Methodology', type: 'dropdown', options: ['Agile', 'Waterfall', 'Kanban', 'Scrum'] },
      { id: 'prop_tech_stack', name: 'Tech Stack', type: 'multiselect', options: ['React', 'Node', 'Python', 'Java', 'AWS', 'Azure'] },
      { id: 'prop_risk', name: 'Risk Level', type: 'dropdown', options: ['Low', 'Medium', 'High'] },
      { id: 'prop_qa_lead', name: 'QA Lead', type: 'user' },
      { id: 'prop_billing_code', name: 'Billing Code', type: 'text' },
    ],
    tasks: [
      { id: 'prop_type', name: 'Task Type', type: 'dropdown', options: ['Feature', 'Bug', 'Chore', 'Spike', 'Epic'] },
      { id: 'prop_impact', name: 'Business Impact', type: 'dropdown', options: ['High', 'Medium', 'Low', 'Critical'] },
      { id: 'prop_sprint', name: 'Sprint', type: 'text' },
      { id: 'prop_points', name: 'Story Points', type: 'number' },
      { id: 'prop_qa_passed', name: 'QA Passed', type: 'checkbox' },
      { id: 'prop_environment', name: 'Environment', type: 'multiselect', options: ['Dev', 'Staging', 'Prod'] },
      { id: 'prop_complexity', name: 'Complexity', type: 'rating' },
      { id: 'prop_deploy_link', name: 'Deployment URL', type: 'url' },
      { id: 'prop_acceptance', name: 'Acceptance Criteria', type: 'text' },
      { id: 'prop_tester', name: 'Assigned Tester', type: 'user' },
      { id: 'prop_orig_est', name: 'Original Estimate (h)', type: 'number' },
      { id: 'prop_remaining', name: 'Remaining Work (h)', type: 'number' },
      { id: 'prop_blockers', name: 'Blockers', type: 'text' },
      { id: 'prop_version', name: 'Release Version', type: 'text' },
      { id: 'prop_root_cause', name: 'Root Cause', type: 'dropdown', options: ['Code Error', 'Requirement Gap', 'Design Flaw', 'Data Issue'] },
      { id: 'prop_browser', name: 'Browser', type: 'multiselect', options: ['Chrome', 'Firefox', 'Safari', 'Edge'] },
      { id: 'prop_device', name: 'Device', type: 'multiselect', options: ['Desktop', 'Mobile', 'Tablet'] },
      { id: 'prop_severity', name: 'Severity', type: 'dropdown', options: ['S1 - Blocker', 'S2 - Critical', 'S3 - Major', 'S4 - Minor'] },
      { id: 'prop_reproduce', name: 'Steps to Reproduce', type: 'text' },
      { id: 'prop_customer_ticket', name: 'Zendesk Ticket ID', type: 'text' },
    ],
    budgetItems: [
       { id: 'prop_vendor', name: 'Vendor', type: 'text' },
       { id: 'prop_invoice', name: 'Invoice #', type: 'text' },
       { id: 'prop_status', name: 'Payment Status', type: 'dropdown', options: ['Paid', 'Pending', 'Unpaid', 'Processing', 'Void'] },
       { id: 'prop_category', name: 'Expense Category', type: 'dropdown', options: ['Software', 'Hardware', 'Contractor', 'Travel', 'Events', 'Marketing'] },
       { id: 'prop_payment_date', name: 'Payment Date', type: 'date' },
       { id: 'prop_approver', name: 'Approver', type: 'user' },
       { id: 'prop_cost_center', name: 'Cost Center', type: 'text' },
       { id: 'prop_po_number', name: 'PO Number', type: 'text' },
       { id: 'prop_receipt', name: 'Receipt URL', type: 'url' },
       { id: 'prop_notes', name: 'Notes', type: 'text' },
       { id: 'prop_tax', name: 'Tax Amount', type: 'currency' },
       { id: 'prop_currency', name: 'Currency', type: 'dropdown', options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] },
       { id: 'prop_method', name: 'Payment Method', type: 'dropdown', options: ['Credit Card', 'Wire Transfer', 'ACH', 'Check'] },
       { id: 'prop_gl_code', name: 'GL Code', type: 'text' },
       { id: 'prop_fiscal_q', name: 'Fiscal Quarter', type: 'dropdown', options: ['Q1', 'Q2', 'Q3', 'Q4'] },
       { id: 'prop_fiscal_y', name: 'Fiscal Year', type: 'text' },
       { id: 'prop_recurring', name: 'Recurring', type: 'checkbox' },
       { id: 'prop_sub_id', name: 'Subscription ID', type: 'text' },
       { id: 'prop_contact', name: 'Vendor Contact', type: 'text' },
       { id: 'prop_capex_opex', name: 'CapEx / OpEx', type: 'dropdown', options: ['CapEx', 'OpEx'] },
    ]
  });

  // ... (handlers remain the same) ...
  const handleDeleteProperty = (context: keyof typeof propertyDefinitions, id: string) => {
    setPropertyDefinitions(prev => ({ ...prev, [context]: prev[context].filter(p => p.id !== id) }));
    const cleanCustomProps = (item: any) => {
        if (!item.customProperties) return item;
        if (id in item.customProperties) {
            const newProps = { ...item.customProperties };
            delete newProps[id];
            return { ...item, customProperties: newProps };
        }
        return item;
    };
    if (context === 'tasks') setTasks(prev => prev.map(cleanCustomProps));
    else if (context === 'projects') setProjects(prev => prev.map(cleanCustomProps));
    else if (context === 'users') setTeam(prev => prev.map(cleanCustomProps));
    else if (context === 'budgetItems') setBudgetLines(prev => prev.map(cleanCustomProps));
    addNotification('Field Deleted', 'Property field removed successfully.', 'info');
  };

  const [activeView, setActiveView] = useState<string>('dashboard'); 
  const [activeProjectTab, setActiveProjectTab] = useState<ProjectViewTab>('overview');
  const [projectMasterFilter, setProjectMasterFilter] = useState<string>('active');
  const [selectedUserIdForTasks, setSelectedUserIdForTasks] = useState<string | null>(null);
  const [drillDownFilter, setDrillDownFilter] = useState<{field: string, value: string} | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [targetDepartmentId, setTargetDepartmentId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalParentId, setModalParentId] = useState<string | undefined>(undefined);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);

  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateDeptModalOpen, setIsCreateDeptModalOpen] = useState(false);
  const [isCreateSectionModalOpen, setIsCreateSectionModalOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isShareViewOpen, setIsShareViewOpen] = useState(false);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [newGoalParentId, setNewGoalParentId] = useState<string | undefined>(undefined);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);


  const currentUser = team[0];
  const currentProject = projects.find(p => p.id === activeView);
  
  let filteredTasks = tasks;
  if (activeView.startsWith('p')) {
      filteredTasks = tasks.filter(t => t.projectId === activeView);
  } else if (activeView === 'user_tasks' && selectedUserIdForTasks) {
      filteredTasks = tasks.filter(t => t.assignee === selectedUserIdForTasks);
  } else if (activeView === 'overdue_tasks') {
      filteredTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed);
  } else if (activeView === 'all_tasks' && drillDownFilter) {
      filteredTasks = tasks.filter(t => {
          const val = (t as any)[drillDownFilter.field];
          if (val === undefined || val === null) return drillDownFilter.value === '';
          return String(val) === drillDownFilter.value;
      });
  }

  if (activeView !== 'overdue_tasks') { 
    if (taskStatusFilter === 'active') {
      filteredTasks = filteredTasks.filter(t => !t.completed);
    } else if (taskStatusFilter === 'completed') {
      filteredTasks = filteredTasks.filter(t => t.completed);
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Auto-calculate goal progress
  useEffect(() => {
    const updatedGoals = goals.map(goal => {
        let newProgress = goal.progress;

        if (goal.progressMethod === 'Projects' && goal.progressSource && goal.progressSource.length > 0) {
            const sourceProjects = projects.filter(p => goal.progressSource?.some(s => s.id === p.id && s.type === 'project'));
            if (sourceProjects.length > 0) {
                const completedProjects = sourceProjects.filter(p => p.status === 'Completed').length;
                newProgress = Math.round((completedProjects / sourceProjects.length) * 100);
            } else {
                newProgress = 0;
            }
        } else if (goal.progressMethod === 'Tasks' && goal.progressSource && goal.progressSource.length > 0) {
            const sourceTasks = tasks.filter(t => goal.progressSource?.some(s => s.id === t.id && s.type === 'task'));
            if (sourceTasks.length > 0) {
                const completedTasks = sourceTasks.filter(t => t.completed).length;
                newProgress = Math.round((completedTasks / sourceTasks.length) * 100);
            } else {
                newProgress = 0;
            }
        }
        
        if (newProgress !== goal.progress) {
            return { ...goal, progress: newProgress };
        }
        return goal;
    });

    // Prevent infinite loops by checking for actual changes before setting state
    if (JSON.stringify(goals) !== JSON.stringify(updatedGoals)) {
        setGoals(updatedGoals);
    }
  }, [tasks, projects, goals]);


  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setNotifications(prev => [{ id: `n-${Date.now()}`, title, message, timestamp: new Date().toISOString(), read: false, type }, ...prev]);
  };
  
  const handleOpenModal = (parentId?: string) => {
    setModalParentId(parentId);
    setIsModalOpen(true);
  };
  
  const onOpenBulkAddModal = () => setIsBulkAddModalOpen(true);

  const handleNavigate = (view: string, filter?: string, status: 'all' | 'active' | 'completed' = 'all') => {
    setActiveView(view);
    setDrillDownFilter(null);
    setTaskStatusFilter(status);
    if (view.startsWith('p')) setActiveProjectTab('list');
    if (view === 'projects_master' && filter) setProjectMasterFilter(filter.toLowerCase());
    setSidebarOpen(false);
  };
  
  const handleSetProjectView = (view: 'board' | 'list') => {
    setActiveProjectTab(view);
  };

  const handleReportDrillDown = (entity: 'tasks' | 'projects', field: string, value: string) => {
      setDrillDownFilter({ field, value });
      if (entity === 'tasks') setActiveView('all_tasks');
      else {
          setActiveView('projects_master');
          if (field === 'status') setProjectMasterFilter(value.toLowerCase());
      }
  };

  const handleOpenProjectTasks = (projectId: string) => { setActiveView(projectId); setActiveProjectTab('list'); };
  const handleViewUserTasks = (userId: string, status: 'all' | 'active' | 'completed' = 'all') => { setSelectedUserIdForTasks(userId); setTaskStatusFilter(status); setActiveView('user_tasks'); };
  const handleUpdateBudgetLine = (updatedLine: BudgetLineItem) => { setBudgetLines(prev => prev.map(line => line.id === updatedLine.id ? updatedLine : line)); };
  const handleAddBudgetLine = (line: BudgetLineItem) => { setBudgetLines(prev => [...prev, line]); };
  
  const handleCreateGroupRequest = () => setIsCreateGroupModalOpen(true);
  const submitCreateGroup = (name: string) => { setProjectGroups([...projectGroups, { id: `g${Date.now()}`, name }]); };
  const handleUpdateGroup = (updatedGroup: ProjectGroup) => { setProjectGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)); };
  
  const handleDeleteGroup = (groupId: string) => {
      if (confirm('Delete portfolio group?')) {
          const fallbackGroupId = projectGroups.find(g => g.id !== groupId)?.id;
          if (fallbackGroupId) setProjects(prev => prev.map(p => p.groupId === groupId ? { ...p, groupId: fallbackGroupId } : p));
          setProjectGroups(prev => prev.filter(g => g.id !== groupId));
          addNotification('Portfolio Deleted', 'Group removed.', 'info');
      }
  };

  const handleCreateProjectRequest = (groupId?: string) => { setTargetGroupId(groupId); setIsCreateProjectModalOpen(true); };
  
  const submitCreateProject = (name: string) => { 
      const timestamp = Date.now();
      const driveLink = googleIntegration.isConnected && googleIntegration.features.autoDriveFolders ? `https://drive.google.com/drive/folders/folder-${timestamp}` : '';
      const chatLink = googleIntegration.isConnected && googleIntegration.features.autoChatSpace ? `https://mail.google.com/chat/u/0/#chat/space/space-${timestamp}` : '';
      const newProject: Project = { 
          id: `p${timestamp}`, groupId: targetGroupId || projectGroups[0].id, name, description: 'New Project', status: 'Active', driveLink: driveLink, chatLink: chatLink, sheetId: `s-${timestamp}`, budget: 0, automations: [] 
      };
      setProjects([...projects, newProject]);
      setActiveView(newProject.id);
      addNotification('Project Created', `Project "${name}" initialized.`, 'success');
      if (googleIntegration.isConnected && googleIntegration.features.autoChatSpace) {
         setTimeout(() => addNotification('Google Workspace', 'New Chat Space created.', 'success'), 500);
      }
  };
  
  const submitCreateSection = (name: string) => {
    handleInlineCreateTask(name, undefined, true);
  };

  const handleUpdateProject = (p: Project) => setProjects(prev => prev.map(pr => pr.id === p.id ? p : pr));
  
  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;

    if (confirm(`Are you sure you want to delete project "${projectToDelete.name}" and all its associated data? This cannot be undone.`)) {
        // Collect IDs of tasks being deleted
        const tasksFromDeletedProject = new Set(tasks.filter(t => t.projectId === projectId).map(t => t.id));

        // Filter out the project and its tasks/budget lines
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setBudgetLines(prev => prev.filter(b => b.projectId !== projectId));
        
        // Remove tasks of the deleted project AND clean up dependencies from remaining tasks
        setTasks(prevTasks =>
            prevTasks
                .filter(t => t.projectId !== projectId) 
                .map(t => {
                    if (t.dependencies && t.dependencies.length > 0) {
                        return {
                            ...t,
                            dependencies: t.dependencies.filter(dep => !tasksFromDeletedProject.has(dep.taskId))
                        };
                    }
                    return t;
                })
        );
        
        // Clean up goals linked to this project
        setGoals(prevGoals => prevGoals.map(goal => {
            const wasLinked = goal.progressSource?.some(s => s.type === 'project' && s.id === projectId);
            const newProgressSource = goal.progressSource?.filter(source => !(source.type === 'project' && source.id === projectId));
            const newRelatedWork = goal.relatedWork?.filter(work => !(work.type === 'project' && work.id === projectId));

            let newProgress = goal.progress;
            if (goal.progressMethod === 'Projects' && wasLinked) {
                if (newProgressSource && newProgressSource.length > 0) {
                    const sourceProjects = projects.filter(p => p.id !== projectId && newProgressSource.some(s => s.id === p.id && s.type === 'project'));
                    const completedProjects = sourceProjects.filter(p => p.status === 'Completed').length;
                    newProgress = sourceProjects.length > 0 ? Math.round((completedProjects / sourceProjects.length) * 100) : 0;
                } else {
                    newProgress = 0;
                }
            }
            
            return {
                ...goal,
                progress: newProgress,
                progressSource: newProgressSource,
                relatedWork: newRelatedWork,
            };
        }));
        
        setActiveView('dashboard');
        addNotification('Project Deleted', `"${projectToDelete.name}" and all associated data have been removed.`, 'info');
    }
  };


  const handleAddDepartment = (name: string) => { setDepartments(prev => [...prev, { id: `d-${Date.now()}`, name, description: 'New Department' }]); addNotification('Department Created', `Department "${name}" added.`, 'success'); };
  const handleDeleteDepartment = (id: string) => { setDepartments(prev => prev.filter(d => d.id !== id)); setTeam(prev => prev.map(m => m.departmentId === id ? { ...m, departmentId: undefined } : m)); addNotification('Department Deleted', 'Department removed.', 'info'); };
  const handleUpdateDepartment = (d: Department) => { setDepartments(prev => prev.map(dp => dp.id === d.id ? d : dp)); };
  
  const getTaskValue = (task: Task, field: string) => {
    if (field in task) return (task as any)[field];
    return task.customProperties?.[field];
  };

  const handleCreateTask = (title: string, desc: string, pri: Priority, due: string, start: string, subtaskData: {title: string, dueDate: string}[], dependencies: Dependency[], budgetId: string, attachments: File[], parentId?: string) => {
      const pid = currentProject ? currentProject.id : projects[0].id;
      
      const newSubtasks: Subtask[] = subtaskData.map(st => ({
          id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: st.title,
          completed: false,
          dueDate: st.dueDate || undefined
      }));

      const newAttachments: Attachment[] = attachments.map(file => ({
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file), // Simulate upload for preview
        type: 'other', // Simplified for this example
        uploadedAt: new Date().toISOString(),
        size: `${(file.size / 1024).toFixed(1)} KB`,
      }));

      const t: Task = { 
          id: Date.now().toString(), 
          projectId: pid, 
          title, 
          description: desc, 
          priority: pri, 
          status: 'Not Started', 
          completed: false, 
          subtasks: newSubtasks, 
          tags: [], 
          startDate: start, 
          dueDate: due,
          dependencies: dependencies,
          attachments: newAttachments,
          budgetLineItemId: budgetId || undefined,
          parentId: parentId || undefined
      };

      const project = projects.find(p => p.id === pid);
      if (project?.automations) {
          project.automations.forEach(rule => {
              if (!rule.active) return;
              const newVal = getTaskValue(t, rule.triggerField);
              
              if (newVal === rule.triggerValue) { 
                  if (rule.actionField === 'dueDate' && typeof rule.actionValue === 'string' && rule.actionValue.startsWith('TODAY+')) {
                      const days = parseInt(rule.actionValue.split('+')[1]);
                      const date = addDays(new Date(), days);
                      t.dueDate = formatDate(date);
                  } else if (rule.actionField === 'subtasks' && typeof rule.actionValue === 'string') {
                      t.subtasks = [...t.subtasks, { id: `st-auto-c-${Date.now()}`, title: rule.actionValue, completed: false }];
                  } else {
                      if (rule.actionField in t) (t as any)[rule.actionField] = rule.actionValue;
                      else t.customProperties = { ...t.customProperties, [rule.actionField]: rule.actionValue };
                  }
                  addNotification('Automation Run', `Applied rule: ${rule.triggerField} -> ${rule.actionField}`, 'info');
              }
          });
      }

      setTasks(prev => [...prev, t]);
      addNotification('Task Created', `Task "${title}" created.`, 'success');
  };
  
  const handleBulkCreateTasks = (titles: string, status: TaskStatus) => {
    const pid = currentProject?.id;
    if (!pid) {
        addNotification('Action Failed', 'Bulk tasks can only be added within a project view.', 'alert');
        return;
    }

    const newTasks: Task[] = titles
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(title => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            projectId: pid,
            title: title.trim(),
            description: '',
            priority: 'Medium' as Priority,
            status: status,
            completed: false,
            subtasks: [],
            tags: [],
        }));

    setTasks(prev => [...prev, ...newTasks]);
    addNotification('Tasks Created', `${newTasks.length} tasks have been added.`, 'success');
  };

  const handleInlineCreateTask = (title: string, parentId?: string, isSection?: boolean, dueDate?: string) => {
      const pid = currentProject?.id;
      if (!pid) {
          addNotification('Action Failed', 'Sections or inline tasks can only be added within a project view.', 'alert');
          return;
      }

      const defaultStatus = (currentProject?.columns || COLUMNS)[0].id;

      const t: Task = { 
          id: Date.now().toString(), 
          projectId: pid, 
          title, 
          description: '', 
          priority: 'Medium', 
          status: defaultStatus, 
          completed: false, 
          subtasks: [], 
          tags: [],
          parentId: parentId,
          isSection: isSection || false,
          dueDate: dueDate
      };
      setTasks(prev => [...prev, t]);
      addNotification(isSection ? 'Section Created' : 'Task Created', `"${title}" added.`, 'info');
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const originalTask = tasks.find(t => t.id === updatedTask.id);
    let taskToSave = { ...updatedTask };
    let systemComments: Comment[] = [];

    // Automatically set completed status based on status name
    const completedStatusId = 'Completed';
    if (taskToSave.status === completedStatusId && !taskToSave.completed) {
        taskToSave.completed = true;
    } else if (originalTask && originalTask.status === completedStatusId && taskToSave.status !== completedStatusId && taskToSave.completed) {
        taskToSave.completed = false;
    }

    if (originalTask) {
        if (originalTask.status !== taskToSave.status) systemComments.push({ id: `c-sys-${Date.now()}`, userId: 'system', text: `Status changed from '${(currentProject?.columns || COLUMNS).find(c => c.id === originalTask.status)?.title || originalTask.status}' to '${(currentProject?.columns || COLUMNS).find(c => c.id === taskToSave.status)?.title || taskToSave.status}'`, createdAt: new Date().toISOString(), isSystem: true });
        if (originalTask.assignee !== taskToSave.assignee) {
            const oldName = team.find(t => t.id === originalTask.assignee)?.name || 'Unassigned';
            const newName = team.find(t => t.id === taskToSave.assignee)?.name || 'Unassigned';
            systemComments.push({ id: `c-sys-${Date.now()+1}`, userId: 'system', text: `Assignee changed from ${oldName} to ${newName}`, createdAt: new Date().toISOString(), isSystem: true });
        }
        if (originalTask.dueDate !== taskToSave.dueDate) systemComments.push({ id: `c-sys-${Date.now()+2}`, userId: 'system', text: `Due date changed to ${taskToSave.dueDate || 'none'}`, createdAt: new Date().toISOString(), isSystem: true });
    }
    
    const project = projects.find(p => p.id === updatedTask.projectId);
    if (project?.automations) {
        project.automations.forEach(rule => {
            if (!rule.active) return;
            const newVal = getTaskValue(updatedTask, rule.triggerField);
            const oldVal = originalTask ? getTaskValue(originalTask, rule.triggerField) : undefined;
            if (newVal === rule.triggerValue && oldVal !== rule.triggerValue) {
                if (rule.actionField === 'dueDate' && typeof rule.actionValue === 'string' && rule.actionValue.startsWith('TODAY+')) {
                    const days = parseInt(rule.actionValue.split('+')[1]);
                    const date = addDays(new Date(), days);
                    taskToSave.dueDate = formatDate(date);
                } else if (rule.actionField === 'subtasks' && typeof rule.actionValue === 'string') {
                    taskToSave.subtasks = [...taskToSave.subtasks, { id: `st-auto-${Date.now()}`, title: rule.actionValue, completed: false }];
                } else {
                    if (rule.actionField in taskToSave) (taskToSave as any)[rule.actionField] = rule.actionValue;
                    else taskToSave.customProperties = { ...taskToSave.customProperties, [rule.actionField]: rule.actionValue };
                }
                addNotification('Automation Run', `Set ${rule.actionField} to ${rule.actionValue}`, 'info');
            }
        });
    }

    if (systemComments.length > 0) taskToSave.comments = [...(taskToSave.comments || []), ...systemComments];

    let newTasks = tasks.map(t => (t.id === taskToSave.id ? taskToSave : t));

    if (originalTask && originalTask.dueDate !== taskToSave.dueDate && taskToSave.dueDate) {
        const dependents = newTasks.filter(t => t.dependencies?.some(d => d.taskId === taskToSave.id));
        let tasksToUpdate = [...dependents];
        let processedIds = new Set(dependents.map(d => d.id).concat(taskToSave.id));
        let iterations = 0;
        
        while(tasksToUpdate.length > 0) {
            iterations++;
            if (iterations > 100) break;
            const currentTask = tasksToUpdate.shift();
            if(!currentTask || !currentTask.startDate || !currentTask.dueDate) continue;
            
            const predecessorDep = currentTask.dependencies?.find(d => newTasks.some(nt => nt.id === d.taskId)); 
            const predecessor = newTasks.find(t => t.id === predecessorDep?.taskId);
            
            if (!predecessor || !predecessor.dueDate) continue;
            
            const newStartDate = addDays(new Date(predecessor.dueDate), 1);
            const duration = getDaysDiff(new Date(currentTask.startDate), new Date(currentTask.dueDate));
            const newDueDate = addDays(newStartDate, duration);
            
            if (formatDate(newStartDate) !== currentTask.startDate) {
                newTasks = newTasks.map(t => t.id === currentTask.id ? { ...t, startDate: formatDate(newStartDate), dueDate: formatDate(newDueDate) } : t);
                const nextDependents = newTasks.filter(t => t.dependencies?.some(dep => dep.taskId === currentTask.id) && !processedIds.has(t.id));
                nextDependents.forEach(d => { tasksToUpdate.push(d); processedIds.add(d.id); });
            }
        }
    }

    setTasks(newTasks);
    if (selectedTask?.id === taskToSave.id) setSelectedTask(newTasks.find(t => t.id === taskToSave.id) || null);
    if (originalTask && originalTask.status !== taskToSave.status) addNotification('Status Update', `"${taskToSave.title}" moved to ${taskToSave.status}`, 'info');
  };
  
  const handleUpdateMultipleTasks = (tasksToUpdate: Task[]) => {
    const tasksToUpdateMap = new Map(tasksToUpdate.map(t => [t.id, t]));
    setTasks(prevTasks =>
      prevTasks.map(t => tasksToUpdateMap.get(t.id) || t)
    );
    addNotification('Timeline updated', `${tasksToUpdate.length} tasks have been rescheduled.`, 'success');
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    if (taskToDelete.isSection) {
        // Re-parent children of the section to be top-level
        const updatedTasks = tasks
            .map(t => (t.parentId === id ? { ...t, parentId: undefined } : t))
            .filter(t => t.id !== id);
        setTasks(updatedTasks);
        addNotification('Section Deleted', `"${taskToDelete.title}" removed. Tasks are now top-level.`, 'info');
    } else {
        // Delete task and all its descendants recursively
        const idsToDelete = new Set<string>();
        const queue: string[] = [id];
        idsToDelete.add(id);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = tasks.filter(t => t.parentId === currentId);
            for (const child of children) {
                idsToDelete.add(child.id);
                queue.push(child.id);
            }
        }
        
        setTasks(prev => prev.filter(t => !idsToDelete.has(t.id)));
        addNotification('Task Deleted', `"${taskToDelete.title}" and its sub-tasks were removed.`, 'info');
    }
    
    if (selectedTask?.id === id) setSelectedTask(null);
  };
  
  const handleAddTeamMember = (memberData: any) => {
    const newMember: TeamMember = { id: `tm-${Date.now()}`, initials: memberData.name.split(' ').map((n:string) => n[0]).join('').substring(0,2).toUpperCase(), color: '#808080', customProperties: {}, permissionLevel: memberData.permissionLevel || 'Viewer', departmentId: targetDepartmentId || undefined, ...memberData };
    setTeam(prev => [...prev, newMember]); setTargetDepartmentId(null); addNotification('Team Update', `${newMember.name} added to the team.`, 'success');
  };
  const handleUpdateTeamMember = (m: TeamMember) => { setTeam(prev => prev.map(tm => tm.id === m.id ? m : tm)); };
  const handleGoogleConnect = () => { setGoogleIntegration(prev => ({ ...prev, isConnected: true, connectedEmail: currentUser.email })); addNotification('Integration', 'Google Workspace connected.', 'success'); }; 
  const handleGoogleDisconnect = () => { setGoogleIntegration(prev => ({ ...prev, isConnected: false, connectedEmail: undefined })); addNotification('Integration', 'Google Workspace disconnected.', 'info'); }; 
  const handleToggleIntegrationFeature = (feature: keyof IntegrationConfig['features']) => { setGoogleIntegration(prev => ({ ...prev, features: { ...prev.features, [feature]: !prev.features[feature] } })); };
  const handleAddProperty = (context: keyof typeof propertyDefinitions, property: PropertyDefinition) => { setPropertyDefinitions(prev => ({ ...prev, [context]: [...prev[context], property] })); };
  const handleUpdateProperty = (context: keyof typeof propertyDefinitions, property: PropertyDefinition) => { setPropertyDefinitions(prev => ({ ...prev, [context]: prev[context].map(p => p.id === property.id ? property : p) })); };
  const handleAddReport = (report: ReportWidget) => { setCustomReports(prev => [...prev, report]); addNotification('Report Saved', `"${report.title}" has been saved.`, 'success'); };
  const handleDeleteReport = (id: string) => { if(confirm('Delete report?')) setCustomReports(prev => prev.filter(r => r.id !== id)); };
  const openAddMemberModal = (deptId?: string) => { setTargetDepartmentId(deptId || null); setIsAddMemberModalOpen(true); };

  const handleAddColumn = () => {
    if (!currentProject) return;
    const newColumn: Column = { id: `col-${Date.now()}`, title: 'New Section', color: 'gray' };
    const updatedProject = { ...currentProject, columns: [...(currentProject.columns || COLUMNS), newColumn] };
    handleUpdateProject(updatedProject);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (!currentProject) return;
    const currentColumns = [...(currentProject.columns || COLUMNS)];
    if (currentColumns.length <= 1) {
      alert("Cannot delete the last section.");
      return;
    }
    
    const firstColumnId = currentColumns.find(c => c.id !== columnId)?.id;
    if (!firstColumnId) return; 

    const updatedTasks = tasks.map(t => {
      if (t.projectId === currentProject.id && t.status === columnId) {
        return { ...t, status: firstColumnId };
      }
      return t;
    });
    setTasks(updatedTasks);

    const updatedProject = { ...currentProject, columns: currentColumns.filter(c => c.id !== columnId) };
    handleUpdateProject(updatedProject);
  };

  const handleUpdateColumnTitle = (columnId: string, newTitle: string) => {
    if (!currentProject) return;
    const updatedProject = { ...currentProject, columns: (currentProject.columns || COLUMNS).map(c => c.id === columnId ? { ...c, title: newTitle } : c) };
    handleUpdateProject(updatedProject);
  };

  const handleUpdateColumnColor = (columnId: string, newColor: string) => {
    if (!currentProject) return;
    const updatedProject = { ...currentProject, columns: (currentProject.columns || COLUMNS).map(c => c.id === columnId ? { ...c, color: newColor } : c) };
    handleUpdateProject(updatedProject);
  };
  
  const handleCreateGoalRequest = (parentId?: string) => {
    setEditingGoal(null);
    setNewGoalParentId(parentId);
    setIsNewGoalModalOpen(true);
  };
  
  const handleEditGoalRequest = (goal: Goal) => {
    setEditingGoal(goal);
    setIsNewGoalModalOpen(true);
  };

  const submitGoal = (goalData: Omit<Goal, 'id' | 'status' | 'progress'>) => {
    if (editingGoal) {
      const updatedGoal = { ...editingGoal, ...goalData };
      handleUpdateGoal(updatedGoal);
      addNotification('Goal Updated', `"${updatedGoal.title}" has been saved.`, 'success');
    } else {
      const newGoal: Goal = {
        id: `g-${Date.now()}`,
        ...goalData,
        status: 'Not Started',
        progress: 0,
      };
      setGoals(prev => [...prev, newGoal]);
      addNotification('Goal Created', `New goal "${goalData.title}" has been set.`, 'success');
    }
  };
  
  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };
  
  const handleDeleteGoal = (goalId: string) => {
    // Also un-parent any children
    setGoals(prev => {
        const goalToDelete = prev.find(g => g.id === goalId);
        return prev
            .filter(g => g.id !== goalId)
            .map(g => (g.parentId === goalId ? { ...g, parentId: goalToDelete?.parentId } : g));
    });
    addNotification('Goal Deleted', 'The goal and its connections have been removed.', 'info');
  };

  const pidForModal = currentProject ? currentProject.id : (projects.length > 0 ? projects[0].id : undefined);
  const tasksForModal = pidForModal ? tasks.filter(t => t.projectId === pidForModal) : [];

  return (
    <div className={`flex h-screen bg-background font-sans overflow-hidden`}>
      <AppSidebar 
        orgSettings={orgSettings} projects={projects} projectGroups={projectGroups} activeView={activeView} 
        onNavigate={handleNavigate} onCreateGroup={handleCreateGroupRequest} onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup} onCreateProject={handleCreateProjectRequest}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-surface border-b border-border h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
             <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-muted hover:bg-background rounded-lg">
                <Menu size={24} />
             </button>
             {currentProject ? (
               <div className="flex-1 min-w-0">
                 <EditableCell
                    value={currentProject.name}
                    type="text"
                    onChange={(val) => handleUpdateProject({ ...currentProject, name: val })}
                    className="text-lg md:text-xl font-bold text-main truncate w-full bg-transparent -ml-2 p-2"
                 />
                 <div className="text-xs text-muted flex items-center gap-1 truncate -mt-3 ml-2">
                    <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0"></span>
                    <span className="truncate">Live Sync • {currentProject.status}</span>
                 </div>
               </div>
             ) : (
                 <h1 className="text-lg md:text-xl font-bold text-main truncate">
                   {activeView === 'dashboard' ? 'Executive Dashboard' : 
                    activeView === 'projects_master' ? 'Projects Master Portfolio' :
                    activeView === 'global_budget' ? 'Global Budget Database' :
                    activeView === 'goals' ? 'Company Goals' :
                    activeView === 'user_tasks' ? `Tasks: ${team.find(u => u.id === selectedUserIdForTasks)?.name}` :
                    activeView === 'overdue_tasks' ? 'Overdue Tasks' :
                    activeView === 'all_tasks' ? 'All Tasks Master List' :
                    activeView === 'reports' ? 'Analytics & Reports' :
                    activeView === 'team' ? 'Team Directory' :
                    activeView === 'settings' ? 'Global Settings' : 
                    activeView === 'user_prefs' ? 'My Profile' : 'Overview'}
                 </h1>
             )}
          </div>
          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
             {currentProject && (
               <div className="flex items-center gap-1 md:gap-2 mr-1 md:mr-2 pr-1 md:pr-2 border-r border-border">
                  <button onClick={() => setIsShareViewOpen(true)} className="p-2 text-muted hover:text-primary hover:bg-background rounded-lg transition-colors hidden sm:block" title="External Report">
                     <Share2 size={20} />
                  </button>
                  <button onClick={() => window.open('https://meet.google.com/new', '_blank')} className="p-2 text-muted hover:text-primary hover:bg-background rounded-lg transition-colors hidden sm:block" title="Start Google Meet">
                     <Video size={20} />
                  </button>
                  <button onClick={() => window.open((currentProject.chatLink && currentProject.chatLink.length > 1) ? currentProject.chatLink : 'https://chat.google.com', '_blank')} className="p-2 text-muted hover:text-success hover:bg-background rounded-lg transition-colors hidden sm:block" title="Open Project Chat">
                     <MessageSquare size={20} />
                  </button>
               </div>
             )}
             <button onClick={() => setIsCommandPaletteOpen(true)} className="p-2 text-muted hover:bg-background rounded-lg" title="Command Palette (Ctrl+K)">
                <Command size={20} />
             </button>
             <button onClick={() => setIsNotificationDrawerOpen(true)} className="p-2 text-muted hover:bg-background rounded-lg relative" title="Activity">
                <Bell size={20} />
                {notifications.some(n => !n.read) && <div className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full"></div>}
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto relative bg-background">
          
          {activeView === 'dashboard' && <Dashboard currentUser={currentUser} projects={projects} tasks={tasks} team={team} departments={departments} budgetLines={budgetLines} onNavigate={handleNavigate} onViewUser={handleViewUserTasks} onTaskClick={setSelectedTask} />}
          {activeView === 'projects_master' && (
            <div className="h-full p-4 md:p-6">
                <ProjectsTable 
                    currentUser={currentUser}
                    projectGroups={projectGroups}
                    projects={projects}
                    tasks={tasks}
                    team={team}
                    onSelectProject={(id) => handleNavigate(id)}
                    onOpenProjectTasks={handleOpenProjectTasks}
                    onUpdateProject={handleUpdateProject}
                    onCreateProject={handleCreateProjectRequest}
                    customProperties={propertyDefinitions.projects}
                    initialFilter={projectMasterFilter} 
                />
            </div>
          )}
          {activeView === 'global_budget' && (
            currentUser.permissionLevel === 'Admin' ? (
              <GlobalBudgetView projects={projects} budgetLines={budgetLines} customProperties={propertyDefinitions.budgetItems} onNavigateToProject={handleNavigate} onUpdateBudgetLine={handleUpdateBudgetLine} onAddBudgetLine={handleAddBudgetLine} onBack={() => handleNavigate('dashboard')} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                  <Lock size={48} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Access Restricted</h2>
                <p className="max-w-md text-center">Financial data is restricted to administrators. Please contact your workspace owner if you believe this is an error.</p>
                <button onClick={() => handleNavigate('dashboard')} className="mt-6 text-nexus-primary hover:underline font-medium">Return to Dashboard</button>
              </div>
            )
          )}
           {activeView === 'goals' && (
            <GoalsView 
              goals={goals} 
              team={team}
              projects={projects}
              tasks={tasks}
              currentUser={currentUser}
              onAddGoal={handleCreateGoalRequest} 
              onUpdateGoal={handleUpdateGoal} 
              onDeleteGoal={handleDeleteGoal}
              onEditGoal={handleEditGoalRequest} 
            />
          )}
          {(activeView === 'all_tasks' || activeView === 'user_tasks' || activeView === 'overdue_tasks') && (
              <div className="h-full p-4 md:p-6">
                <ProjectListView 
                    project={{id: 'master_list', name: 'Master List', description: '', status: 'Active', driveLink: '', sheetId: ''}} 
                    tasks={filteredTasks} 
                    team={team} 
                    customProperties={propertyDefinitions.tasks} 
                    onUpdateTask={handleUpdateTask} 
                    onDeleteTask={handleDeleteTask} 
                    onGenerateSubtasks={() => {}} 
                    onTaskClick={setSelectedTask} 
                    activeFilter={drillDownFilter} 
                    onClearFilter={() => setDrillDownFilter(null)} 
                    onSetView={handleSetProjectView}
                    currentView='list'
                    onAddTaskClick={handleOpenModal}
                    onOpenBulkAddModal={onOpenBulkAddModal}
                    onAddSectionClick={() => setIsCreateSectionModalOpen(true)}
                    onInlineCreateTask={handleInlineCreateTask}
                    smartKeys={orgSettings.smartKeys}
                />
              </div>
          )}
          {activeView === 'reports' && <CustomReports reports={customReports} projects={projects} tasks={tasks} team={team} groups={projectGroups} customProperties={activeView === 'reports' ? [...propertyDefinitions.tasks, ...propertyDefinitions.projects] : []} onAddReport={handleAddReport} onDeleteReport={handleDeleteReport} onDrillDown={handleReportDrillDown} />}
          {activeView === 'team' && <div className="h-full p-4 md:p-6">
            <TeamTable 
              team={team} 
              departments={departments} 
              tasks={tasks} 
              customProperties={propertyDefinitions.users} 
              onAddMember={openAddMemberModal} 
              onExportCSV={()=>{}} 
              onImportCSV={()=>{}} 
              onUpdateMember={handleUpdateTeamMember} 
              onUpdateDepartment={handleUpdateDepartment} 
              onViewUserTasks={handleViewUserTasks}
              onCreateDepartment={() => setIsCreateDeptModalOpen(true)}
              onDeleteDepartment={handleDeleteDepartment}
            /></div>
          }
          {activeView === 'settings' && <div className="h-full p-4 md:p-6"><PropertyManager orgSettings={orgSettings} onUpdateOrgSettings={setOrgSettings} definitions={propertyDefinitions} onAddProperty={handleAddProperty} onUpdateProperty={handleUpdateProperty} onDeleteProperty={handleDeleteProperty} onLoadPresets={()=>{}} /></div>}
          {activeView === 'user_prefs' && <UserPreferences 
              currentUser={currentUser} 
              departments={departments} 
              integrationConfig={googleIntegration} 
              onUpdateUser={(updates) => handleUpdateTeamMember({ ...currentUser, ...updates })} 
              onConnectGoogle={handleGoogleConnect} 
              onDisconnectGoogle={handleGoogleDisconnect} 
              onToggleIntegrationFeature={handleToggleIntegrationFeature}
              theme={theme} 
              onUpdateTheme={setTheme} 
          />}

          {currentProject && (
            <div className="h-full flex flex-col">
              <div className="px-4 md:px-6 border-b border-border bg-surface sticky top-0 z-10 shadow-sm">
                <div className="flex space-x-6 overflow-x-auto no-scrollbar">
                  <button onClick={() => setActiveProjectTab('overview')} className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeProjectTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'}`}><Layout size={16} /> Overview</button>
                  <button onClick={() => setActiveProjectTab('list')} className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeProjectTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'}`}>Task List</button>
                  <button onClick={() => setActiveProjectTab('board')} className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeProjectTab === 'board' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'}`}>Status</button>
                  <button onClick={() => setActiveProjectTab('pulse')} className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeProjectTab === 'pulse' ? 'border-secondary text-secondary' : 'border-transparent text-muted hover:text-main'}`}><Activity size={16} /> Project Pulse</button>
                  <button onClick={() => setActiveProjectTab('gantt')} className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeProjectTab === 'gantt' ? 'border-secondary text-secondary' : 'border-transparent text-muted hover:text-main'}`}><BarChart2 size={16} /> Gantt</button>
                  <button onClick={() => setActiveProjectTab('planner')} className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeProjectTab === 'planner' ? 'border-warning text-warning' : 'border-transparent text-muted hover:text-main'}`}><BarChart2 size={16} /> Planner</button>
                  <button onClick={() => setActiveProjectTab('files')} className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeProjectTab === 'files' ? 'border-info text-info' : 'border-transparent text-muted hover:text-main'}`}><FolderOpen size={16} /> Files</button>
                  <button onClick={() => setActiveProjectTab('automations')} className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeProjectTab === 'automations' ? 'border-warning text-warning' : 'border-transparent text-muted hover:text-main'}`}><Zap size={16} /> Automations</button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {activeProjectTab === 'overview' && <ProjectOverview currentUser={currentUser} project={currentProject} tasks={filteredTasks} allTasks={tasks} team={team} budgetLines={budgetLines} projectGroups={projectGroups} customProperties={propertyDefinitions.projects} onUpdateProject={handleUpdateProject} onAddBudgetLine={handleAddBudgetLine} onUpdateBudgetLine={(line) => setBudgetLines(prev => prev.map(b => b.id === line.id ? line : b))} onDeleteBudgetLine={(id) => setBudgetLines(prev => prev.filter(b => b.id !== id))} onDeleteProject={handleDeleteProject} />}
                {activeProjectTab === 'board' && <div className="h-full p-4 md:p-6 bg-background"><ProjectBoard currentUser={currentUser} project={currentProject} tasks={filteredTasks.filter(t => !t.isSection)} team={team} allTasks={tasks} customProperties={propertyDefinitions.tasks} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onTaskClick={setSelectedTask} onAddTaskClick={() => handleOpenModal()} onOpenBulkAddModal={onOpenBulkAddModal} onAddColumn={handleAddColumn} onDeleteColumn={handleDeleteColumn} onUpdateColumnTitle={handleUpdateColumnTitle} onUpdateColumnColor={handleUpdateColumnColor} processingTaskId={null} onSetView={handleSetProjectView} currentView="board" /></div>}
                {activeProjectTab === 'pulse' && <ProjectPulse project={currentProject} tasks={filteredTasks} team={team} onUpdateTask={handleUpdateTask} onTaskClick={setSelectedTask} />}
                {activeProjectTab === 'list' && <div className="h-full p-4 md:p-6 bg-background"><ProjectListView project={currentProject} tasks={filteredTasks} team={team} customProperties={propertyDefinitions.tasks} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onTaskClick={setSelectedTask} onAddTaskClick={handleOpenModal} onOpenBulkAddModal={onOpenBulkAddModal} onAddSectionClick={() => setIsCreateSectionModalOpen(true)} onGenerateSubtasks={()=>{}} onInlineCreateTask={handleInlineCreateTask} onSetView={handleSetProjectView} currentView="list" smartKeys={orgSettings.smartKeys} /></div>}
                {activeProjectTab === 'gantt' && <ProjectGanttView project={currentProject} tasks={filteredTasks} team={team} onTaskClick={setSelectedTask} onUpdateTask={handleUpdateTask} onAddTaskClick={() => handleOpenModal()} />}
                {activeProjectTab === 'planner' && <ProjectPlannerView project={currentProject} tasks={filteredTasks} team={team} onUpdateMultipleTasks={handleUpdateMultipleTasks} onTaskClick={setSelectedTask} />}
                {activeProjectTab === 'files' && <ProjectFiles project={currentProject} onUpdateProject={handleUpdateProject} />}
                {activeProjectTab === 'automations' && <ProjectAutomations project={currentProject} team={team} onUpdateProject={handleUpdateProject} taskProperties={propertyDefinitions.tasks} />}
              </div>
            </div>
          )}
        </main>
      </div>

      {isModalOpen && <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateTask} tasks={tasksForModal} budgetLines={currentProject?.budget ? budgetLines.filter(b => b.projectId === currentProject?.id) : []} parentId={modalParentId} smartKeys={orgSettings.smartKeys} />}
      {isBulkAddModalOpen && currentProject && (
        <BulkAddTaskModal
            isOpen={isBulkAddModalOpen}
            onClose={() => setIsBulkAddModalOpen(false)}
            onSubmit={handleBulkCreateTasks}
            columns={currentProject.columns || COLUMNS}
        />
      )}
      {selectedTask && <TaskDetailModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} team={team} allTasks={tasks} projects={projects} budgetLines={budgetLines} onUpdate={handleUpdateTask} currentUser={currentUser} />}
      {isAddMemberModalOpen && <AddMemberModal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)} onSubmit={handleAddTeamMember} />}
      {isNewGoalModalOpen && <NewGoalModal isOpen={isNewGoalModalOpen} onClose={() => { setIsNewGoalModalOpen(false); setEditingGoal(null); }} onSubmit={submitGoal} team={team} goals={goals} projects={projects} tasks={tasks} parentId={newGoalParentId} editingGoal={editingGoal} />}
      {isCommandPaletteOpen && <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} projects={projects} tasks={tasks} team={team} onNavigate={handleNavigate} onTaskClick={(t) => { setSelectedTask(t); handleNavigate(t.projectId); }} />}
      <NotificationDrawer isOpen={isNotificationDrawerOpen} onClose={() => setIsNotificationDrawerOpen(false)} notifications={notifications} onClear={() => setNotifications([])}/>
      {isCreateGroupModalOpen && <InputModal isOpen={isCreateGroupModalOpen} onClose={() => setIsCreateGroupModalOpen(false)} onSubmit={submitCreateGroup} title="Portfolio Group" placeholder="e.g. Q4 Initiatives" />}
      {isCreateProjectModalOpen && <InputModal isOpen={isCreateProjectModalOpen} onClose={() => setIsCreateProjectModalOpen(false)} onSubmit={submitCreateProject} title="New Project" placeholder="Project Name" />}
      {isCreateDeptModalOpen && <InputModal isOpen={isCreateDeptModalOpen} onClose={() => setIsCreateDeptModalOpen(false)} onSubmit={handleAddDepartment} title="New Department" placeholder="e.g. Customer Success" />}
      {isCreateSectionModalOpen && <InputModal isOpen={isCreateSectionModalOpen} onClose={() => setIsCreateSectionModalOpen(false)} onSubmit={submitCreateSection} title="New Section" placeholder="Section Name" buttonText="Create Section" />}
      {currentProject && isShareViewOpen && <ExternalShareView project={currentProject} tasks={filteredTasks} team={team} orgSettings={orgSettings} onClose={() => setIsShareViewOpen(false)} />}
    </div>
  );
};

export default App;
