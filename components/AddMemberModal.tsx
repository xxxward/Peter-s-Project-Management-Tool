
import React, { useState } from 'react';
import { X, User, Mail, Briefcase, Shield } from 'lucide-react';
import { TeamMember, PermissionLevel } from '../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (member: Omit<TeamMember, 'id' | 'initials' | 'color'>) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('Viewer');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      name, 
      email, 
      role,
      permissionLevel
    });
    setName('');
    setEmail('');
    setRole('');
    setPermissionLevel('Viewer');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Add Team Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all"
                placeholder="Jane Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all"
                placeholder="jane@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role / Job Title</label>
            <div className="relative">
              <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all"
                placeholder="Marketing Manager"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permission Level</label>
            <div className="relative">
              <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={permissionLevel}
                onChange={(e) => setPermissionLevel(e.target.value as PermissionLevel)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary outline-none transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="Viewer">Viewer (Read Only)</option>
                <option value="Standard">Standard (Edit Own)</option>
                <option value="Admin">Admin (Full Access)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-nexus-primary hover:bg-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
