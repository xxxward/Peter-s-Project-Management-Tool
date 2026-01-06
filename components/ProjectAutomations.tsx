
import React, { useState } from 'react';
import { Project, AutomationRule, Task, TeamMember, PropertyDefinition, PropertyType } from '../types';
import { Zap, Plus, Trash2, ArrowRight, Check, Calendar, User, CheckSquare, Type, Hash, ToggleLeft } from 'lucide-react';

interface ProjectAutomationsProps {
  project: Project;
  team: TeamMember[];
  onUpdateProject: (project: Project) => void;
  taskProperties?: PropertyDefinition[];
}

export const ProjectAutomations: React.FC<ProjectAutomationsProps> = ({ project, team, onUpdateProject, taskProperties = [] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    triggerField: 'status',
    triggerValue: 'Done',
    actionField: 'priority',
    actionValue: 'Low',
    active: true
  });

  const automations = project.automations || [];

  // Combine System Fields + Custom Properties for Dropdowns
  const fieldOptions = [
    { id: 'status', name: 'Status', type: 'dropdown', options: ['To Do', 'In Progress', 'Review', 'Done'] },
    { id: 'priority', name: 'Priority', type: 'dropdown', options: ['Low', 'Medium', 'High', 'Critical'] },
    { id: 'assignee', name: 'Assignee', type: 'user' },
    { id: 'startDate', name: 'Start Date', type: 'date' },
    { id: 'dueDate', name: 'Due Date', type: 'date' },
    ...taskProperties
  ];

  // Helper to find field definition
  const getFieldDef = (fieldId: string) => fieldOptions.find(f => f.id === fieldId);

  const getActionLabel = (rule: AutomationRule) => {
      const def = getFieldDef(rule.actionField);
      
      if (rule.actionField === 'assignee') {
          const user = team.find(t => t.id === rule.actionValue);
          return `Assign to ${user ? user.name : 'Unknown'}`;
      }
      if (rule.actionField === 'dueDate' && String(rule.actionValue).startsWith('TODAY+')) {
          return `Set due date to Today + ${String(rule.actionValue).split('+')[1] || 0} days`;
      }
      if (rule.actionField === 'subtasks') {
          return `Add subtask: "${rule.actionValue}"`;
      }
      if (def?.type === 'user') {
          const user = team.find(t => t.id === rule.actionValue);
          return `Set ${def.name} to ${user ? user.name : 'Unknown'}`;
      }
      if (def?.type === 'checkbox') {
          return `Set ${def.name} to ${rule.actionValue ? 'Checked (True)' : 'Unchecked (False)'}`;
      }
      return `Set ${def ? def.name : rule.actionField} to ${rule.actionValue}`;
  };

  const renderValueInput = (fieldId: string, value: any, onChange: (val: any) => void, isAction: boolean) => {
      // Special case for subtasks (only valid as an action)
      if (fieldId === 'subtasks') {
          return (
            <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-lg">
                <CheckSquare size={16} className="text-gray-400"/>
                <input 
                    type="text" 
                    placeholder="Enter subtask title..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
          );
      }

      const def = getFieldDef(fieldId);
      if (!def) return null;

      if (def.type === 'dropdown') {
          return (
            <select 
                className="w-full p-2 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:border-nexus-primary"
                value={value}
                onChange={e => onChange(e.target.value)}
            >
                {def.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          );
      }

      if (def.type === 'user') {
          return (
            <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-lg">
                <User size={16} className="text-gray-400"/>
                <select 
                    className="flex-1 bg-transparent outline-none text-sm"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                >
                    <option value="">Select User...</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>
          );
      }

      if (def.type === 'date') {
          if (isAction) {
              // Action logic for dates often relative (TODAY+X)
              return (
                <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-lg">
                    <Calendar size={16} className="text-gray-400"/>
                    <span className="text-sm text-gray-600">Today +</span>
                    <input 
                        type="number" 
                        min="0"
                        className="w-16 bg-gray-50 border border-gray-200 rounded px-1 text-center outline-none text-sm"
                        value={String(value).replace('TODAY+', '')}
                        onChange={e => onChange(e.target.value)}
                    />
                    <span className="text-sm text-gray-600">days</span>
                </div>
              );
          } else {
              // Trigger logic for dates usually specific (but we allow loose matching for simplicity here)
              return <input type="date" className="w-full p-2 border border-gray-200 rounded-lg" value={value} onChange={e => onChange(e.target.value)} />;
          }
      }

      if (def.type === 'checkbox') {
          // Boolean handling
          return (
            <div className="flex items-center gap-3 bg-white p-2 border border-gray-200 rounded-lg h-[42px]">
                <ToggleLeft size={18} className={value ? 'text-nexus-primary' : 'text-gray-400'}/>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input 
                        type="checkbox" 
                        checked={!!value}
                        onChange={e => onChange(e.target.checked)}
                        className="hidden" // Hiding default, using custom label
                    />
                    <span className={`font-medium ${value ? 'text-nexus-primary' : 'text-gray-500'}`}>
                        {value ? 'True (Checked)' : 'False (Unchecked)'}
                    </span>
                </label>
            </div>
          );
      }

      if (def.type === 'number' || def.type === 'rating' || def.type === 'currency') {
          return (
            <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-lg">
                <Hash size={16} className="text-gray-400"/>
                <input 
                    type="number" 
                    className="flex-1 bg-transparent outline-none text-sm"
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    placeholder="Enter number..."
                />
            </div>
          );
      }

      return (
        <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-lg">
            <Type size={16} className="text-gray-400"/>
            <input 
                type="text" 
                className="flex-1 bg-transparent outline-none text-sm"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
      );
  };

  const handleSaveRule = () => {
    // Basic validation, allow boolean false or 0, so check undefined/null specifically if needed
    if (newRule.triggerValue === undefined || newRule.actionValue === undefined) return;

    let finalActionValue = newRule.actionValue;
    const actionDef = getFieldDef(newRule.actionField!);
    
    // Format relative date correctly if it came from the number input
    if (actionDef?.type === 'date' && !String(newRule.actionValue).startsWith('TODAY+')) {
        finalActionValue = `TODAY+${newRule.actionValue}`;
    }

    const rule: AutomationRule = {
      id: `auto-${Date.now()}`,
      name: `Auto-generated rule`, // Name is rebuilt dynamically anyway
      triggerField: newRule.triggerField!,
      triggerValue: newRule.triggerValue!,
      actionField: newRule.actionField!,
      actionValue: finalActionValue!,
      active: true
    };
    onUpdateProject({ ...project, automations: [...automations, rule] });
    setIsAdding(false);
    
    // Reset
    setNewRule({
        triggerField: 'status',
        triggerValue: 'Done',
        actionField: 'priority',
        actionValue: 'Low',
        active: true
    });
  };

  const deleteRule = (id: string) => {
    onUpdateProject({ ...project, automations: automations.filter(a => a.id !== id) });
  };

  return (
    <div className="h-full bg-gray-50/50 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Zap size={24} className="text-nexus-yellow fill-current" /> 
            Workflow Automations
          </h2>
          <p className="text-gray-500 mt-1">Automate repetitive tasks to keep your project moving.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Card */}
          <div className={`bg-white rounded-xl border-2 ${isAdding ? 'border-nexus-primary shadow-lg' : 'border-dashed border-gray-300'} p-6 transition-all`}>
            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-3 py-8 text-gray-500 hover:text-nexus-primary transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-50">
                  <Plus size={24} />
                </div>
                <span className="font-medium">Create New Automation</span>
              </button>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">New Rule</h3>
                
                <div className="space-y-4">
                  {/* Trigger Section */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">When this happens...</div>
                    <div className="flex gap-2">
                        <div className="w-1/3">
                            <select 
                                className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-sm outline-none focus:border-nexus-primary"
                                value={newRule.triggerField}
                                onChange={e => {
                                    const fieldId = e.target.value;
                                    const def = getFieldDef(fieldId);
                                    let defaultVal: any = '';
                                    // Set smarter defaults based on type
                                    if(def?.options && def.options.length > 0) defaultVal = def.options[0];
                                    else if (def?.type === 'checkbox') defaultVal = true;
                                    else if (def?.type === 'number') defaultVal = 0;
                                    
                                    setNewRule({...newRule, triggerField: fieldId, triggerValue: defaultVal});
                                }}
                            >
                                {fieldOptions.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">is</div>
                        <div className="flex-1">
                            {newRule.triggerField && renderValueInput(
                                newRule.triggerField, 
                                newRule.triggerValue, 
                                (val) => setNewRule({...newRule, triggerValue: val}),
                                false
                            )}
                        </div>
                    </div>
                  </div>

                  <div className="flex justify-center"><ArrowRight size={16} className="text-gray-300 rotate-90" /></div>

                  {/* Action Section */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Do this...</div>
                    <div className="space-y-3">
                        <select 
                            className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-sm outline-none focus:border-nexus-primary"
                            value={newRule.actionField}
                            onChange={e => {
                                const fieldId = e.target.value;
                                const def = getFieldDef(fieldId);
                                let defaultVal: any = '';
                                if(fieldId === 'dueDate') defaultVal = '3';
                                else if(def?.options && def.options.length > 0) defaultVal = def.options[0];
                                else if (def?.type === 'checkbox') defaultVal = true;
                                else if (def?.type === 'number') defaultVal = 0;
                                
                                setNewRule({...newRule, actionField: fieldId, actionValue: defaultVal})
                            }}
                        >
                            <option value="" disabled>Select Action Field...</option>
                            {fieldOptions.map(f => (
                                <option key={f.id} value={f.id}>Set {f.name}</option>
                            ))}
                            <option value="subtasks">Add Subtask</option>
                        </select>

                        {/* Dynamic Input based on Action Field */}
                        {newRule.actionField && renderValueInput(
                            newRule.actionField, 
                            newRule.actionValue, 
                            (val) => setNewRule({...newRule, actionValue: val}),
                            true
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                  <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleSaveRule} className="px-4 py-1.5 text-sm bg-nexus-primary text-white rounded-lg shadow-sm hover:bg-indigo-600 transition-colors font-medium">Save Automation</button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Rules */}
          {automations.map(rule => {
             const triggerDef = getFieldDef(rule.triggerField);
             return (
                <div key={rule.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
                <button 
                    onClick={() => deleteRule(rule.id)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={16} />
                </button>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Zap size={16} />
                        </div>
                        <span className="font-bold text-gray-700 text-sm">Active Rule</span>
                    </div>
                    
                    <div className="text-sm text-gray-600 leading-relaxed">
                        When <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 text-xs uppercase tracking-wide">{triggerDef ? triggerDef.name : rule.triggerField}</span> is <span className="font-bold text-nexus-primary">{String(rule.triggerValue)}</span>...
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <ArrowRight size={16} />
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed font-medium">
                        {getActionLabel(rule)}
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Automatic</span>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check size={12} /> Enabled
                    </div>
                </div>
                </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};
