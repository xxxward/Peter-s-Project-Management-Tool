import React, { useRef, useState, useEffect } from 'react';
import { Project, TeamMember, Task, PropertyDefinition, Department, ProjectGroup } from '../types';
import { ExternalLink, FileSpreadsheet, Mail, Plus, Download, FileUp, BarChart2, Table as TableIcon, Users, Building2, Link as LinkIcon, ArrowLeft, Loader2, FolderInput, ChevronDown, SlidersHorizontal, Activity, TrendingUp, Trash2, UserCheck, Shield } from 'lucide-react';
import { EditableCell } from './EditableCell';
import { WorkloadView } from './WorkloadView';

// Styling helper for status chips (Monday.com style)
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-nexus-teal text-white shadow-sm';
    case 'On Hold': return 'bg-nexus-yellow text-white shadow-sm';
    case 'Completed': return 'bg-nexus-primary text-white shadow-sm';
    case 'Archived': return 'bg-gray-600 text-white shadow-sm';
    default: return 'bg-gray-200 text-gray-800';
  }
};

// Helper for CSV Export
const downloadCSV = (filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) => {
  const processRow = (row: any[]) => {
    return row.map(val => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  };

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(processRow)].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Projects Master Sheet View ---
interface ProjectsTableProps {
  currentUser: TeamMember;
  projectGroups: ProjectGroup[];
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
  onSelectProject: (id: string) => void;
  onOpenProjectTasks: (id: string) => void;
  onUpdateProject: (project: Project) => void;
  onCreateProject: (groupId?: string) => void;
  customProperties: PropertyDefinition[];
  initialFilter?: string;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({ 
  currentUser,
  projectGroups, 
  projects, 
  tasks, 
  team, 
  onSelectProject, 
  onOpenProjectTasks, 
  onUpdateProject, 
  onCreateProject,
  customProperties,
  initialFilter
}) => {
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter || 'active');
  const isAdmin = currentUser.permissionLevel === 'Admin';
  
  // Default columns - only include 'budget' if admin
  const defaultCols = ['status', 'tasks', 'start', 'due', 'owner'];
  if (isAdmin) defaultCols.splice(4, 0, 'budget');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultCols);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) newSet.delete(groupId);
      else newSet.add(groupId);
      return newSet;
    });
  };

  const updateField = (project: Project, field: keyof Project, value: any) => {
    let finalValue = value;
    if (field === 'budget') {
        finalValue = parseFloat(value) || 0;
    }
    onUpdateProject({ ...project, [field]: finalValue });
  };

  const updateCustomField = (project: Project, propId: string, value: string) => {
    const updatedCustomProps = { ...project.customProperties, [propId]: value };
    onUpdateProject({ ...project, customProperties: updatedCustomProps });
  };

  const filteredProjects = projects.filter(p => {
    if (activeFilter === 'active') return p.status === 'Active';
    if (activeFilter === 'hold') return p.status === 'On Hold';
    if (activeFilter === 'completed') return p.status === 'Completed';
    if (activeFilter === 'archived') return p.status === 'Archived';
    return p.status === 'Active'; // Default
  });

  const handleExport = () => {
    // Only include Budget in export if Admin
    const baseHeaders = ['Project Name', 'Group', 'Status', 'Start Date', 'Due Date', 'Owner'];
    if (isAdmin) baseHeaders.splice(5, 0, 'Budget');
    
    const headers = [...baseHeaders, ...customProperties.map(p => p.name)];
    
    const rows = filteredProjects.map(p => {
        const groupName = projectGroups.find(g => g.id === p.groupId)?.name || '';
        const ownerName = team.find(t => t.id === p.ownerId)?.name || '';
        const customValues = customProperties.map(prop => {
            const val = p.customProperties?.[prop.id];
            return Array.isArray(val) ? val.join('; ') : val;
        });
        
        const baseData: (string | number | undefined)[] = [
            p.name,
            groupName,
            p.status,
            p.startDate || '',
            p.dueDate || '',
            ownerName
        ];
        
        if (isAdmin) baseData.splice(5, 0, p.budget);

        return [
            ...baseData,
            ...customValues
        ];
    });
    downloadCSV(`projects_export_${activeFilter}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const allColumns = [
    { id: 'status', label: 'Status' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'start', label: 'Start Date' },
    { id: 'due', label: 'Due Date' },
    ...(isAdmin ? [{ id: 'budget', label: 'Budget' }] : []),
    { id: 'owner', label: 'Owner' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-1.5 bg-nexus-teal/10 text-nexus-teal rounded-lg">
              <FileSpreadsheet size={20} />
            </div>
            Project Portfolio
          </h2>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
             <button 
               onClick={() => setActiveFilter('active')}
               className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeFilter === 'active' ? 'bg-white text-nexus-teal shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
             >
               Active
             </button>
             <button 
               onClick={() => setActiveFilter('hold')}
               className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeFilter === 'hold' ? 'bg-white text-nexus-yellow shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
             >
               On Hold
             </button>
             <button 
               onClick={() => setActiveFilter('completed')}
               className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeFilter === 'completed' ? 'bg-white text-nexus-primary shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
             >
               Completed
             </button>
             <button 
               onClick={() => setActiveFilter('archived')}
               className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeFilter === 'archived' ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
             >
               Archived
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-xs font-medium shadow-sm transition-colors"
            >
              <SlidersHorizontal size={14} /> Properties <ChevronDown size={14} />
            </button>
            {isColumnPickerOpen && (
              <>
                 <div className="fixed inset-0 z-10" onClick={() => setIsColumnPickerOpen(false)}></div>
                 <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-3 max-h-60 overflow-y-auto">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Columns</div>
                    {allColumns.map(col => (
                      <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs text-gray-800 font-medium">
                        <input type="checkbox" checked={visibleColumns.includes(col.id)} onChange={() => toggleColumn(col.id)} className="rounded text-nexus-primary focus:ring-nexus-primary" />
                        {col.label}
                      </label>
                    ))}
                    <div className="border-t border-gray-100 my-2"></div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom</div>
                    {customProperties.map(p => (
                      <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs text-gray-800 font-medium">
                        <input type="checkbox" checked={visibleColumns.includes(p.id)} onChange={() => toggleColumn(p.id)} className="rounded text-nexus-primary focus:ring-nexus-primary" />
                        {p.name}
                      </label>
                    ))}
                 </div>
              </>
            )}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-xs font-medium shadow-sm transition-colors"
            title="Export to CSV"
          >
            <Download size={14} /> Export
          </button>

          <button 
             onClick={() => onCreateProject()}
             className="flex items-center gap-2 px-4 py-2 bg-nexus-primary text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg"
          >
             <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Grouped Table */}
      <div className="overflow-auto flex-1 bg-gray-50/50 p-6 space-y-8 custom-scrollbar">
        {projectGroups.map(group => {
           const groupProjects = filteredProjects.filter(p => p.groupId === group.id);
           const isCollapsed = collapsedGroups.has(group.id);
           
           if (groupProjects.length === 0 && activeFilter !== 'active') return null;

           return (
             <div key={group.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div 
                    className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => toggleGroup(group.id)}
                >
                   <h3 className="font-bold text-nexus-primary text-sm uppercase tracking-wider flex items-center gap-2">
                     <ChevronDown size={14} className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} /> 
                     {group.name}
                   </h3>
                   <span className="text-xs font-semibold text-gray-500">{groupProjects.length} Projects</span>
                </div>
                
                {!isCollapsed && (
                    <table className="w-full text-sm text-left border-collapse animate-in slide-in-from-top-2 duration-200">
                    <thead className="text-xs text-gray-500 font-semibold uppercase bg-white border-b border-gray-100">
                        <tr>
                        <th className="px-6 py-3 w-[250px] pl-10">Project Name</th>
                        {visibleColumns.includes('status') && <th className="px-6 py-3 w-[140px] text-center">Status</th>}
                        {visibleColumns.includes('tasks') && <th className="px-6 py-3 w-[100px] text-center">Tasks</th>}
                        {visibleColumns.includes('start') && <th className="px-6 py-3 w-[120px] text-center">Start</th>}
                        {visibleColumns.includes('due') && <th className="px-6 py-3 w-[120px] text-center">Due</th>}
                        {/* Only render Budget header if admin and visible */}
                        {isAdmin && visibleColumns.includes('budget') && <th className="px-6 py-3 w-[120px] text-right">Budget</th>}
                        {visibleColumns.includes('owner') && <th className="px-6 py-3 w-[150px] text-center">Owner</th>}
                        {customProperties.filter(p => visibleColumns.includes(p.id)).map(prop => (
                            <th key={prop.id} className="px-6 py-3 min-w-[120px] whitespace-nowrap text-center">
                            {prop.name}
                            </th>
                        ))}
                        <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {groupProjects.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="px-6 py-8 text-center text-gray-500 italic">
                                No {activeFilter} projects in this portfolio. 
                                {activeFilter === 'active' && <button onClick={() => onCreateProject(group.id)} className="ml-2 text-nexus-primary hover:underline font-medium">Add one?</button>}
                            </td>
                        </tr>
                        ) : (
                        groupProjects.map(project => {
                            const projectTaskCount = tasks.filter(t => t.projectId === project.id).length;
                            return (
                            <tr key={project.id} className="bg-white hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-3 pl-10 border-l-4 border-transparent hover:border-nexus-primary transition-all">
                                <div className="flex items-center justify-between gap-2">
                                    <EditableCell 
                                    value={project.name}
                                    type="text"
                                    onChange={(val) => updateField(project, 'name', val)}
                                    className="font-medium text-gray-900"
                                    />
                                    <button 
                                    onClick={() => onSelectProject(project.id)}
                                    className="text-gray-300 hover:text-nexus-primary p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Open Project"
                                    >
                                    <FolderInput size={16} />
                                    </button>
                                </div>
                                </td>
                                {visibleColumns.includes('status') && (
                                <td className="px-6 py-3 text-center">
                                    <div className={`inline-block w-full rounded-md px-2 py-1 text-xs font-semibold text-center ${getStatusStyle(project.status)}`}>
                                    <EditableCell 
                                        value={project.status}
                                        type="dropdown"
                                        options={['Active', 'On Hold', 'Completed', 'Archived']}
                                        onChange={(val) => updateField(project, 'status', val)}
                                        className="bg-transparent text-white text-center cursor-pointer font-semibold"
                                    />
                                    </div>
                                </td>
                                )}
                                {visibleColumns.includes('tasks') && (
                                <td className="px-6 py-3 text-center">
                                    <button 
                                    onClick={() => onOpenProjectTasks(project.id)}
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-xs inline-flex items-center justify-center transition-colors"
                                    >
                                    {projectTaskCount}
                                    </button>
                                </td>
                                )}
                                {visibleColumns.includes('start') && (
                                <td className="px-6 py-3 text-center text-gray-600">
                                    <EditableCell 
                                    value={project.startDate}
                                    type="date"
                                    onChange={(val) => updateField(project, 'startDate', val)}
                                    className="text-center text-xs"
                                    />
                                </td>
                                )}
                                {visibleColumns.includes('due') && (
                                <td className="px-6 py-3 text-center text-gray-600">
                                    <EditableCell 
                                    value={project.dueDate}
                                    type="date"
                                    onChange={(val) => updateField(project, 'dueDate', val)}
                                    className="text-center text-xs"
                                    />
                                </td>
                                )}
                                {isAdmin && visibleColumns.includes('budget') && (
                                <td className="px-6 py-3 text-right">
                                    <EditableCell 
                                    value={project.budget}
                                    type="currency"
                                    placeholder="-"
                                    onChange={(val) => updateField(project, 'budget', val)}
                                    className="text-right font-mono text-gray-800"
                                    />
                                </td>
                                )}
                                {visibleColumns.includes('owner') && (
                                <td className="px-6 py-3 text-center">
                                    <div className="flex justify-center">
                                    <EditableCell 
                                        value={team.find(t => t.id === project.ownerId)?.name || project.ownerId}
                                        type="user"
                                        options={team.map(t => t.name)}
                                        placeholder="Assign"
                                        onChange={(val) => {
                                        const member = team.find(t => t.name === val);
                                        updateField(project, 'ownerId', member ? member.id : val);
                                        }}
                                        className="text-center text-xs bg-gray-100 text-gray-800 rounded px-2 py-1"
                                    />
                                    </div>
                                </td>
                                )}

                                {customProperties.filter(p => visibleColumns.includes(p.id)).map(prop => (
                                <td key={prop.id} className="px-6 py-3 text-center">
                                    <div className="bg-gray-50 rounded px-2 py-1 inline-block min-w-[80px]">
                                    <EditableCell 
                                        value={project.customProperties?.[prop.id]}
                                        type={prop.type}
                                        options={prop.options}
                                        onChange={(val) => updateCustomField(project, prop.id, val)}
                                        className="text-center text-xs text-gray-700"
                                    />
                                    </div>
                                </td>
                                ))}

                                <td className="px-6 py-3 text-right">
                                <button onClick={() => onSelectProject(project.id)} className="text-gray-400 hover:text-nexus-primary transition-colors">
                                    <ArrowLeft size={16} className="rotate-180" />
                                </button>
                                </td>
                            </tr>
                            );
                        })
                        )}
                    </tbody>
                    </table>
                )}
             </div>
           );
        })}
      </div>
    </div>
  );
};

interface TeamTableProps {
  team: TeamMember[];
  departments: Department[];
  tasks: Task[];
  customProperties: PropertyDefinition[];
  onAddMember: (deptId?: string) => void;
  onImportCSV: (file: File) => void;
  onExportCSV: () => void;
  onUpdateMember: (member: TeamMember) => void;
  onUpdateDepartment: (dept: Department) => void;
  onViewUserTasks: (userId: string) => void;
  onCreateDepartment: () => void;
  onDeleteDepartment: (id: string) => void;
}

export const TeamTable: React.FC<TeamTableProps> = ({ 
  team, departments, tasks, customProperties, 
  onAddMember, onImportCSV, onExportCSV, onUpdateMember, onUpdateDepartment, onViewUserTasks,
  onCreateDepartment, onDeleteDepartment 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'table' | 'workload' | 'departments' | 'deptDetail'>('table');
  const [viewFilter, setViewFilter] = useState<'all' | 'admin' | 'standard' | 'viewer'>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['role', 'permission', 'email', 'dept']);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportCSV(e.target.files[0]);
      e.target.value = '';
    }
  };

  const updateField = (member: TeamMember, field: keyof TeamMember, value: string) => {
    onUpdateMember({ ...member, [field]: value });
  };

  const updateCustomField = (member: TeamMember, propId: string, value: string) => {
    const updatedCustomProps = { ...member.customProperties, [propId]: value };
    onUpdateMember({ ...member, customProperties: updatedCustomProps });
  };

  const getTaskCount = (memberId: string) => tasks.filter(t => t.assignee === memberId).length;

  const filteredTeam = team.filter(m => {
    if (viewFilter === 'all') return true;
    if (viewFilter === 'admin') return m.permissionLevel === 'Admin';
    if (viewFilter === 'standard') return m.permissionLevel === 'Standard';
    if (viewFilter === 'viewer') return m.permissionLevel === 'Viewer';
    return true;
  });

  const handleDeptClick = (deptId: string) => {
    setSelectedDeptId(deptId);
    setViewMode('deptDetail');
  };

  const handleDeleteDept = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm('Delete this department? Members will be unassigned.')) {
          onDeleteDepartment(id);
      }
  };

  if (viewMode === 'workload') {
    return (
      <div className="flex flex-col h-full">
         <div className="flex justify-between items-center mb-4 px-2">
           <h2 className="text-xl font-bold text-gray-800">Resource Planning</h2>
           <div className="flex bg-gray-200 rounded-lg p-1">
              <button onClick={() => setViewMode('table')} className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm flex items-center gap-2"><TableIcon size={16}/> Table</button>
              <button onClick={() => setViewMode('departments')} className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm flex items-center gap-2"><Building2 size={16}/> Departments</button>
              <button onClick={() => setViewMode('workload')} className="px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm text-gray-900 flex items-center gap-2"><BarChart2 size={16}/> Workload</button>
           </div>
         </div>
         <WorkloadView team={filteredTeam} tasks={tasks} departments={departments} />
      </div>
    );
  }

  if (viewMode === 'departments') {
      return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h2 className="text-xl font-bold text-gray-800">Departments</h2>
             <p className="text-sm text-gray-500">Manage team structure and leadership roles</p>
           </div>
           <div className="flex items-center gap-4">
               <button 
                 onClick={onCreateDepartment}
                 className="flex items-center gap-2 px-3 py-1.5 bg-nexus-primary text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-600 transition-colors"
               >
                 <Plus size={16} /> New Department
               </button>
               <div className="flex bg-gray-200 rounded-lg p-1">
                  <button onClick={() => setViewMode('table')} className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm flex items-center gap-2"><TableIcon size={16}/> Table</button>
                  <button onClick={() => setViewMode('departments')} className="px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm text-gray-900 flex items-center gap-2"><Building2 size={16}/> Departments</button>
                  <button onClick={() => setViewMode('workload')} className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm flex items-center gap-2"><BarChart2 size={16}/> Workload</button>
               </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10">
           {departments.map(dept => {
             const members = team.filter(t => t.departmentId === dept.id);
             return (
               <div 
                 key={dept.id} 
                 className="border border-gray-200 rounded-xl p-5 hover:border-nexus-primary hover:shadow-md transition-all group bg-white flex flex-col h-full relative"
               >
                 <button 
                    onClick={(e) => handleDeleteDept(e, dept.id)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50"
                    title="Delete Department"
                 >
                    <Trash2 size={16} />
                 </button>

                 <div className="mb-4 pr-8">
                    <EditableCell 
                        value={dept.name}
                        type="text"
                        onChange={(val) => onUpdateDepartment({...dept, name: val})}
                        className="font-bold text-gray-800 text-lg mb-1 block"
                    />
                    <EditableCell 
                        value={dept.description}
                        type="text"
                        placeholder="Add description..."
                        onChange={(val) => onUpdateDepartment({...dept, description: val})}
                        className="text-sm text-gray-500 line-clamp-2 block"
                    />
                 </div>

                 {/* Manager Assignment */}
                 <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 block tracking-wider flex items-center gap-1">
                        <Shield size={10} /> Department Lead
                    </label>
                    <div className="flex items-center gap-2">
                        {dept.headId ? (
                            <div className="w-6 h-6 rounded-full bg-nexus-purple text-white text-[10px] flex items-center justify-center font-bold">
                                {team.find(t => t.id === dept.headId)?.initials || '?'}
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                <UserCheck size={12} />
                            </div>
                        )}
                        <select 
                            className="bg-transparent text-sm font-medium text-gray-700 outline-none flex-1 cursor-pointer"
                            value={dept.headId || ''}
                            onChange={(e) => onUpdateDepartment({...dept, headId: e.target.value})}
                        >
                            <option value="">Select Manager...</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                 </div>

                 <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Team Members ({members.length})</label>
                        <button 
                            onClick={() => onAddMember(dept.id)}
                            className="text-nexus-primary hover:text-indigo-600 p-0.5 rounded transition-colors"
                            title="Add member to this department"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                        {members.length === 0 && <div className="text-sm text-gray-400 italic">No members assigned</div>}
                        {members.map(m => (
                            <div key={m.id} className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${m.color}`}>
                                    {m.initials}
                                    </div>
                                    <span className={`truncate max-w-[120px] ${m.id === dept.headId ? 'font-semibold text-nexus-primary' : 'text-gray-700'}`}>
                                        {m.name}
                                    </span>
                                </div>
                                {m.id === dept.headId && (
                                    <span className="text-[9px] bg-nexus-purple/10 text-nexus-purple px-1.5 py-0.5 rounded font-medium border border-nexus-purple/20">Lead</span>
                                )}
                            </div>
                        ))}
                    </div>
                 </div>
                 
                 <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={() => handleDeptClick(dept.id)}
                        className="text-xs font-medium text-nexus-primary hover:underline flex items-center gap-1"
                    >
                        View Details <ArrowLeft size={12} className="rotate-180"/>
                    </button>
                 </div>
               </div>
             )
           })}
        </div>
      </div>
    );
  }
  
  if (viewMode === 'deptDetail' && selectedDeptId) {
     const dept = departments.find(d => d.id === selectedDeptId);
     const members = team.filter(t => t.departmentId === selectedDeptId);
     
     return (
       <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('departments')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{dept?.name} Overview</h2>
                <p className="text-sm text-gray-500">Workload analysis and distribution</p>
              </div>
            </div>
         </div>
 
         <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
               <WorkloadView team={members} tasks={tasks} departments={departments.filter(d => d.id === selectedDeptId)} />
            </div>
         </div>
       </div>
     );
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-nexus-yellow" />
            Team Directory
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('table')} className="px-3 py-1 rounded-md text-xs font-semibold bg-white shadow-sm text-gray-900">Table</button>
              <button onClick={() => setViewMode('departments')} className="px-3 py-1 rounded-md text-xs font-semibold text-gray-600 hover:text-gray-900">Departments</button>
              <button onClick={() => setViewMode('workload')} className="px-3 py-1 rounded-md text-xs font-semibold text-gray-600 hover:text-gray-900">Workload</button>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Column Picker Logic - same as projects */}
          <div className="relative">
            <button 
              onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs font-medium shadow-sm"
            >
              <SlidersHorizontal size={14} /> Properties <ChevronDown size={14} />
            </button>
            {isColumnPickerOpen && (
              <>
                 <div className="fixed inset-0 z-10" onClick={() => setIsColumnPickerOpen(false)}></div>
                 <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-2 max-h-60 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1 mb-1">Visible Columns</div>
                    {['role', 'permission', 'email', 'dept'].map(id => (
                      <label key={id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs text-gray-800 capitalize">
                        <input type="checkbox" checked={visibleColumns.includes(id)} onChange={() => toggleColumn(id)} className="rounded text-nexus-primary focus:ring-nexus-primary" />
                        {id}
                      </label>
                    ))}
                    <div className="border-t border-gray-100 my-1"></div>
                    {customProperties.map(p => (
                      <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs text-gray-800">
                        <input type="checkbox" checked={visibleColumns.includes(p.id)} onChange={() => toggleColumn(p.id)} className="rounded text-nexus-primary focus:ring-nexus-primary" />
                        {p.name}
                      </label>
                    ))}
                 </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1"></div>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-nexus-primary hover:bg-gray-100 rounded-lg" title="Import CSV"><FileUp size={18} /></button>
          <button onClick={onExportCSV} className="p-2 text-gray-500 hover:text-nexus-primary hover:bg-gray-100 rounded-lg" title="Export CSV"><Download size={18} /></button>
          
          <button onClick={() => onAddMember()} className="flex items-center gap-2 px-3 py-1.5 bg-nexus-primary text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium shadow-md">
            <Plus size={16} /> Add Row
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 bg-gray-50/50 p-6">
        <table className="w-full text-sm text-left border-collapse bg-white rounded-lg shadow-sm">
          <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-semibold border-r border-gray-100 min-w-[200px] pl-10">Member</th>
              {visibleColumns.includes('role') && <th className="px-6 py-3 font-semibold border-r border-gray-100 min-w-[150px] text-center">Role</th>}
              {visibleColumns.includes('permission') && <th className="px-6 py-3 font-semibold border-r border-gray-100 min-w-[120px] text-center">Permission</th>}
              {visibleColumns.includes('email') && <th className="px-6 py-3 font-semibold border-r border-gray-100 min-w-[200px]">Email</th>}
              <th className="px-6 py-3 font-semibold border-r border-gray-100 w-[100px] text-center">Tasks</th>
              {visibleColumns.includes('dept') && <th className="px-6 py-3 font-semibold border-r border-gray-100 min-w-[150px] text-center">Department</th>}
              {customProperties.filter(p => visibleColumns.includes(p.id)).map(prop => (
                <th key={prop.id} className="px-6 py-3 font-semibold border-r border-gray-100 min-w-[150px] whitespace-nowrap text-center">
                  {prop.name}
                </th>
              ))}
              <th className="px-6 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTeam.map(member => (
              <tr key={member.id} className="bg-white hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-3 border-r border-gray-100 pl-10 border-l-4 border-l-transparent hover:border-l-nexus-primary transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${member.color} shadow-sm`}>
                      {member.initials}
                    </div>
                    <EditableCell 
                      value={member.name} 
                      type="text" 
                      onChange={(val) => updateField(member, 'name', val)}
                      className="font-medium text-gray-900"
                    />
                  </div>
                </td>
                
                {visibleColumns.includes('role') && (
                  <td className="px-6 py-3 border-r border-gray-100 text-center">
                    <EditableCell value={member.role} type="text" onChange={(val) => updateField(member, 'role', val)} className="text-center text-gray-700"/>
                  </td>
                )}
                
                {visibleColumns.includes('permission') && (
                  <td className="px-6 py-3 border-r border-gray-100 text-center">
                     <EditableCell 
                      value={member.permissionLevel} 
                      type="dropdown" 
                      options={['Admin', 'Standard', 'Viewer']}
                      onChange={(val) => updateField(member, 'permissionLevel', val)}
                      className={`text-center font-medium ${member.permissionLevel === 'Admin' ? 'text-nexus-purple' : 'text-gray-700'}`}
                    />
                  </td>
                )}
                
                {visibleColumns.includes('email') && (
                  <td className="px-6 py-3 border-r border-gray-100 text-gray-600 font-mono text-xs">
                    <EditableCell value={member.email} type="text" onChange={(val) => updateField(member, 'email', val)} />
                  </td>
                )}
                
                <td className="px-6 py-3 border-r border-gray-100 text-center">
                   <button 
                    onClick={() => onViewUserTasks(member.id)}
                    className="bg-gray-100 hover:bg-nexus-primary hover:text-white transition-colors text-gray-700 px-2 py-1 rounded-full text-xs font-medium border border-gray-200"
                   >
                     {getTaskCount(member.id)}
                   </button>
                </td>
                
                {visibleColumns.includes('dept') && (
                  <td className="px-6 py-3 border-r border-gray-100 text-center">
                     <EditableCell 
                       value={departments.find(d => d.id === member.departmentId)?.name}
                       type="dropdown"
                       options={departments.map(d => d.name)}
                       placeholder="Assign"
                       onChange={(val) => {
                         const dept = departments.find(d => d.name === val);
                         updateField(member, 'departmentId', dept ? dept.id : '');
                       }}
                       className="text-center text-nexus-blue bg-nexus-blue/5 rounded px-2 py-1"
                     />
                  </td>
                )}
                
                {customProperties.filter(p => visibleColumns.includes(p.id)).map(prop => (
                  <td key={prop.id} className="px-6 py-3 border-r border-gray-100 text-center">
                    <EditableCell 
                      value={member.customProperties?.[prop.id]} 
                      type={prop.type} 
                      options={prop.options}
                      onChange={(val) => updateCustomField(member, prop.id, val)}
                      className="text-center text-gray-700"
                    />
                  </td>
                ))}

                <td className="px-6 py-3 text-right">
                   <a href={`mailto:${member.email}`} className="text-gray-400 hover:text-nexus-primary transition-colors">
                    <Mail size={16} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};