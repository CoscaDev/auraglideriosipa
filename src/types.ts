export interface AnxietyDataPoint {
  time: string;
  level: number; // 0-100
  heartRate: number;
  auraM?: number; // Computed metric
  adjustedLevel?: number; // 0-100, user-adjusted
  isPredicted?: boolean;
  timestamp?: number;
  hour?: number;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string; // ISO string or YYYY-MM-DD
  expectedStress: number; // 0-10
  isCompleted?: boolean;
  stressPlan?: string;
  recommendedExercise?: string;
  recommendedDuration?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  eventId?: string;
  recommendedExercise?: string;
  recommendedDuration?: number;
}

export interface UserState {
  isPremium: boolean;
  lastSync: string | null;
}
