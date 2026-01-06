import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Project, Task, TeamMember, COLUMNS } from '../types';
import { BarChart2, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { EditableCell } from './EditableCell';

// Date helpers
const getDaysDiff = (date1: Date, date2: Date): number => {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const DAY_WIDTH = 40;
const ROW_HEIGHT = 56;
const GROUP_HEADER_HEIGHT = 40;

interface ProjectPlannerViewProps {
  project: Project;
  tasks: Task[];
  team: TeamMember[];
  onUpdateMultipleTasks: (tasks: Task[]) => void;
  onTaskClick: (task: Task) => void;
}

export const ProjectPlannerView: React.FC<ProjectPlannerViewProps> = ({ project, tasks, team, onUpdateMultipleTasks, onTaskClick }) => {
  const [draftTasks, setDraftTasks] = useState<Task[]>([]);
  const [initialTasks, setInitialTasks] = useState<Task[]>([]);
  const [dragInfo, setDragInfo] = useState<{ task: Task; startX: number; } | null>(null);
  const [groupBy, setGroupBy] = useState<string>('none');

  const dependencyMap = useMemo(() => {
    const map = new Map<string, string[]>();
    tasks.forEach(task => {
        task.dependencies?.forEach(dep => {
            if (!map.has(dep.taskId)) {
                map.set(dep.taskId, []);
            }
            map.get(dep.taskId)!.push(task.id);
        });
    });
    return map;
  }, [tasks]);

  useEffect(() => {
    const tasksCopy = JSON.parse(JSON.stringify(tasks)).map((t: Task) => {
        if (t.startDate && t.dueDate) {
            t.duration = getDaysDiff(new Date(t.startDate), new Date(t.dueDate)) + 1;
        } else {
            t.duration = t.duration || 1;
        }
        return t;
    });
    setDraftTasks(tasksCopy);
    setInitialTasks(tasksCopy);
  }, [tasks]);

  const propagateChanges = useCallback((draggedTaskId: string, updatedTasks: Task[]) => {
    const taskMap = new Map(updatedTasks.map(t => [t.id, {...t}]));
    const queue = [draggedTaskId];
    const visited = new Set([draggedTaskId]);

    while (queue.length > 0) {
      const predecessorId = queue.shift()!;
      const predecessor = taskMap.get(predecessorId)!;
      if (!predecessor.dueDate) continue;

      const dependents = dependencyMap.get(predecessorId) || [];

      for (const dependentId of dependents) {
        if (visited.has(dependentId)) continue; 

        const dependent = taskMap.get(dependentId)!;
        if (!dependent.startDate || !dependent.dueDate) continue;
        
        const dependentDuration = dependent.duration || 1;
        const newStartDate = addDays(new Date(predecessor.dueDate), 1);
        const newDueDate = addDays(newStartDate, dependentDuration - 1);
        
        dependent.startDate = formatDate(newStartDate);
        dependent.dueDate = formatDate(newDueDate);

        visited.add(dependentId);
        queue.push(dependentId);
      }
    }
    return Array.from(taskMap.values());
  }, [dependencyMap]);
  
  const handleDurationChange = (taskId: string, newDuration: number) => {
    const task = draftTasks.find(t => t.id === taskId);
    if (!task || !task.startDate) return;

    const newDueDate = addDays(new Date(task.startDate), newDuration - 1);

    const updatedTask = {
        ...task,
        duration: newDuration,
        dueDate: formatDate(newDueDate),
    };

    let newDraftTasks = draftTasks.map(t => (t.id === taskId ? updatedTask : t));
    newDraftTasks = propagateChanges(taskId, newDraftTasks);
    
    setDraftTasks(newDraftTasks);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragInfo) return;

    const taskId = e.dataTransfer.getData('taskId');
    if (taskId !== dragInfo.task.id) { setDragInfo(null); return; }

    const deltaX = e.clientX - dragInfo.startX;
    const dayDelta = Math.round(deltaX / DAY_WIDTH);
    if (dayDelta === 0) { setDragInfo(null); return; }

    const task = draftTasks.find(t => t.id === taskId);
    if (!task || !task.startDate || !task.dueDate) { setDragInfo(null); return; }

    const newStartDate = addDays(new Date(task.startDate), dayDelta);
    const newDueDate = addDays(newStartDate, (task.duration || 1) - 1);

    const updatedTask = { ...task, startDate: formatDate(newStartDate), dueDate: formatDate(newDueDate) };
    
    let newDraftTasks = draftTasks.map(t => (t.id === taskId ? updatedTask : t));
    newDraftTasks = propagateChanges(taskId, newDraftTasks);
    
    setDraftTasks(newDraftTasks);
    setDragInfo(null);
  };
  
  const handleSaveChanges = () => {
      const changedTasks = draftTasks.filter((draftTask) => {
          const initialTask = initialTasks.find(it => it.id === draftTask.id);
          return initialTask && (draftTask.startDate !== initialTask.startDate || draftTask.dueDate !== initialTask.dueDate);
      });
      if(changedTasks.length > 0) {
          onUpdateMultipleTasks(changedTasks);
      }
  };
  
  const handleReset = () => {
      setDraftTasks(JSON.parse(JSON.stringify(initialTasks)));
  };

  const { groupedTasks, taskRowMap } = useMemo(() => {
    const taskMap = new Map<string, number>();
    const sortedTasks = draftTasks.filter(t => t.dueDate).sort((a,b) => new Date(a.startDate || a.dueDate!).getTime() - new Date(b.startDate || b.dueDate!).getTime());
    
    if (groupBy === 'none') {
        sortedTasks.forEach((task, index) => taskMap.set(task.id, index));
        return { groupedTasks: { 'All Tasks': sortedTasks }, taskRowMap: taskMap };
    }
    
    if (groupBy === 'section') {
        const sections = draftTasks.filter(t => t.isSection).sort((a,b) => a.title.localeCompare(b.title));
        const tasksBySection: {[key: string]: Task[]} = {};
        
        sections.forEach(s => tasksBySection[s.id] = []);
        tasksBySection['no-section'] = [];

        draftTasks.forEach(task => {
            if (task.isSection) return;
            if (task.parentId && tasksBySection[task.parentId]) {
                tasksBySection[task.parentId].push(task);
            } else {
                tasksBySection['no-section'].push(task);
            }
        });

        const groups: {[key: string]: Task[]} = {};
        sections.forEach(s => {
            groups[s.title] = tasksBySection[s.id];
        });
        if (tasksBySection['no-section'].length > 0) {
            groups['(No Section)'] = tasksBySection['no-section'];
        }
        
        let rowIndex = 0;
        Object.keys(groups).forEach(groupName => {
            rowIndex++; // for group header
            groups[groupName].forEach(task => taskMap.set(task.id, rowIndex++));
        });

        return { groupedTasks: groups, taskRowMap: taskMap };
    }
    
    const groups: {[key: string]: Task[]} = {};
    sortedTasks.forEach(task => {
        let groupKey = (task as any)[groupBy];
        if (groupBy === 'assignee') groupKey = team.find(t => t.id === groupKey)?.name || 'Unassigned';
        if (groupKey === undefined || groupKey === null) groupKey = 'Unassigned';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(task);
    });

    let rowIndex = 0;
    Object.keys(groups).sort().forEach(groupName => {
        rowIndex++; // for group header
        groups[groupName].forEach(task => taskMap.set(task.id, rowIndex++));
    });

    return { groupedTasks: groups, taskRowMap: taskMap };
  }, [draftTasks, groupBy, team]);
  
  const { initialEndDate, draftEndDate } = useMemo(() => {
    const getLatestDate = (taskArray: Task[]) => {
        const dates = taskArray.filter(t => t.dueDate).map(t => new Date(t.dueDate!).getTime());
        return dates.length > 0 ? new Date(Math.max(...dates)) : new Date(project.dueDate || '');
    };
    return {
        initialEndDate: getLatestDate(initialTasks),
        draftEndDate: getLatestDate(draftTasks),
    };
  }, [initialTasks, draftTasks, project.dueDate]);

  const dateShift = getDaysDiff(initialEndDate, draftEndDate);
  const hasChanges = JSON.stringify(initialTasks) !== JSON.stringify(draftTasks);

  const allTasksWithDates = Object.values(groupedTasks).flat();
  
  let timelineStart = new Date(); let timelineEnd = new Date();
  if (allTasksWithDates.length > 0) {
      const allStartDates = allTasksWithDates.map(t => new Date(t.startDate || t.dueDate!));
      const allEndDates = allTasksWithDates.map(t => new Date(t.dueDate!));
      timelineStart = new Date(Math.min(...allStartDates.map(d => d.getTime())));
      timelineEnd = new Date(Math.max(...allEndDates.map(d => d.getTime()), draftEndDate.getTime()));
  }
  timelineStart.setDate(timelineStart.getDate() - 3); timelineEnd.setDate(timelineEnd.getDate() + 14);
  const timelineDuration = getDaysDiff(timelineStart, timelineEnd);
  const dateArray: Date[] = Array.from({ length: timelineDuration + 1 }, (_, i) => addDays(timelineStart, i));
  const todayOffset = getDaysDiff(timelineStart, new Date());

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50/50 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart2 size={20} className="text-warning"/> Timeline Planner</h3>
            <div className="w-px h-8 bg-gray-200"></div>
            {hasChanges ? (
                <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} className={dateShift > 0 ? "text-red-500" : "text-yellow-500"} />
                    <span className="font-medium text-gray-700">Project end date will shift by</span>
                    <span className={`font-bold ${dateShift > 0 ? "text-red-600" : "text-yellow-600"}`}>{dateShift} days</span>
                </div>
            ) : (
                <p className="text-sm text-gray-500">Drag tasks on the timeline to visualize changes.</p>
            )}
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Group By:</label>
                <select onChange={e => setGroupBy(e.target.value)} value={groupBy} className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium shadow-sm transition-colors">
                    <option value="none">None</option>
                    <option value="section">Section</option>
                    <option value="status">Status</option>
                    <option value="assignee">Assignee</option>
                    <option value="priority">Priority</option>
                </select>
            </div>
          <button onClick={handleReset} disabled={!hasChanges} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50 transition-colors">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={handleSaveChanges} disabled={!hasChanges} className="flex items-center gap-2 px-5 py-2 bg-nexus-primary text-white rounded-lg shadow-sm font-medium text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors">
            <Save size={14} /> Save Timeline
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar border border-gray-200 rounded-xl bg-white shadow-sm relative">
        <div className="grid relative" style={{ gridTemplateColumns: `minmax(350px, 400px) ${dateArray.length * DAY_WIDTH}px` }}>
            <div className="sticky top-0 left-0 bg-white z-30 border-b border-r border-gray-200 h-10 grid grid-cols-2 items-center px-4 font-bold text-xs text-gray-500 uppercase tracking-wider"><span>Task Name</span><span className="text-center">Duration</span></div>
            <div className="sticky top-0 bg-white z-20 border-b border-gray-200 h-10 flex">
                {dateArray.map((date, i) => <div key={i} className={`flex-shrink-0 text-center text-[10px] font-medium text-gray-400 border-r border-gray-100 flex items-center justify-center ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50/50' : ''}`} style={{ width: DAY_WIDTH }}>{date.getDate()}</div>)}
            </div>
            
            <div className="bg-white border-r border-gray-200 relative z-20">
                {Object.entries(groupedTasks).map(([groupName, tasksInGroup]) => (
                    <React.Fragment key={groupName}>
                        {groupBy !== 'none' && <div className="h-10 flex items-center px-4 bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">{groupName}</div>}
                        {tasksInGroup.map(task => (
                            <div key={task.id} className="grid grid-cols-2 items-center px-4 h-14 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <p onClick={() => onTaskClick(task)} className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:text-nexus-primary">{task.title}</p>
                                <div className="text-center"><EditableCell type="number" value={task.duration} onChange={(val) => handleDurationChange(task.id, parseInt(val))} className="w-16 text-center" /></div>
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
            
            <div className="relative" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                <div className="absolute inset-0 flex pointer-events-none">
                    {dateArray.map((date, i) => <div key={i} className={`flex-shrink-0 border-r border-gray-100 h-full ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50/30' : ''}`} style={{ width: DAY_WIDTH }}></div>)}
                </div>
                <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-nexus-primary/50" style={{ left: todayOffset * DAY_WIDTH }}></div>
                
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                    <defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" /></marker></defs>
                    {allTasksWithDates.map((task) => {
                      if (!task.dependencies || task.dependencies.length === 0) return null;
                      return task.dependencies.map(dep => {
                        if (!taskRowMap.has(dep.taskId) || !taskRowMap.has(task.id)) return null;
                        const predecessor = draftTasks.find(t => t.id === dep.taskId);
                        if (!predecessor) return null;
                        const y1 = taskRowMap.get(dep.taskId)! * ROW_HEIGHT + (ROW_HEIGHT / 2) + (groupBy !== 'none' ? Object.keys(groupedTasks).findIndex(g => groupedTasks[g].some(t => t.id === dep.taskId)) * GROUP_HEADER_HEIGHT : 0);
                        const x1 = (getDaysDiff(timelineStart, new Date(predecessor.dueDate!)) + 1) * DAY_WIDTH;
                        const y2 = taskRowMap.get(task.id)! * ROW_HEIGHT + (ROW_HEIGHT / 2) + (groupBy !== 'none' ? Object.keys(groupedTasks).findIndex(g => groupedTasks[g].some(t => t.id === task.id)) * GROUP_HEADER_HEIGHT : 0);
                        {/* FIX: Define x2 which is the start coordinate of the dependent task. */}
                        const x2 = getDaysDiff(timelineStart, new Date(task.startDate || task.dueDate!)) * DAY_WIDTH;
                        const path = `M ${x1} ${y1} C ${x1 + 20} ${y1}, ${x2 - 20} ${y2}, ${x2} ${y2}`;
                        return <path key={`${dep.taskId}-${task.id}`} d={path} stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" className="opacity-60" />;
                      });
                    })}
                </svg>

                {Object.entries(groupedTasks).map(([groupName, tasksInGroup]) => (
                    <React.Fragment key={groupName}>
                        {groupBy !== 'none' && <div className="h-10 border-b border-gray-50"></div>}
                        {tasksInGroup.map(task => {
                            const initialVersion = initialTasks.find(t => t.id === task.id);
                            const hasChanged = task.startDate !== initialVersion?.startDate || task.dueDate !== initialVersion?.dueDate;
                            return (
                                <div key={task.id} className="relative h-14 border-b border-gray-50 pointer-events-none">
                                    {hasChanged && initialVersion?.startDate && (<div className="absolute top-1/2 -translate-y-1/2 h-7 opacity-30" style={{ left: getDaysDiff(timelineStart, new Date(initialVersion.startDate)) * DAY_WIDTH, width: (getDaysDiff(new Date(initialVersion.startDate), new Date(initialVersion.dueDate!)) + 1) * DAY_WIDTH }}><div className="h-full w-full bg-gray-300 rounded-md border border-dashed border-gray-400"></div></div>)}
                                    <div draggable={!!(task.startDate && task.dueDate)} onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.effectAllowed = 'move'; setDragInfo({ task, startX: e.clientX }); }} onDragEnd={() => setDragInfo(null)} onClick={() => onTaskClick(task)} className="absolute top-1/2 -translate-y-1/2 h-8 group pointer-events-auto cursor-move" style={{ left: getDaysDiff(timelineStart, new Date(task.startDate || task.dueDate!)) * DAY_WIDTH, width: (task.duration || 1) * DAY_WIDTH, }}><div className="h-full w-full bg-nexus-primary rounded-md shadow-sm hover:brightness-110 transition-all flex items-center px-2"><span className="text-white text-[10px] font-bold truncate">{task.title}</span></div></div>
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
