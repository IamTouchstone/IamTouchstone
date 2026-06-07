import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, Sparkles, Check, ChevronRight } from 'lucide-react';
import { Category, TimeEntry } from '../types';
import { playClick, playTapIn, playChimeSuccess } from './SoundEngine';
import DynamicIcon from './DynamicIcon';
import Ripple from './Ripple';

interface DigitalTimerProps {
  categories: Category[];
  activeCategoryId: string;
  setActiveCategoryId: (id: string) => void;
  onSaveEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  soundEnabled: boolean;
}

export default function DigitalTimer({
  categories,
  activeCategoryId,
  setActiveCategoryId,
  onSaveEntry,
  soundEnabled,
}: DigitalTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotesForm, setShowNotesForm] = useState(false);

  // Ripple state
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleCounter = useRef(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<string | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Clean layout helper for timer numbers
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return {
      hrs: hrs.toString().padStart(2, '0'),
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
    };
  };

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];

  const triggerRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    rippleCounter.current += 1;
    const newRipple = { id: rippleCounter.current, x, y };
    setRipples((prev) => [...prev, newRipple]);
  };

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (soundEnabled) playTapIn();
    triggerRipple(e);
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = new Date().toISOString();
  };

  const handlePause = () => {
    if (soundEnabled) playClick();
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    if (seconds === 0) return;
    if (soundEnabled) playChimeSuccess();

    const finalStartTime = startTimeRef.current || new Date(Date.now() - seconds * 1000).toISOString();
    const finalEndTime = new Date().toISOString();

    onSaveEntry({
      taskName: taskName.trim() || `${activeCategory.name} Track`,
      category: activeCategoryId,
      startTime: finalStartTime,
      endTime: finalEndTime,
      duration: seconds,
      notes: notes.trim() || undefined,
    });

    // Reset states
    setIsRunning(false);
    setIsPaused(false);
    setSeconds(0);
    setTaskName('');
    setNotes('');
    setShowNotesForm(false);
    startTimeRef.current = null;
  };

  const handleRemoveRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  const { hrs, mins, secs } = formatTime(seconds);

  // SVG parameters for stopwatch outer ring ticks
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  // Progress ratio
  const progressPercent = isRunning ? (seconds % 60) / 60 : 0;
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <div className="flex flex-col items-center justify-between h-full pt-4 pb-6 px-1">
      {/* Title block */}
      <div className="text-center mb-2">
        <span className="text-teal-600 font-medium tracking-widest text-[10px] uppercase bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-full inline-block mb-1.5 shadow-sm">
          {isRunning ? (isPaused ? 'Session Paused' : 'Tracking in progress') : 'Ready to Clikko'}
        </span>
        <h2 className="text-xl font-display font-bold text-slate-900">
          {isRunning ? activeCategory.name : 'Focus & Record'}
        </h2>
      </div>

      {/* Stopwatch ring & finger-tap ripple visual body */}
      <div className="relative flex items-center justify-center my-5">
        {/* Large stopwatch button layout */}
        <button
          onClick={(e) => {
            if (!isRunning) {
              handleStart(e);
            } else {
              triggerRipple(e);
              handlePause();
            }
          }}
          className={`relative w-64 h-64 rounded-full border flex flex-col justify-center items-center shadow-lg focus:outline-none transition-all duration-300 overflow-hidden cursor-pointer ${
            isRunning && !isPaused
              ? 'ring-4 ring-teal-500/10 shadow-[0_0_40px_rgba(13,148,136,0.25)] bg-[#0D9488] border-[#0D9488]'
              : isPaused
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-850 active:scale-95 text-white'
              : 'bg-slate-900 border-slate-900 hover:bg-slate-950 active:scale-95 text-white'
          }`}
        >
          {/* Dynamic animations for stopwatch ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            {/* Background thin circle */}
            <circle
              cx="128"
              cy="128"
              r={radius}
              fill="none"
              stroke={isRunning && !isPaused ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}
              strokeWidth="4"
            />
            {/* Animated progress ring representing ticking */}
            <motion.circle
              cx="128"
              cy="128"
              r={radius}
              fill="none"
              stroke={isRunning && !isPaused ? '#ffffff' : '#0D9488'}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>

          {/* Organic finger-tap active ripples */}
          <Ripple ripples={ripples} onAnimationComplete={handleRemoveRipple} />

          {/* Core time value display */}
          <div className="z-10 flex flex-col items-center mt-2">
            <div className="flex font-mono text-4xl font-bold tracking-widest tabular-nums select-none text-white">
              <span>{hrs}</span>
              <span className={`mx-0.5 ${isRunning && !isPaused ? 'animate-pulse' : 'opacity-70'}`}>:</span>
              <span>{mins}</span>
              <span className={`mx-0.5 ${isRunning && !isPaused ? 'animate-pulse' : 'opacity-70'}`}>:</span>
              <span className={isRunning && !isPaused ? 'text-white' : 'text-teal-400'}>{secs}</span>
            </div>

            {/* Sub-label inside the button */}
            <div className={`mt-4 text-xs tracking-wider font-semibold font-display flex items-center gap-1.5 uppercase select-none ${isRunning && !isPaused ? 'text-teal-100' : 'text-slate-400'}`}>
              {!isRunning ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <span>Tap to Start</span>
                </>
              ) : isPaused ? (
                <span>Resume Session</span>
              ) : (
                <span>Tracking...</span>
              )}
            </div>
          </div>
        </button>

        {/* Dynamic Category Pill Floating Accent */}
        <div className="absolute -bottom-2.5 z-10">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border border-slate-200/90 flex items-center gap-1.5 bg-white text-slate-800 shadow-md`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              activeCategory.color === 'teal' ? 'bg-teal-500' :
              activeCategory.color === 'indigo' ? 'bg-indigo-500' :
              activeCategory.color === 'amber' ? 'bg-amber-500' :
              activeCategory.color === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
            <span>{activeCategory.name}</span>
          </span>
        </div>
      </div>

      {/* Track info inputs card */}
      <div className="w-full max-w-[300px] bg-slate-50 border border-slate-200/70 rounded-2xl p-4 mb-3">
        <input
          type="text"
          placeholder="What are you working on?"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-405"
        />

        <div className="mt-2 flex items-center justify-between">
          {!showNotesForm ? (
            <button
              onClick={() => {
                if (soundEnabled) playClick();
                setShowNotesForm(true);
              }}
              className="text-[11px] text-teal-600 hover:text-teal-700 flex items-center gap-1 font-semibold bg-transparent cursor-pointer"
            >
              <Sparkles size={11} />
              <span>Add custom notes...</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (soundEnabled) playClick();
                setShowNotesForm(false);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-500 flex items-center gap-1 font-medium bg-transparent cursor-pointer"
            >
              <span>Hide notes</span>
            </button>
          )}
        </div>

        <AnimatePresence>
          {showNotesForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session details or takeaways..."
                rows={2}
                className="w-full mt-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-sans text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-405 resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stop / Cancel Controls Panel */}
      {isRunning && (
        <div className="flex items-center gap-3.5 mt-1.5 mb-2.5">
          <button
            onClick={handlePause}
            className={`flex items-center justify-center p-3 rounded-full border transition-all cursor-pointer ${
              isPaused 
                ? 'bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm'
            }`}
            title={isPaused ? "Resume Session" : "Pause Session"}
          >
            {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
          </button>

          <button
            onClick={handleStop}
            className="flex items-center justify-center p-3.5 bg-red-50 border border-red-200/80 text-red-600 hover:bg-red-100/50 rounded-full transition-all cursor-pointer shadow-sm"
            title="Stop & Save Entry"
          >
            <Square size={18} fill="currentColor" />
          </button>
        </div>
      )}

      {/* Category quick selectors */}
      <div className="w-full mt-2">
        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 text-center">
          Active Space Tag
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 justify-center scrollbar-none px-2">
          {categories.map((cat) => {
            const isSelected = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (soundEnabled) playClick();
                  setActiveCategoryId(cat.id);
                }}
                className={`px-3 py-1.5 text-xs rounded-full border select-none transition-all cursor-pointer flex items-center gap-1.5 shrink-0 font-medium ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-md shadow-slate-900/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  cat.color === 'teal' ? 'bg-teal-500' :
                  cat.color === 'indigo' ? 'bg-indigo-500' :
                  cat.color === 'amber' ? 'bg-amber-500' :
                  cat.color === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'
                }`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
