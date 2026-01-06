import React, { useState } from 'react';
import { Task, Priority, PropertyDefinition } from '../types';
import { Calendar, CheckSquare, Zap, Trash2, MessageSquare, Tag, AlignLeft, AlertCircle, PlayCircle, CheckCircle2, GitMerge } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  customProperties?: PropertyDefinition[];
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles = {
    Low: 'bg-gray-200 text-gray-700',
    Medium: 'bg-nexus-blue text-white',
    High: 'bg-orange-400 text-white',
    Critical: 'bg-nexus-red text-white shadow-sm',
  };
  return (
    <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${styles[priority]}`}>
      {priority}
    </span>
  );
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, allTasks, customProperties, onUpdate, onDelete, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  const toggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...task, completed: !task.completed });
  };

  // Status Logic
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  
  let statusBadge = null;
  if (task.completed) {
    statusBadge = <span className="text-[10px] font-bold text-nexus-teal flex items-center gap-1 uppercase tracking-wide"><CheckCircle2 size={10} /> Complete</span>;
  } else if (isOverdue) {
    statusBadge = <span className="text-[10px] font-bold text-nexus-red flex items-center gap-1 uppercase tracking-wide"><AlertCircle size={10} /> Overdue</span>;
  }

  const parentTask = task.parentId ? allTasks.find(t => t.id === task.parentId) : null;

  return (
    <div 
      onClick={() => onClick(task)}
      className={`bg-white p-3 rounded-lg shadow-sm border border-transparent hover:border-nexus-primary/30 hover:shadow-card transition-all duration-200 cursor-pointer group relative flex flex-col gap-2 ${task.completed ? 'opacity-60 bg-gray-50' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Row: Priority & Actions */}
      <div className="flex justify-between items-center mb-1 h-5">
        <div className="flex items-center gap-2">
           <PriorityBadge priority={task.priority} />
           {statusBadge}
        </div>
        
        <div className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
           <button 
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="p-1 rounded hover:bg-nexus-red/10 text-gray-400 hover:text-nexus-red transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-3 items-start group/check">
        <button 
            onClick={toggleComplete}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                task.completed 
                ? 'bg-nexus-teal border-nexus-teal text-white' 
                : 'border-gray-300 text-transparent hover:border-nexus-teal hover:text-nexus-teal/30'
            }`}
        >
            <CheckCircle2 size={14} className={task.completed ? 'opacity-100' : 'opacity-0 group-hover/check:opacity-100'} />
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm text-gray-800 leading-tight truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </h3>
          {parentTask && (
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium">
              <GitMerge size={12} className="text-gray-400" />
              <span className="truncate">{parentTask.title}</span>
            </div>
          )}
          {task.description && !task.completed && !parentTask && (
            <div className="text-xs text-gray-500 line-clamp-2 mt-1 font-normal">
               {task.description}
            </div>
          )}
        </div>
      </div>

      {/* Custom Properties (Compact) */}
      {customProperties && customProperties.length > 0 && !task.completed && (
        <div className="flex flex-wrap gap-1 mt-1">
          {customProperties.slice(0, 3).map(prop => {
            const val = task.customProperties?.[prop.id];
            if (!val) return null;
            return (
              <div key={prop.id} className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 max-w-[80px] truncate">
                {val}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer: Date, Subtasks, Comments */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div className={`flex items-center text-xs font-medium ${isOverdue ? 'text-nexus-red' : 'text-gray-500'}`}>
              <Calendar size={12} className="mr-1" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          )}
          {task.subtasks.length > 0 && (
            <div className="flex items-center text-xs text-gray-500" title="Subtasks">
              <CheckSquare size={12} className="mr-1" />
              {task.subtasks.filter(t => t.completed).length}/{task.subtasks.length}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
            {task.tags.map(tag => (
                <span key={tag} className="w-2 h-2 rounded-full bg-nexus-purple/50" title={tag}></span>
            ))}
            {task.comments && task.comments.length > 0 && (
            <div className="flex items-center text-xs text-gray-400">
                <MessageSquare size={12} className="mr-1" />
                {task.comments.length}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};