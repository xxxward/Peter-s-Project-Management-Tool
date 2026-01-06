import React, { useState } from 'react';
import { Project, Task, TaskStatus, COLUMNS, TeamMember, PropertyDefinition, Column } from '../types';
import { TaskCard } from './TaskCard';
import { Plus, Trash2, LayoutGrid, Rows, MoreVertical, Layers } from 'lucide-react';
import { EditableCell } from './EditableCell';

interface ProjectBoardProps {
  currentUser: TeamMember;
  project: Project;
  tasks: Task[];
  team: TeamMember[];
  allTasks: Task[]; // All tasks to find parent info
  customProperties: PropertyDefinition[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onAddTaskClick: () => void;
  onOpenBulkAddModal: () => void;
  onAddColumn: () => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => void;
  onUpdateColumnColor: (columnId: string, newColor: string) => void;
  processingTaskId: string | null;
  onSetView: (view: 'board' | 'list') => void;
  currentView: 'board' | 'list';
}

export const ProjectBoard: React.FC<ProjectBoardProps> = ({
  project,
  tasks,
  team,
  allTasks,
  customProperties,
  onUpdateTask,
  onDeleteTask,
  onTaskClick,
  onAddTaskClick,
  onOpenBulkAddModal,
  onAddColumn,
  onDeleteColumn,
  onUpdateColumnTitle,
  onUpdateColumnColor,
  onSetView,
  currentView
}) => {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const availableColors = ['gray', 'red', 'blue', 'yellow', 'green', 'purple', 'pink', 'indigo'];
  const columns = project.columns !== undefined ? project.columns : COLUMNS;

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => { 
      e.preventDefault(); 
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== status) {
      onUpdateTask({ ...task, status });
    }
  };

  const handleDelete = (columnId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const tasksInColumn = tasks.filter(t => t.status === columnId);
    let confirmMessage = 'Are you sure you want to delete this status column?';
    
    if (tasksInColumn.length > 0) {
      confirmMessage = `This column contains ${tasksInColumn.length} task(s). Deleting it will move them to the first available column. Continue?`;
    }

    if (window.confirm(confirmMessage)) {
      onDeleteColumn(columnId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
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
        <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onOpenBulkAddModal}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors"
            >
              <Layers size={16} /> Bulk Add
            </button>
            <button 
              type="button"
              onClick={onAddTaskClick}
              className="flex items-center gap-2 bg-nexus-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm font-medium text-sm transition-colors"
            >
              <Plus size={18} /> Add Task
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 relative">
          <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start">
            {columns.map(column => {
              const columnColor = column.color || 'gray';
              return (
              <div 
                key={column.id} 
                className="flex flex-col min-w-[320px] w-[320px] h-full bg-gray-100/50 rounded-xl border border-transparent hover:border-gray-200 transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Section Header */}
                <div className={`flex items-center justify-between px-4 py-3 bg-white rounded-t-xl border-b border-gray-200 border-t-4 border-${columnColor}-400 shadow-sm z-10 flex-shrink-0`}>
                  <div className="flex-1 font-bold text-gray-700 text-sm">
                     <EditableCell 
                        value={column.title}
                        type="text"
                        onChange={(val) => onUpdateColumnTitle(column.id, val)}
                        className="font-bold text-gray-700 bg-transparent hover:bg-gray-50"
                     />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {tasks.filter(t => t.status === column.id).length}
                    </span>
                    <div className="relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === column.id ? null : column.id); }} 
                            className="text-gray-400 hover:text-gray-800 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>
                        {menuOpen === column.id && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(null)}></div> 
                                <div 
                                    onClick={e => e.stopPropagation()}
                                    className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 p-2 z-30"
                                >
                                    <div className="text-xs font-bold text-gray-500 mb-2 px-2">Set color</div>
                                    <div className="grid grid-cols-4 gap-2 px-2 mb-2">
                                        {availableColors.map(color => (
                                            <button key={color} onClick={() => { onUpdateColumnColor(column.id, color); setMenuOpen(null); }} className={`w-6 h-6 rounded-full bg-${color}-400 hover:ring-2 ring-offset-2 ring-${color}-400 transition-all`}></button>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-100 my-2"></div>
                                    <button onClick={(e) => handleDelete(column.id, e)} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
                                        <Trash2 size={14}/> Delete Status
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                  </div>
                </div>

                {/* Cards Container (Scrollable) */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                   {tasks
                    .filter(task => task.status === column.id)
                    .map(task => (
                      <div 
                        key={task.id} 
                        className="relative"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      >
                        <TaskCard 
                           task={task} 
                           allTasks={allTasks}
                           customProperties={customProperties}
                           onUpdate={onUpdateTask} 
                           onDelete={onDeleteTask}
                           onClick={onTaskClick}
                         />
                      </div>
                   ))}
                </div>
              </div>
            )})}
            
            {/* Add Column Button */}
            <button
                type="button"
                onClick={onAddColumn}
                className="min-w-[320px] h-full rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-nexus-primary hover:text-nexus-primary hover:bg-nexus-primary/5 transition-all cursor-pointer group"
            >
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-nexus-primary/10 flex items-center justify-center transition-colors">
                    <Plus size={24} />
                </div>
                <span className="font-medium mt-3">Add Status</span>
            </button>
          </div>
      </div>
    </div>
  );
};
