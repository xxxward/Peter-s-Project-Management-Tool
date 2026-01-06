
import React from 'react';
import { X, Link as LinkIcon, Sparkles } from 'lucide-react';

interface FeatureSpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 relative transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-google-blue/10 flex items-center justify-center mb-4 border-4 border-white shadow-lg">
            <Sparkles size={32} className="text-google-blue" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Unlock a Smarter Workflow</h2>
          <p className="text-gray-500 mt-2 mb-6">
            Connect your Google Account to automatically create Drive folders, sync with your Calendar, and get smart alerts in Google Chat.
          </p>
          <button 
            onClick={onConnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-google-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            <LinkIcon size={18} /> Connect Google Account
          </button>
          <button onClick={onClose} className="text-sm text-gray-400 hover:underline mt-4">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
