import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, Task, PropertyDefinition, TeamMember, PropertyType, COLUMNS, SmartKeyRule, Dependency } from '../types';
import { Plus, SlidersHorizontal, ChevronDown, CheckSquare, Calendar, User, AlignLeft, Download, X, Filter, Layers, LayoutGrid, Rows, ChevronRight, MoreVertical, Trash2, ArrowUp, ArrowDown, Link as LinkIcon } from 'lucide-react';
import { EditableCell } from './EditableCell';

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const formatDate = (date: Date) => date.toISOString().split('T')[0];

interface ProjectListViewProps {
  project: Project;
  tasks: Task[];
  team: TeamMember[];
  customProperties: PropertyDefinition[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onAddTaskClick: (parentId?: string) => void;
  onOpenBulkAddModal: () => void;
  onAddSectionClick: () => void;
  activeFilter?: { field: string; value: string } | null;
  onClearFilter?: () => void;
  onGenerateSubtasks: (task: Task) => void;
  onInlineCreateTask: (title: string, parentId?: string, isSection?: boolean, dueDate?: string) => void;
  onSetView: (view: 'board' | 'list') => void;
  currentView: 'board' | 'list';
  smartKeys?: { enabled: boolean; rules: SmartKeyRule[] };
}

interface ColumnDef {
  id: string;
  label: string;
  isCustom?: boolean;
  propId?: string;
  type?: PropertyType;
  options?: string[];
}

interface HierarchicalTask extends Task {
  children: HierarchicalTask[];
}

const AddTaskInline: React.FC<{ 
    parentId: string; 
    onInlineCreateTask: (title: string, parentId?: string, isSection?: boolean, dueDate?: string) => void;
    smartKeys?: { enabled: boolean; rules: SmartKeyRule[] };
}> = ({ parentId, onInlineCreateTask, smartKeys }) => {
  const [title, setTitle] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Standard Enter submission
    if (e.key === 'Enter' && !(e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (title.trim()) {
        onInlineCreateTask(title.trim(), parentId, false);
        setTitle('');
      }
      return;
    }

    // Smart Key shortcut for Due Date only in inline mode
    if (smartKeys?.enabled && (e.metaKey || e.ctrlKey)) {
      const rule = smartKeys.rules.find(r => r.key.toLowerCase() === e.key.toLowerCase());
      if (rule && rule.actionField === 'dueDate') {
        e.preventDefault();
        if (title.trim()) {
          const days = typeof rule.actionValue === 'number' ? rule.actionValue : parseInt(rule.actionValue);
          if (!isNaN(days)) {
            const newDueDate = formatDate(addDays(new Date(), days));
            onInlineCreateTask(title.trim(), parentId, false, newDueDate);
            setTitle('');
          }
        }
      }
    }
  };

  return (
    <input
      type="text"
      placeholder="+ Add task to this section..."
      value={title}
      onChange={e => setTitle(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full bg-transparent outline-none text-sm placeholder-gray-400 py-1"
    />
  );
};


export const ProjectListView: React.FC<ProjectListViewProps> = ({
  project,
  tasks,
  team,
  customProperties,
  onUpdateTask,
  onDeleteTask,
  onTaskClick,
  onAddTaskClick,
  onOpenBulkAddModal,
  onAddSectionClick,
  activeFilter,
  onClearFilter,
  onInlineCreateTask,
  onSetView,
  currentView,
  smartKeys
}) => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['status', 'priority', 'assignee', 'dueDate']);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [dependencyMenuTaskId, setDependencyMenuTaskId] = useState<string | null>(null);
  const dependencyMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dependencyMenuRef.current && !dependencyMenuRef.current.contains(event.target as Node)) {
            setDependencyMenuTaskId(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dependencyMenuRef]);

  const addDependency = (task: Task, dependencyId: string) => {
    if (!dependencyId) return;
    const newDependencies = [...(task.dependencies || []), { taskId: dependencyId, type: 'FS' as 'FS' }];
    onUpdateTask({ ...task, dependencies: newDependencies });
  };

  const removeDependency = (task: Task, dependencyId: string) => {
    const newDependencies = task.dependencies?.filter(d => d.taskId !== dependencyId);
    onUpdateTask({ ...task, dependencies: newDependencies });
  };

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const allColumns: ColumnDef[] = [
    { id: 'status', label: 'Status', type: 'dropdown' }, { id: 'priority', label: 'Priority', type: 'dropdown' }, { id: 'assignee', label: 'Assignee', type: 'user' }, { id: 'startDate', label: 'Start Date', type: 'date' }, { id: 'dueDate', label: 'Due Date', type: 'date' },
    ...customProperties.map(p => ({ id: `custom_${p.id}`, label: p.name, isCustom: true, propId: p.id, type: p.type, options: p.options }))
  ];

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return null; // Unset sort
      }
      return { key, direction: 'asc' }; // New sort
    });
  };

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

    const sortNodes = (nodes: HierarchicalTask[]): HierarchicalTask[] => {
      let sortedNodes = [...nodes];
      
      if (sortConfig) {
        const { key, direction } = sortConfig;
        
        const getSortableValue = (task: Task) => {
          if (key.startsWith('custom_')) {
            const propId = key.substring(7);
            return task.customProperties?.[propId];
          }
          if (key === 'assignee') {
            return team.find(m => m.id === task.assignee)?.name;
          }
          if (key === 'title') return task.title;
          return (task as any)[key];
        };

        sortedNodes.sort((a, b) => {
          // Keep sections pinned to the top regardless of sort
          if (a.isSection && !b.isSection) return -1;
          if (!a.isSection && b.isSection) return 1;

          const valA = getSortableValue(a);
          const valB = getSortableValue(b);

          if (valA == null && valB != null) return 1;
          if (valA != null && valB == null) return -1;
          if (valA == null && valB == null) return 0;
          
          const propDef = allColumns.find(c => c.id === key);
          const propType = key === 'title' ? 'text' : propDef?.type;
          
          if (propType === 'date') {
            return new Date(valA).getTime() - new Date(valB).getTime();
          }
          if (propType === 'number' || propType === 'currency' || propType === 'rating') {
            return Number(valA) - Number(valB);
          }

          return String(valA).localeCompare(String(valB));
        });

        if (direction === 'desc') {
            sortedNodes.reverse();
        }
      } else {
        // Default sort: sections first
        const sections = nodes.filter(n => n.isSection);
        const items = nodes.filter(n => !n.isSection);
        sortedNodes = [...sections, ...items];
      }

      // Recursively sort children
      sortedNodes.forEach(node => {
          if (node.children.length > 0) {
              node.children = sortNodes(node.children);
          }
      });
      
      return sortedNodes;
    };
    
    return sortNodes(roots);
  }, [tasks, sortConfig, team, allColumns]);

  const toggleCollapse = (itemId: string) => {
    setCollapsedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const getAssigneeName = (id?: string) => team.find(m => m.id === id)?.name || 'Unassigned';
  const updateField = (task: Task, field: keyof Task, value: any) => onUpdateTask({ ...task, [field]: value });
  const updateCustomField = (task: Task, propId: string, value: string) => onUpdateTask({ ...task, customProperties: { ...task.customProperties, [propId]: value } });
  
  const handleDropOnItem = (e: React.DragEvent, targetTask: HierarchicalTask) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.remove('bg-blue-100');
    const draggedTaskId = e.dataTransfer.getData('taskId');
    const draggedTask = tasks.find(t => t.id === draggedTaskId);

    if (draggedTask && draggedTaskId !== targetTask.id) {
        // Prevent dropping a parent onto one of its children
        let current = targetTask;
        while (current.parentId) {
            if (current.parentId === draggedTaskId) return;
            const parent = tasks.find(t => t.id === current.parentId!);
            if (!parent) break;
            current = parent as HierarchicalTask;
        }

        const newParentId = targetTask.id;
        if (draggedTask.parentId !== newParentId) {
            onUpdateTask({ ...draggedTask, parentId: newParentId });
        }
    }
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedTaskId = e.dataTransfer.getData('taskId');
    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    if (draggedTask && draggedTask.parentId) {
        onUpdateTask({ ...draggedTask, parentId: undefined });
    }
  };

  const RenderRow = ({ task, level }: { task: HierarchicalTask, level: number }) => {
    const isCollapsed = collapsedItems.has(task.id);
    
    const dragProps = {
        onDragOver: (e: React.DragEvent) => e.preventDefault(),
        onDragEnter: (e: React.DragEvent) => (e.currentTarget as HTMLElement).classList.add('bg-blue-100'),
        onDragLeave: (e: React.DragEvent) => (e.currentTarget as HTMLElement).classList.remove('bg-blue-100'),
    };

    if (task.isSection) {
      return (
        <React.Fragment>
          <tr 
            className="bg-gray-100/80 hover:bg-gray-200/50 transition-colors group sticky top-[41px] z-[5] border-b-2 border-gray-200"
            {...dragProps}
            onDrop={(e) => handleDropOnItem(e, task)}
          >
            <td colSpan={visibleColumns.length + 2} className="px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleCollapse(task.id)} className="p-1 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronDown size={16} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                  <EditableCell 
                    value={task.title}
                    type="text"
                    onChange={(val) => onUpdateTask({ ...task, title: val })}
                    className="font-bold text-gray-800 text-sm"
                  />
                  <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full font-mono">{task.children.length}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => onAddTaskClick(task.id)} className="p-1.5 text-gray-500 hover:text-nexus-primary hover:bg-white rounded-md" title="Add task to section"><Plus size={14} /></button>
                   <button onClick={() => onDeleteTask(task.id)} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-white rounded-md" title="Delete section"><Trash2 size={14} /></button>
                </div>
              </div>
            </td>
          </tr>
          {!isCollapsed && task.children.map(child => <RenderRow key={child.id} task={child} level={level + 1} />)}
          {!isCollapsed && (
            <tr className="bg-gray-50/20">
              <td className="text-center" style={{ paddingLeft: `${(level + 1) * 1.5 + 0.5}rem` }}>
                <Plus size={14} className="text-gray-400" />
              </td>
              <td className="px-6 py-1" colSpan={visibleColumns.length + 1}>
                <AddTaskInline parentId={task.id} onInlineCreateTask={onInlineCreateTask} smartKeys={smartKeys} />
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <tr 
          className="hover:bg-blue-50/30 transition-colors group"
          draggable={!task.isSection}
          onDragStart={(e) => {
              e.dataTransfer.setData('taskId', task.id);
              e.dataTransfer.effectAllowed = 'move';
          }}
          {...dragProps}
          onDrop={(e) => handleDropOnItem(e, task)}
        >
          <td className="px-4 py-3 border-r border-gray-100 text-center" style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}>
            <div className="flex items-center gap-1">
                {task.children.length > 0 && <button onClick={() => toggleCollapse(task.id)} className="text-gray-400 hover:text-gray-800"><ChevronDown size={14} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} /></button>}
                {task.children.length === 0 && <div className="w-4"></div>}
                <button onClick={() => onTaskClick(task)} className="text-gray-400 hover:text-nexus-primary"><AlignLeft size={16} /></button>
            </div>
          </td>
          <td className="px-6 py-3 border-r border-gray-100 font-medium text-gray-800 relative">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <input type="checkbox" checked={task.completed} onChange={() => onUpdateTask({...task, completed: !task.completed})} className="w-4 h-4 rounded text-nexus-teal focus:ring-nexus-teal cursor-pointer"/>
                  <EditableCell value={task.title} type="text" onChange={(val) => updateField(task, 'title', val)} className={task.completed ? 'line-through text-gray-400' : ''}/>
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div 
                        className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-nexus-primary p-1 rounded-full hover:bg-gray-100"
                        title="Manage dependencies"
                        onClick={(e) => { e.stopPropagation(); setDependencyMenuTaskId(task.id); }}
                    >
                        <LinkIcon size={12} />
                        <span>{task.dependencies.length}</span>
                    </div>
                  )}
               </div>
               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); setDependencyMenuTaskId(task.id); }} className="p-1 text-gray-400 hover:text-nexus-primary hover:bg-gray-100 rounded-md" title="Manage dependencies"><LinkIcon size={14}/></button>
                   <button onClick={() => onAddTaskClick(task.id)} className="p-1 text-gray-400 hover:text-nexus-primary hover:bg-gray-100 rounded-md" title="Add sub-item"><Plus size={14}/></button>
                   <button onClick={() => onDeleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-md" title="Delete task"><Trash2 size={14}/></button>
               </div>
            </div>
            {dependencyMenuTaskId === task.id && (
                <div 
                    ref={dependencyMenuRef} 
                    className="absolute z-20 top-full left-10 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-3 animate-in fade-in zoom-in-95 duration-150"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Blocked By</h4>
                        <button onClick={() => setDependencyMenuTaskId(null)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                    </div>
                    
                    <div className="space-y-1 mb-3 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                        {(!task.dependencies || task.dependencies.length === 0) && (
                            <div className="text-xs text-gray-400 italic text-center py-2">No dependencies.</div>
                        )}
                        {task.dependencies?.map(dep => {
                            const depTask = tasks.find(t => t.id === dep.taskId);
                            return (
                                <div key={dep.taskId} className="flex items-center justify-between text-xs bg-gray-100 p-1.5 rounded">
                                    <span className="truncate font-normal">{depTask?.title || 'Unknown Task'}</span>
                                    <button onClick={() => removeDependency(task, dep.taskId)} className="text-gray-400 hover:text-red-500">
                                        <X size={12}/>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    
                    <select 
                        className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded outline-none"
                        onChange={(e) => addDependency(task, e.target.value)}
                        value=""
                    >
                        <option value="">+ Add blocker task...</option>
                        {tasks.filter(t => !t.isSection && t.id !== task.id && !task.dependencies?.some(d => d.taskId === t.id)).map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                    </select>
                </div>
            )}
          </td>
          {allColumns.filter(c => visibleColumns.includes(c.id)).map(col => {
            if (col.isCustom && col.propId) return <td key={col.id} className="px-6 py-3 border-r border-gray-100"><EditableCell value={task.customProperties?.[col.propId]} type={col.type || 'text'} options={col.options} onChange={(val) => updateCustomField(task, col.propId!, val)} /></td>;
            if (col.id === 'status') {
              const columns = project.columns || COLUMNS;
              const statusValue = task.status; const columnDef = columns.find(c => c.id === statusValue);
              const statusLabel = columnDef?.title || statusValue;
              const color = columnDef?.color || 'gray';
              const colorClasses = `bg-${color}-100 text-${color}-800 border border-${color}-200`;
              return <td key={col.id} className="px-6 py-3 border-r border-gray-100"><EditableCell value={statusLabel} type="dropdown" options={columns.map(c => c.title)} onChange={(val) => { const selectedColumn = columns.find(c => c.title === val); if (selectedColumn) updateField(task, 'status', selectedColumn.id); }} className={`font-medium text-xs px-2 py-1 rounded-full w-auto inline-block text-center ${colorClasses}`} /></td>;
            }
            if (col.id === 'priority') return <td key={col.id} className="px-6 py-3 border-r border-gray-100"><EditableCell value={task.priority} type="dropdown" options={['Low', 'Medium', 'High', 'Critical']} onChange={(val) => updateField(task, 'priority', val)} className={task.priority === 'Critical' ? 'text-red-600 font-bold' : ''} /></td>;
            if (col.id === 'assignee') return <td key={col.id} className="px-6 py-3 border-r border-gray-100"><EditableCell value={getAssigneeName(task.assignee)} type="user" options={team.map(t => t.name)} onChange={(val) => { const member = team.find(t => t.name === val); updateField(task, 'assignee', member ? member.id : ''); }} /></td>;
            if (col.id === 'dueDate' || col.id === 'startDate') return <td key={col.id} className="px-6 py-3 border-r border-gray-100 text-gray-500 text-xs"><EditableCell value={(task as any)[col.id as keyof Task] as string} type="date" onChange={(val) => updateField(task, col.id as keyof Task, val)} /></td>;
            return <td key={col.id} className="px-6 py-3 border-r border-gray-100"></td>;
          })}
        </tr>
        {!isCollapsed && task.children.map(child => <RenderRow key={child.id} task={child} level={level + 1} />)}
      </React.Fragment>
    );
  };
  
  const SortableHeader: React.FC<{ sortKey: string; label: string }> = ({ sortKey, label }) => (
    <button onClick={() => handleSort(sortKey)} className="flex items-center gap-1.5 group text-gray-500 hover:text-gray-800 transition-colors">
      <span>{label}</span>
      <div className="flex flex-col">
        {sortConfig?.key === sortKey ? (
            sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-nexus-primary"/> : <ArrowDown size={12} className="text-nexus-primary"/>
        ) : (
            <ArrowUp size={12} className="text-gray-300 group-hover:text-gray-500"/>
        )}
      </div>
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
            <button 
              onClick={() => onSetView('board')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${currentView === 'board' ? 'bg-white text-nexus-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <LayoutGrid size={16}/> Board
            </button>
            <button 
              onClick={() => onSetView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${currentView === 'list' ? 'bg-white text-nexus-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Rows size={16}/> List
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsColumnPickerOpen(p => !p)}
              className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal size={14} /> Properties <ChevronDown size={14} />
            </button>
            {isColumnPickerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsColumnPickerOpen(false)}></div>
                <div className="absolute top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-2">
                  <div className="text-xs font-bold text-gray-500 px-2 py-1 mb-1">Visible Columns</div>
                  {allColumns.map(col => (
                    <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm">
                      <input type="checkbox" checked={visibleColumns.includes(col.id)} onChange={() => toggleColumn(col.id)} className="rounded text-nexus-primary focus:ring-nexus-primary" />
                      {col.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onAddSectionClick}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors"
            >
              <Plus size={16} /> Add Section
            </button>
            <button 
                type="button"
                onClick={onOpenBulkAddModal}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors"
            >
                <Layers size={16} /> Bulk Add
            </button>
            <button 
            type="button"
            onClick={() => onAddTaskClick()}
            className="flex items-center gap-2 bg-nexus-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm font-medium text-sm transition-colors"
            >
            <Plus size={18} /> Add Task
            </button>
        </div>
      </div>

      {activeFilter && onClearFilter && (
        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 mb-2 self-start">
          <Filter size={12} />
          <span>Filtered by: <strong>{activeFilter.field} = {activeFilter.value}</strong></span>
          <button onClick={onClearFilter} className="p-0.5 rounded-full hover:bg-blue-100"><X size={12} /></button>
        </div>
      )}

      {/* Main Content */}
      <div 
        className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white shadow-sm"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnRoot}
      >
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50/70 backdrop-blur-sm sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-500 border-r border-gray-100 w-16"></th>
              <th className="px-6 py-3 font-semibold text-gray-500 border-r border-gray-100 min-w-[300px]">
                <SortableHeader sortKey="title" label="Task Name" />
              </th>
              {allColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
                <th key={col.id} className="px-6 py-3 font-semibold text-gray-500 border-r border-gray-100 min-w-[150px] whitespace-nowrap">
                   <SortableHeader sortKey={col.propId || col.id} label={col.label} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hierarchicalTasks.map(task => <RenderRow key={task.id} task={task} level={0} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
};
