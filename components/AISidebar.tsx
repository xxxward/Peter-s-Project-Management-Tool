
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Search, X, Sparkles, Loader2 } from 'lucide-react';
import { Task, ChatMessage } from '../types';
import { chatWithProject, suggestResources } from '../services/geminiService';

interface AISidebarProps {
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
}

export const AISidebar: React.FC<AISidebarProps> = ({ tasks, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hi! I\'m Calyx AI. I can help you manage your project, break down tasks, or find resources. How can I help?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    // Check if it's a search request
    if (query.toLowerCase().startsWith('search') || query.toLowerCase().includes('find resources')) {
       const resources = await suggestResources(query);
       let responseText = "Here are some resources I found:\n";
       if (resources.length > 0) {
         responseText += resources.map(r => `- [${r.title}](${r.uri})`).join('\n');
       } else {
         responseText = "I couldn't find specific resources for that query.";
       }
       setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText }]);
    } else {
       // Standard chat
       const response = await chatWithProject(query, tasks);
       setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response }]);
    }
    
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageText = (text: string) => {
    // Basic link parsing for markdown-style links [Title](URL)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <a 
          key={match.index} 
          href={match[2]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-nexus-primary hover:underline font-medium break-all"
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50">
        <div className="flex items-center gap-2 text-nexus-primary font-bold">
          <Sparkles size={18} />
          <span>Calyx Assistant</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-nexus-primary text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
              }
            `}>
              {renderMessageText(msg.text)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <Loader2 size={16} className="animate-spin text-nexus-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about tasks, or type 'Search...'"
            className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-nexus-primary/20 focus:border-nexus-primary transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-nexus-primary hover:bg-green-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
          Powered by Gemini 2.5 • Can make mistakes
        </div>
      </div>
    </div>
  );
};
