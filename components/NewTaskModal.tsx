import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Link as LinkIcon, DollarSign, CheckSquare, Calendar, AlertCircle, GitMerge, Paperclip, File } from 'lucide-react';
import { Priority, Task, BudgetLineItem, Dependency, SmartKeyRule } from '../types';

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];


interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, priority: Priority, dueDate: string, startDate: string, subtasks: {title: string, dueDate: string}[], dependencies: Dependency[], budgetLineId: string, attachments: File[], parentId?: string) => void;
  tasks: Task[];
  budgetLines: BudgetLineItem[];
  parentId?: string;
  smartKeys?: { enabled: boolean; rules: SmartKeyRule[] };
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onSubmit, tasks, budgetLines, parentId: defaultParentId, smartKeys }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [subtasks, setSubtasks] = useState<{ title: string, dueDate: string }[]>([]);
  const [newSubtask, setNewSubtask] = useState({ title: '', dueDate: '' });
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [budgetLineId, setBudgetLineId] = useState('');
  const [parentId, setParentId] = useState(defaultParentId || '');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if(isOpen) {
        setParentId(defaultParentId || '');
    } else {
        // Full reset on close
        setTitle(''); setDescription(''); setPriority('Medium'); setStartDate(''); setDueDate('');
        setSubtasks([]); setNewSubtask({ title: '', dueDate: '' });
        setDependencyIds([]); setBudgetLineId(''); setParentId(''); setAttachments([]);
    }
  }, [isOpen, defaultParentId]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (newSubtask.title.trim()) {
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtask({ title: '', dueDate: '' });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDownSubtask = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSubtask();
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const addDependency = (taskId: string) => {
      if (taskId && !dependencyIds.includes(taskId)) {
          setDependencyIds([...dependencyIds, taskId]);
      }
  };

  const removeDependency = (taskId: string) => {
      setDependencyIds(dependencyIds.filter(id => id !== taskId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dependencies: Dependency[] = dependencyIds.map(id => ({ taskId: id, type: 'FS' }));
    onSubmit(title, description, priority, dueDate, startDate, subtasks, dependencies, budgetLineId, attachments, parentId);
    onClose();
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (smartKeys?.enabled && e.ctrlKey && !e.metaKey) { // Only Ctrl, not Cmd
        const rule = smartKeys.rules.find(r => r.key.toLowerCase() === e.key.toLowerCase());
        if (rule) {
            e.preventDefault();
            switch(rule.actionField) {
                case 'dueDate':
                    const days = typeof rule.actionValue === 'number' ? rule.actionValue : parseInt(rule.actionValue);
                    if (!isNaN(days)) {
                        setDueDate(formatDate(addDays(new Date(), days)));
                    }
                    break;
                case 'priority':
                    setPriority(rule.actionValue as Priority);
                    break;
                // 'status' is not editable in this modal, so it's ignored here
            }
        }
    }
    
    // Allow normal form submission on Enter
    if (e.key === 'Enter' && e.ctrlKey) { // Only Ctrl+Enter to submit
      handleSubmit(e);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Create New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
            {/* Main Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                    <input
                        required
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all text-lg font-medium"
                        placeholder="e.g. Q4 Marketing Strategy"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all resize-none text-sm"
                        placeholder="Add details about this task..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meta Data */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none bg-white text-sm"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Budget Item</label>
                        <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={budgetLineId}
                                onChange={(e) => setBudgetLineId(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none bg-white text-sm"
                            >
                                <option value="">Select Line Item...</option>
                                {budgetLines.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none text-sm text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none text-sm text-gray-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Parent Task</label>
                        <div className="relative">
                            <GitMerge size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none bg-white text-sm"
                            >
                                <option value="">None (Top-level task)</option>
                                {tasks.filter(t => !t.isSection).map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                </div>

                {/* Subtasks & Dependencies */}
                <div className="space-y-5">
                    {/* Subtasks */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subtasks</label>
                        <div className="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                placeholder="Add a subtask..." 
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary"
                                value={newSubtask.title}
                                onChange={e => setNewSubtask({...newSubtask, title: e.target.value})}
                                onKeyDown={handleKeyDownSubtask}
                            />
                             <input 
                                type="date" 
                                className="px-2 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary w-32"
                                value={newSubtask.dueDate}
                                onChange={e => setNewSubtask({...newSubtask, dueDate: e.target.value})}
                            />
                            <button 
                                type="button" 
                                onClick={handleAddSubtask}
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        {subtasks.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-2 space-y-1 max-h-[120px] overflow-y-auto">
                                {subtasks.map((st, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-gray-100 text-sm">
                                        <span className="truncate flex-1">{st.title}</span>
                                        {st.dueDate && <span className="text-xs text-gray-500 ml-2">{new Date(st.dueDate).toLocaleDateString()}</span>}
                                        <button onClick={() => removeSubtask(i)} className="text-gray-400 hover:text-red-500 ml-2">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dependencies */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dependencies</label>
                        <div className="relative mb-2">
                            <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select 
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none bg-white text-sm"
                                onChange={(e) => { addDependency(e.target.value); e.target.value = ''; }}
                                value=""
                            >
                                <option value="">+ Add blocker task...</option>
                                {tasks.filter(t => !t.isSection).map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                        {dependencyIds.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {dependencyIds.map(depId => {
                                    const task = tasks.find(t => t.id === depId);
                                    return (
                                        <div key={depId} className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs border border-orange-100">
                                            <span className="max-w-[150px] truncate">{task?.title || 'Unknown Task'}</span>
                                            <button onClick={() => removeDependency(depId)} className="hover:text-orange-900"><X size={12}/></button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

             {/* Attachments */}
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attachments</label>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-sm text-gray-500 hover:border-nexus-primary hover:text-nexus-primary transition-colors">
                    Click to browse or drag & drop files
                </button>
                {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                    {attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200 text-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                        <File size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-gray-400 text-xs flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button type="button" onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                    </div>
                    ))}
                </div>
                )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
                <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg mr-2 transition-colors font-medium text-sm"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="px-6 py-2.5 bg-nexus-primary hover:bg-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium text-sm"
                >
                Create Task
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
