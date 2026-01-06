import React, { useState, useEffect } from 'react';
import { Project, Task, ReportWidget, TeamMember, ProjectGroup, ReportFilter, PropertyDefinition } from '../types';
import { PieChart, BarChart2, Plus, Trash2, Layout, X, Activity, Save, ArrowRight, MousePointerClick, RefreshCw, AlertCircle, MoreVertical, Download, Image as ImageIcon, FileText, Filter, Table as TableIcon, Maximize2, Settings } from 'lucide-react';

interface CustomReportsProps {
  reports: ReportWidget[];
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
  groups: ProjectGroup[];
  customProperties: PropertyDefinition[];
  onAddReport: (report: ReportWidget) => void;
  onDeleteReport: (id: string) => void;
  onDrillDown: (entity: 'tasks' | 'projects', field: string, value: string) => void;
}

export const CustomReports: React.FC<CustomReportsProps> = ({ 
  reports, 
  projects, 
  tasks, 
  team, 
  groups, 
  customProperties,
  onAddReport, 
  onDeleteReport,
  onDrillDown
}) => {
  const [isCreating, setIsCreating] = useState(false);
  
  // Creation State
  const [newReport, setNewReport] = useState<Partial<ReportWidget>>({
    type: 'bar',
    entity: 'tasks',
    metric: 'count',
    groupBy: 'status',
    title: '',
    description: '',
    filters: [],
    selectedFields: ['title', 'status', 'priority']
  });

  const [tempFilter, setTempFilter] = useState<ReportFilter>({
      id: '',
      field: 'status',
      operator: 'equals',
      value: ''
  });

  const availableFields = [
      { id: 'status', label: 'Status', type: 'dropdown' },
      { id: 'priority', label: 'Priority', type: 'dropdown' },
      { id: 'assignee', label: 'Assignee', type: 'user' },
      { id: 'dueDate', label: 'Due Date', type: 'date' },
      { id: 'budget', label: 'Budget', type: 'number' },
      ...customProperties.map(p => ({ id: p.id, label: p.name, type: p.type }))
  ];

  const handleCreate = () => {
    const reportToAdd: ReportWidget = {
      id: `rep-${Date.now()}`,
      title: newReport.title || 'Untitled Report',
      description: newReport.description || `${newReport.metric} of ${newReport.entity} by ${newReport.groupBy}`,
      type: newReport.type || 'bar',
      entity: newReport.entity || 'tasks',
      metric: newReport.metric || 'count',
      groupBy: newReport.groupBy || 'status',
      filters: newReport.filters || [],
      selectedFields: newReport.selectedFields || []
    };

    onAddReport(reportToAdd);
    closeCreator();
  };

  const closeCreator = () => {
      setIsCreating(false);
      setNewReport({ type: 'bar', entity: 'tasks', metric: 'count', groupBy: 'status', title: '', description: '', filters: [], selectedFields: [] });
  };

  const addFilter = () => {
      if (tempFilter.value || tempFilter.operator.startsWith('is')) {
          setNewReport(prev => ({
              ...prev,
              filters: [...(prev.filters || []), { ...tempFilter, id: `f-${Date.now()}` }]
          }));
          setTempFilter({ id: '', field: 'status', operator: 'equals', value: '' });
      }
  };

  const removeFilter = (id: string) => {
      setNewReport(prev => ({
          ...prev,
          filters: prev.filters?.filter(f => f.id !== id)
      }));
  };

  const toggleField = (fieldId: string) => {
      const current = newReport.selectedFields || [];
      if (current.includes(fieldId)) {
          setNewReport(prev => ({ ...prev, selectedFields: current.filter(f => f !== fieldId) }));
      } else {
          setNewReport(prev => ({ ...prev, selectedFields: [...current, fieldId] }));
      }
  };

  // --- Data Processing ---

  const getLabel = (key: string, fieldId: string | undefined, entity: 'tasks' | 'projects') => {
      if (fieldId === 'assignee' || fieldId === 'ownerId') return team.find(t => t.id === key)?.name || 'Unassigned';
      if (fieldId === 'groupId') return groups.find(g => g.id === key)?.name || 'Unknown';
      if (fieldId === 'projectId') return projects.find(p => p.id === key)?.name || 'Unknown';
      return key || 'None';
  };

  const filterData = (items: any[], filters: ReportFilter[]) => {
      return items.filter(item => {
          return filters.every(f => {
              let itemVal = item[f.field];
              if (itemVal === undefined && item.customProperties) {
                  itemVal = item.customProperties[f.field];
              }
              itemVal = String(itemVal || '').toLowerCase();
              const filterVal = f.value.toLowerCase();

              switch(f.operator) {
                  case 'equals': return itemVal === filterVal;
                  case 'contains': return itemVal.includes(filterVal);
                  case 'greater': return parseFloat(itemVal) > parseFloat(filterVal);
                  case 'less': return parseFloat(itemVal) < parseFloat(filterVal);
                  case 'isSet': return itemVal !== '';
                  case 'isNotSet': return itemVal === '';
                  default: return true;
              }
          });
      });
  };

  const calculateData = (report: Partial<ReportWidget>) => {
    let rawData: any[] = report.entity === 'tasks' ? tasks : projects;
    
    // Apply Filters
    if (report.filters && report.filters.length > 0) {
        rawData = filterData(rawData, report.filters);
    }

    // Aggregation
    const groupsMap: { [key: string]: number } = {};
    rawData.forEach(item => {
        let key = (item as any)[report.groupBy || 'status'];
        if (item.customProperties && key === undefined) key = item.customProperties[report.groupBy || 'status'];
        if (key === undefined || key === null) key = 'Unassigned';
        
        let value = 1;
        if (report.metric === 'budget') value = (item as Project).budget || 0;
        if (report.metric === 'hours') value = (item as Task).estimatedHours || 0;

        groupsMap[key] = (groupsMap[key] || 0) + value;
    });

    const labels = Object.keys(groupsMap);
    const values = Object.values(groupsMap);
    const total = values.reduce((a, b) => a + b, 0);

    return { labels, values, total, rawData };
  };

  const renderWidgetContent = (report: Partial<ReportWidget>, isPreview = false) => {
    const { labels, values, total, rawData } = calculateData(report);
    const maxVal = Math.max(...values, 1);

    if (total === 0 && rawData.length === 0 && isPreview) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
                <AlertCircle size={32} className="mb-3 opacity-50" />
                <span className="text-sm">No data matches the current filters.</span>
            </div>
        );
    }

    if (report.type === 'table') {
        return (
            <div className="flex-1 w-full overflow-auto custom-scrollbar border border-gray-200 rounded-lg mt-2 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 border-b border-gray-200 font-semibold text-gray-700">Name</th>
                            {(report.selectedFields || []).map(f => (
                                <th key={f} className="p-3 border-b border-gray-200 font-semibold text-gray-700 capitalize">
                                    {availableFields.find(af => af.id === f)?.label || f}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rawData.slice(0, isPreview ? 20 : 50).map((item: any, i) => (
                            <tr key={item.id || i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="p-3 truncate max-w-[200px] font-medium text-gray-900">{item.title || item.name}</td>
                                {(report.selectedFields || []).map(f => {
                                    let val = item[f];
                                    if(val === undefined && item.customProperties) val = item.customProperties[f];
                                    if(f === 'assignee' || f === 'ownerId') val = getLabel(val, f, report.entity as any);
                                    return <td key={f} className="p-3 truncate max-w-[150px] text-gray-600">{val}</td>
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (report.type === 'summary') {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6">
                <div className="text-6xl font-bold text-nexus-primary">{report.metric === 'budget' ? `$${total.toLocaleString()}` : total}</div>
                <div className="text-lg text-gray-500 mt-2 font-medium">Total {report.metric === 'count' ? (report.entity === 'tasks' ? 'Tasks' : 'Projects') : (report.metric === 'budget' ? 'Budget' : 'Hours')}</div>
            </div>
        );
    }

    if (report.type === 'donut') {
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#6366f1'];
        let currentAngle = 0;
        const segments = values.map((val, i) => {
            const percentage = (val / total) * 100;
            const endAngle = currentAngle + percentage;
            const str = `${colors[i % colors.length]} ${currentAngle}% ${endAngle}%`;
            currentAngle = endAngle;
            return str;
        }).join(', ');
        
        return (
            <div className="flex items-center justify-center h-full min-h-[250px] gap-8">
                {/* Conic Gradient Donut */}
                <div 
                    className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-inner"
                    style={{ background: `conic-gradient(${segments || '#e5e7eb 0% 100%'})` }}
                >
                     <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-sm z-10">
                         <div className="text-2xl font-bold text-gray-800">{total.toLocaleString()}</div>
                         <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Total</div>
                     </div>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                    {labels.map((label, i) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}></div>
                            <div className="text-sm font-medium text-gray-700 min-w-[80px] truncate" title={getLabel(label, report.groupBy, report.entity as any)}>
                                {getLabel(label, report.groupBy, report.entity as any)}
                            </div>
                            <div className="text-sm font-bold text-gray-900">{values[i]}</div>
                            <div className="text-xs text-gray-400">({Math.round((values[i]/total)*100)}%)</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Bar Chart (Default)
    return (
        <div className="flex flex-col h-full justify-end pt-6 min-h-[250px] pb-2">
            <div className="flex items-end justify-around h-full gap-2 px-2 overflow-x-auto custom-scrollbar">
                {labels.map((label, i) => (
                    <div key={label} className="flex flex-col items-center flex-1 group cursor-pointer min-w-[40px]" onClick={() => !isPreview && onDrillDown(report.entity as any, report.groupBy!, label)}>
                        <div className="text-xs font-bold text-gray-900 mb-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">{values[i]}</div>
                        <div 
                            className="w-full max-w-[60px] bg-nexus-primary rounded-t-md hover:bg-indigo-500 transition-all relative shadow-sm"
                            style={{ height: `${(values[i] / maxVal) * 100}%`, minHeight: '4px' }}
                        >
                        </div>
                        <div className="mt-3 text-[10px] text-gray-500 font-medium truncate max-w-[80px] text-center" title={getLabel(label, report.groupBy, report.entity as any)}>
                            {getLabel(label, report.groupBy, report.entity as any)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  // --- RENDER ---

  // 1. Full Screen Builder
  if (isCreating) {
      return (
          <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-in fade-in duration-200">
              {/* Top Bar */}
              <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
                  <div className="flex items-center gap-3">
                      <div className="bg-nexus-primary/10 p-2 rounded-lg text-nexus-primary">
                          <Layout size={20} />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Report Builder</h2>
                  </div>
                  <div className="flex items-center gap-3">
                      <button onClick={closeCreator} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          Cancel
                      </button>
                      <button onClick={handleCreate} className="px-5 py-2 text-sm font-medium bg-nexus-primary text-white hover:bg-indigo-600 rounded-lg shadow-sm transition-colors flex items-center gap-2">
                          <Save size={16} /> Save Report
                      </button>
                  </div>
              </div>

              {/* Builder Layout */}
              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                  {/* Left Sidebar: Config */}
                  <div className="w-full lg:w-[400px] bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
                      <div className="p-6 space-y-8">
                          
                          {/* Section: General */}
                          <div className="space-y-4">
                              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                  <FileText size={14} /> General Info
                              </h3>
                              <div className="space-y-3">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                                      <input 
                                          autoFocus
                                          type="text" 
                                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-nexus-primary focus:ring-2 focus:ring-nexus-primary/20 outline-none transition-all"
                                          placeholder="e.g. Tasks by Status"
                                          value={newReport.title}
                                          onChange={e => setNewReport({...newReport, title: e.target.value})}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                      <textarea 
                                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-nexus-primary focus:ring-2 focus:ring-nexus-primary/20 outline-none transition-all resize-none"
                                          rows={2}
                                          placeholder="Describe this report..."
                                          value={newReport.description}
                                          onChange={e => setNewReport({...newReport, description: e.target.value})}
                                      />
                                  </div>
                              </div>
                          </div>

                          <div className="h-px bg-gray-100"></div>

                          {/* Section: Type */}
                          <div className="space-y-4">
                              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                  <ImageIcon size={14} /> Visualization
                              </h3>
                              <div className="grid grid-cols-2 gap-3">
                                  {[
                                      { id: 'bar', label: 'Bar Chart', icon: BarChart2 },
                                      { id: 'donut', label: 'Donut Chart', icon: PieChart },
                                      { id: 'summary', label: 'Summary Card', icon: Activity },
                                      { id: 'table', label: 'Data Table', icon: TableIcon },
                                  ].map(t => (
                                      <button
                                          key={t.id}
                                          onClick={() => setNewReport({...newReport, type: t.id as any})}
                                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                                              newReport.type === t.id 
                                              ? 'border-nexus-primary bg-nexus-primary/5 text-nexus-primary ring-1 ring-nexus-primary' 
                                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                                          }`}
                                      >
                                          <t.icon size={24} />
                                          <span className="text-xs font-medium">{t.label}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="h-px bg-gray-100"></div>

                          {/* Section: Data Source */}
                          <div className="space-y-4">
                              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                  <Settings size={14} /> Data Configuration
                              </h3>
                              
                              <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                                  <div>
                                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Source Entity</label>
                                      <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                                          <button 
                                              onClick={() => setNewReport({...newReport, entity: 'tasks'})}
                                              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${newReport.entity === 'tasks' ? 'bg-nexus-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                                          >
                                              Tasks
                                          </button>
                                          <button 
                                              onClick={() => setNewReport({...newReport, entity: 'projects'})}
                                              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${newReport.entity === 'projects' ? 'bg-nexus-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                                          >
                                              Projects
                                          </button>
                                      </div>
                                  </div>

                                  {newReport.type !== 'table' && (
                                      <>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Group By</label>
                                                  <select 
                                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary"
                                                      value={newReport.groupBy}
                                                      onChange={e => setNewReport({...newReport, groupBy: e.target.value})}
                                                  >
                                                      {availableFields.filter(f => f.type === 'dropdown' || f.type === 'user' || f.type === 'multiselect').map(f => (
                                                          <option key={f.id} value={f.id}>{f.label}</option>
                                                      ))}
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Metric</label>
                                                  <select 
                                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary"
                                                      value={newReport.metric}
                                                      onChange={e => setNewReport({...newReport, metric: e.target.value as any})}
                                                  >
                                                      <option value="count">Count</option>
                                                      <option value="budget">Budget Sum</option>
                                                      {newReport.entity === 'tasks' && <option value="hours">Est. Hours Sum</option>}
                                                  </select>
                                              </div>
                                          </div>
                                      </>
                                  )}

                                  {newReport.type === 'table' && (
                                      <div>
                                          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Columns</label>
                                          <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg bg-white p-2">
                                              {availableFields.map(f => (
                                                  <label key={f.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm">
                                                      <input 
                                                          type="checkbox" 
                                                          checked={newReport.selectedFields?.includes(f.id)}
                                                          onChange={() => toggleField(f.id)}
                                                          className="rounded text-nexus-primary focus:ring-nexus-primary"
                                                      />
                                                      {f.label}
                                                  </label>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="h-px bg-gray-100"></div>

                          {/* Section: Filters */}
                          <div className="space-y-4 pb-10">
                              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                  <Filter size={14} /> Data Filters
                              </h3>
                              
                              <div className="space-y-2">
                                  {newReport.filters?.map(f => (
                                      <div key={f.id} className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100">
                                          <span className="font-medium">{availableFields.find(af => af.id === f.field)?.label || f.field}</span>
                                          <span className="text-blue-400 text-xs">{f.operator}</span>
                                          <span className="font-bold">{f.value}</span>
                                          <button onClick={() => removeFilter(f.id)} className="ml-auto text-blue-400 hover:text-blue-600"><X size={14}/></button>
                                      </div>
                                  ))}
                              </div>

                              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                                  <div className="flex gap-2">
                                      <select 
                                          className="w-1/3 px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-nexus-primary"
                                          value={tempFilter.field}
                                          onChange={e => setTempFilter({...tempFilter, field: e.target.value})}
                                      >
                                          {availableFields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                      </select>
                                      <select 
                                          className="w-1/4 px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-nexus-primary"
                                          value={tempFilter.operator}
                                          onChange={e => setTempFilter({...tempFilter, operator: e.target.value as any})}
                                      >
                                          <option value="equals">is</option>
                                          <option value="contains">contains</option>
                                          <option value="greater">{'>'}</option>
                                          <option value="less">{'<'}</option>
                                          <option value="isSet">is set</option>
                                          <option value="isNotSet">is empty</option>
                                      </select>
                                      <input 
                                          type="text" 
                                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-nexus-primary"
                                          placeholder="Value..."
                                          value={tempFilter.value}
                                          onChange={e => setTempFilter({...tempFilter, value: e.target.value})}
                                          disabled={tempFilter.operator.startsWith('is')}
                                      />
                                  </div>
                                  <button onClick={addFilter} className="w-full py-2 bg-white border border-gray-200 hover:border-nexus-primary hover:text-nexus-primary rounded-lg text-xs font-medium transition-colors shadow-sm text-gray-600">
                                      + Add Filter
                                  </button>
                              </div>
                          </div>

                      </div>
                  </div>

                  {/* Right: Preview Area */}
                  <div className="flex-1 bg-gray-50/50 p-4 md:p-8 flex flex-col overflow-hidden">
                      <div className="mb-4 flex items-center justify-between">
                          <div>
                              <h3 className="text-xl font-bold text-gray-800">{newReport.title || 'Untitled Report'}</h3>
                              <p className="text-sm text-gray-500">{newReport.description || 'No description provided'}</p>
                          </div>
                          <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Live Preview
                          </div>
                      </div>

                      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col overflow-hidden relative">
                          <div className="absolute top-0 left-0 w-full h-1 bg-nexus-primary/20"></div>
                          {renderWidgetContent(newReport, true)}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // 2. Default Dashboard View (Grid of Widgets)
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4 md:p-8 custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 size={24} className="text-nexus-purple" /> 
              Analytics & Reports
            </h2>
            <p className="text-gray-500 mt-1">Custom insights into your project data.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-nexus-primary text-white rounded-xl shadow-lg shadow-nexus-primary/20 hover:bg-indigo-600 hover:-translate-y-0.5 transition-all font-medium"
          >
            <Plus size={18} /> Create Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
          {reports.map(report => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-[380px] overflow-hidden group">
              <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-white relative z-10">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg truncate pr-4" title={report.title}>{report.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{report.description}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteReport(report.id); }} 
                  className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg z-20"
                  title="Delete Report"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex-1 p-5 overflow-hidden flex flex-col relative bg-gray-50/10">
                 {renderWidgetContent(report)}
                 
                 {/* Hover Overlay for Drilldown hint */}
                 {report.type !== 'summary' && report.type !== 'table' && (
                    <div className="absolute bottom-3 right-3 text-xs text-nexus-primary font-medium bg-nexus-primary/5 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
                        <MousePointerClick size={12} /> Click bars to drill down
                    </div>
                 )}
              </div>
            </div>
          ))}

          {/* Add New Placeholder Card */}
          <button 
            onClick={() => setIsCreating(true)}
            className="border-2 border-dashed border-gray-300 rounded-2xl h-[380px] flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-nexus-primary hover:border-nexus-primary hover:bg-nexus-primary/5 transition-all group"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
              <Plus size={32} />
            </div>
            <span className="font-medium text-lg">Create New Widget</span>
          </button>
        </div>
      </div>
    </div>
  );
};