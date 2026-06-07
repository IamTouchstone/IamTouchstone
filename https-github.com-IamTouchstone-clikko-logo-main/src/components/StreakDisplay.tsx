import { motion } from 'motion/react';
import { Flame, Award, Calendar, Sparkles } from 'lucide-react';
import { Streak, TimeEntry } from '../types';

interface StreakDisplayProps {
  streak: Streak;
  entries: TimeEntry[];
}

export default function StreakDisplay({ streak, entries }: StreakDisplayProps) {
  // Calculate stats
  const totalHours = (entries.reduce((acc, entry) => acc + entry.duration, 0) / 3600).toFixed(1);
  const distinctDays = new Set(entries.map(e => e.startTime.split('T')[0])).size;

  let message = "Start your focus streak today with your first Clikko session!";
  if (streak.currentStreak > 0) {
    if (streak.currentStreak < 3) {
      message = "Awesome start! Log a focus session tomorrow to keep the flame alive. 🔥";
    } else if (streak.currentStreak < 7) {
      message = "You're on fire! Unstoppable daily momentum. Keep Clikko-ing! 💪";
    } else {
      message = "Legendary streak! You've unlocked executive elite focus. Premium level! 👑";
    }
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex gap-4 items-start">
        <motion.div 
          animate={streak.currentStreak > 0 ? {
            scale: [1, 1.15, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ repeat: Infinity, duration: 2.5, repeatType: "reverse" }}
          className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 ${
            streak.currentStreak > 0 
              ? 'bg-amber-50 border-amber-200 text-amber-500' 
              : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}
        >
          <Flame size={24} fill={streak.currentStreak > 0 ? "currentColor" : "none"} />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Streak Tracker</h3>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>

          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 font-display">
              {streak.currentStreak}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {streak.currentStreak === 1 ? 'day focus' : 'consecutive days'}
            </span>
          </div>

          <p className="text-xs text-slate-600 font-sans leading-relaxed mt-2 select-none">
            {message}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 mt-5 pt-5 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
          <div className="text-teal-600 bg-teal-50 border border-teal-100 p-2 rounded-xl">
            <Calendar size={15} />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Days Focus</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{distinctDays} days</div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
          <div className="text-indigo-600 bg-indigo-50 border border-indigo-100 p-2 rounded-xl">
            <Award size={15} />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Focus Hours</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{totalHours} hrs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
