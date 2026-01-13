export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  image?: string; // Base64 encoded image data
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface Habit {
  id: string;
  title: string;
  datesCompleted: string[]; // List of YYYY-MM-DD strings
  createdAt: number;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  goal: string;
  coachName: string;
  currentWeight?: number;
  targetWeight?: number;
  weightHistory: WeightEntry[];
  onboardingCompleted: boolean;
}

export interface DailyLog {
  date: string;
  completedTasks: string[]; // List of task strings completed that day
}

export interface AppState {
  profile: UserProfile;
  messages: Message[];
  logs: DailyLog[];
  currentPlan: string[]; 
  habits: Habit[]; 
  lastPlanUpdate: string;
}