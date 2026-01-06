import React, { useState } from 'react';
import { Goal, TeamMember, GoalStatus, Project, Task } from '../types';
import { ChevronDown, User, Calendar, MoreVertical, Plus, Trash2, Edit, Link as LinkIcon, Briefcase, CheckSquare } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  allGoals: Goal[];
  team: TeamMember[];
  projects: Project[];
  tasks: Task[];
  level: number;
  onAddSubGoal: (parentId: string) => void;
  onUpdate: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onEdit: (goal: Goal) => void;
}

const getStatusStyles = (status: GoalStatus): { bar: string, text: string, bg: string } => {
    switch (status) {
        case 'On Track': return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
        case 'At Risk': return { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' };
        case 'Off Track': return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' };
        case 'Completed': return { bar: 'bg-nexus-primary', text: 'text-nexus-primary', bg: 'bg-nexus-primary/10' };
        default: return { bar: 'bg-gray-300', text: 'text-gray-600', bg: 'bg-gray-100' };
    }
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, allGoals, team, projects, tasks, level, onAddSubGoal, onUpdate, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const owner = team.find(t => t.id === goal.ownerId);
  const subGoals = allGoals.filter(g => g.parentId === goal.id);
  const statusStyles = getStatusStyles(goal.status);

  const linkedWork = (goal.progressSource || []).map(source => {
      if (source.type === 'project') {
          const project = projects.find(p => p.id === source.id);
          return project ? { ...project, type: 'Project', isComplete: project.status === 'Completed' } : null;
      }
      if (source.type === 'task') {
          const task = tasks.find(t => t.id === source.id);
          return task ? { ...task, type: 'Task', isComplete: task.completed } : null;
      }
      return null;
  }).filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:border-nexus-primary/30">
        <div className="flex p-5 gap-4">
            <div className={`w-1.5 rounded-full ${statusStyles.bar}`}></div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            {subGoals.length > 0 && (
                                <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400 hover:text-gray-700">
                                    <ChevronDown size={16} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                </button>
                            )}
                            {subGoals.length === 0 && <div className="w-6"></div>}
                            <h3 className="font-bold text-gray-900 text-base">{goal.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 ml-8">
                            {owner && <div className="flex items-center gap-1.5"><User size={12}/> {owner.name}</div>}
                            <div className="flex items-center gap-1.5"><Calendar size={12}/> {goal.timePeriod}</div>
                            <div className={`px-2 py-0.5 rounded-full font-medium border ${statusStyles.bg} ${statusStyles.text}`}>{goal.status}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                           <div className="font-bold text-xl text-gray-800">{goal.progress}%</div>
                           <div className="text-xs text-gray-400 -mt-1">Complete</div>
                        </div>
                        <div className="relative">
                            <button onClick={() => setIsMenuOpen(p => !p)} className="p-2 text-gray-400 rounded-full hover:bg-gray-100">
                                <MoreVertical size={16}/>
                            </button>
                            {isMenuOpen && (
                                <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1">
                                    <button onClick={() => { onAddSubGoal(goal.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"><Plus size={14}/> Add Sub-goal</button>
                                    <button onClick={() => { onEdit(goal); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"><Edit size={14}/> Edit</button>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button onClick={() => { onDelete(goal.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14}/> Delete</button>
                                </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 ml-8">
                    <div className="h-2.5 bg-gray-200 rounded-full w-full overflow-hidden">
                        <div className={`h-full ${statusStyles.bar} rounded-full`} style={{width: `${goal.progress}%`}}></div>
                    </div>
                </div>

                {linkedWork.length > 0 && (
                    <div className="mt-4 ml-8">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <LinkIcon size={12} /> Connected Work
                        </div>
                        <div className="space-y-3">
                            {linkedWork.map((item: any) => (
                               <div key={item.id}>
                                 <div className="flex justify-between items-center text-xs mb-1">
                                   <div className="flex items-center gap-1.5 font-medium text-gray-700 truncate">
                                     {item.type === 'Project' ? <Briefcase size={12} className="text-gray-400"/> : <CheckSquare size={12} className="text-gray-400"/>}
                                     <span className="truncate" title={item.name || item.title}>{item.name || item.title}</span>
                                   </div>
                                   <span className={`font-semibold ${item.isComplete ? 'text-green-600' : 'text-gray-500'}`}>
                                     {item.isComplete ? '100%' : '0%'}
                                   </span>
                                 </div>
                                 <div className="h-1.5 bg-gray-200 rounded-full w-full overflow-hidden">
                                     <div 
                                         className={`h-full rounded-full ${item.isComplete ? 'bg-green-500' : 'bg-gray-200'}`} 
                                         style={{ width: item.isComplete ? '100%' : '0%' }}
                                     ></div>
                                 </div>
                               </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {isExpanded && subGoals.length > 0 && (
            <div className="pl-12 pr-5 pb-5 space-y-3 border-t border-gray-100 pt-5">
                {subGoals.map(subGoal => (
                    <GoalCard 
                        key={subGoal.id}
                        goal={subGoal}
                        allGoals={allGoals}
                        team={team}
                        projects={projects}
                        tasks={tasks}
                        level={level + 1}
                        onAddSubGoal={onAddSubGoal}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        )}
    </div>
  );
};
