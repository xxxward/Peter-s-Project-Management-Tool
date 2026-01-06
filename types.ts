

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TaskStatus = string;

export type PropertyType = 'text' | 'number' | 'dropdown' | 'multiselect' | 'date' | 'currency' | 'user' | 'checkbox' | 'url' | 'email' | 'rating';

export type PermissionLevel = 'Admin' | 'Standard' | 'Viewer';

export type DashboardPreset = 'Executive' | 'Manager' | 'Team' | 'Personnel';

export type DependencyType = 'FS' | 'SS'; // Finish-to-Start, Start-to-Start

export interface Dependency {
  taskId: string;
  type: DependencyType;
}

export interface PropertyDefinition {
  id: string;
  name: string;
  type: PropertyType;
  options?: string[]; // Comma-separated options for dropdowns
  isSystem?: boolean; // If true, cannot be deleted
}

export interface SmartKeyRule {
  id: string;
  key: string; // '1' through '9'
  actionField: 'dueDate' | 'priority' | 'status';
  actionValue: string | number;
}

export interface OrganizationSettings {
  name: string;
  domain: string;
  fiscalYearStart: string;
  currency: string;
  timezone: string;
  logoUrl?: string;
  supportEmail?: string;
  workingDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  smartKeys?: {
    enabled: boolean;
    rules: SmartKeyRule[];
  };
}

export interface CustomProperties {
  [key: string]: any;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
  startDate?: string;
  dueDate?: string;
  attachments?: Attachment[];
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  isSystem?: boolean;
}

export interface TimeLog {
  id: string;
  userId: string;
  hours: number;
  date: string;
  description?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'sheet' | 'doc' | 'slide' | 'folder' | 'other';
  uploadedAt: string;
  size?: string;
  owner?: string;
  parentId?: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
  color: string; // Tailwind color name: 'gray', 'red', 'blue', 'yellow', 'green'
}

export interface ProjectGroup {
  id: string;
  name: string;
  color?: string; 
}

export interface BudgetLineItem {
  id: string;
  projectId: string;
  name: string;
  allocated: number;
  actualSpent: number; 
  customProperties?: CustomProperties;
}

export interface IntegrationConfig {
  isConnected: boolean;
  connectedEmail?: string;
  features: {
    autoDriveFolders: boolean;
    taskSync: boolean;
    smartAlerts: boolean;
    autoChatSpace: boolean;
  };
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerField: string;
  triggerValue: string | boolean | number;
  actionField: string;
  actionValue: string | boolean | number;
  active: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export interface ViewConfig {
  id: string;
  name: string;
  visibleColumns: string[];
  groupBy: string | null;
}

export interface Project {
  id: string;
  groupId?: string;
  name: string;
  description: string;
  status: 'Active' | 'On Hold' | 'Completed' | 'Archived';
  startDate?: string;
  dueDate?: string;
  budget?: number;
  ownerId?: string;
  driveLink: string;
  chatLink?: string; 
  sheetId: string;
  columns?: Column[]; 
  files?: Attachment[]; 
  customProperties?: CustomProperties;
  automations?: AutomationRule[];
  views?: ViewConfig[];
  activeViewId?: string;
}

export interface Department {
  id: string;
  name: string;
  headId?: string;
  description?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  color: string;
  permissionLevel: PermissionLevel;
  departmentId?: string;
  customProperties?: CustomProperties;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  completed: boolean; 
  assignee?: string;
  startDate?: string;
  dueDate?: string;
  budgetLineItemId?: string;
  dependencies?: Dependency[]; 
  subtasks: Subtask[];
  tags: string[];
  comments?: Comment[];
  timeLogs?: TimeLog[];
  attachments?: Attachment[];
  aiSuggestions?: string;
  customProperties?: CustomProperties;
  estimatedHours?: number;
  duration?: number;
  parentId?: string;
  isSection?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'isSet' | 'isNotSet';
  value: string;
}

export interface ReportWidget {
  id: string;
  title: string;
  description?: string;
  type: 'bar' | 'donut' | 'summary' | 'table';
  entity: 'tasks' | 'projects';
  groupBy?: string;
  metric: 'count' | 'budget' | 'hours';
  filters?: ReportFilter[];
  selectedFields?: string[]; // For table view
}

// --- Goals Feature Types ---

export type GoalStatus = 'On Track' | 'At Risk' | 'Off Track' | 'Completed' | 'Not Started';
export type GoalProgressMethod = 'Manual' | 'Subgoals' | 'Projects' | 'Tasks';

export interface GoalProgressSource {
  id: string; // ID of project or task
  type: 'project' | 'task';
}

export interface GoalStatusUpdate {
  id: string;
  authorId: string;
  createdAt: string;
  status: GoalStatus;
  notes: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  ownerId: string; // TeamMember ID
  timePeriod: string; // e.g., "Q1 2025", "FY2024"
  status: GoalStatus;
  progress: number; // Percentage (0-100)
  progressMethod: GoalProgressMethod;
  progressSource?: GoalProgressSource[]; // For 'Projects' or 'Tasks' method
  parentId?: string; // For sub-goals
  isPrivate: boolean;
  members?: string[]; // TeamMember IDs for private goals
  statusUpdates?: GoalStatusUpdate[];
  relatedWork?: { type: 'project' | 'portfolio'; id: string }[];
}


export const COLUMNS: Column[] = [
  { id: 'Unscheduled', title: 'Unscheduled', color: 'gray' },
  { id: 'Not Started', title: 'Not Started', color: 'red' },
  { id: 'In Progress', title: 'In Progress', color: 'blue' },
  { id: 'On Hold', title: 'On Hold', color: 'yellow' },
  { id: 'Completed', title: 'Completed', color: 'green' },
];
