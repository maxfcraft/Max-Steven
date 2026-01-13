import React from 'react';
import { Dumbbell, MessageSquare, User, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="flex-none p-4 bg-slate-900 border-b border-slate-800 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Dumbbell size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            CustomCoach
          </h1>
        </div>
        <div className="text-xs text-slate-400 font-mono">
           {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-slate-900 border-t border-slate-800 pb-safe">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${
              activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium">Plan</span>
          </button>
          
          <button
            onClick={() => onTabChange('chat')}
            className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${
              activeTab === 'chat' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <MessageSquare size={20} />
            <span className="text-[10px] font-medium">Coach</span>
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${
              activeTab === 'profile' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User size={20} />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;