
import React from 'react';
import { X, Bell, CheckCircle2, AlertCircle, Info, Clock } from 'lucide-react';
import { Notification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onClear: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, notifications, onClear }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose}></div>
      )}
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Bell size={18} className="text-nexus-primary" /> Activity Feed
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                <Bell size={48} className="mb-4 opacity-20" />
                <p>All caught up!</p>
                <p className="text-xs mt-1">No recent activity.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`p-4 rounded-xl border border-gray-100 shadow-sm relative ${notif.read ? 'bg-white' : 'bg-blue-50/50'}`}>
                  <div className="flex gap-3">
                    <div className={`mt-1 ${
                      notif.type === 'success' ? 'text-green-500' : 
                      notif.type === 'alert' ? 'text-nexus-red' : 
                      'text-nexus-blue'
                    }`}>
                      {notif.type === 'success' ? <CheckCircle2 size={16} /> : notif.type === 'alert' ? <AlertCircle size={16} /> : <Info size={16} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">{notif.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                        <Clock size={10} /> {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <button 
                onClick={onClear}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
