import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import { loadState, updateProfile, updateCurrentPlan, addHabit, clearState, addMessage } from './services/storageService';
import { AppState, UserProfile, Message } from './types';
import { Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const refreshState = useCallback(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const handleOnboardingComplete = (profileData: Partial<UserProfile>) => {
    if (state) {
        const updatedState = updateProfile({
            ...profileData,
            onboardingCompleted: true
        });
        setState(updatedState);
        setActiveTab('chat'); 
    }
  };

  const handlePlanUpdate = (newPlan: string[]) => {
      if (state) {
          const newState = updateCurrentPlan(newPlan);
          setState(newState);
      }
  };

  const handleAddHabit = (title: string) => {
    if (state) {
      const newState = addHabit(title);
      setState(newState);
    }
  };

  const handleNewMessage = (message: Message) => {
    const newState = addMessage(message);
    setState(newState);
  };

  const handleReset = () => {
    if(window.confirm("Are you sure you want to delete all data and reset?")) {
        clearState();
        window.location.reload();
    }
  }

  if (!state) return <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Loading Coach...</div>;

  if (!state.profile.onboardingCompleted) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className={activeTab === 'dashboard' ? 'block h-full' : 'hidden h-full'}>
          <Dashboard 
            profile={state.profile} 
            currentPlan={state.currentPlan}
            logs={state.logs}
            habits={state.habits}
            onSwitchTab={setActiveTab}
            onUpdateLogs={refreshState}
          />
      </div>
      
      <div className={activeTab === 'chat' ? 'block h-full' : 'hidden h-full'}>
          <Chat 
            messages={state.messages} 
            onNewMessage={handleNewMessage}
            profile={state.profile}
            onUpdatePlan={handlePlanUpdate}
            onAddHabit={handleAddHabit}
          />
      </div>

      <div className={activeTab === 'profile' ? 'block h-full' : 'hidden h-full'}>
        <div className="p-6 space-y-6">
           <h2 className="text-2xl font-black text-white uppercase tracking-tight">Intelligence Profile</h2>
           
           <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-5 shadow-inner">
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Client</span>
                <span className="text-white font-bold">{state.profile.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Coach Unit</span>
                <span className="text-blue-400 font-bold">{state.profile.coachName}</span>
              </div>
              <div className="flex flex-col gap-2 border-b border-slate-800 pb-3">
                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Primary Objective</span>
                <span className="text-slate-200 text-sm font-medium leading-relaxed">{state.profile.goal}</span>
              </div>
              <div className="flex justify-between pt-1">
                 <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Target Weight</span>
                 <span className="text-emerald-400 font-mono font-black">{state.profile.targetWeight || '--'} LBS</span>
              </div>
           </div>

           <div className="pt-8">
             <button 
                onClick={handleReset}
                className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-500 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-red-500/20 text-xs font-black uppercase tracking-widest active:scale-95"
             >
                <Trash2 size={16} /> Wipe All Memory
             </button>
             <p className="text-center text-[10px] text-slate-700 mt-6 font-bold uppercase tracking-[0.2em]">
                Version 2.0.2 • Edge Storage Enabled
             </p>
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;