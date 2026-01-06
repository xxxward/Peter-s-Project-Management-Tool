
import React, { useState, useEffect } from 'react';
import { TeamMember, Department, IntegrationConfig } from '../types';
import { Shield, Bell, Edit2, Save, Palette, Moon, Sun, Monitor } from 'lucide-react';
import { GoogleIntegrationCard } from './GoogleIntegrationCard';

interface UserPreferencesProps {
  currentUser: TeamMember;
  departments: Department[];
  integrationConfig: IntegrationConfig;
  onUpdateUser: (updates: Partial<TeamMember>) => void;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onToggleIntegrationFeature: (feature: keyof IntegrationConfig['features']) => void;
  theme: 'light' | 'dark'; 
  onUpdateTheme: (theme: 'light' | 'dark') => void;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({ 
  currentUser, 
  departments, 
  integrationConfig,
  onUpdateUser,
  onConnectGoogle,
  onDisconnectGoogle,
  onToggleIntegrationFeature,
  theme,
  onUpdateTheme
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [role, setRole] = useState(currentUser.role);
  
  // Custom Color State
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#475569');

  // Load current CSS vars on mount
  useEffect(() => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);
      setPrimaryColor(computed.getPropertyValue('--primary').trim());
      setSecondaryColor(computed.getPropertyValue('--secondary').trim());
  }, []);

  const handleSave = () => {
    onUpdateUser({ name, email, role });
    setIsEditing(false);
  };

  const updateColor = (variable: string, value: string) => {
      document.documentElement.style.setProperty(variable, value);
      if(variable === '--primary') setPrimaryColor(value);
      if(variable === '--secondary') setSecondaryColor(value);
  };

  const toggleTheme = (mode: 'light' | 'dark') => {
      onUpdateTheme(mode);
      if (mode === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  return (
    <div className="h-full overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-2xl font-bold text-main">Settings & Preferences</h1>
          <p className="text-muted">Manage your profile, integrations, and workspace appearance.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary to-secondary relative">
             <div className="absolute -bottom-10 left-8">
               <div className={`w-24 h-24 rounded-full border-4 border-surface flex items-center justify-center text-white text-3xl font-bold`} style={{ backgroundColor: currentUser.color }}>
                 {currentUser.initials}
               </div>
             </div>
          </div>
          <div className="pt-12 pb-8 px-8 flex justify-between items-start">
             <div>
               <h2 className="text-xl font-bold text-main">{name}</h2>
               <div className="text-muted text-sm flex items-center gap-2 mt-1">
                 <span>{role}</span>
                 <span>•</span>
                 <span>{departments.find(d => d.id === currentUser.departmentId)?.name || 'Unassigned'}</span>
               </div>
               <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                 <Shield size={12} /> {currentUser.permissionLevel} Access
               </div>
             </div>
             
             {!isEditing ? (
               <button 
                 onClick={() => setIsEditing(true)}
                 className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-highlight text-sm font-medium text-main transition-colors"
               >
                 <Edit2 size={16} /> Edit Profile
               </button>
             ) : (
               <button 
                 onClick={handleSave}
                 className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-fg rounded-lg hover:opacity-90 text-sm font-medium shadow-sm transition-colors"
               >
                 <Save size={16} /> Save Changes
               </button>
             )}
          </div>

          {isEditing && (
            <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
               <div>
                 <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
                 <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-border bg-input text-main rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-muted mb-1">Email</label>
                 <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-border bg-input text-main rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-muted mb-1">Job Title</label>
                 <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border border-border bg-input text-main rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
               </div>
            </div>
          )}
        </div>

        <GoogleIntegrationCard
           config={integrationConfig}
           onConnect={onConnectGoogle}
           onDisconnect={onDisconnectGoogle}
           onToggleFeature={onToggleIntegrationFeature} 
        />

        {/* Theme & Appearance */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-bold text-main mb-6 flex items-center gap-2">
                <Palette size={18} className="text-primary" /> Workspace Appearance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="text-sm font-semibold text-muted mb-3 block">Color Mode</label>
                    <div className="flex bg-surface-highlight p-1 rounded-lg border border-border">
                        <button 
                            onClick={() => toggleTheme('light')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-main'}`}
                        >
                            <Sun size={16} /> Light
                        </button>
                        <button 
                            onClick={() => toggleTheme('dark')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-main'}`}
                        >
                            <Moon size={16} /> Dark
                        </button>
                    </div>
                    <p className="text-xs text-muted mt-2">Switch between the standard high-contrast Light mode and the eye-strain reducing Dark mode.</p>
                </div>

                <div>
                    <label className="text-sm font-semibold text-muted mb-3 block">Brand Colors</label>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-main">Primary Color</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted">{primaryColor}</span>
                                <input 
                                    type="color" 
                                    value={primaryColor} 
                                    onChange={(e) => updateColor('--primary', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-main">Secondary Color</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted">{secondaryColor}</span>
                                <input 
                                    type="color" 
                                    value={secondaryColor} 
                                    onChange={(e) => updateColor('--secondary', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
