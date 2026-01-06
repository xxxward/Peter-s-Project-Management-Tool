import React, { useState } from 'react';
import { X, Upload, FileText, ArrowRight, Table, CheckCircle, Info } from 'lucide-react';
import { Task, Priority } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tasks: Partial<Task>[]) => void;
}

type Step = 'upload' | 'map' | 'review';
type MappedField = keyof Task | 'ignore';

const TARGET_FIELDS: { id: MappedField; label: string }[] = [
    { id: 'title', label: 'Task Title' },
    { id: 'description', label: 'Description' },
    { id: 'priority', label: 'Priority (Low, Medium, High, Critical)' },
    { id: 'dueDate', label: 'Due Date (YYYY-MM-DD)' },
    { id: 'startDate', label: 'Start Date (YYYY-MM-DD)' },
    { id: 'ignore', label: 'Ignore this column' },
];

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, MappedField>>({});

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setData([]);
    setColumnMap({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const fileHeaders = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const fileData = rows.slice(1).map(row => row.split(',').map(d => d.trim().replace(/"/g, '')));
        
        setHeaders(fileHeaders);
        setData(fileData);

        // Auto-map common headers
        const newMap: Record<string, MappedField> = {};
        fileHeaders.forEach(header => {
            const h = header.toLowerCase();
            if (h.includes('title') || h.includes('name')) newMap[header] = 'title';
            else if (h.includes('desc')) newMap[header] = 'description';
            else if (h.includes('priority')) newMap[header] = 'priority';
            else if (h.includes('due')) newMap[header] = 'dueDate';
            else if (h.includes('start')) newMap[header] = 'startDate';
            else newMap[header] = 'ignore';
        });
        setColumnMap(newMap);
        setStep('map');
    };
    reader.readAsText(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleMapChange = (header: string, field: MappedField) => {
    setColumnMap(prev => ({ ...prev, [header]: field }));
  };

  const handleImport = () => {
    const tasksToImport: Partial<Task>[] = data.map(row => {
        const task: Partial<Task> = {};
        headers.forEach((header, index) => {
            const mappedField = columnMap[header];
            if (mappedField !== 'ignore') {
                let value: any = row[index];
                if (mappedField === 'priority') {
                    const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
                    const foundPriority = priorities.find(p => p.toLowerCase() === value.toLowerCase());
                    value = foundPriority || 'Medium';
                }
                (task as any)[mappedField] = value;
            }
        });
        return task;
    }).filter(t => t.title); // Only import tasks that have a title

    onSubmit(tasksToImport);
    handleClose();
  };

  if (!isOpen) return null;

  const StepIndicator = ({ num, label, active }: { num: number, label: string, active: boolean }) => (
    <div className={`flex items-center gap-2 ${active ? 'text-nexus-primary' : 'text-gray-400'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-nexus-primary text-white' : 'bg-gray-200'}`}>
            {num}
        </div>
        <span className={`font-semibold text-sm ${active ? 'text-gray-800' : ''}`}>{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Upload size={20} className="text-nexus-primary" /> Import Tasks from CSV
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex items-center gap-4 border-b border-gray-100 bg-gray-50/50">
           <StepIndicator num={1} label="Upload File" active={step === 'upload'} />
           <ArrowRight size={16} className={step !== 'upload' ? 'text-nexus-primary' : 'text-gray-300'}/>
           <StepIndicator num={2} label="Map Columns" active={step === 'map'} />
           <ArrowRight size={16} className={step === 'review' ? 'text-nexus-primary' : 'text-gray-300'}/>
           <StepIndicator num={3} label="Review & Import" active={step === 'review'} />
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
            {step === 'upload' && (
                <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="w-full h-80 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-nexus-primary hover:bg-nexus-primary/5 transition-colors">
                        <Upload size={48} className="text-gray-400 mb-4" />
                        <p className="font-bold text-gray-700">Drag & drop your CSV file here</p>
                        <p className="text-sm text-gray-500">or click to browse</p>
                    </label>
                    <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-blue-700">
                        <p className="font-bold flex items-center gap-2"><Info size={16}/> Instructions</p>
                        <p className="mt-2 text-xs">Your CSV file should have a header row. We recommend columns like: <code className="font-mono bg-blue-100 p-1 rounded">title</code>, <code className="font-mono bg-blue-100 p-1 rounded">description</code>, <code className="font-mono bg-blue-100 p-1 rounded">priority</code>, and <code className="font-mono bg-blue-100 p-1 rounded">dueDate</code>.</p>
                    </div>
                </div>
            )}

            {step === 'map' && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-4">Map your CSV columns to task fields</h3>
                    <div className="space-y-3">
                        {headers.map(header => (
                            <div key={header} className="grid grid-cols-2 items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-gray-400" />
                                    <span className="font-medium text-gray-700 truncate">{header}</span>
                                </div>
                                <select 
                                    value={columnMap[header] || 'ignore'}
                                    onChange={(e) => handleMapChange(header, e.target.value as MappedField)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none text-sm"
                                >
                                    {TARGET_FIELDS.map(field => (
                                        <option key={field.id} value={field.id}>{field.label}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {step === 'review' && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-4">Review your data ({data.length} tasks)</h3>
                    <div className="w-full overflow-auto border border-gray-200 rounded-lg max-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    {headers.map(h => {
                                        const mappedTo = columnMap[h];
                                        if (mappedTo === 'ignore') return null;
                                        return <th key={h} className="p-3 font-semibold text-gray-600 capitalize">{mappedTo}</th>
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.slice(0, 10).map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        {headers.map((h, j) => {
                                            const mappedTo = columnMap[h];
                                            if (mappedTo === 'ignore') return null;
                                            return <td key={j} className="p-3 text-gray-700 truncate max-w-xs">{row[j]}</td>
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {data.length > 10 && <p className="text-center text-xs text-gray-400 mt-2">Showing first 10 rows for preview.</p>}
                </div>
            )}
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50/50">
            <button onClick={handleClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm">
                Cancel
            </button>
            <div>
                {step === 'map' && <button onClick={() => setStep('review')} className="px-6 py-2 bg-nexus-primary text-white rounded-lg shadow-md font-medium text-sm">Review Data</button>}
                {step === 'review' && <button onClick={handleImport} className="px-6 py-2 bg-green-600 text-white rounded-lg shadow-md font-medium text-sm flex items-center gap-2"><CheckCircle size={16}/> Import {data.length} Tasks</button>}
            </div>
        </div>
      </div>
    </div>
  );
};
