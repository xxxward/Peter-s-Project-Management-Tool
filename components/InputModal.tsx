
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  placeholder?: string;
  initialValue?: string;
  buttonText?: string;
}

export const InputModal: React.FC<InputModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  placeholder = '', 
  initialValue = '',
  buttonText = 'Create'
}) => {
  const [value, setValue] = useState(initialValue);

  // Reset value when modal opens
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value);
      setValue('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none mb-6 text-sm text-gray-800"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!value.trim()} 
              className="px-6 py-2 bg-nexus-primary text-white rounded-lg hover:bg-indigo-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
