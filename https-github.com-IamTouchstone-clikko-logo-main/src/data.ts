import { Category, TimeEntry } from './types';

export const DEFAULTS: Category[] = [
  {
    id: 'design',
    name: 'Design',
    color: 'teal',
    bgColor: 'bg-teal-500/10',
    accentColor: 'border-teal-500/20 text-teal-400',
    icon: 'Palette'
  },
  {
    id: 'coding',
    name: 'Coding',
    color: 'indigo',
    bgColor: 'bg-indigo-500/10',
    accentColor: 'border-indigo-500/20 text-indigo-400',
    icon: 'Code'
  },
  {
    id: 'writing',
    name: 'Writing',
    color: 'amber',
    bgColor: 'bg-amber-500/10',
    accentColor: 'border-amber-500/20 text-amber-400',
    icon: 'BookOpen'
  },
  {
    id: 'meeting',
    name: 'Meeting',
    color: 'rose',
    bgColor: 'bg-rose-500/10',
    accentColor: 'border-rose-500/20 text-rose-400',
    icon: 'Users'
  },
  {
    id: 'break',
    name: 'Break',
    color: 'emerald',
    bgColor: 'bg-emerald-500/10',
    accentColor: 'border-emerald-500/20 text-emerald-400',
    icon: 'Coffee'
  }
];

// Seed some realistic data for high fidelity
export const SEED_ENTRIES: TimeEntry[] = [
  {
    id: 'seed-1',
    taskName: 'Clikko UI Wireframing & Prototyping',
    category: 'design',
    startTime: new Date(Date.now() - 4 * 3600000 - 45 * 60000).toISOString(), // 4h 45m ago
    endTime: new Date(Date.now() - 4 * 3600000).toISOString(),
    duration: 2700, // 45 mins
    notes: 'Crafted the stopwatch-ripple alignment and set up standard Figma frames.'
  },
  {
    id: 'seed-2',
    taskName: 'Core Web Audio Synthesizer Integration',
    category: 'coding',
    startTime: new Date(Date.now() - 2 * 3600000 - 80 * 60000).toISOString(),
    endTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    duration: 4800, // 1h 20m
    notes: 'Programmed standard OscillatorNode behaviors, with exponential gain decay on complete.'
  },
  {
    id: 'seed-3',
    taskName: 'Weekly Scrum & Backlog Alignment',
    category: 'meeting',
    startTime: new Date(Date.now() - 1 * 3600000 - 30 * 60000).toISOString(),
    endTime: new Date(Date.now() - 1 * 3600000).toISOString(),
    duration: 1800, // 30 mins
    notes: 'Presented clikko app icon design draft to stakeholders. They loved the solid teal bg.'
  },
  {
    id: 'seed-4',
    taskName: 'Release Documentation Draft',
    category: 'writing',
    startTime: new Date(Date.now() - 30 * 60000).toISOString(),
    endTime: new Date().toISOString(),
    duration: 1500, // 25 mins
    notes: 'Wrote installation guide for Clikko premium client.'
  }
];
