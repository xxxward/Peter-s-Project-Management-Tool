
import React, { useState } from 'react';
import { Project, Task, BudgetLineItem, TeamMember, DashboardPreset, Department } from '../types';
import { PieChart, TrendingUp, AlertCircle, DollarSign, Clock, Receipt, Lock, ChevronRight, ArrowRight, LayoutDashboard, Briefcase, Users, User, CheckCircle2, ListTodo, Calendar, BarChart } from 'lucide-react';

interface DashboardProps {
  currentUser: TeamMember;
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
  departments: Department[];
  budgetLines?: BudgetLineItem[];
  onNavigate?: (view: string, filter?: string, status?: 'all' | 'active' | 'completed') => void;
  onViewUser?: (userId: string, status?: 'all' | 'active' | 'completed') => void;
  onTaskClick: (task: Task) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical': return 'border-nexus-red';
    case 'High': return 'border-orange-500';
    case 'Medium': return 'border-nexus-blue';
    default: return 'border-gray-300';
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, projects, tasks, team, departments, budgetLines = [], onNavigate, onViewUser, onTaskClick }) => {
  const [activeTab, setActiveTab] = useState<DashboardPreset>('Executive');
  const isAdmin = currentUser.permissionLevel === 'Admin';

  // --- Data Calculations ---
  // Executive
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  const totalActuals = budgetLines.reduce((acc, line) => acc + (line.actualSpent || 0), 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length;
  const budgetUsage = totalBudget > 0 ? (totalActuals / totalBudget) * 100 : 0;
  const statusDist = [
    { label: 'Active', value: activeProjects, color: 'bg-green-500', filter: 'active' },
    { label: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length, color: 'bg-yellow-500', filter: 'hold' },
    { label: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: 'bg-blue-500', filter: 'completed' },
  ];

  // Personnel (Mocking ID match for demo if needed, but sticking to strict ID for correctness)
  const myTasks = tasks.filter(t => t.assignee === currentUser.id);
  const myOpenTasks = myTasks.filter(t => !t.completed);
  const myOverdue = myOpenTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const myCompleted = myTasks.filter(t => t.completed);

  // Team
  const userDept = departments.find(d => d.id === currentUser.departmentId);
  const teamMembers = team.filter(m => m.departmentId === currentUser.departmentId);
  const teamMemberIds = teamMembers.map(m => m.id);
  const teamTasks = tasks.filter(t => t.assignee && teamMemberIds.includes(t.assignee));
  const teamOpenTasks = teamTasks.filter(t => !t.completed);
  const teamProjectIds = [...new Set(teamTasks.map(t => t.projectId))];
  const teamProjects = projects.filter(p => teamProjectIds.includes(p.id));

  const handleNav = (view: string, filter?: string, status: 'all' | 'active' | 'completed' = 'all') => {
    if (onNavigate) onNavigate(view, filter, status);
  };

  const handleViewUser = (userId: string, status: 'all' | 'active' | 'completed' = 'all') => {
    if (onViewUser) onViewUser(userId, status);
  };

  const TabButton = ({ name, icon: Icon }: { name: DashboardPreset; icon: any }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative ${
        activeTab === name
          ? 'text-nexus-primary'
          : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      <Icon size={18} className={activeTab === name ? 'text-nexus-primary' : 'text-gray-400'} />
      {name}
      {activeTab === name && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-nexus-primary rounded-t-full"></div>
      )}
    </button>
  );

  const TaskListItem: React.FC<{ task: Task, showProject?: boolean }> = ({ task, showProject = false }) => (
    <div 
      onClick={() => onTaskClick(task)}
      className={`p-3.5 rounded-xl flex items-center justify-between cursor-pointer group transition-all border border-gray-100 hover:border-nexus-primary/30 hover:shadow-md bg-white mb-2`}
    >
      <div className="flex items-start gap-3 overflow-hidden">
         <div className={`w-1 h-8 rounded-full mt-1 ${task.priority === 'Critical' ? 'bg-nexus-red' : task.priority === 'High' ? 'bg-orange-400' : 'bg-nexus-blue'}`}></div>
         <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 truncate group-hover:text-nexus-primary transition-colors">{task.title}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              {showProject && <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-gray-600"><Briefcase size={10}/> {projects.find(p => p.id === task.projectId)?.name || '...'}</span>}
              {task.dueDate && <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
            </div>
         </div>
      </div>
      <ChevronRight size={16} className="text-gray-300 group-hover:text-nexus-primary transition-transform group-hover:translate-x-1" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
             <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
             <div className="text-gray-500 dark:text-gray-400 mt-1">Overview for {currentUser.name} • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {isAdmin && <TabButton name="Executive" icon={LayoutDashboard} />}
          <TabButton name="Manager" icon={BarChart} />
          <TabButton name="Team" icon={Users} />
          <TabButton name="Personnel" icon={User} />
        </div>
      </div>

      {activeTab === 'Executive' && isAdmin && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button type="button" onClick={() => handleNav('projects_master', 'active')} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-5 cursor-pointer hover:-translate-y-1 transition-transform duration-300 group text-left w-full"><div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors"><TrendingUp size={28} /></div><div><div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Projects</div><div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalProjects}</div><div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-semibold mt-1 bg-green-50 px-2 py-0.5 rounded-full w-fit">{activeProjects} Active</div></div></button>
            {isAdmin && (
              <>
                <button type="button" onClick={() => handleNav('global_budget')} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-5 cursor-pointer hover:-translate-y-1 transition-transform duration-300 group text-left w-full"><div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors"><DollarSign size={28} /></div><div><div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Budget</div><div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${totalBudget.toLocaleString()}</div><div className="text-xs text-gray-400 mt-1 flex items-center gap-1">View Details <ArrowRight size={10}/></div></div></button>
                <button type="button" onClick={() => handleNav('global_budget')} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-5 cursor-pointer hover:-translate-y-1 transition-transform duration-300 group text-left w-full"><div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl"><Receipt size={28} /></div><div><div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Actual Costs</div><div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${totalActuals.toLocaleString()}</div><div className="w-24 bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden"><div className={`h-full rounded-full ${budgetUsage > 100 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(budgetUsage, 100)}%` }}></div></div></div></button>
              </>
            )}
            <button type="button" onClick={() => handleNav('overdue_tasks')} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-5 cursor-pointer hover:-translate-y-1 transition-transform duration-300 group text-left w-full"><div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors"><AlertCircle size={28} /></div><div><div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Attention Needed</div><div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{overdueTasks}</div><div className="text-xs text-red-500 dark:text-red-400 font-semibold flex items-center gap-1 mt-1">Overdue Tasks <ArrowRight size={10} /></div></div></button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2"><PieChart size={20} className="text-nexus-blue" />Portfolio Distribution</h3>
                </div>
                <div className="space-y-5">
                   {statusDist.map(stat => (
                      <div key={stat.label} className="cursor-pointer group" onClick={() => handleNav('projects_master', stat.filter)}>
                         <div className="flex justify-between text-sm mb-2 px-1">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-nexus-primary transition-colors flex items-center gap-2">
                               <div className={`w-2 h-2 rounded-full ${stat.color}`}></div> {stat.label}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">{stat.value}</span>
                         </div>
                         <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                            <div className={`h-full ${stat.color} opacity-80 group-hover:opacity-100 transition-all duration-500`} style={{ width: `${totalProjects > 0 ? (stat.value / totalProjects) * 100 : 0}%` }}></div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             <div className="bg-gradient-to-br from-nexus-primary to-indigo-700 p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-10 translate-x-10 pointer-events-none"></div>
                <h3 className="font-bold text-xl mb-2 flex items-center gap-2 relative z-10"><Clock size={22} />Timeline Health</h3>
                <p className="text-indigo-100 text-sm mb-8 relative z-10">{overdueTasks > 0 ? `${overdueTasks} tasks need immediate attention.` : "Project timeline is healthy."}</p>
                <div className="flex flex-col gap-4 relative z-10">
                   <div 
                      className="bg-white/10 px-5 py-3 rounded-xl backdrop-blur-md border border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/20 transition-colors"
                      onClick={() => handleNav('all_tasks', undefined, 'completed')}
                    >
                      <span className="text-indigo-100 text-sm font-medium">Completed Tasks</span>
                      <span className="text-2xl font-bold">{completedTasks}</span>
                   </div>
                   <div 
                      className="bg-white/10 px-5 py-3 rounded-xl backdrop-blur-md border border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/20 transition-colors"
                      onClick={() => handleNav('all_tasks', undefined, 'active')}
                   >
                      <span className="text-indigo-100 text-sm font-medium">Pending Tasks</span>
                      <span className="text-2xl font-bold">{totalTasks - completedTasks}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Manager' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div onClick={() => handleNav('projects_master', 'active')} className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all"><div className="text-sm text-gray-500 font-medium">Active Projects</div><div className="text-3xl font-bold text-gray-900">{activeProjects}</div></div>
            <div onClick={() => handleNav('all_tasks', undefined, 'completed')} className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all"><div className="text-sm text-gray-500 font-medium">Completion Rate</div><div className="text-3xl font-bold text-gray-900">{totalTasks > 0 ? `${Math.round((completedTasks/totalTasks)*100)}%` : 'N/A'}</div></div>
            <div onClick={() => handleNav('overdue_tasks')} className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all"><div className="text-sm text-gray-500 font-medium">Overdue Tasks</div><div className="text-3xl font-bold text-red-600">{overdueTasks}</div></div>
            <div onClick={() => handleNav('team')} className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all"><div className="text-sm text-gray-500 font-medium">Team Size</div><div className="text-3xl font-bold text-gray-900">{team.length}</div></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 px-1">Active Projects</h3>
              <div className="space-y-2">
                {projects.filter(p => p.status === 'Active').slice(0, 5).map(p => (
                  <div key={p.id} onClick={() => handleNav(p.id)} className="p-4 rounded-xl flex items-center justify-between cursor-pointer group transition-colors border border-gray-100 hover:border-nexus-primary hover:shadow-sm">
                    <div><p className="font-bold text-sm text-gray-800">{p.name}</p><p className="text-xs text-gray-500 mt-1">{p.description}</p></div>
                    {isAdmin && (
                        <div className="flex items-center gap-3">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">
                            {Math.round(p.budget ? (budgetLines.filter(b=>b.projectId===p.id).reduce((a,b)=>a+b.actualSpent,0)/p.budget)*100 : 0)}% Budget
                        </span>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-nexus-primary" />
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 px-1 flex items-center gap-2"><AlertCircle size={16} className="text-red-500"/> At-Risk Items</h3>
              <div className="space-y-2">
                 {tasks.filter(t => !t.completed && (t.priority === 'Critical' || (t.dueDate && new Date(t.dueDate) < new Date()))).slice(0, 5).map(task => <TaskListItem key={task.id} task={task} showProject />)}
                 {tasks.filter(t => !t.completed && (t.priority === 'Critical' || (t.dueDate && new Date(t.dueDate) < new Date()))).length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                       <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400"/>
                       <p className="text-sm">No critical issues found.</p>
                    </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Team' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-gray-800">{userDept?.name || 'Department'} Overview</h2>
             <span onClick={() => handleNav('team')} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors">{teamMembers.length} Members</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 px-1">Department Task Queue</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                 {teamOpenTasks.length > 0 ? (
                    teamOpenTasks.map(task => <TaskListItem key={task.id} task={task} showProject />)
                 ) : (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                       <p>No active tasks for this department.</p>
                    </div>
                 )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 px-1">Team Load</h3>
                <div className="space-y-4">
                  {teamMembers.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between group p-2 rounded-lg -mx-2 hover:bg-gray-50 transition-colors"
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer" 
                        onClick={() => handleViewUser(member.id)}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${member.color} shadow-sm border-2 border-white`}>{member.initials}</div>
                        <div><p className="font-semibold text-sm text-gray-800">{member.name}</p><p className="text-xs text-gray-500">{member.role}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div 
                            className="flex flex-col items-end cursor-pointer hover:text-nexus-primary transition-colors"
                            onClick={() => handleViewUser(member.id, 'active')}
                          >
                             <span className="text-sm font-bold text-gray-700">{tasks.filter(t => t.assignee === member.id && !t.completed).length}</span>
                             <span className="text-[10px] uppercase text-gray-400">Open</span>
                         </div>
                         <div className="w-px h-6 bg-gray-200"></div>
                         <div 
                            className="flex flex-col items-end cursor-pointer hover:text-green-600 transition-colors"
                            onClick={() => handleViewUser(member.id, 'completed')}
                         >
                             <span className="text-sm font-bold text-gray-700">{tasks.filter(t => t.assignee === member.id && t.completed).length}</span>
                             <span className="text-[10px] uppercase text-gray-400">Done</span>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Personnel' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div onClick={() => handleViewUser(currentUser.id, 'active')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-5 cursor-pointer hover:shadow-md transition-all">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><ListTodo size={24}/></div>
              <div><div className="text-sm text-gray-500 font-medium">My Open Tasks</div><div className="text-3xl font-bold text-gray-900">{myOpenTasks.length}</div></div>
            </div>
            <div onClick={() => handleNav('overdue_tasks')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-5 cursor-pointer hover:shadow-md transition-all">
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><AlertCircle size={24}/></div>
              <div><div className="text-sm text-gray-500 font-medium">Overdue</div><div className="text-3xl font-bold text-red-600">{myOverdue.length}</div></div>
            </div>
            <div onClick={() => handleViewUser(currentUser.id, 'completed')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-5 cursor-pointer hover:shadow-md transition-all">
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><CheckCircle2 size={24}/></div>
              <div><div className="text-sm text-gray-500 font-medium">Total Completed</div><div className="text-3xl font-bold text-green-600">{myCompleted.length}</div></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
              <h3 className="font-bold text-gray-800 mb-6 px-1 flex items-center gap-2"><Clock size={18} className="text-nexus-primary"/> My Priority Tasks</h3>
              <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {myOpenTasks.sort((a,b) => (b.priority > a.priority ? 1 : -1)).map(task => <TaskListItem key={task.id} task={task} showProject />)}
                {myOpenTasks.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                         <CheckCircle2 size={32} className="text-green-400" />
                      </div>
                      <p className="font-medium text-gray-600">You're all caught up!</p>
                      <p className="text-sm mt-1">No pending tasks assigned to you.</p>
                   </div>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
              <h3 className="font-bold text-gray-800 mb-6 px-1 flex items-center gap-2"><CheckCircle2 size={18} className="text-green-500"/> Recently Completed</h3>
              <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {myCompleted.slice(0, 10).map(task => (
                   <div key={task.id} onClick={() => onTaskClick(task)} className="p-3 rounded-xl flex items-center justify-between group cursor-pointer border border-transparent hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 size={14} /></div>
                         <div>
                            <p className="text-sm font-medium text-gray-600 line-through decoration-gray-400">{task.title}</p>
                            <p className="text-xs text-gray-400">{projects.find(p => p.id === task.projectId)?.name}</p>
                         </div>
                      </div>
                      <span className="text-xs text-gray-400">Done</span>
                   </div>
                ))}
                {myCompleted.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                      <p>No tasks completed yet.</p>
                      <p className="text-xs mt-2">Finish a task to see it here.</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
