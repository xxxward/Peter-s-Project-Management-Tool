import React, { useState, useMemo } from 'react';
import { Project, Task, TeamMember, COLUMNS } from '../types';
import { BarChart2, Calendar, Plus, ChevronDown } from 'lucide-react';

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
const ROW_HEIGHT = 56; // h-14 in tailwind

interface ProjectGanttViewProps {
  project: Project;
  tasks: Task[];
  team: TeamMember[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task) => void; 
  onAddTaskClick: () => void;
}

interface HierarchicalTask extends Task {
  children: HierarchicalTask[];
}

export const ProjectGanttView: React.FC<ProjectGanttViewProps> = ({ project, tasks, team, onTaskClick, onUpdateTask, onAddTaskClick }) => {
  const [dragState, setDragState] = useState<{ task: Task; startX: number; } | null>(null);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());

  const columns = project.columns || COLUMNS;

  const hierarchicalTasks = useMemo(() => {
    const itemsById = new Map<string, HierarchicalTask>();
    tasks.forEach(t => itemsById.set(t.id, { ...t, children: [] }));
    const roots: HierarchicalTask[] = [];

    tasks.forEach(task => {
      const item = itemsById.get(task.id)!;
      if (task.parentId && itemsById.has(task.parentId)) {
        itemsById.get(task.parentId)!.children.push(item);
      } else {
        roots.push(item);
      }
    });

    // Sort sections to be first, then by date
    roots.sort((a, b) => {
        if (a.isSection && !b.isSection) return -1;
        if (!a.isSection && b.isSection) return 1;
        const dateA = new Date(a.startDate || a.dueDate || 0);
        const dateB = new Date(b.startDate || b.dueDate || 0);
        return dateA.getTime() - dateB.getTime();
    });

    return roots;
  }, [tasks]);

  const toggleCollapse = (itemId: string) => {
    setCollapsedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const flattenedTasks = useMemo(() => {
    const flatList: {task: HierarchicalTask, level: number}[] = [];
    const flatten = (items: HierarchicalTask[], level: number) => {
        items.forEach(item => {
            flatList.push({task: item, level});
            if (item.children && !collapsedItems.has(item.id)) {
                flatten(item.children, level + 1);
            }
        });
    };
    flatten(hierarchicalTasks, 0);
    return flatList;
  }, [hierarchicalTasks, collapsedItems]);

  const taskRowMap = useMemo(() => {
    const map = new Map<string, number>();
    flattenedTasks.forEach(({ task }, index) => {
        map.set(task.id, index);
    });
    return map;
  }, [flattenedTasks]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragState) return;

    const taskId = e.dataTransfer.getData('taskId');
    if (taskId !== dragState.task.id) {
        setDragState(null);
        return;
    }
    
    const deltaX = e.clientX - dragState.startX;
    const dayDelta = Math.round(deltaX / DAY_WIDTH);
    
    if (dayDelta === 0) {
        setDragState(null);
        return;
    }

    const { task } = dragState;
    if (!task.startDate || !task.dueDate) {
        setDragState(null);
        return;
    }

    const originalStartDate = new Date(task.startDate);
    const originalEndDate = new Date(task.dueDate);
    
    const durationDays = getDaysDiff(originalStartDate, originalEndDate);

    const newStartDate = addDays(originalStartDate, dayDelta);
    const newDueDate = addDays(newStartDate, durationDays);

    onUpdateTask({
        ...task,
        startDate: formatDate(newStartDate),
        dueDate: formatDate(newDueDate),
    });

    setDragState(null);
  };


  // Determine timeline range
  let timelineStart = new Date();
  let timelineEnd = new Date();
  
  const allTasksWithDates = tasks.filter(t => t.dueDate);
  if (allTasksWithDates.length > 0) {
      const allStartDates = allTasksWithDates.map(t => new Date(t.startDate || t.dueDate!));
      const allEndDates = allTasksWithDates.map(t => new Date(t.dueDate!));
      timelineStart = new Date(Math.min(...allStartDates.map(d => d.getTime())));
      timelineEnd = new Date(Math.max(...allEndDates.map(d => d.getTime())));
  }
  
  timelineStart.setDate(timelineStart.getDate() - 3); 
  timelineEnd.setDate(timelineEnd.getDate() + 14);

  const timelineDuration = getDaysDiff(timelineStart, timelineEnd);
  
  const dateArray: Date[] = [];
  for (let i = 0; i <= timelineDuration; i++) {
    dateArray.push(addDays(timelineStart, i));
  }
  
  const getMonthLabel = (date: Date) => date.toLocaleString('default', { month: 'long', year: 'numeric' });
  const months: { label: string; days: number; }[] = [];
  dateArray.forEach(date => {
    const monthLabel = getMonthLabel(date);
    const lastMonth = months[months.length - 1];
    if (!lastMonth || lastMonth.label !== monthLabel) {
      months.push({ label: monthLabel, days: 1 });
    } else {
      lastMonth.days++;
    }
  });

  const getAssignee = (id?: string) => team.find(m => m.id === id);
  const today = new Date();
  const todayOffset = getDaysDiff(timelineStart, today);
  const isTodayVisible = today >= timelineStart && today <= timelineEnd;

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50/50 dark:bg-gray-900 overflow-hidden">
      <div className="flex-1 overflow-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm relative">
        <div className="grid relative" style={{ gridTemplateColumns: `minmax(250px, 300px) ${dateArray.length * DAY_WIDTH}px` }}>
          
          {/* Header: Task Names */}
          <div className="sticky top-0 left-0 bg-white dark:bg-gray-800 z-30 border-b border-r border-gray-200 dark:border-gray-600 shadow-sm h-20 flex items-center justify-between px-4 font-bold text-sm text-gray-700 dark:text-gray-200 tracking-wider">
              <span className="uppercase">Project Tasks</span>
              <button 
                onClick={onAddTaskClick}
                className="p-1.5 bg-nexus-primary text-white rounded hover:bg-indigo-600 transition-colors shadow-sm"
                title="Add Task"
              >
                <Plus size={16} />
              </button>
          </div>

          {/* Header: Timeline */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-20 border-b border-gray-200 dark:border-gray-600 shadow-sm h-20">
            <div className="relative h-full">
              {/* Month Row */}
              <div className="flex absolute top-0 left-0 w-full h-10 border-b border-gray-100 dark:border-gray-700">
                {months.map((month, i) => (
                  <div key={i} className="flex-shrink-0 text-center font-bold text-xs text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700 flex items-center justify-center uppercase tracking-wide bg-gray-50/50" style={{ width: month.days * DAY_WIDTH }}>
                    {month.label}
                  </div>
                ))}
              </div>
              {/* Day Row */}
              <div className="flex absolute bottom-0 left-0 w-full h-10">
                {dateArray.map((date, i) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <div key={i} className={`flex-shrink-0 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 border-r border-gray-50 dark:border-gray-700 flex items-center justify-center relative ${isWeekend ? 'bg-gray-50/50 dark:bg-gray-700/30' : ''} ${isToday ? 'bg-blue-50/50' : ''}`} style={{ width: DAY_WIDTH }}>
                      {date.getDate()}
                      {isToday && <div className="absolute bottom-0 w-full h-1 bg-nexus-primary"></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Body: Task List Side */}
          <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 relative z-20">
             {flattenedTasks.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-400 italic">
                   No tasks with dates yet.<br/>
                   <button onClick={onAddTaskClick} className="text-nexus-primary hover:underline mt-2 font-medium">Add Task</button>
                </div>
             )}
             {flattenedTasks.map(({ task, level }) => {
                if (task.isSection) {
                    return (
                        <div key={task.id} className="flex items-center px-4 h-14 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 font-bold text-sm text-gray-600 dark:text-gray-300">
                            <button onClick={() => toggleCollapse(task.id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <ChevronDown size={16} className={`transition-transform ${collapsedItems.has(task.id) ? '-rotate-90' : ''}`} />
                            </button>
                            <span className="truncate">{task.title}</span>
                        </div>
                    );
                }
                return (
                    <div key={task.id} className="flex items-center px-6 h-14 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 transition-colors" style={{ paddingLeft: `${1.5 + level * 1.5}rem`}}>
                        <div className="truncate cursor-pointer w-full" onClick={() => onTaskClick(task)}>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate hover:text-nexus-primary transition-colors">
                            {task.title}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                            {new Date(task.startDate || task.dueDate!).toLocaleDateString()} - {new Date(task.dueDate!).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                );
             })}
          </div>

          {/* Body: Timeline Chart Side */}
          <div 
            className="relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
             {/* Grid Lines */}
             <div className="absolute inset-0 flex pointer-events-none">
                {dateArray.map((date, i) => (
                   <div key={i} className={`flex-shrink-0 border-r border-gray-50 dark:border-gray-700/50 h-full ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50/30' : ''}`} style={{ width: DAY_WIDTH }}></div>
                ))}
             </div>

             {/* Today Line */}
             {isTodayVisible && (
               <div 
                 className="absolute top-0 bottom-0 border-l-2 border-dashed border-nexus-primary/50 z-10 pointer-events-none"
                 style={{ left: (todayOffset * DAY_WIDTH) + (DAY_WIDTH / 2) }}
               >
                 <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-nexus-primary rounded-full"></div>
               </div>
             )}

             {/* Dependency Lines (SVG) */}
             <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
                  </marker>
                </defs>
                {flattenedTasks.map(({task}) => {
                  if (!task.dependencies || task.dependencies.length === 0) return null;
                  
                  return task.dependencies.map(dep => {
                    const predecessor = tasks.find(t => t.id === dep.taskId);
                    const predIndex = taskRowMap.get(dep.taskId);
                    const currIndex = taskRowMap.get(task.id);

                    if (!predecessor || predIndex === undefined || currIndex === undefined) return null;
                    
                    const y1 = predIndex * ROW_HEIGHT + (ROW_HEIGHT / 2);
                    const x1 = (getDaysDiff(timelineStart, new Date(predecessor.dueDate!)) + 1) * DAY_WIDTH;
                    
                    const y2 = currIndex * ROW_HEIGHT + (ROW_HEIGHT / 2);
                    const x2 = getDaysDiff(timelineStart, new Date(task.startDate || task.dueDate!)) * DAY_WIDTH;
                    
                    const cp1x = x1 + 20; 
                    const cp2x = x2 - 20;

                    const path = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;

                    return (
                      <path 
                        key={`${dep.taskId}-${task.id}`}
                        d={path}
                        stroke="#94a3b8" // Slate-400
                        strokeWidth="1.5"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                        className="opacity-60"
                      />
                    );
                  });
                })}
             </svg>

             {/* Task Bars & Section Summaries */}
             {flattenedTasks.map(({task, level}, index) => {
                if(task.isSection) {
                    const childTasks = task.children.filter(t => t.startDate && t.dueDate);
                    if (childTasks.length === 0) return <div key={task.id} className="relative h-14 border-b border-gray-50 dark:border-gray-700/0"></div>;
                    
                    const startDates = childTasks.map(t => new Date(t.startDate!).getTime());
                    const endDates = childTasks.map(t => new Date(t.dueDate!).getTime());
                    const sectionStart = new Date(Math.min(...startDates));
                    const sectionEnd = new Date(Math.max(...endDates));
                    
                    const offset = getDaysDiff(timelineStart, sectionStart);
                    const duration = getDaysDiff(sectionStart, sectionEnd) + 1;

                    return (
                        <div key={task.id} className="relative h-14 border-b border-gray-50 dark:border-gray-700/0 pointer-events-none">
                            <div className="absolute top-1/2 -translate-y-1/2 h-2" style={{ left: offset * DAY_WIDTH, width: duration * DAY_WIDTH }}>
                                <div className="h-full w-full bg-gray-400/50 rounded-full flex items-center justify-between">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    );
                }

                if (!task.dueDate) return <div key={task.id} className="relative h-14 border-b border-gray-50 dark:border-gray-700/0"></div>;

                const assignee = getAssignee(task.assignee);
                const taskEnd = new Date(task.dueDate!);
                const taskStart = task.startDate ? new Date(task.startDate) : taskEnd;

                const offset = getDaysDiff(timelineStart, taskStart);
                const duration = task.startDate ? getDaysDiff(taskStart, taskEnd) + 1 : 1;

                const statusInfo = columns.find(c => c.id === task.status);
                const statusColorName = statusInfo?.color || 'gray';
                const barColor = `bg-${statusColorName}-500`;
                
                const isDragging = dragState?.task.id === task.id;

                return (
                  <div key={task.id} className="relative h-14 border-b border-gray-50 dark:border-gray-700/0 hover:bg-gray-50/0 transition-colors pointer-events-none">
                    <div 
                         draggable={!!(task.startDate && task.dueDate)}
                         onDragStart={(e) => {
                             if (!task.startDate || !task.dueDate) return;
                             e.dataTransfer.setData('taskId', task.id);
                             e.dataTransfer.effectAllowed = 'move';
                             const img = new Image(); img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
                             e.dataTransfer.setDragImage(img, 0, 0);
                             setDragState({ task, startX: e.clientX });
                         }}
                         onDragEnd={() => setDragState(null)}
                         onClick={() => onTaskClick(task)}
                         className={`absolute top-1/2 -translate-y-1/2 h-7 group pointer-events-auto ${isDragging ? 'opacity-50' : ''} ${task.startDate && task.dueDate ? 'cursor-move' : 'cursor-pointer'}`}
                         style={{ left: offset * DAY_WIDTH, width: Math.max(duration * DAY_WIDTH, 10) }}
                    >
                      <div className={`h-full w-full ${barColor} rounded-md shadow-sm hover:shadow-md hover:brightness-110 transition-all flex items-center justify-between px-2 overflow-hidden`}>
                        <span className="text-white text-[10px] font-bold truncate opacity-90">{task.title}</span>
                        {assignee && (
                          <div title={assignee.name} className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-inner ${assignee.color} border border-white/20 ml-2 flex-shrink-0`}>
                            {assignee.initials}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};
