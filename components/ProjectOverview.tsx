import React, { useState, useMemo } from 'react';
import { Project, Task, BudgetLineItem, TeamMember, PropertyDefinition, ProjectGroup } from '../types';
import { Plus, DollarSign, PieChart, Trash2, Calendar, User, AlignLeft, Layout, SlidersHorizontal, AlertCircle, ChevronDown, Check, Folder, Edit2, Lock, TrendingUp, BarChart2 } from 'lucide-react';
import { EditableCell } from './EditableCell';

// Date helpers
const getDaysDiff = (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const calculateProjectedEndDate = (projectTasks: Task[], allTasks: Task[]): Date | null => {
    if (!projectTasks.length) return null;

    const taskMap = new Map<string, Task>(allTasks.map(t => [t.id, t]));
    const memo = new Map<string, Date>();
    const path = new Set<string>(); // For circular dependency detection

    const getEarliestFinishDate = (taskId: string): Date => {
        if (memo.has(taskId)) return memo.get(taskId)!;
        if (path.has(taskId)) return new Date(0); // Circular dependency detected

        const task = taskMap.get(taskId);
        if (!task || !task.dueDate) return new Date(0);

        path.add(taskId);

        const originalStartDate = task.startDate ? new Date(task.startDate) : new Date(task.dueDate);
        const originalEndDate = new Date(task.dueDate);
        const duration = getDaysDiff(originalStartDate, originalEndDate);

        let newStartDate = originalStartDate;

        if (task.dependencies && task.dependencies.length > 0) {
            const predecessorFinishDates = task.dependencies
                .map(dep => getEarliestFinishDate(dep.taskId))
                .filter(d => d.getTime() > 0);

            if (predecessorFinishDates.length > 0) {
                const latestPredecessorFinish = new Date(Math.max(...predecessorFinishDates.map(d => d.getTime())));
                const potentialStartDate = addDays(latestPredecessorFinish, 1); // FS + 1 day lag
                newStartDate = potentialStartDate;
            }
        }
        
        const finishDate = addDays(newStartDate, duration);
        memo.set(taskId, finishDate);
        path.delete(taskId);
        return finishDate;
    };

    const allFinishDates = projectTasks.map(t => getEarliestFinishDate(t.id));
    const validDates = allFinishDates.filter(d => d.getTime() > 0);

    if (validDates.length === 0) return null;

    return new Date(Math.max(...validDates.map(d => d.getTime())));
};


const TimelineForecast: React.FC<{ project: Project, tasks: Task[], allTasks: Task[] }> = ({ project, tasks, allTasks }) => {
    const projectedEndDate = useMemo(() => calculateProjectedEndDate(tasks, allTasks), [tasks, allTasks]);
    
    const targetDate = project.dueDate ? new Date(project.dueDate) : null;
    let status: 'On Track' | 'At Risk' = 'On Track';
    let difference = 0;

    if (targetDate && projectedEndDate) {
        difference = getDaysDiff(targetDate, projectedEndDate);
        if (projectedEndDate > targetDate) {
            status = 'At Risk';
        }
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart2 size={16} /> Timeline Forecast
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5"><Calendar size={12} /> Target Due Date</div>
                    <div className="text-xl font-bold text-gray-800 dark:text-white">
                        {targetDate ? targetDate.toLocaleDateString() : 'Not Set'}
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5"><TrendingUp size={12} /> Projected Completion</div>
                    <div className="text-xl font-bold text-gray-800 dark:text-white">
                        {projectedEndDate ? projectedEndDate.toLocaleDateString() : 'N/A'}
                    </div>
                </div>
                <div className={`p-4 rounded-lg border ${status === 'On Track' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'}`}>
                    <div className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${status === 'On Track' ? 'text-green-700' : 'text-red-700'}`}>
                        {status === 'On Track' ? <Check size={12} /> : <AlertCircle size={12} />} Status
                    </div>
                    <div className={`text-xl font-bold ${status === 'On Track' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                        {status === 'On Track' ? 'On Track' : `Delayed by ${difference} days`}
                    </div>
                </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
                Projection is based on current task durations and dependencies.
            </p>
        </div>
    );
};

interface ProjectOverviewProps {
  currentUser: TeamMember;
  project: Project;
  tasks: Task[];
  allTasks: Task[];
  team: TeamMember[];
  budgetLines: BudgetLineItem[];
  customProperties: PropertyDefinition[];
  projectGroups: ProjectGroup[];
  onUpdateProject: (project: Project) => void;
  onAddBudgetLine: (line: BudgetLineItem) => void;
  onUpdateBudgetLine: (line: BudgetLineItem) => void;
  onDeleteBudgetLine: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  currentUser,
  project,
  tasks,
  allTasks,
  team,
  budgetLines,
  customProperties,
  projectGroups,
  onUpdateProject,
  onAddBudgetLine,
  onUpdateBudgetLine,
  onDeleteBudgetLine,
  onDeleteProject
}) => {
  const [newLineName, setNewLineName] = useState('');
  const [newLineAmount, setNewLineAmount] = useState('');
  
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const [isFieldPickerOpen, setIsFieldPickerOpen] = useState(false);

  const projectLines = budgetLines.filter(b => b.projectId === project.id);
  
  const totalAllocated = projectLines.reduce((sum, line) => sum + line.allocated, 0);
  const totalSpent = projectLines.reduce((sum, line) => sum + (line.actualSpent || 0), 0);
  
  const totalProjectBudget = project.budget || 0;
  const unallocated = totalProjectBudget - totalAllocated;
  const percentUsed = totalProjectBudget > 0 ? (totalSpent / totalProjectBudget) * 100 : 0;

  const handleAddLineItem = () => {
    if (!newLineName.trim() || !newLineAmount.trim()) return;
    
    onAddBudgetLine({
      id: `bl-${Date.now()}`,
      projectId: project.id,
      name: newLineName,
      allocated: parseFloat(newLineAmount) || 0,
      actualSpent: 0
    });
    setNewLineName('');
    setNewLineAmount('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddLineItem();
    }
  };

  const updateField = (field: keyof Project, value: any) => {
    let finalValue = value;
    if (field === 'budget') {
        finalValue = parseFloat(value) || 0;
    }
    onUpdateProject({ ...project, [field]: finalValue });
  };

  const updateCustomField = (propId: string, value: string) => {
    const updatedCustomProps = { ...project.customProperties, [propId]: value };
    onUpdateProject({ ...project, customProperties: updatedCustomProps });
  };

  const toggleFieldVisibility = (id: string) => {
    const newSet = new Set(visibleFields);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisibleFields(newSet);
  };

  const handleDelete = () => {
      onDeleteProject(project.id);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      
      <div className="flex-1 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 relative">
           <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg">
                  <Layout size={20} className="text-nexus-primary" />
                  Project Details
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                    <button 
                    onClick={() => setIsFieldPickerOpen(!isFieldPickerOpen)}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                    >
                    <SlidersHorizontal size={14} /> Add Fields <ChevronDown size={14} />
                    </button>
                    
                    {isFieldPickerOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsFieldPickerOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 p-2 max-h-60 overflow-y-auto">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1 mb-1">Custom Fields</div>
                        {customProperties.length === 0 && <div className="px-2 py-1 text-xs text-gray-400 italic">No custom fields defined.</div>}
                        {customProperties.map(prop => (
                            <button 
                            key={prop.id}
                            onClick={() => toggleFieldVisibility(prop.id)}
                            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200 text-left"
                            >
                            <span>{prop.name}</span>
                            {visibleFields.has(prop.id) && <Check size={14} className="text-nexus-primary" />}
                            </button>
                        ))}
                        </div>
                    </>
                    )}
                </div>
                <button 
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Project"
                >
                    <Trash2 size={16} />
                </button>
              </div>
           </div>
           
           <div className="space-y-4">
              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                 <textarea 
                    className="w-full text-sm p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 outline-none focus:border-nexus-primary transition-colors resize-none"
                    rows={4}
                    value={project.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Enter project scope and goals..."
                 />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Portfolio Group</label>
                    <div className="relative">
                        <Folder size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <select 
                            value={project.groupId || ''}
                            onChange={(e) => updateField('groupId', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:border-nexus-primary cursor-pointer"
                        >
                            {projectGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Status</label>
                    <EditableCell 
                       value={project.status}
                       type="dropdown"
                       options={['Active', 'On Hold', 'Completed']}
                       onChange={(val) => updateField('status', val)}
                       className={`border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm ${project.status === 'Active' ? 'text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-50 dark:bg-gray-900 dark:text-gray-300'}`}
                    />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Project Owner</label>
                    <EditableCell 
                       value={team.find(t => t.id === project.ownerId)?.name || 'Unassigned'}
                       type="user"
                       options={team.map(t => t.name)}
                       onChange={(val) => {
                          const member = team.find(t => t.name === val);
                          updateField('ownerId', member ? member.id : '');
                       }}
                       className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Start Date</label>
                    <EditableCell 
                       value={project.startDate}
                       type="date"
                       onChange={(val) => updateField('startDate', val)}
                       className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Due Date</label>
                    <EditableCell 
                       value={project.dueDate}
                       type="date"
                       onChange={(val) => updateField('dueDate', val)}
                       className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-white"
                    />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Google Chat Space Link</label>
                    <EditableCell 
                       value={project.chatLink}
                       type="text"
                       placeholder="https://chat.google.com/..."
                       onChange={(val) => updateField('chatLink', val)}
                       className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-white truncate"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Drive Folder Link</label>
                    <EditableCell 
                       value={project.driveLink}
                       type="text"
                       placeholder="https://drive.google.com/..."
                       onChange={(val) => updateField('driveLink', val)}
                       className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-white truncate"
                    />
                 </div>
              </div>

              {visibleFields.size > 0 && (
                 <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Additional Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {customProperties.filter(p => visibleFields.has(p.id)).map(prop => (
                          <div key={prop.id}>
                             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{prop.name}</label>
                             <EditableCell 
                                value={project.customProperties?.[prop.id]}
                                type={prop.type}
                                options={prop.options}
                                onChange={(val) => updateCustomField(prop.id, val)}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-900 dark:text-white"
                             />
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
        </div>
        <TimelineForecast project={project} tasks={tasks} allTasks={allTasks} />
      </div>

      <div className="flex-1 space-y-6">
         {currentUser.permissionLevel === 'Admin' ? (
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg">
                        <PieChart size={20} className="text-google-green" />
                        Budget Breakdown
                    </div>
                    <div className="flex flex-col items-end group">
                        <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 cursor-help" title="Click amount to edit">Total Budget <Edit2 size={10} className="opacity-0 group-hover:opacity-100 text-gray-400"/></span>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400 font-light">$</span>
                            <EditableCell 
                            value={project.budget}
                            type="currency"
                            onChange={(val) => updateField('budget', val)}
                            className="font-bold text-xl text-gray-900 dark:text-white w-32 text-right p-0 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-300 font-semibold">Allocated</div>
                        <div className="text-lg font-bold text-blue-900 dark:text-white">${totalAllocated.toLocaleString()}</div>
                    </div>
                    <div className={`p-3 rounded-lg border ${unallocated < 0 ? 'bg-red-50 dark:bg-red-900/30 border-red-100' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100'}`}>
                        <div className={`text-[10px] uppercase tracking-wider font-semibold ${unallocated < 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>Remaining</div>
                        <div className={`text-lg font-bold ${unallocated < 0 ? 'text-red-900 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>${unallocated.toLocaleString()}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-100 dark:border-green-800">
                        <div className="text-[10px] uppercase tracking-wider text-green-600 dark:text-green-300 font-semibold">Spent (Actuals)</div>
                        <div className="text-lg font-bold text-green-900 dark:text-white">${totalSpent.toLocaleString()}</div>
                    </div>
                </div>
                
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-4">
                    <div 
                        className={`h-full transition-all duration-500 ${percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    ></div>
                </div>
                </div>

                <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-gray-900/30">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white dark:bg-gray-800 text-xs text-gray-500 uppercase border-b border-gray-100 dark:border-gray-700 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 font-semibold min-w-[200px]">Item Name</th>
                            <th className="px-4 py-3 font-semibold text-right">Allocated</th>
                            <th className="px-4 py-3 font-semibold text-right">Actuals</th>
                            <th className="px-4 py-3 font-semibold w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {projectLines.map(line => {
                            const isOver = (line.actualSpent || 0) > line.allocated;
                            return (
                            <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group transition-colors">
                                <td className="px-6 py-3">
                                    <EditableCell 
                                        value={line.name}
                                        type="text"
                                        onChange={(val) => onUpdateBudgetLine({...line, name: val})}
                                        className="font-medium text-gray-800 dark:text-white"
                                    />
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-300">
                                    <div className="flex justify-end">
                                        <EditableCell 
                                        value={line.allocated}
                                        type="currency"
                                        onChange={(val) => onUpdateBudgetLine({...line, allocated: parseFloat(val)})}
                                        className="text-right"
                                        />
                                    </div>
                                </td>
                                <td className={`px-4 py-3 text-right font-mono font-medium ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                                    <div className="flex justify-end">
                                        <EditableCell 
                                        value={line.actualSpent}
                                        type="currency"
                                        onChange={(val) => onUpdateBudgetLine({...line, actualSpent: parseFloat(val)})}
                                        className="text-right"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button 
                                        onClick={() => onDeleteBudgetLine(line.id)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                            );
                        })}
                        
                        {/* Add Row */}
                        <tr className="bg-gray-50 dark:bg-gray-700/30">
                            <td className="px-6 py-3">
                            <input 
                                type="text" 
                                placeholder="+ Add Budget Item" 
                                className="bg-transparent outline-none w-full text-sm placeholder-gray-400 dark:text-white"
                                value={newLineName}
                                onChange={e => setNewLineName(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                            />
                            </td>
                            <td className="px-4 py-3">
                            <input 
                                type="number" 
                                placeholder="0.00" 
                                className="bg-transparent outline-none w-full text-sm text-right placeholder-gray-300 dark:text-white"
                                value={newLineAmount}
                                onChange={e => setNewLineAmount(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                            />
                            </td>
                            <td className="px-4 py-3 text-right text-gray-400 text-xs italic">--</td>
                            <td className="px-4 py-3 text-right">
                            <button 
                                type="button"
                                onClick={handleAddLineItem}
                                disabled={!newLineName || !newLineAmount}
                                className="text-nexus-primary hover:bg-nexus-primary/10 p-1.5 rounded-md transition-colors disabled:opacity-30"
                            >
                                <Plus size={16} />
                            </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                </div>
             </div>
         ) : (
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center justify-center p-8 text-center">
                 <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                     <Lock size={32} className="text-gray-400 dark:text-gray-500" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Restricted Access</h3>
                 <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                     Budget details and financial breakdowns are only available to workspace administrators.
                 </p>
             </div>
         )}
      </div>
    </div>
  );
};
