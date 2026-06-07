export interface TimeEntry {
  id: string;
  taskName: string;
  category: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // in seconds
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind color class prefix or hex code
  bgColor: string;
  accentColor: string;
  icon: string; // Lucide icon name
}

export interface Streak {
  currentStreak: number;
  lastTrackedDate: string | null; // YYYY-MM-DD
}
