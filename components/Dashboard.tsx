import React, { useState, useMemo } from 'react';
import { UserProfile, DailyLog, Habit } from '../types';
import { CheckCircle, Circle, MessageSquare, Activity, Flame, Trash2, Sparkles, X, Loader2, Lock, Trophy, Target, ArrowRight } from 'lucide-react';
import { toggleTaskCompletion, toggleHabitCheckIn, deleteHabit } from '../services/storageService';
import { generateMotivation } from '../services/geminiService';

interface DashboardProps {
  profile: UserProfile;
  currentPlan: string[];
  logs: DailyLog[];
  habits: Habit[];
  onSwitchTab: (tab: string) => void;
  onUpdateLogs: () => void; 
}

const Dashboard: React.FC<DashboardProps> = ({ profile, currentPlan, logs, habits, onSwitchTab, onUpdateLogs }) => {
  const [motivationText, setMotivationText] = useState<string | null>(null);
  const [isMotivating, setIsMotivating] = useState(false);
  
  const today = new Date().toLocaleDateString();
  const todaysLog = logs.find(l => l.date === today);
  const completedTasks = todaysLog ? todaysLog.completedTasks : [];

  // --- STAT CALCULATIONS ---
  const totalCheckIns = useMemo(() => {
    return logs.reduce((acc, log) => acc + (log.completedTasks?.length || 0), 0);
  }, [logs]);

  const appStreak = useMemo(() => {
    if (logs.length === 0) return 0;
    const sortedDates = logs
        .map(l => new Date(l.date).setHours(0,0,0,0))
        .sort((a, b) => b - a);
    
    const uniqueDates = Array.from(new Set(sortedDates));
    const todayTime = new Date().setHours(0,0,0,0);
    const yesterdayTime = new Date(todayTime);
    yesterdayTime.setDate(yesterdayTime.getDate() - 1);

    if (!uniqueDates.includes(todayTime) && !uniqueDates.includes(yesterdayTime.getTime())) return 0;

    let streak = 0;
    let checkTime = uniqueDates.includes(todayTime) ? todayTime : yesterdayTime.getTime();

    for (const date of uniqueDates) {
        if (date === checkTime) {
            streak++;
            const d = new Date(checkTime);
            d.setDate(d.getDate() - 1);
            checkTime = d.getTime();
        } else {
            break;
        }
    }
    return streak;
  }, [logs]);

  const lastWeightUpdate = useMemo(() => {
    if (!profile.weightHistory || profile.weightHistory.length === 0) return "Never";
    const last = profile.weightHistory[profile.weightHistory.length - 1];
    return new Date(last.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [profile.weightHistory]);

  const weightDiff = useMemo(() => {
    if (!profile.currentWeight || !profile.targetWeight) return null;
    const diff = Math.abs(profile.targetWeight - profile.currentWeight);
    return `${diff} lbs difference. Keep pushing!`;
  }, [profile.currentWeight, profile.targetWeight]);

  const handleToggleTask = (task: string) => {
    const isCompleted = completedTasks.includes(task);
    toggleTaskCompletion(task, !isCompleted);
    onUpdateLogs();
  };

  const handleToggleHabit = (id: string) => {
    toggleHabitCheckIn(id);
    onUpdateLogs();
  }

  const handleDeleteHabit = (id: string, title: string) => {
    if(confirm(`Stop tracking "${title}"?`)) {
        deleteHabit(id);
        onUpdateLogs();
    }
  }

  const handleMotivateMe = async () => {
    setIsMotivating(true);
    try {
        const text = await generateMotivation(profile, currentPlan);
        setMotivationText(text);
    } catch (e) {
        setMotivationText("The only bad workout is the one that didn't happen. Let's go!");
    } finally {
        setIsMotivating(false);
    }
  };

  const renderRichText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-blue-400 font-black text-lg uppercase tracking-tight mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      const parts = line.split(/(\**.*?\**)/g);
      const content = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-blue-300 font-extrabold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return <p key={i} className="mb-3 leading-relaxed text-slate-300">{content}</p>;
    });
  };

  const calculateHabitStreak = (dates: string[]) => {
    if (!dates || dates.length === 0) return 0;
    const sortedDates = [...dates].map(d => new Date(d).setHours(0,0,0,0)).sort((a, b) => b - a);
    const uniqueDates = Array.from(new Set(sortedDates));
    const todayTime = new Date().setHours(0,0,0,0);
    const yesterdayTime = new Date(todayTime);
    yesterdayTime.setDate(yesterdayTime.getDate() - 1);
    if (!uniqueDates.includes(todayTime) && !uniqueDates.includes(yesterdayTime.getTime())) return 0;
    let streak = 0;
    let checkTime = uniqueDates.includes(todayTime) ? todayTime : yesterdayTime.getTime();
    for (const date of uniqueDates) {
        if (date === checkTime) {
            streak++;
            const d = new Date(checkTime);
            d.setDate(d.getDate() - 1);
            checkTime = d.getTime();
        } else {
            break;
        }
    }
    return streak;
  }

  const showStagedOverlay = currentPlan.length === 0;

  return (
    <div className="relative min-h-full">
      <div className={`p-4 space-y-6 pb-2 transition-all duration-700 ${showStagedOverlay ? 'blur-2xl opacity-40 scale-[0.98] pointer-events-none grayscale' : ''}`}>
        
        {/* New Header Design */}
        <div className="relative pt-2 pb-1">
          <div className="absolute -right-2 top-0 opacity-10">
            <Trophy size={80} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{profile.coachName || 'Coach'}'s Dashboard</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Status: Fully Operational</p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">App Streak</span>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">{appStreak}</span>
                    <span className="text-emerald-500/80 text-xs font-bold uppercase tracking-tight">Days</span>
                </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Plan Check-ins</span>
                <span className="text-3xl font-black text-white font-mono tracking-tighter">{totalCheckIns}</span>
            </div>
        </div>

        {/* Habit Bubbles */}
        {habits.length > 0 && (
            <div className="space-y-4">
                {habits.map(habit => {
                    const streak = calculateHabitStreak(habit.datesCompleted);
                    const isDoneToday = habit.datesCompleted.includes(today);
                    return (
                      <div key={habit.id} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 relative group overflow-hidden shadow-xl">
                          <div className="flex justify-between items-start mb-6">
                              <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                                  <div className={`p-2 rounded-xl transition-all ${isDoneToday ? 'bg-orange-500 text-white scale-110 shadow-lg shadow-orange-900/40' : 'bg-slate-800 text-slate-500'}`}>
                                    <Flame size={20} fill={isDoneToday ? "currentColor" : "none"} />
                                  </div>
                                  {habit.title}
                              </h3>
                              <button onClick={() => handleDeleteHabit(habit.id, habit.title)} className="text-slate-700 hover:text-red-500 p-2 transition-colors"><Trash2 size={16} /></button>
                          </div>
                          <div className="flex items-end justify-between">
                               <div>
                                  <div className="flex items-baseline gap-2">
                                      <span className={`text-4xl font-black font-mono tracking-tighter ${isDoneToday ? 'text-orange-500' : 'text-white'}`}>{streak}</span>
                                      <span className="text-xs text-slate-600 font-black uppercase tracking-widest">DAY STREAK</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-2">
                                      <Activity size={10} className="text-slate-700" />
                                      <span className="text-[9px] text-slate-700 font-bold uppercase tracking-widest">Last check-in: {isDoneToday ? 'Today' : 'Never'}</span>
                                  </div>
                               </div>
                               <button onClick={() => handleToggleHabit(habit.id)} className={`px-8 py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg uppercase tracking-widest ${isDoneToday ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'}`}>{isDoneToday ? 'Done' : 'Check In'}</button>
                          </div>
                      </div>
                    );
                })}
            </div>
        )}

        {/* Weight Goal Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative group">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600/20 rounded-lg">
                        <Target size={18} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight">Weight Goal</h3>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Last updated: {lastWeightUpdate}</span>
                </div>
            </div>

            <div className="flex items-center justify-between mb-8 px-4">
                <div className="text-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Current</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white font-mono">{profile.currentWeight || '--'}</span>
                        <span className="text-xs text-slate-600 font-bold uppercase">lbs</span>
                    </div>
                </div>
                <ArrowRight size={24} className="text-slate-800" />
                <div className="text-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Target</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-blue-400 font-mono">{profile.targetWeight || '--'}</span>
                        <span className="text-xs text-slate-600 font-bold uppercase">lbs</span>
                    </div>
                </div>
            </div>

            {weightDiff && (
                <div className="text-center border-t border-slate-800 pt-4">
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.1em]">{weightDiff}</p>
                </div>
            )}
        </div>

        {/* Today's Mission */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2 px-1 uppercase tracking-[0.15em]"><Activity size={16} className="text-blue-500" /> Today's Mission</h3>
          <div className="bg-slate-900 rounded-3xl p-2 border border-slate-800 shadow-xl">
               {currentPlan.length > 0 ? currentPlan.map((item, idx) => (
                 <div key={idx} onClick={() => handleToggleTask(item)} className={`p-5 flex gap-4 items-start border-b border-slate-800 last:border-0 cursor-pointer transition-all hover:bg-slate-800/40 rounded-2xl ${completedTasks.includes(item) ? 'opacity-40' : ''}`}>
                   <div className="mt-0.5 transition-transform active:scale-90">
                     {completedTasks.includes(item) ? <CheckCircle size={22} className="text-emerald-500 fill-emerald-500/10" /> : <Circle size={22} className="text-slate-800 hover:text-blue-500 transition-colors" />}
                   </div>
                   <p className={`text-sm font-bold leading-relaxed tracking-tight ${completedTasks.includes(item) ? 'line-through text-slate-600' : 'text-slate-200'}`}>{item}</p>
                 </div>
               )) : (
                 <div className="p-10 text-center space-y-4">
                    <p className="text-slate-600 text-xs font-black uppercase tracking-widest">No Active Mission</p>
                    <button onClick={() => onSwitchTab('chat')} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">Consult Coach</button>
                 </div>
               )}
          </div>
        </div>

        {/* Relocated Hype Me Button */}
        <div className="pt-6 pb-12 flex justify-center">
          <button 
            onClick={handleMotivateMe} 
            disabled={isMotivating}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-5 rounded-3xl shadow-2xl shadow-blue-900/60 border border-blue-400 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isMotivating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
            <span className="text-sm font-black uppercase tracking-[0.2em]">Hype Me</span>
          </button>
        </div>

      </div>

      {/* Blurred "See Chat" Overlay */}
      {showStaged