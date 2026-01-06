
import React, { useState } from 'react';
import { Project, Task, TeamMember, Dependency } from '../types';
import { AlertTriangle, Link as LinkIcon } from 'lucide-react';

interface ProjectPulseProps {
  project: Project;
  tasks: Task[];
  team: TeamMember[];
  onUpdateTask: (task: Task) => void;
  onTaskClick: (task: Task) => void;
}

export const ProjectPulse: React.FC<ProjectPulseProps> = ({ project, tasks, team, onUpdateTask, onTaskClick }) => {
  const [view, setView] = useState<'timeline' | 'dependencies'>('timeline');

  const sortedTasks = [...tasks].sort((a, b) => {
    return (a.startDate || '').localeCompare(b.startDate || '') || (a.dueDate || '').localeCompare(b.dueDate || '');
  });

  const getMemberName = (id?: string) => team.find(m => m.id === id)?.name || 'Unassigned';

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      
      {/* Main Content: Management & Timeline */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={() => setView('timeline')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === 'timeline' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Timeline (Gantt)
            </button>
            <button 
              onClick={() => setView('dependencies')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === 'dependencies' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Dependencies
            </button>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
             <AlertTriangle size={12} className="text-orange-500" />
             {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length} Overdue
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {view === 'timeline' && (
            <div className="space-y-4">
              {sortedTasks.map(task => {
                 const start = task.startDate ? new Date(task.startDate) : null;
                 const end = task.dueDate ? new Date(task.dueDate) : null;
                 const isOverdue = end && end < new Date() && !task.completed;
                 
                 return (
                   <div 
                     key={task.id} 
                     className="relative group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                     onClick={() => onTaskClick(task)}
                   >
                     <div className="flex items-center justify-between mb-1 text-sm">
                       <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                         {task.title}
                       </span>
                       <span className="text-xs text-gray-500">
                         {start?.toLocaleDateString()} - {end?.toLocaleDateString() || 'No Date'}
                       </span>
                     </div>
                     {/* Simplified Bar Representation */}
                     <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                       <div 
                         className={`h-full ${task.completed ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-blue-500'} rounded-full`} 
                         style={{ width: task.completed ? '100%' : '50%' }}
                       ></div>
                     </div>
                     <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>Assignee: {getMemberName(task.assignee)}</span>
                        {task.dependencies && task.dependencies.length > 0 && (
                          <span className="flex items-center gap-1"><LinkIcon size={10} /> Waiting on {task.dependencies.length} tasks</span>
                        )}
                     </div>
                   </div>
                 );
              })}
              {tasks.length === 0 && <div className="text-center text-gray-400 py-10">No tasks with dates found.</div>}
            </div>
          )}

          {view === 'dependencies' && (
             <div className="space-y-3">
               <p className="text-xs text-gray-500 italic mb-2">
                 Tasks linked here will automatically shift dates if the predecessor is delayed.
               </p>
               {tasks.map(task => (
                 <div key={task.id} className="p-3 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors">
                   <div className="flex items-center justify-between">
                     <span className="font-medium text-sm text-gray-800">{task.title}</span>
                     <select 
                       className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-google-blue"
                       onChange={(e) => {
                         const depId = e.target.value;
                         if (depId && !task.dependencies?.some(d => d.taskId === depId)) {
                            onUpdateTask({ ...task, dependencies: [...(task.dependencies || []), { taskId: depId, type: 'FS' }] });
                         }
                         e.target.value = '';
                       }}
                       value=""
                     >
                       <option value="">+ Add Dependency</option>
                       {tasks.filter(t => t.id !== task.id).map(t => (
                         <option key={t.id} value={t.id}>{t.title}</option>
                       ))}
                     </select>
                   </div>
                   {task.dependencies && task.dependencies.length > 0 && (
                     <div className="mt-2 pl-4 border-l-2 border-gray-200 space-y-1">
                       {task.dependencies.map(dep => {
                         const depTask = tasks.find(t => t.id === dep.taskId);
                         return (
                           <div key={dep.taskId} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-1.5 rounded justify-between group">
                             <div className="flex items-center gap-2">
                               <LinkIcon size={10} />
                               <span>{depTask?.title || 'Unknown Task'}</span>
                             </div>
                             <button 
                               onClick={() => onUpdateTask({ ...task, dependencies: task.dependencies?.filter(d => d.taskId !== dep.taskId) })}
                               className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                             >
                               Remove
                             </button>
                           </div>
                         );
                       })}
                     </div>
                   )}
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
