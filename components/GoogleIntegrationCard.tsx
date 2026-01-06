
import React from 'react';
import { IntegrationConfig } from '../types';
import { Mail, MessageSquare, HardDrive, Activity, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

interface GoogleIntegrationCardProps {
  config: IntegrationConfig;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleFeature: (feature: keyof IntegrationConfig['features']) => void;
}

const FeatureToggle: React.FC<{ label: string, description: string, isEnabled: boolean, onToggle: () => void, isConnected: boolean }> = 
({ label, description, isEnabled, onToggle, isConnected }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <div className={`font-medium ${isConnected ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>{label}</div>
      <div className={`text-xs ${isConnected ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>{description}</div>
    </div>
    <button
      onClick={onToggle}
      disabled={!isConnected}
      className={`w-10 h-6 rounded-full transition-colors relative ${isEnabled && isConnected ? 'bg-nexus-primary' : 'bg-gray-200 dark:bg-gray-600'} disabled:cursor-not-allowed`}
    >
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${isEnabled && isConnected ? 'left-5' : 'left-1'}`}></div>
    </button>
  </div>
);

export const GoogleIntegrationCard: React.FC<GoogleIntegrationCardProps> = ({ config, onConnect, onDisconnect, onToggleFeature }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" alt="Google Logo" className="h-6" />
            Workspace Integration
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Supercharge your workflow with seamless Google connections.</p>
        </div>
        {config.isConnected ? (
          <div className="text-right">
             <div className="flex items-center justify-end gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 size={16} /> Connected
             </div>
             <button onClick={onDisconnect} className="text-xs text-red-500 hover:underline mt-1">Disconnect</button>
          </div>
        ) : (
          <button 
            onClick={onConnect}
            className="flex items-center gap-2 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <LinkIcon size={16} /> Connect Google Account
          </button>
        )}
      </div>
      <div className={`p-6 transition-opacity ${!config.isConnected ? 'opacity-50' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
          <FeatureToggle 
              label="Auto Drive Folders"
              description="Create Drive folders for new projects."
              isEnabled={config.features.autoDriveFolders}
              onToggle={() => onToggleFeature('autoDriveFolders')}
              isConnected={config.isConnected}
          />
          <FeatureToggle 
              label="Google Calendar Sync"
              description="Sync task due dates with Calendar."
              isEnabled={config.features.taskSync}
              onToggle={() => onToggleFeature('taskSync')}
              isConnected={config.isConnected}
          />
          <FeatureToggle 
              label="Smart Alerts in Chat"
              description="Get task updates in Google Chat."
              isEnabled={config.features.smartAlerts}
              onToggle={() => onToggleFeature('smartAlerts')}
              isConnected={config.isConnected}
          />
          <FeatureToggle 
              label="Auto Chat Spaces"
              description="Create a dedicated Space for each new project."
              isEnabled={config.features.autoChatSpace}
              onToggle={() => onToggleFeature('autoChatSpace')}
              isConnected={config.isConnected}
          />
        </div>
      </div>
    </div>
  );
};
