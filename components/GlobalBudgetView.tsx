
import React, { useState } from 'react';
import { Project, BudgetLineItem, PropertyDefinition } from '../types';
import { ArrowLeft, DollarSign, Folder, TrendingUp, TrendingDown, Plus, Trash2, Download } from 'lucide-react';
import { EditableCell } from './EditableCell';

// Helper for CSV Export (Duplicated for component independence, or could be utils)
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

interface GlobalBudgetViewProps {
  projects: Project[];
  budgetLines: BudgetLineItem[];
  customProperties: PropertyDefinition[];
  onNavigateToProject: (projectId: string) => void;
  onUpdateBudgetLine: (line: BudgetLineItem) => void;
  onAddBudgetLine: (line: BudgetLineItem) => void;
  onBack: () => void;
}

export const GlobalBudgetView: React.FC<GlobalBudgetViewProps> = ({ 
  projects, 
  budgetLines, 
  customProperties, 
  onNavigateToProject, 
  onUpdateBudgetLine,
  onAddBudgetLine,
  onBack
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAllocated, setNewItemAllocated] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalAllocated = budgetLines.reduce((acc, b) => acc + b.allocated, 0);
  const totalSpent = budgetLines.reduce((acc, b) => acc + b.actualSpent, 0);
  const unallocated = totalBudget - totalAllocated;

  const updateCustomField = (line: BudgetLineItem, propId: string, value: string) => {
    onUpdateBudgetLine({ ...line, customProperties: { ...line.customProperties, [propId]: value }});
  };

  const handleAddItem = () => {
    if (newItemName && newItemAllocated && selectedProject) {
        onAddBudgetLine({
            id: `bl-g-${Date.now()}`,
            projectId: selectedProject,
            name: newItemName,
            allocated: parseFloat(newItemAllocated) || 0,
            actualSpent: 0
        });
        setNewItemName('');
        setNewItemAllocated('');
    }
  };

  const handleExport = () => {
    const headers = ['Line Item', 'Project', 'Allocated', 'Actual Spent', ...customProperties.map(p => p.name)];
    const rows = budgetLines.map(line => {
        const projectName = projects.find(p => p.id === line.projectId)?.name || 'Unknown Project';
        const customValues = customProperties.map(prop => {
            const val = line.customProperties?.[prop.id];
            return Array.isArray(val) ? val.join('; ') : val;
        });
        
        return [
            line.name,
            projectName,
            line.allocated,
            line.actualSpent,
            ...customValues
        ];
    });
    downloadCSV(`budget_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500">
            <ArrowLeft size={20} />
            </button>
            <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Global Budget Database</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all financial line items across the portfolio.</p>
            </div>
        </div>
        <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm transition-colors text-sm font-medium"
        >
            <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
         <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-2"><DollarSign size={14} /> Total Portfolio Budget</div>
           <div className="text-3xl font-bold text-gray-900 dark:text-white">${totalBudget.toLocaleString()}</div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-2"><TrendingUp size={14} className="text-green-500" /> Total Spent</div>
           <div className="text-3xl font-bold text-green-600 dark:text-green-400">${totalSpent.toLocaleString()}</div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-2"><TrendingDown size={14} className="text-blue-500" /> Total Allocated</div>
           <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">${totalAllocated.toLocaleString()}</div>
         </div>
         <div className={`p-5 rounded-xl border shadow-sm ${unallocated < 0 ? 'bg-red-50 dark:bg-red-900/30 border-red-200' : 'bg-white dark:bg-gray-800 border-gray-200'}`}>
           <div className={`text-sm font-medium mb-1 ${unallocated < 0 ? 'text-red-600' : 'text-gray-500'}`}>Unallocated Funds</div>
           <div className={`text-3xl font-bold ${unallocated < 0 ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>${unallocated.toLocaleString()}</div>
         </div>
      </div>

      {/* Budget Table */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 sticky top-0">
              <tr>
                <th className="px-6 py-3 font-semibold min-w-[200px]">Line Item</th>
                <th className="px-6 py-3 font-semibold min-w-[180px]">Project</th>
                <th className="px-6 py-3 font-semibold text-right min-w-[120px]">Allocated</th>
                <th className="px-6 py-3 font-semibold text-right min-w-[120px]">Actual Spent</th>
                {customProperties.map(prop => (
                  <th key={prop.id} className="px-6 py-3 font-semibold min-w-[150px] whitespace-nowrap text-center">
                    {prop.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {budgetLines.map(line => {
                const project = projects.find(p => p.id === line.projectId);
                return (
                  <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                       <EditableCell 
                         value={line.name}
                         type="text"
                         onChange={(val) => onUpdateBudgetLine({ ...line, name: val })}
                       />
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => onNavigateToProject(line.projectId)} className="flex items-center gap-2 text-nexus-primary hover:underline">
                        <Folder size={14} />
                        {project?.name || 'Unknown Project'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">
                       <EditableCell 
                         value={line.allocated}
                         type="currency"
                         onChange={(val) => onUpdateBudgetLine({ ...line, allocated: parseFloat(val) })}
                         className="text-right"
                       />
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-green-700 dark:text-green-400">
                       <EditableCell 
                         value={line.actualSpent}
                         type="currency"
                         onChange={(val) => onUpdateBudgetLine({ ...line, actualSpent: parseFloat(val) })}
                         className="text-right"
                       />
                    </td>
                    {customProperties.map(prop => (
                      <td key={prop.id} className="px-6 py-4 text-center">
                        <EditableCell 
                          value={line.customProperties?.[prop.id]}
                          type={prop.type}
                          options={prop.options}
                          onChange={(val) => updateCustomField(line, prop.id, val)}
                          className="text-center"
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
              
              {/* Add Row */}
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100">
                  <td className="px-6 py-3">
                      <input 
                          type="text" 
                          placeholder="+ New Item Name"
                          className="w-full bg-transparent outline-none text-gray-700"
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                      />
                  </td>
                  <td className="px-6 py-3">
                      <select 
                          className="w-full bg-transparent outline-none text-gray-700"
                          value={selectedProject}
                          onChange={e => setSelectedProject(e.target.value)}
                      >
                          <option value="">Select Project...</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </td>
                  <td className="px-6 py-3 text-right">
                      <input 
                          type="number" 
                          placeholder="0.00"
                          className="w-full bg-transparent outline-none text-right text-gray-700"
                          value={newItemAllocated}
                          onChange={e => setNewItemAllocated(e.target.value)}
                      />
                  </td>
                  <td className="px-6 py-3 text-right">
                      <button 
                          onClick={handleAddItem}
                          disabled={!newItemName || !newItemAllocated || !selectedProject}
                          className="text-nexus-primary hover:bg-white p-1 rounded disabled:opacity-30"
                      >
                          <Plus size={18} />
                      </button>
                  </td>
                  {customProperties.map(p => <td key={p.id}></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
