import React, { useState, useEffect } from 'react';
import { Layout, Users, FileSpreadsheet, Settings, LayoutDashboard, ChevronRight, Plus, FolderPlus, Package, UserCircle, Trash2, PieChart, X, Target, Edit2 } from 'lucide-react';
import { Project, ProjectGroup, OrganizationSettings } from '../types';

interface AppSidebarProps {
  orgSettings: OrganizationSettings;
  projects: Project[];
  projectGroups: ProjectGroup[];
  activeView: string;
  onNavigate: (view: string) => void;
  onCreateGroup: () => void;
  onUpdateGroup: (group: ProjectGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onCreateProject: (groupId?: string) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ 
  orgSettings,
  projects, 
  projectGroups, 
  activeView, 
  onNavigate, 
  onCreateGroup, 
  onUpdateGroup,
  onDeleteGroup,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  isOpen = false,
  onClose
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(projectGroups.map(g => g.id)));
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);


  useEffect(() => {
    // Auto-expand the group of the active project
    if (activeView.startsWith('p')) {
      const project = projects.find(p => p.id === activeView);
      if (project && project.groupId && !expandedGroups.has(project.groupId)) {
        setExpandedGroups(prev => new Set(prev).add(project.groupId!));
      }
    }
  }, [activeView, projects, expandedGroups]);

  const toggleGroup = (id: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedGroups(newSet);
  };

  const handleGroupRename = (group: ProjectGroup, newName: string) => {
    onUpdateGroup({ ...group, name: newName });
    setEditingGroupId(null);
  };
  
  const handleProjectRename = (project: Project, newName: string) => {
    onUpdateProject({ ...project, name: newName });
    setEditingProjectId(null);
  };

  const NavItem = ({ icon: Icon, label, id, colorClass = 'text-gray-400' }: any) => (
    <button
      onClick={() => onNavigate(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
        activeView === id 
          ? 'bg-nexus-primary text-white shadow-md' 
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
      }`}
    >
      <Icon size={18} className={`${activeView === id ? 'text-white' : colorClass} group-hover:scale-105 transition-transform`} />
      <span>{label}</span>
      {activeView === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]" />}
    </button>
  );

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-nexus-dark text-gray-300 flex flex-col h-screen border-r border-white/10 flex-shrink-0 font-sans shadow-xl transform transition-transform duration-300 md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between mb-2 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-nexus-primary to-nexus-teal rounded-lg flex items-center justify-center text-white shadow-lg shadow-black/20 flex-shrink-0">
            <Package size={18} />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-white text-lg tracking-tight leading-none truncate" title={orgSettings.name}>
              {orgSettings.name}
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block mt-0.5 truncate">{orgSettings.domain || 'Workspace'}</span>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-4 custom-scrollbar">
        {/* Main Nav */}
        <div className="space-y-1 mb-8">
          <NavItem icon={LayoutDashboard} label="Dashboard" id="dashboard" colorClass="text-gray-400 group-hover:text-white" />
          <NavItem icon={FileSpreadsheet} label="Projects Master" id="projects_master" colorClass="text-gray-400 group-hover:text-white" />
          <NavItem icon={Users} label="Team Directory" id="team" colorClass="text-gray-400 group-hover:text-white" />
          <NavItem icon={Target} label="Goals" id="goals" colorClass="text-gray-400 group-hover:text-white" />
          <NavItem icon={PieChart} label="Analytics & Reports" id="reports" colorClass="text-gray-400 group-hover:text-white" />
        </div>

        {/* Portfolio Groups */}
        <div className="px-2 mb-3 flex items-center justify-between group">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-600 group-hover:text-gray-400 transition-colors">
             Portfolio
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onCreateGroup(); }}
            className="text-gray-500 hover:text-white hover:bg-white/10 rounded p-1 transition-all opacity-0 group-hover:opacity-100"
            title="Add Portfolio Group"
          >
            <FolderPlus size={14} />
          </button>
        </div>
        
        <div className="space-y-4 mb-8">
          {projectGroups.map(group => {
            const isExpanded = expandedGroups.has(group.id);
            const groupProjects = projects.filter(p => p.groupId === group.id);

            return (
              <div key={group.id} className="space-y-1">
                <div 
                  className="flex items-center justify-between group/header hover:bg-white/5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors" 
                  onClick={() => toggleGroup(group.id)}
                >
                   <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <div className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight size={12} />
                      </div>
                      {editingGroupId === group.id ? (
                        <input 
                          autoFocus
                          type="text"
                          defaultValue={group.name}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => handleGroupRename(group, e.target.value)}
                          onKeyDown={(e) => { if(e.key === 'Enter') handleGroupRename(group, e.currentTarget.value) }}
                          className="bg-gray-800 text-white text-xs px-2 py-1 rounded outline-none border border-nexus-primary w-full"
                        />
                      ) : (
                        <span 
                          className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate hover:text-gray-200" 
                          onDoubleClick={() => setEditingGroupId(group.id)}
                        >
                          {group.name}
                        </span>
                      )}
                   </div>
                   <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Delete Group"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onCreateProject(group.id); }}
                        className="text-gray-500 hover:text-white transition-colors p-1"
                        title="Add Project to Group"
                      >
                        <Plus size={14} />
                      </button>
                   </div>
                </div>

                {isExpanded && (
                  <div className="space-y-0.5 pl-2 border-l border-gray-700 ml-3">
                    {groupProjects.length === 0 && (
                      <div className="px-4 py-1 text-xs text-gray-600 italic">No projects</div>
                    )}
                    {groupProjects.map(project => (
                        <div key={project.id} className={`group/project w-full flex items-center justify-between text-sm rounded-md pr-2 ${ activeView === project.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                            <button
                                onClick={() => { if(editingProjectId !== project.id) onNavigate(project.id) }}
                                className={`flex items-center gap-3 py-1.5 px-3 flex-1 truncate ${ activeView === project.id ? 'text-white font-medium' : 'text-gray-400 group-hover/project:text-gray-200'}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${project.status === 'Active' ? 'bg-nexus-teal shadow-[0_0_5px_rgba(101,163,13,0.5)]' : project.status === 'On Hold' ? 'bg-nexus-yellow' : 'bg-gray-600'}`}></div>
                                {editingProjectId === project.id ? (
                                    <input 
                                      autoFocus
                                      type="text"
                                      defaultValue={project.name}
                                      onClick={(e) => e.stopPropagation()}
                                      onBlur={(e) => handleProjectRename(project, e.target.value)}
                                      onKeyDown={(e) => { 
                                          if(e.key === 'Enter') handleProjectRename(project, e.currentTarget.value);
                                          if(e.key === 'Escape') setEditingProjectId(null);
                                      }}
                                      className="bg-gray-900/50 text-white text-sm px-1 py-0 rounded outline-none border border-nexus-primary w-full"
                                    />
                                ) : (
                                    <span className="truncate" >{project.name}</span>
                                )}
                            </button>
                            <div className="flex items-center opacity-0 group-hover/project:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingProjectId(project.id); }}
                                    className="text-gray-500 hover:text-white transition-colors p-1"
                                    title="Rename Project"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                    title="Delete Project"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Configuration */}
        <div className="mt-auto space-y-1">
          <div className="h-px bg-white/5 my-4 mx-2"></div>
          <NavItem icon={UserCircle} label="My Profile" id="user_prefs" colorClass="text-gray-400" />
          <NavItem icon={Settings} label="Settings" id="settings" colorClass="text-gray-400" />
        </div>
      </div>
    </div>
  );
};
