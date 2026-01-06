import React, { useState, useEffect } from 'react';
// FIX: Import ChevronDown icon.
import { X, User, Calendar, GitMerge, Lock, Unlock, Search, Briefcase, CheckSquare, ChevronDown } from 'lucide-react';
import { Goal, GoalProgressMethod, TeamMember, Project, Task, GoalProgressSource } from '../types';

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: Omit<Goal, 'id' | 'status' | 'progress'>) => void;
  team: TeamMember[];
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  parentId?: string;
  editingGoal: Goal | null;
}

export const NewGoalModal: React.FC<NewGoalModalProps> = ({ isOpen, onClose, onSubmit, team, goals, projects, tasks, parentId: defaultParentId, editingGoal }) => {
  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [timePeriod, setTimePeriod] = useState('');
  const [parentId, setParentId] = useState(defaultParentId || '');
  const [progressMethod, setProgressMethod] = useState<GoalProgressMethod>('Projects');
  const [isPrivate, setIsPrivate] = useState(false);
  const [progressSource, setProgressSource] = useState<GoalProgressSource[]>([]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isEditMode = !!editingGoal;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode) {
            setTitle(editingGoal.title);
            setOwnerId(editingGoal.ownerId);
            setTimePeriod(editingGoal.timePeriod);
            setParentId(editingGoal.parentId || '');
            setProgressMethod(editingGoal.progressMethod);
            setIsPrivate(editingGoal.isPrivate);
            setProgressSource(editingGoal.progressSource || []);
        } else {
            // Reset form for create mode
            setTitle('');
            setOwnerId(team[0]?.id || '');
            setTimePeriod('');
            setParentId(defaultParentId || '');
            setProgressMethod('Projects');
            setIsPrivate(false);
            setProgressSource([]);
        }
    }
  }, [isOpen, editingGoal, defaultParentId, team, isEditMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !ownerId || !timePeriod) return;
    
    onSubmit({
      title,
      ownerId,
      timePeriod,
      parentId: parentId || undefined,
      progressMethod,
      isPrivate,
      progressSource,
    });
    onClose();
  };
  
  const sourceItems = progressMethod === 'Projects' 
    ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleSourceItem = (id: string) => {
      const type = progressMethod === 'Projects' ? 'project' : 'task';
      if (progressSource.some(s => s.id === id)) {
          setProgressSource(prev => prev.filter(s => s.id !== id));
      } else {
          setProgressSource(prev => [...prev, { id, type }]);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? 'Edit Goal' : defaultParentId ? 'Create New Sub-goal' : 'Create New Goal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Goal Title</label>
            <input
              required
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none text-lg font-medium"
              placeholder="e.g., Increase Q4 Revenue by 20%"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  required
                  value={ownerId}
                  onChange={e => setOwnerId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white outline-none text-sm"
                >
                  <option value="" disabled>Select owner...</option>
                  {team.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="text"
                  value={timePeriod}
                  onChange={e => setTimePeriod(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                  placeholder="e.g., Q1 2025"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Progress Measurement</label>
            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                {(['Projects', 'Tasks'] as GoalProgressMethod[]).map(method => (
                    <button
                        key={method}
                        type="button"
                        onClick={() => { setProgressMethod(method); setProgressSource([]); }}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${progressMethod === method ? 'bg-white text-nexus-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        {method}
                    </button>
                ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Connected Work</label>
            <div className="relative">
                <button type="button" onClick={() => setIsDropdownOpen(p => !p)} className="w-full text-left px-4 py-2 border border-gray-200 rounded-lg bg-white flex justify-between items-center">
                    <span className="text-sm">{progressSource.length} {progressMethod} selected</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                    <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                        <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" placeholder={`Search ${progressMethod}...`} className="w-full pl-7 pr-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto p-2">
                            {sourceItems.map(item => (
                                <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input type="checkbox" checked={progressSource.some(s => s.id === item.id)} onChange={() => toggleSourceItem(item.id)} className="w-4 h-4 rounded text-nexus-primary focus:ring-nexus-primary"/>
                                    {progressMethod === 'Projects' ? <Briefcase size={14} className="text-gray-400" /> : <CheckSquare size={14} className="text-gray-400" />}
                                    <span className="text-sm text-gray-700 truncate">{('name' in item) ? item.name : item.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-nexus-primary text-white rounded-lg shadow-md hover:shadow-lg font-medium text-sm hover:bg-indigo-600"
            >
              {isEditMode ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
