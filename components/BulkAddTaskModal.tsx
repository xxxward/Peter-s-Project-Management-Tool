import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { Column } from '../types';

interface BulkAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskTitles: string, status: string) => void;
  columns: Column[];
}

export const BulkAddTaskModal: React.FC<BulkAddTaskModalProps> = ({ isOpen, onClose, onSubmit, columns }) => {
  const [taskTitles, setTaskTitles] = useState('');
  const [defaultStatus, setDefaultStatus] = useState(columns[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitles.trim()) return;
    onSubmit(taskTitles, defaultStatus);
    onClose();
  };

  const taskCount = taskTitles.split('\n').filter(line => line.trim() !== '').length;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Layers size={20} className="text-nexus-primary" /> Bulk Add Tasks
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Titles</label>
            <p className="text-xs text-gray-500 mb-2">Paste your tasks below, one per line.</p>
            <textarea
              autoFocus
              value={taskTitles}
              onChange={e => setTaskTitles(e.target.value)}
              rows={10}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all text-sm font-mono"
              placeholder="- Design new homepage mockup&#10;- Develop user authentication&#10;- Write API documentation..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Status</label>
            <select
              value={defaultStatus}
              onChange={e => setDefaultStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none text-sm"
            >
              {columns.map(col => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
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
              disabled={taskCount === 0}
              className="px-6 py-2 bg-nexus-primary text-white rounded-lg shadow-md hover:shadow-lg font-medium text-sm hover:bg-indigo-600 disabled:opacity-50"
            >
              Create {taskCount > 0 ? `${taskCount} ` : ''}Task{taskCount !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
