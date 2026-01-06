import React, { useState, useRef, useEffect } from 'react';
import { PropertyType } from '../types';
import { Check, Star, ExternalLink, Mail, Link as LinkIcon, Plus, X } from 'lucide-react';

interface EditableCellProps {
  value: any; // Relaxed type to support array/boolean
  type: PropertyType;
  options?: string[];
  onChange: (val: any) => void;
  className?: string;
  placeholder?: string;
}

export const EditableCell: React.FC<EditableCellProps> = ({ 
  value, 
  type, 
  options, 
  onChange, 
  className,
  placeholder = 'Empty'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (type === 'dropdown' || type === 'user') {
        selectRef.current?.focus();
      } else if (type !== 'multiselect' && type !== 'rating' && type !== 'checkbox') {
        inputRef.current?.focus();
      }
    }
  }, [isEditing, type]);

  // Click outside handler for complex types
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  const handleBlur = (e?: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    // If focus is moving to an element that should not trigger a save (like a delete button),
    // just exit edit mode without saving and revert the local state.
    if (e?.relatedTarget && (e.relatedTarget as HTMLElement).closest('[data-no-save-on-blur]')) {
        setIsEditing(false);
        setLocalValue(value); // Revert any unsaved changes
        return;
    }

    // Only auto-close for simple inputs, complex popovers handle their own state
    if (type !== 'multiselect' && type !== 'rating') {
        setIsEditing(false);
        if (localValue !== value) {
            onChange(localValue);
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (inputRef.current) inputRef.current.blur();
      if (selectRef.current) selectRef.current.blur();
    }
  };

  const handleCheckboxChange = () => {
      const newValue = !localValue;
      setLocalValue(newValue);
      onChange(newValue);
  };

  const handleRatingChange = (rating: number) => {
      setLocalValue(rating);
      onChange(rating);
      setIsEditing(false);
  };

  const handleMultiSelectToggle = (option: string) => {
      const currentArr = Array.isArray(localValue) ? localValue : [];
      let newArr;
      if (currentArr.includes(option)) {
          newArr = currentArr.filter((item: string) => item !== option);
      } else {
          newArr = [...currentArr, option];
      }
      setLocalValue(newArr);
      onChange(newArr);
  };

  // --- RENDERERS ---

  if (type === 'checkbox') {
      return (
          <div className={`flex items-center justify-center h-full ${className}`}>
              <button 
                onClick={handleCheckboxChange}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${localValue ? 'bg-nexus-primary border-nexus-primary text-white' : 'bg-white border-gray-300 hover:border-nexus-primary'}`}
              >
                  {localValue && <Check size={14} />}
              </button>
          </div>
      );
  }

  if (type === 'rating') {
      const rating = Number(localValue) || 0;
      return (
          <div className={`flex items-center h-full ${className}`} onMouseLeave={() => isEditing && setIsEditing(false)}>
              <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className={`${star <= rating ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'} transition-colors`}
                      >
                          <Star size={16} fill={star <= rating ? "currentColor" : "none"} />
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  // --- EDIT MODES ---

  if (isEditing) {
    if ((type === 'dropdown' || type === 'user') && options) {
      return (
        <select
          ref={selectRef}
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className={`w-full bg-white border border-nexus-primary rounded px-2 py-1 outline-none text-sm shadow-sm ${className}`}
        >
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (type === 'multiselect' && options) {
        const selected = Array.isArray(localValue) ? localValue : [];
        return (
            <div ref={wrapperRef} className="relative w-full">
                <div className="absolute top-0 left-0 min-w-[200px] z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase">Select Options</div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {options.map(opt => (
                            <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm text-gray-700">
                                <input 
                                    type="checkbox" 
                                    checked={selected.includes(opt)}
                                    onChange={() => handleMultiSelectToggle(opt)}
                                    className="rounded text-nexus-primary focus:ring-nexus-primary"
                                />
                                {opt}
                            </label>
                        ))}
                        {options.length === 0 && <div className="text-gray-400 text-xs px-2">No options defined</div>}
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-100 text-right">
                        <button onClick={() => setIsEditing(false)} className="text-xs text-nexus-primary font-medium hover:underline">Done</button>
                    </div>
                </div>
                {/* Placeholder to keep layout size */}
                <div className="opacity-0 px-2 py-1">{selected.join(', ') || 'Select...'}</div>
            </div>
        )
    }

    return (
      <input
        ref={inputRef}
        type={type === 'date' ? 'date' : type === 'number' || type === 'currency' ? 'number' : 'text'}
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
        className={`w-full bg-white border border-nexus-primary rounded px-2 py-1 outline-none text-sm shadow-sm ${className}`}
      />
    );
  }

  // --- DISPLAY MODES ---

  if (type === 'multiselect') {
      const selected = Array.isArray(localValue) ? localValue : [];
      return (
        <div 
            onClick={() => setIsEditing(true)}
            className={`w-full h-full min-h-[1.5rem] flex flex-wrap gap-1 items-center -ml-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all ${className}`}
        >
            {selected.length > 0 ? (
                selected.map((item: string) => (
                    <span key={item} className="inline-flex px-1.5 py-0.5 rounded-md bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20 text-[10px] font-medium leading-none">
                        {item}
                    </span>
                ))
            ) : (
                <span className="text-gray-400 italic text-xs">{placeholder}</span>
            )}
        </div>
      );
  }

  if (type === 'url') {
      return (
        <div className={`group flex items-center justify-between w-full gap-2 ${className}`}>
            <a 
                href={localValue} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`truncate hover:underline text-blue-600 ${!localValue ? 'text-gray-400 italic pointer-events-none no-underline' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {localValue || placeholder}
            </a>
            <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity p-1">
                <Plus size={12} />
            </button>
        </div>
      );
  }

  let displayValue = localValue;
  if (type === 'currency' && localValue) {
    displayValue = `$${Number(localValue).toLocaleString()}`;
  }
  
  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={`w-full h-full min-h-[1.5rem] flex items-center px-2 py-1 -ml-2 rounded cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all truncate ${!localValue ? 'text-gray-400 italic' : ''} ${className}`}
    >
      {displayValue || placeholder}
    </div>
  );
};
