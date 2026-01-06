import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, Layout, CheckSquare, User, X } from 'lucide-react';
import { Project, Task, TeamMember } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
  onNavigate: (view: string) => void;
  onTaskClick: (task: Task) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, onClose, projects, tasks, team, onNavigate, onTaskClick 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3);
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const filteredTeam = team.filter(t => t.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3);

  const allResults = [
    ...filteredProjects.map(p => ({ type: 'project', data: p })),
    ...filteredTasks.map(t => ({ type: 'task', data: t })),
    ...filteredTeam.map(t => ({ type: 'person', data: t }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (item: any) => {
    if (!item) return;
    if (item.type === 'project') {
      onNavigate(item.data.id);
    } else if (item.type === 'task') {
      onTaskClick(item.data);
    } else if (item.type === 'person') {
      onNavigate('team');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative border-b border-gray-100 p-4 flex items-center gap-3">
          <Search className="text-gray-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="w-full text-lg outline-none text-gray-800 placeholder-gray-400"
            placeholder="Search projects, tasks, or people..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
          <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-medium">ESC</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {allResults.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Command size={32} className="mx-auto mb-2 opacity-50" />
              <p>No results found.</p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {allResults.map((item, index) => (
                <div
                  key={`${item.type}-${item.data.id}`}
                  onClick={() => handleSelect(item)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-nexus-primary/10 text-nexus-primary' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`p-2 rounded-md ${
                    item.type === 'project' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'task' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {item.type === 'project' ? <Layout size={16} /> : item.type === 'task' ? <CheckSquare size={16} /> : <User size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{'title' in item.data ? item.data.title : item.data.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{item.type}</div>
                  </div>
                  {index === selectedIndex && <ArrowRight size={16} className="text-nexus-primary animate-pulse" />}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-2 text-xs text-gray-400 border-t border-gray-100 flex justify-between px-4">
           <span>Use arrows to navigate</span>
           <span>Enter to select</span>
        </div>
      </div>
    </div>
  );
};
