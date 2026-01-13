import { AppState, UserProfile, Message, DailyLog, Habit } from '../types';

const STORAGE_KEY = 'mycoach_data_v2';

const INITIAL_STATE: AppState = {
  profile: {
    name: '',
    age: 30,
    gender: '',
    goal: '',
    coachName: 'YourAICoach',
    weightHistory: [],
    onboardingCompleted: false,
  },
  messages: [],
  logs: [],
  currentPlan: [],
  habits: [],
  lastPlanUpdate: new Date().toLocaleDateString()
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return INITIAL_STATE;
    const loaded = JSON.parse(serialized);
    
    // Backwards compatibility checks
    if (!loaded.profile.weightHistory) loaded.profile.weightHistory = [];
    if (!loaded.currentPlan) loaded.currentPlan = [];
    if (!loaded.logs) loaded.logs = [];
    if (!loaded.habits) loaded.habits = [];

    // If current weight exists but history is empty, add it
    if (loaded.profile.currentWeight && loaded.profile.weightHistory.length === 0) {
       loaded.profile.weightHistory.push({
         date: new Date().toLocaleDateString(),
         weight: loaded.profile.currentWeight
       });
    }
    
    return loaded;
  } catch (e) {
    console.error("Failed to load state", e);
    return INITIAL_STATE;
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const updateProfile = (profileUpdates: Partial<UserProfile>): AppState => {
  const current = loadState();
  const updatedProfile = { ...current.profile, ...profileUpdates };

  // If weight changed, add to history
  if (profileUpdates.currentWeight && profileUpdates.currentWeight !== current.profile.currentWeight) {
    const today = new Date().toLocaleDateString();
    const existingEntryIndex = updatedProfile.weightHistory.findIndex(w => w.date === today);
    if (existingEntryIndex >= 0) {
       updatedProfile.weightHistory[existingEntryIndex].weight = profileUpdates.currentWeight;
    } else {
       updatedProfile.weightHistory.push({ date: today, weight: profileUpdates.currentWeight });
    }
  }

  const newState = {
    ...current,
    profile: updatedProfile
  };
  saveState(newState);
  return newState;
};

export const addMessage = (message: Message): AppState => {
  const current = loadState();
  const newState = {
    ...current,
    messages: [...current.messages, message]
  };
  saveState(newState);
  return newState;
};

export const updateCurrentPlan = (newPlan: string[]): AppState => {
  const current = loadState();
  const newState = {
    ...current,
    currentPlan: newPlan,
    lastPlanUpdate: new Date().toLocaleDateString()
  };
  saveState(newState);
  return newState;
};

export const toggleTaskCompletion = (task: string, isCompleted: boolean): AppState => {
  const current = loadState();
  const today = new Date().toLocaleDateString();
  
  const existingLogIndex = current.logs.findIndex(l => l.date === today);
  let newLogs = [...current.logs];
  let currentTasks = existingLogIndex >= 0 ? newLogs[existingLogIndex].completedTasks : [];

  if (isCompleted) {
    if (!currentTasks.includes(task)) currentTasks.push(task);
  } else {
    currentTasks = currentTasks.filter(t => t !== task);
  }

  if (existingLogIndex >= 0) {
    newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], completedTasks: currentTasks };
  } else {
    newLogs.push({ date: today, completedTasks: currentTasks });
  }

  const newState = { ...current, logs: newLogs };
  saveState(newState);
  return newState;
};

// --- HABIT FUNCTIONS ---

export const addHabit = (title: string): AppState => {
  const current = loadState();
  const newHabit: Habit = {
    id: Date.now().toString() + Math.random().toString().slice(2, 5),
    title,
    datesCompleted: [],
    createdAt: Date.now()
  };
  const newState = {
    ...current,
    habits: [...current.habits, newHabit]
  };
  saveState(newState);
  return newState;
};

export const deleteHabit = (id: string): AppState => {
  const current = loadState();
  const newState = {
    ...current,
    habits: current.habits.filter(h => h.id !== id)
  };
  saveState(newState);
  return newState;
};

export const toggleHabitCheckIn = (id: string): AppState => {
  const current = loadState();
  const today = new Date().toLocaleDateString();
  
  const updatedHabits = current.habits.map(h => {
    if (h.id === id) {
      const isCompletedToday = h.datesCompleted.includes(today);
      let newDates = [...h.datesCompleted];
      if (isCompletedToday) {
        newDates = newDates.filter(d => d !== today);
      } else {
        newDates.push(today);
      }
      return { ...h, datesCompleted: newDates };
    }
    return h;
  });

  const newState = { ...current, habits: updatedHabits };
  saveState(newState);
  return newState;
};