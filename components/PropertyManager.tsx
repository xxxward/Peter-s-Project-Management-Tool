// ... imports ...
import React, { useState, useEffect } from 'react';
import { PropertyDefinition, PropertyType, OrganizationSettings, SmartKeyRule, Priority } from '../types';
import { Plus, Trash2, Settings, Type, List, Calendar, DollarSign, User, Edit2, RotateCw, X, Building, Check, Globe, Link as LinkIcon, Star, CheckSquare, Hash, ChevronLeft, ChevronRight, Search, Mail, Command, ArrowRight, Briefcase, ImageIcon } from 'lucide-react';

interface PropertyManagerProps {
  orgSettings: OrganizationSettings;
  onUpdateOrgSettings: (settings: OrganizationSettings) => void;
  definitions: {
    users: PropertyDefinition[];
    tasks: PropertyDefinition[];
    projects: PropertyDefinition[];
    budgetItems: PropertyDefinition[];
  };
  onAddProperty: (context: 'users' | 'tasks' | 'projects' | 'budgetItems', property: PropertyDefinition) => void;
  onUpdateProperty: (context: 'users' | 'tasks' | 'projects' | 'budgetItems', property: PropertyDefinition) => void;
  onDeleteProperty: (context: 'users' | 'tasks' | 'projects' | 'budgetItems', id: string) => void;
  onLoadPresets: () => void;
}

export const PropertyManager: React.FC<PropertyManagerProps> = ({ 
  orgSettings,
  onUpdateOrgSettings,
  definitions, 
  onAddProperty, 
  onUpdateProperty, 
  onDeleteProperty, 
  onLoadPresets 
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'tasks' | 'projects' | 'budgetItems'>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<PropertyType>('text');
  
  // Organization Settings Form State
  const [orgForm, setOrgForm] = useState<OrganizationSettings>(orgSettings);
  
  // Dynamic Options State
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 7;

  // Smart Key Creation State
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<SmartKeyRule>>({ key: '1', actionField: 'dueDate', actionValue: 1 });


  // Safe access
  const currentDefinitions = activeTab !== 'general' ? definitions[activeTab] : [];
  
  // Filter & Pagination Logic
  const filteredDefinitions = currentDefinitions.filter(def => 
    def.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    def.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.max(1, Math.ceil(filteredDefinitions.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setIsAdding(false);
  }, [activeTab]);
  
  useEffect(() => {
    setOrgForm(orgSettings);
  }, [orgSettings]);

  // Auto-correct pagination if we delete the last item on a page
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startEdit = (def: PropertyDefinition) => {
    setEditingId(def.id);
    setFormName(def.name);
    setFormType(def.type);
    setCurrentOptions(def.options || []);
    setIsAdding(true);
  };

  const startAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormType('text');
    setCurrentOptions([]);
    setNewOptionInput('');
    setIsAdding(true);
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOptionInput.trim()) {
      if (!currentOptions.includes(newOptionInput.trim())) {
        setCurrentOptions([...currentOptions, newOptionInput.trim()]);
      }
      setNewOptionInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setCurrentOptions(currentOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProp: PropertyDefinition = {
      id: editingId || `prop_${Date.now()}`,
      name: formName,
      type: formType,
      options: (formType === 'dropdown' || formType === 'multiselect') ? currentOptions : undefined,
      isSystem: false
    };

    if (activeTab !== 'general') {
      if (editingId) {
        onUpdateProperty(activeTab, newProp);
      } else {
        onAddProperty(activeTab, newProp);
      }
    }
    setIsAdding(false);
  };

  const handleOrgSave = () => {
    onUpdateOrgSettings(orgForm);
  };

  const handleDelete = (id: string) => {
      if (activeTab !== 'general') {
          onDeleteProperty(activeTab, id);
      }
  };

  const handleWorkingDayToggle = (dayIndex: number) => {
    const currentDays = orgForm.workingDays || [];
    const newDays = currentDays.includes(dayIndex)
        ? currentDays.filter(d => d !== dayIndex)
        : [...currentDays, dayIndex].sort();
    setOrgForm({ ...orgForm, workingDays: newDays });
  };

    const handleAddRule = () => {
    const ruleToAdd: SmartKeyRule = {
      id: `sk-${Date.now()}`,
      key: newRule.key!,
      actionField: newRule.actionField!,
      actionValue: newRule.actionValue!,
    };
    
    const updatedRules = [...(orgSettings.smartKeys?.rules || []), ruleToAdd];
    onUpdateOrgSettings({ ...orgSettings, smartKeys: { ...orgSettings.smartKeys, rules: updatedRules, enabled: orgSettings.smartKeys?.enabled || true } });
    setIsAddingRule(false);
    setNewRule({ key: '1', actionField: 'dueDate', actionValue: 1 });
  };
  
  const handleDeleteRule = (id: string) => {
    const updatedRules = orgSettings.smartKeys?.rules.filter(r => r.id !== id) || [];
    onUpdateOrgSettings({ ...orgSettings, smartKeys: { ...orgSettings.smartKeys, rules: updatedRules, enabled: orgSettings.smartKeys?.enabled || false } });
  };


  const propertyTypes: { type: PropertyType; label: string; icon: any; desc: string }[] = [
    { type: 'text', label: 'Text', icon: Type, desc: 'Short text input' },
    { type: 'number', label: 'Number', icon: Hash, desc: 'Numeric value' },
    { type: 'dropdown', label: 'Dropdown', icon: List, desc: 'Single selection' },
    { type: 'multiselect', label: 'Multi-Select', icon: CheckSquare, desc: 'Multiple tags' },
    { type: 'date', label: 'Date', icon: Calendar, desc: 'Date picker' },
    { type: 'user', label: 'Person', icon: User, desc: 'Team member' },
    { type: 'checkbox', label: 'Checkbox', icon: Check, desc: 'True/False toggle' },
    { type: 'rating', label: 'Rating', icon: Star, desc: '1-5 Star scale' },
    { type: 'currency', label: 'Currency', icon: DollarSign, desc: 'Monetary value' },
    { type: 'url', label: 'Link', icon: LinkIcon, desc: 'Website URL' },
    { type: 'email', label: 'Email', icon: Mail, desc: 'Email address' },
  ];

  const getIcon = (type: PropertyType) => {
    const found = propertyTypes.find(p => p.type === type);
    const Icon = found ? found.icon : Type;
    return <Icon size={16} />;
  };

  const paginatedDefinitions = filteredDefinitions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const availableKeys = ['1','2','3','4','5','6','7','8','9'].filter(k => !(orgSettings.smartKeys?.rules || []).some(r => r.key === k));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full max-w-6xl mx-auto m-6 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white border border-gray-200 rounded-lg text-nexus-primary shadow-sm">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">System Configuration</h2>
            <p className="text-xs text-gray-500">Manage data models and global settings.</p>
          </div>
        </div>
        <button 
          onClick={onLoadPresets}
          className="flex items-center gap-2 text-gray-500 hover:text-nexus-primary hover:bg-white px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200 transition-all text-xs font-medium"
        >
          <RotateCw size={14} />
          Reset Defaults
        </button>
      </div>

      <div className="flex border-b border-gray-200 bg-white px-2 flex-shrink-0">
        <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'general' 
                ? 'border-nexus-primary text-nexus-primary' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
            General
        </button>
        {(['users', 'tasks', 'projects', 'budgetItems'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'border-nexus-primary text-nexus-primary' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab === 'budgetItems' ? 'Budget' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        
        {activeTab === 'general' ? (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Building size={18} className="text-nexus-primary" /> Organization Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Organization Name</label>
                            <input 
                                type="text" 
                                value={orgForm.name} 
                                onChange={(e) => setOrgForm({...orgForm, name: e.target.value})} 
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Primary Domain</label>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                    type="text" 
                                    value={orgForm.domain} 
                                    onChange={(e) => setOrgForm({...orgForm, domain: e.target.value})} 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Logo URL</label>
                            <div className="relative">
                                <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                    type="url" 
                                    value={orgForm.logoUrl || ''} 
                                    onChange={(e) => setOrgForm({...orgForm, logoUrl: e.target.value})} 
                                    placeholder="https://..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Support Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                    type="email" 
                                    value={orgForm.supportEmail || ''} 
                                    onChange={(e) => setOrgForm({...orgForm, supportEmail: e.target.value})} 
                                    placeholder="support@..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                 <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Briefcase size={18} className="text-nexus-primary" /> Workspace Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fiscal Year Start</label>
                             <select value={orgForm.fiscalYearStart} onChange={(e) => setOrgForm({...orgForm, fiscalYearStart: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all text-sm bg-white">
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Currency</label>
                             <select value={orgForm.currency} onChange={(e) => setOrgForm({...orgForm, currency: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all text-sm bg-white">
                                {['USD', 'EUR', 'GBP', 'JPY', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Working Days</label>
                             <div className="flex justify-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                                    const isWorking = (orgForm.workingDays || []).includes(index);
                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleWorkingDayToggle(index)}
                                            className={`flex-1 h-10 flex items-center justify-center rounded-md font-bold text-sm transition-colors ${
                                                isWorking ? 'bg-nexus-primary text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-200'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Command size={18} className="text-nexus-primary" /> Smart Keys
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="smart-key-toggle" className="font-medium text-gray-800 cursor-pointer">Enable Smart Key Shortcuts</label>
                            <p className="text-xs text-gray-500 max-w-sm mt-1">
                                Use keyboard shortcuts like <kbd className="px-1.5 py-0.5 border bg-gray-100 rounded text-xs font-sans">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 border bg-gray-100 rounded text-xs font-sans">Number</kbd> to quickly set task properties on creation.
                            </p>
                        </div>
                        <button
                            id="smart-key-toggle"
                            onClick={() => onUpdateOrgSettings({ ...orgSettings, smartKeys: { rules: orgSettings.smartKeys?.rules || [], enabled: !orgSettings.smartKeys?.enabled } })}
                            className={`w-10 h-6 rounded-full transition-colors relative ${orgSettings.smartKeys?.enabled ? 'bg-nexus-primary' : 'bg-gray-200'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${orgSettings.smartKeys?.enabled ? 'left-5' : 'left-1'}`}></div>
                        </button>
                    </div>
                    <div className={`mt-6 pt-6 border-t border-gray-100 space-y-3 transition-opacity ${orgSettings.smartKeys?.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        {(orgSettings.smartKeys?.rules || []).map(rule => (
                            <div key={rule.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <kbd className="px-2 py-1 border bg-white rounded text-sm font-sans font-semibold text-gray-700">Ctrl</kbd>
                                    <span>+</span>
                                    <kbd className="w-8 h-8 flex items-center justify-center border bg-white rounded text-sm font-sans font-semibold text-gray-700">{rule.key}</kbd>
                                    <ArrowRight size={16} className="text-gray-400"/>
                                    <div className="text-sm">
                                        Set <span className="font-semibold text-gray-800 capitalize">{rule.actionField.replace('Date', ' Date')}</span> to <span className="font-semibold text-nexus-primary">
                                            {rule.actionField === 'dueDate' ? `${rule.actionValue} day(s) from now` : String(rule.actionValue)}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}

                        {isAddingRule ? (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3 animate-in fade-in duration-200">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Key</label>
                                        <select 
                                            value={newRule.key} 
                                            onChange={e => setNewRule({...newRule, key: e.target.value})}
                                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            {availableKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-500">Action</label>
                                         <select 
                                            value={newRule.actionField} 
                                            onChange={e => setNewRule({...newRule, actionField: e.target.value as any, actionValue: e.target.value === 'dueDate' ? 1 : 'Medium'})}
                                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="dueDate">Set Due Date</option>
                                            <option value="priority">Set Priority</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500">Value</label>
                                    {newRule.actionField === 'dueDate' && (
                                        <div className="flex items-center gap-2 mt-1">
                                             <input type="number" value={newRule.actionValue} onChange={e => setNewRule({...newRule, actionValue: parseInt(e.target.value) || 1})} className="w-20 p-2 border border-gray-300 rounded-md text-sm text-center"/>
                                             <span className="text-sm text-gray-600">day(s) from now</span>
                                        </div>
                                    )}
                                    {newRule.actionField === 'priority' && (
                                        <select value={newRule.actionValue} onChange={e => setNewRule({...newRule, actionValue: e.target.value})} className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm">
                                            {(['Low', 'Medium', 'High', 'Critical'] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t border-blue-100 mt-2">
                                    <button onClick={() => setIsAddingRule(false)} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md">Cancel</button>
                                    <button onClick={handleAddRule} className="px-3 py-1 text-xs font-medium bg-nexus-primary text-white rounded-md">Add</button>
                                </div>
                            </div>
                        ) : (
                             <button 
                                onClick={() => setIsAddingRule(true)}
                                disabled={availableKeys.length === 0}
                                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm font-semibold text-gray-500 hover:border-nexus-primary hover:text-nexus-primary hover:bg-nexus-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {availableKeys.length > 0 ? '+ Add New Rule' : 'All Number Keys Used'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button 
                        onClick={handleOrgSave}
                        className="px-6 py-2 bg-nexus-primary text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm font-medium flex items-center gap-2 text-sm"
                    >
                        <Check size={16} /> Save All Settings
                    </button>
                </div>
            </div>
        ) : (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
            {!isAdding ? (
                <>
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <div className="relative w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search properties..." 
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-nexus-primary transition-all"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <button 
                            onClick={startAdd} 
                            className="flex items-center gap-2 bg-nexus-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors shadow-sm text-sm font-medium"
                        >
                            <Plus size={16} /> Add Property
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                        <div className="overflow-y-auto flex-1">
                            {paginatedDefinitions.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                                    <p className="text-sm">No properties found.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {paginatedDefinitions.map(def => (
                                        <div key={def.id} className="flex items-center p-4 hover:bg-gray-50 transition-colors group">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 ${def.isSystem ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                                                {getIcon(def.type)}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 mr-4">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-semibold text-gray-900 truncate">{def.name}</h4>
                                                    {def.isSystem && <span className="text-[10px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 uppercase font-bold tracking-wider">System</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">{def.type}</div>
                                            </div>

                                            <div className="hidden sm:block flex-[2] text-xs text-gray-500 truncate mr-6 text-right">
                                                {def.options ? (
                                                    <div className="flex justify-end gap-1 flex-wrap">
                                                        {def.options.slice(0, 3).map((opt, i) => (
                                                            <span key={i} className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">{opt}</span>
                                                        ))}
                                                        {def.options.length > 3 && <span className="text-gray-400 px-1">+{def.options.length - 3}</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 italic">--</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!def.isSystem ? (
                                                    <>
                                                        <button 
                                                            type="button"
                                                            onClick={() => startEdit(def)} 
                                                            className="p-1.5 text-gray-400 hover:text-nexus-primary hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16}/>
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(def.id); }} 
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="w-16"></div> 
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="border-t border-gray-100 p-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                                <span>Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredDefinitions.length)} of {filteredDefinitions.length}</span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="font-medium text-gray-700">Page {currentPage}</span>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                        <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Edit Property' : `Create New Property`}</h3>
                        <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Property Name</label>
                                        <input 
                                            autoFocus 
                                            required 
                                            type="text" 
                                            value={formName} 
                                            onChange={e => setFormName(e.target.value)} 
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all text-base" 
                                            placeholder="e.g. Impact Score"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Data Type</label>
                                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {propertyTypes.map((t) => {
                                                const Icon = t.icon;
                                                return (
                                                    <label 
                                                        key={t.type} 
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                            formType === t.type 
                                                            ? 'border-nexus-primary bg-nexus-primary/5 ring-1 ring-nexus-primary' 
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <input 
                                                            type="radio" 
                                                            name="type" 
                                                            value={t.type} 
                                                            checked={formType === t.type} 
                                                            onChange={() => setFormType(t.type)} 
                                                            className="hidden" 
                                                        />
                                                        <div className={`p-2 rounded-md ${formType === t.type ? 'bg-nexus-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                            <Icon size={18} />
                                                        </div>
                                                        <div>
                                                            <div className={`text-sm font-semibold ${formType === t.type ? 'text-nexus-primary' : 'text-gray-700'}`}>{t.label}</div>
                                                            <div className="text-[10px] text-gray-400">{t.desc}</div>
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Configuration</h4>
                                    
                                    {(formType === 'dropdown' || formType === 'multiselect') ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-2">Options List</label>
                                                <div className="flex gap-2 mb-3">
                                                    <input 
                                                        type="text" 
                                                        value={newOptionInput} 
                                                        onChange={e => setNewOptionInput(e.target.value)} 
                                                        placeholder="Type option name and press Enter" 
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-nexus-primary outline-none text-sm" 
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(e); } }} 
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={handleAddOption} 
                                                        disabled={!newOptionInput.trim()} 
                                                        className="flex items-center gap-1 px-4 py-2 bg-nexus-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-600 transition-colors shadow-sm"
                                                    >
                                                        <Plus size={16} /> Add Option
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                    {currentOptions.length === 0 && (
                                                        <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                                                            No options added yet.
                                                        </div>
                                                    )}
                                                    {currentOptions.map((opt, idx) => (
                                                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-md border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-1">
                                                            <span className="text-sm font-medium text-gray-700 pl-2">{opt}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleRemoveOption(idx)} 
                                                                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                                            <Settings size={32} className="mb-2 opacity-20" />
                                            <p className="text-sm">No extra configuration needed for <span className="font-semibold text-gray-600">{propertyTypes.find(t => t.type === formType)?.label}</span>.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                            <button type="submit" className="px-6 py-2.5 bg-nexus-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-600 shadow-md transition-colors flex items-center gap-2">
                                <Check size={18} /> {editingId ? 'Update Field' : 'Create Field'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            </div>
        )}
      </div>
    </div>
  );
};
