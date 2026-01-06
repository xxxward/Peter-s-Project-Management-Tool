import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, AlignLeft, CheckSquare, Send, Link as LinkIcon, Trash2, Clock, Info, Paperclip, FileText, PlayCircle, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import { Task, TeamMember, Priority, TaskStatus, Comment, Subtask, Project, BudgetLineItem, Attachment, TimeLog, COLUMNS, Dependency } from '../types';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  team: TeamMember[];
  allTasks: Task[];
  projects?: Project[];
  budgetLines?: BudgetLineItem[];
  onUpdate: (task: Task) => void;
  currentUser: TeamMember;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  isOpen, onClose, task, team, allTasks, projects, budgetLines = [], onUpdate, currentUser 
}) => {
  const [commentText, setCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'time'>('details');
  const [newTimeLog, setNewTimeLog] = useState<{ hours: string, date: string, desc: string }>({ hours: '', date: new Date().toISOString().split('T')[0], desc: '' });
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(true);
  const [isActivityExpanded, setIsActivityExpanded] = useState(true);
  
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const taskAttachmentRef = useRef<HTMLInputElement>(null);
  const subtaskAttachmentRefs = useRef<{[key: string]: HTMLInputElement | null}>({});


  useEffect(() => {
    if (isOpen) {
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isOpen, task?.comments, isActivityExpanded]);

  if (!isOpen || !task) return null;
  
  const currentProject = projects?.find(p => p.id === task.projectId);
  const projectColumns = currentProject?.columns || COLUMNS;

  const currentProjectBudgetLines = budgetLines.filter(b => b.projectId === task.projectId);
  const blockingTasks = allTasks.filter(t => t.dependencies?.some(d => d.taskId === task.id));
  const predecessorTasks = task.dependencies?.map(dep => allTasks.find(t => t.id === dep.taskId)).filter(Boolean) as Task[] || [];

  const handleFieldUpdate = (field: keyof Task, value: any) => {
    onUpdate({ ...task, [field]: value });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: `st-${Date.now()}`,
      title: newSubtaskTitle,
      completed: false,
    };
    onUpdate({ ...task, subtasks: [...task.subtasks, newSubtask] });
    setNewSubtaskTitle('');
  };

  const updateSubtask = (id: string, updates: Partial<Subtask>) => {
    const updated = task.subtasks.map(s => s.id === id ? { ...s, ...updates } : s);
    onUpdate({ ...task, subtasks: updated });
  };

  const deleteSubtask = (id: string) => {
    onUpdate({ ...task, subtasks: task.subtasks.filter(s => s.id !== id) });
  };
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: currentUser.id,
      text: commentText,
      createdAt: new Date().toISOString()
    };
    onUpdate({ ...task, comments: [...(task.comments || []), newComment] });
    setCommentText('');
  };

  const handleAddDependency = (depId: string) => {
      if (!task.dependencies?.some(d => d.taskId === depId)) {
          const newDependency: Dependency = { taskId: depId, type: 'FS' };
          onUpdate({ ...task, dependencies: [...(task.dependencies || []), newDependency] });
      }
  };

  const removeDependency = (depId: string) => {
      onUpdate({ ...task, dependencies: task.dependencies?.filter(d => d.taskId !== depId) });
  };

  const handleAddBlocking = (successorId: string) => {
    if (!task) return;
    const successorTask = allTasks.find(t => t.id === successorId);
    if (successorTask && !successorTask.dependencies?.some(d => d.taskId === task.id)) {
        const newDependency: Dependency = { taskId: task.id, type: 'FS' };
        onUpdate({ ...successorTask, dependencies: [...(successorTask.dependencies || []), newDependency] });
    }
  };

  const handleRemoveBlocking = (successorId: string) => {
    if (!task) return;
    const successorTask = allTasks.find(t => t.id === successorId);
    if (successorTask) {
        const newDependencies = successorTask.dependencies?.filter(d => d.taskId !== task.id);
        onUpdate({ ...successorTask, dependencies: newDependencies });
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, subtaskId?: string) => {
    if (!e.target.files || e.target.files.length === 0 || !task) return;
    const file = e.target.files[0];
    const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        url: '#', // In a real app, this would be a URL from a storage service
        type: 'other', // Could inspect file.type
        uploadedAt: new Date().toISOString(),
    };
    
    let updatedTask = { ...task };

    if (subtaskId) {
        updatedTask.subtasks = task.subtasks.map(sub => {
            if (sub.id === subtaskId) {
                return { ...sub, attachments: [...(sub.attachments || []), newAttachment] };
            }
            return sub;
        });
    } else {
        updatedTask.attachments = [...(task.attachments || []), newAttachment];
    }
    onUpdate(updatedTask);
    e.target.value = ''; // Reset file input
  };
  
  const handleRemoveAttachment = (attachmentId: string, subtaskId?: string) => {
    if (!task) return;
    let updatedTask = { ...task };
    if (subtaskId) {
        updatedTask.subtasks = task.subtasks.map(sub => {
            if (sub.id === subtaskId) {
                return { ...sub, attachments: sub.attachments?.filter(att => att.id !== attachmentId) };
            }
            return sub;
        });
    } else {
        updatedTask.attachments = task.attachments?.filter(att => att.id !== attachmentId);
    }
    onUpdate(updatedTask);
  };

  const handleAddTimeLog = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTimeLog.hours || !newTimeLog.date) return;
      
      const log: TimeLog = {
          id: `tl-${Date.now()}`,
          userId: currentUser.id,
          hours: parseFloat(newTimeLog.hours),
          date: newTimeLog.date,
          description: newTimeLog.desc
      };
      
      const updatedLogs = [...(task.timeLogs || []), log];
      const totalHours = updatedLogs.reduce((acc, l) => acc + l.hours, 0);
      
      onUpdate({
          ...task,
          timeLogs: updatedLogs,
          estimatedHours: totalHours
      } as any);
      
      setNewTimeLog({ hours: '', date: new Date().toISOString().split('T')[0], desc: '' });
  };

  const handleDeleteTimeLog = (logId: string) => {
      const updatedLogs = task.timeLogs?.filter(l => l.id !== logId) || [];
      const totalHours = updatedLogs.reduce((acc, l) => acc + l.hours, 0);
      
      onUpdate({
          ...task,
          timeLogs: updatedLogs,
          estimatedHours: totalHours
      } as any);
  };
  
  const addToGoogleCalendar = () => {
    if (!task.startDate || !task.dueDate) return;
    
    const sDate = new Date(task.startDate);
    const eDate = new Date(task.dueDate);
    eDate.setDate(eDate.getDate() + 1); // Full day events end on the next day exclusive
    
    const fmt = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&details=${encodeURIComponent(task.description || '')}&dates=${fmt(sDate)}/${fmt(eDate)}`;
    window.open(url, '_blank');
  };

  const totalLogged = (task.timeLogs || []).reduce((acc, l) => acc + l.hours, 0);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[95vh] md:h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-white z-10 flex-shrink-0">
            <div className="flex items-center gap-3 flex-1">
                <input 
                    type="text" 
                    value={task.title}
                    onChange={(e) => handleFieldUpdate('title', e.target.value)}
                    className="text-lg md:text-xl font-bold text-gray-900 border-none outline-none focus:ring-0 bg-transparent w-full"
                />
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                <div className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap ${task.completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                   {task.completed ? 'Completed' : 'In Progress'}
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Left Column: Details & Activity */}
            <div className="flex-1 lg:overflow-y-auto p-4 md:p-6 space-y-8 bg-white h-auto lg:h-full">
                
                {/* Tabs */}
                <div className="flex border-b border-gray-100 mb-4">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'details' ? 'border-nexus-primary text-nexus-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Details
                    </button>
                    <button 
                        onClick={() => setActiveTab('time')}
                        className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'time' ? 'border-nexus-primary text-nexus-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Time Tracking
                    </button>
                </div>

                {activeTab === 'details' && (
                    <>
                        {/* Description */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                                <AlignLeft size={18} /> Description
                            </div>
                            <textarea 
                                value={task.description}
                                onChange={(e) => handleFieldUpdate('description', e.target.value)}
                                className="w-full min-h-[120px] p-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-nexus-primary focus:bg-white transition-all resize-y"
                                placeholder="Add a more detailed description..."
                            />
                        </div>
                        
                        {/* Attachments */}
                        <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                            <Paperclip size={18} /> Attachments
                        </div>
                        <div className="space-y-2">
                            {(task.attachments || []).map(att => (
                                <div key={att.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200 group">
                                <div className="flex items-center gap-3 text-sm text-gray-800">
                                    <FileText size={16} className="text-gray-400"/>
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{att.name}</a>
                                </div>
                                <button onClick={() => handleRemoveAttachment(att.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <input type="file" ref={taskAttachmentRef} className="hidden" onChange={(e) => handleFileChange(e)} />
                        <button onClick={() => taskAttachmentRef.current?.click()} className="w-full text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg py-2 hover:border-nexus-primary hover:text-nexus-primary transition-colors">
                            + Add Attachment
                        </button>
                        </div>

                        {/* Subtasks */}
                        <div className="space-y-3">
                            <div 
                                className="flex items-center justify-between text-gray-500 font-medium text-sm cursor-pointer hover:text-gray-700 transition-colors select-none"
                                onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
                            >
                                <div className="flex items-center gap-2">
                                    {isSubtasksExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    <div className="flex items-center gap-2"><CheckSquare size={18} /> Subtasks</div>
                                </div>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                </span>
                            </div>
                            
                            {isSubtasksExpanded && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    {task.subtasks.map(sub => (
                                        <div key={sub.id} className="group bg-white p-3 -mx-3 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                            <div className="flex items-start gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={sub.completed}
                                                    onChange={() => updateSubtask(sub.id, { completed: !sub.completed })}
                                                    className="w-4 h-4 text-nexus-primary rounded border-gray-300 focus:ring-nexus-primary cursor-pointer mt-1"
                                                />
                                                <input 
                                                type="text" 
                                                value={sub.title}
                                                onChange={(e) => updateSubtask(sub.id, { title: e.target.value })}
                                                className={`w-full bg-transparent outline-none text-sm font-medium ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                                                />
                                                <button onClick={() => deleteSubtask(sub.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="pl-7 mt-2 space-y-2">
                                                <textarea
                                                value={sub.description || ''}
                                                onChange={(e) => updateSubtask(sub.id, { description: e.target.value })}
                                                placeholder="Add description..."
                                                className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:bg-white focus:border-nexus-primary resize-none"
                                                rows={2}
                                                />
                                                <div className="flex items-center gap-2">
                                                <input 
                                                    type="date"
                                                    value={sub.startDate || ''}
                                                    onChange={(e) => updateSubtask(sub.id, { startDate: e.target.value })}
                                                    className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-1 outline-none w-full"
                                                />
                                                <input 
                                                    type="date"
                                                    value={sub.dueDate || ''}
                                                    onChange={(e) => updateSubtask(sub.id, { dueDate: e.target.value })}
                                                    className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-1 outline-none w-full"
                                                />
                                                </div>
                                                {(sub.attachments || []).map(att => (
                                                    <div key={att.id} className="flex items-center justify-between bg-gray-100 pl-2 pr-1 py-1 rounded-md text-xs">
                                                    <a href={att.url} className="text-gray-600 hover:underline truncate">{att.name}</a>
                                                    <button onClick={() => handleRemoveAttachment(att.id, sub.id)} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
                                                    </div>
                                                ))}
                                                
                                                <input type="file" ref={ref => { subtaskAttachmentRefs.current[sub.id] = ref }} className="hidden" onChange={(e) => handleFileChange(e, sub.id)} />
                                                <button onClick={() => subtaskAttachmentRefs.current[sub.id]?.click()} className="text-xs text-gray-500 flex items-center gap-1 hover:text-nexus-primary w-full justify-center p-1 bg-gray-100 rounded-md hover:bg-blue-50 transition-colors">
                                                <Paperclip size={12} /> Add file
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2 items-center">
                                        <input 
                                            type="text"
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            placeholder="Add a subtask..."
                                            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-nexus-primary"
                                        />
                                        <button type="submit" disabled={!newSubtaskTitle.trim()} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50">
                                            Add
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Activity Feed */}
                        <div className="space-y-4 pt-6 border-t border-gray-100">
                             <div 
                                className="flex items-center justify-between text-gray-500 font-medium text-sm cursor-pointer hover:text-gray-700 transition-colors select-none"
                                onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                            >
                                <div className="flex items-center gap-2">
                                    {isActivityExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    <AlignLeft size={18} /> Activity & Comments
                                </div>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                    {task.comments?.length || 0}
                                </span>
                            </div>
                            
                            {isActivityExpanded && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-4 mb-4">
                                        {(task.comments || []).map(comment => {
                                            if (comment.isSystem) {
                                            return (
                                                <div key={comment.id} className="flex gap-3 py-1">
                                                <div className="w-8 flex justify-center flex-shrink-0 pt-1">
                                                    <Info size={14} className="text-gray-400" />
                                                </div>
                                                <div className="text-xs text-gray-500 italic">
                                                    {comment.text} <span className="text-gray-300 mx-1">•</span> {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                                </div>
                                                </div>
                                            );
                                            }

                                            const user = team.find(t => t.id === comment.userId) || currentUser;
                                            return (
                                                <div key={comment.id} className="flex gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${user.color || 'bg-gray-400'}`}>
                                                        {user.initials || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                                                            <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-700 mt-0.5">{comment.text}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={commentsEndRef} />
                                    </div>

                                    <form onSubmit={handleAddComment} className="flex gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${currentUser.color}`}>
                                            {currentUser.initials}
                                        </div>
                                        <div className="flex-1 relative">
                                            <input 
                                                type="text"
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-full outline-none focus:border-nexus-primary focus:ring-2 focus:ring-nexus-primary/10 transition-all text-sm"
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={!commentText.trim()}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-nexus-primary disabled:text-gray-300 hover:text-indigo-600 transition-colors"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'time' && (
                    <div className="space-y-6 animate-in slide-in-from-right-2">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500 font-medium">Total Tracked</div>
                                <div className="text-2xl font-bold text-gray-900">{totalLogged.toFixed(1)}h</div>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-nexus-primary shadow-sm">
                                <Clock size={24} />
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><PlayCircle size={16} className="text-green-600"/> Log Time</h4>
                            <form onSubmit={handleAddTimeLog} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
                                    <input 
                                        type="number" 
                                        step="0.25"
                                        min="0"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-nexus-primary"
                                        placeholder="0.0"
                                        value={newTimeLog.hours}
                                        onChange={(e) => setNewTimeLog({...newTimeLog, hours: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-nexus-primary"
                                        value={newTimeLog.date}
                                        onChange={(e) => setNewTimeLog({...newTimeLog, date: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-nexus-primary"
                                            placeholder="What did you work on?"
                                            value={newTimeLog.desc}
                                            onChange={(e) => setNewTimeLog({...newTimeLog, desc: e.target.value})}
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newTimeLog.hours}
                                            className="px-4 py-2 bg-nexus-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-gray-800 mb-3">Time History</h4>
                            <div className="space-y-2">
                                {(!task.timeLogs || task.timeLogs.length === 0) && (
                                    <div className="text-center py-8 text-gray-400 italic">No time logged yet.</div>
                                )}
                                {task.timeLogs?.map(log => {
                                    const user = team.find(u => u.id === log.userId) || currentUser;
                                    return (
                                        <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${user.color}`}>
                                                    {user.initials}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-gray-800">{log.hours}h</span>
                                                        <span className="text-xs text-gray-400">• {new Date(log.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">{log.description || 'No description'}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteTimeLog(log.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Meta Data */}
            <div className="w-full lg:w-80 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-l border-gray-100 space-y-6 lg:overflow-y-auto h-auto lg:h-full">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Status</label>
                      <select 
                          value={task.status || ''}
                          onChange={(e) => handleFieldUpdate('status', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary cursor-pointer font-medium"
                      >
                          {projectColumns.map(col => (
                              <option key={col.id} value={col.id}>{col.title}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Assignee</label>
                      <select 
                          value={task.assignee || ''}
                          onChange={(e) => handleFieldUpdate('assignee', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary cursor-pointer"
                      >
                          <option value="">Unassigned</option>
                          {team.map(member => (
                              <option key={member.id} value={member.id}>{member.name}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Priority</label>
                      <select 
                           value={task.priority}
                           onChange={(e) => handleFieldUpdate('priority', e.target.value)}
                           className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary cursor-pointer"
                      >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                      </select>
                  </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Timeline</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-400 mb-1 block">Start Date</span>
                          <input type="date" value={task.startDate || ''} onChange={(e) => handleFieldUpdate('startDate', e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary" />
                        </div>
                        <div>
                           <span className="text-xs text-gray-400 mb-1 block">Due Date</span>
                           <input type="date" value={task.dueDate || ''} onChange={(e) => handleFieldUpdate('dueDate', e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary" />
                        </div>
                    </div>
                    {task.startDate && task.dueDate && (
                        <button 
                            onClick={addToGoogleCalendar}
                            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg py-2 hover:bg-gray-50 hover:text-nexus-primary transition-colors"
                        >
                            <Calendar size={14} /> Add to Google Calendar
                        </button>
                    )}
                </div>

                <div>
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Budget Link</label>
                   <select value={task.budgetLineItemId || ''} onChange={(e) => handleFieldUpdate('budgetLineItemId', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary cursor-pointer" >
                       <option value="">None</option>
                       {currentProjectBudgetLines.map(line => ( <option key={line.id} value={line.id}>{line.name}</option> ))}
                   </select>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Dependencies</label>
                    <div className="space-y-4">
                        <div>
                           <h4 className="text-xs font-medium text-gray-400 mb-2">Is Blocked By:</h4>
                           <div className="space-y-2">
                               {predecessorTasks.map(depTask => (
                                   <div key={depTask.id} className="flex items-center justify-between text-xs bg-white border border-gray-200 p-2 rounded shadow-sm group">
                                       <div className="truncate max-w-[150px] font-medium text-gray-700">{depTask.title}</div>
                                       <button onClick={() => removeDependency(depTask.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14} /></button>
                                   </div>
                               ))}
                               <select onChange={(e) => { handleAddDependency(e.target.value); e.target.value = ''; }} className="w-full text-xs px-2 py-1.5 bg-gray-100 border border-transparent rounded hover:bg-gray-200 cursor-pointer outline-none" value="" >
                                   <option value="">+ Add prerequisite</option>
                                   {allTasks.filter(t => !t.isSection && t.id !== task.id && !task.dependencies?.some(d => d.taskId === t.id)).map(t => (<option key={t.id} value={t.id}>{t.title}</option>))}
                               </select>
                           </div>
                        </div>
                        <div>
                           <h4 className="text-xs font-medium text-gray-400 mb-2">Blocks:</h4>
                            <div className="space-y-2">
                               {blockingTasks.length === 0 && <div className="text-xs text-gray-400 italic">Not blocking any tasks.</div>}
                               {blockingTasks.map(depTask => (
                                   <div key={depTask.id} className="flex items-center justify-between text-xs bg-white border border-gray-200 p-2 rounded shadow-sm group">
                                       <div className="truncate max-w-[150px] font-medium text-gray-700">{depTask.title}</div>
                                       <button onClick={() => handleRemoveBlocking(depTask.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14} /></button>
                                   </div>
                               ))}
                               <select onChange={(e) => { handleAddBlocking(e.target.value); e.target.value = ''; }} className="w-full text-xs px-2 py-1.5 bg-gray-100 border border-transparent rounded hover:bg-gray-200 cursor-pointer outline-none" value="" >
                                   <option value="">+ Add task to block</option>
                                   {allTasks.filter(t => !t.isSection && t.id !== task.id && !blockingTasks.some(bt => bt.id === t.id) && !predecessorTasks.some(pt => pt.id === t.id)).map(t => (<option key={t.id} value={t.id}>{t.title}</option>))}
                               </select>
                           </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
