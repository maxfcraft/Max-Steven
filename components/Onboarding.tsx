import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChevronRight, Target, User, Weight, Bot } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile>) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: 30,
    gender: 'Male',
    goal: '',
    coachName: 'YourAICoach',
  });

  const updateForm = (key: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep(s => s + 1);
  
  const finish = () => {
    onComplete(formData);
  };

  return (
    <div className="h-screen bg-slate-950 text-white p-6 flex flex-col justify-center max-w-md mx-auto">
      
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
          Welcome to CustomCoach
        </h2>
        <p className="text-slate-400">Let's build your personal plan.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <label className="block text-sm font-medium text-slate-300">About You & Your Coach</label>
            
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-500" size={20} />
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Your Name"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Bot className="absolute left-3 top-3 text-slate-500" size={20} />
              <input 
                type="text"
                value={formData.coachName}
                onChange={(e) => updateForm('coachName', e.target.value)}
                placeholder="Name your Coach (Default: YourAICoach)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
                <input 
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateForm('age', parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
               </div>
               <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => updateForm('gender', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
             <label className="block text-sm font-medium text-slate-300">What is your main goal?</label>
             <div className="relative">
              <Target className="absolute left-3 top-3 text-slate-500" size={20} />
              <textarea 
                value={formData.goal}
                onChange={(e) => updateForm('goal', e.target.value)}
                placeholder="e.g. I'm a dad and I want to lose 15 pounds..."
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
             </div>
             <p className="text-xs text-slate-500">
               This is where you ramble. The more context you add the better!
             </p>
          </div>
        )}

         {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <label className="block text-sm font-medium text-slate-300">Current Stats (Optional)</label>
            
            <div className="relative">
              <Weight className="absolute left-3 top-3 text-slate-500" size={20} />
              <input 
                type="number"
                value={formData.currentWeight || ''}
                onChange={(e) => updateForm('currentWeight', parseFloat(e.target.value))}
                placeholder="Current Weight (lbs)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors mb-4"
              />
            </div>
            <div className="relative">
              <Target className="absolute left-3 top-3 text-slate-500" size={20} />
              <input 
                type="number"
                value={formData.targetWeight || ''}
                onChange={(e) => updateForm('targetWeight', parseFloat(e.target.value))}
                placeholder="Target Weight (lbs)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        {step < 3 ? (
          <button 
            onClick={nextStep}
            disabled={step === 1 && !formData.name || step === 2 && !formData.goal}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            Next <ChevronRight size={20} />
          </button>
        ) : (
          <button 
            onClick={finish}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            Let's Start!
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;