import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  List, 
  BarChart3, 
  Volume2, 
  VolumeX, 
  Flame, 
  Sparkles,
  Award,
  BookOpen,
  Coffee,
  Palette,
  Code,
  Users
} from 'lucide-react';
import { TimeEntry, Streak, Category } from './types';
import { DEFAULTS, SEED_ENTRIES } from './data';
import DigitalTimer from './components/DigitalTimer';
import SessionList from './components/SessionList';
import StatsDashboard from './components/StatsDashboard';
import StreakDisplay from './components/StreakDisplay';
import { playClick } from './components/SoundEngine';

export default function App() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('design');
  const [activeTab, setActiveTab] = useState<'timer' | 'history' | 'stats'>('timer');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [streak, setStreak] = useState<Streak>({ currentStreak: 0, lastTrackedDate: null });

  // Load from LocalStorage
  useEffect(() => {
    const savedEntries = localStorage.getItem('clikko_entries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    } else {
      // Seed starter entries so the board looks populated and premium
      localStorage.setItem('clikko_entries', JSON.stringify(SEED_ENTRIES));
      setEntries(SEED_ENTRIES);
    }

    const savedSound = localStorage.getItem('clikko_sound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }

    const savedStreak = localStorage.getItem('clikko_streak');
    if (savedStreak) {
      setStreak(JSON.parse(savedStreak));
    }
  }, []);

  // Save entries to dev localStorage & recalculate streak
  const saveEntries = (newEntries: TimeEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('clikko_entries', JSON.stringify(newEntries));
    recalculateStreak(newEntries);
  };

  const handleAddNewEntry = (entry: Omit<TimeEntry, 'id'>) => {
    const fresh: TimeEntry = {
      ...entry,
      id: `clikko-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    const updated = [fresh, ...entries];
    saveEntries(updated);
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    saveEntries(updated);
  };

  const handleUpdateNotes = (id: string, correctedNotes: string) => {
    const updated = entries.map((e) => {
      if (e.id === id) {
        return { ...e, notes: correctedNotes || undefined };
      }
      return e;
    });
    saveEntries(updated);
  };

  // Focus continuous streak algorithm
  const recalculateStreak = (allEntries: TimeEntry[]) => {
    if (allEntries.length === 0) {
      const freshStreak = { currentStreak: 0, lastTrackedDate: null };
      setStreak(freshStreak);
      localStorage.setItem('clikko_streak', JSON.stringify(freshStreak));
      return;
    }

    // Extract sorted unique track dates (YYYY-MM-DD format)
    const dates = Array.from(
      new Set(allEntries.map((e) => e.startTime.split('T')[0]))
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // descending (newest first)

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86450000).toISOString().split('T')[0]; // ~1 day ago

    let currentStreak = 0;
    const latestTrackDate = dates[0];

    // If the user has tracked today or yesterday, they can keep their streak.
    if (latestTrackDate === todayStr || latestTrackDate === yesterdayStr) {
      currentStreak = 1;

      // Count backwards
      for (let i = 0; i < dates.length - 1; i++) {
        const currentDate = new Date(dates[i]);
        const nextDate = new Date(dates[i + 1]);
        const diffDays = Math.round(
          (currentDate.getTime() - nextDate.getTime()) / 86450000
        );

        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          // Streak broke here
          break;
        }
      }
    }

    const updatedStreak = { currentStreak, lastTrackedDate: latestTrackDate };
    setStreak(updatedStreak);
    localStorage.setItem('clikko_streak', JSON.stringify(updatedStreak));
  };

  const toggleSound = () => {
    const val = !soundEnabled;
    setSoundEnabled(val);
    localStorage.setItem('clikko_sound', val.toString());
    if (val) {
      setTimeout(() => playClick(), 50);
    }
  };

  const handleTabChange = (target: 'timer' | 'history' | 'stats') => {
    if (soundEnabled) playClick();
    setActiveTab(target);
  };

  // Breadcrumb segment details
  const getHeaderBreadcrumb = () => {
    if (activeTab === 'timer') return 'Dashboard';
    if (activeTab === 'history') return 'Time records Ledger';
    return 'Performance insights';
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex text-slate-800 font-sans select-none overflow-x-hidden">
      
      {/* 1. Left Sidebar - Sticky Desktop Layer */}
      <aside className="hidden lg:flex lg:w-64 flex-col bg-[#0F172A] text-slate-300 border-r border-slate-800 h-screen sticky top-0 shrink-0 z-40">
        {/* Branding header block */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500 overflow-hidden flex items-center justify-center border border-teal-400/20 group cursor-pointer shadow-md shadow-teal-500/10">
            <img 
              src="/src/assets/images/clikko_icon_1780787037185.png" 
              alt="Clikko stopwatch visual logo representation" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-base font-bold font-display tracking-tight text-white flex items-center gap-1 leading-none">
              Clikko
            </h1>
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Tactile Tracking</span>
          </div>
        </div>

        {/* Navigation operations list */}
        <div className="flex-1 p-4 space-y-1.5 pt-6">
          <button
            onClick={() => handleTabChange('timer')}
            className={`w-full text-left text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'timer'
                ? 'text-white bg-slate-800 border-l-[3px] border-teal-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock size={16} />
            <span>Focus Space</span>
          </button>

          <button
            onClick={() => handleTabChange('history')}
            className={`w-full text-left text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'text-white bg-slate-800 border-l-[3px] border-teal-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <List size={16} />
            <span>Time Records</span>
          </button>

          <button
            onClick={() => handleTabChange('stats')}
            className={`w-full text-left text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'text-white bg-slate-800 border-l-[3px] border-teal-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 size={16} />
            <span>Analytics Workspace</span>
          </button>

          {/* Quick streak banner inside sidebar */}
          {streak.currentStreak > 0 && (
            <div className="mt-8 px-4 py-3 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center gap-3 text-amber-400 select-none">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <Flame size={15} fill="currentColor" />
              </div>
              <div className="flex-1">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-tight">Focus Steak</span>
                <span className="block text-sm font-bold font-mono text-white leading-normal">{streak.currentStreak} Days focus</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar continuous footer panel with audio controls */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Sound</span>
          </div>
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-slate-850 border-slate-700 text-teal-400 hover:text-teal-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-450'
            }`}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </aside>

      {/* 2. Mobile Header - Visible only below 'lg' */}
      <div className="flex-1 min-h-screen flex flex-col bg-[#F8FAFC]">
        <header className="lg:hidden bg-[#0F172A] text-white px-5 py-3.5 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 overflow-hidden flex items-center justify-center border border-teal-400/20 shadow-md">
              <img 
                src="/src/assets/images/clikko_icon_1780787037185.png" 
                alt="Clikko logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display tracking-tight text-white leading-none">
                Clikko
              </h1>
              <span className="text-[8px] uppercase font-semibold text-slate-400 tracking-widest">Premium tracking</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {streak.currentStreak > 0 && (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                <Flame size={10} fill="currentColor" />
                <span>{streak.currentStreak}d</span>
              </span>
            )}

            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-slate-800 border-slate-700 text-teal-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          </div>
        </header>

        {/* 3. Main Workspace Header (Alex Rivera user info & breadcrumbs) */}
        <div className="h-20 bg-white border-b border-slate-205/80 px-6 lg:px-10 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-display">Workspace Overview</span>
            <span className="text-sm font-bold text-slate-800 capitalize">{getHeaderBreadcrumb()}</span>
          </div>

          {/* User profile layout matching high-end design */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-slate-800">Alex Rivera</span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lead Designer</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-sm border border-teal-200">
              AR
            </div>
          </div>
        </div>

        {/* 4. Scrollable Core Content Panels */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 pr-5 max-w-6xl mx-auto w-full pb-20 lg:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'timer' && (
              <motion.div
                key="timer-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
              >
                {/* Visual design instructions call for dual-column grid split (7 cols and 5 cols) for bento polish */}
                <div className="col-span-12 md:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-10 flex flex-col justify-center items-center">
                  <DigitalTimer
                    categories={DEFAULTS}
                    activeCategoryId={activeCategoryId}
                    setActiveCategoryId={setActiveCategoryId}
                    onSaveEntry={handleAddNewEntry}
                    soundEnabled={soundEnabled}
                  />
                </div>

                <div className="col-span-12 md:col-span-5 space-y-6">
                  <StreakDisplay streak={streak} entries={entries} />
                  
                  {/* Informational executive focal tip card */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-md">
                    <div className="absolute top-[-30%] right-[-10%] w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                    <Sparkles className="text-teal-400 mb-3" size={20} />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Tactile Micro-Focus</h4>
                    <p className="text-xs text-slate-200 leading-relaxed mt-1 select-none">
                      Tap the stopwatch circle of Clikko directly to alternate recording flags. Fluid tactile responses boost organic task recollection.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
                className="max-w-4xl mx-auto w-full"
              >
                <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-10 shadow-sm">
                  <SessionList
                    entries={entries}
                    categories={DEFAULTS}
                    onDeleteEntry={handleDeleteEntry}
                    onUpdateNotes={handleUpdateNotes}
                    onAddManualEntry={handleAddNewEntry}
                    soundEnabled={soundEnabled}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
                className="max-w-4xl mx-auto w-full"
              >
                <StatsDashboard entries={entries} categories={DEFAULTS} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* 5. Mobile Floating Dock Options bar - Visible only on < lg */}
        <nav className="lg:hidden fixed bottom-3 inset-x-4 shrink-0 z-50 bg-[#0F172A]/90 border border-slate-800 rounded-2xl flex justify-around py-3.5 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.3)] backdrop-blur-md">
          <button
            onClick={() => handleTabChange('timer')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative ${
              activeTab === 'timer' ? 'text-teal-400' : 'text-slate-400'
            }`}
          >
            <Clock size={18} />
            <span className="text-[9px] font-semibold tracking-wider font-display">Timer</span>
          </button>

          <button
            onClick={() => handleTabChange('history')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative ${
              activeTab === 'history' ? 'text-teal-400' : 'text-slate-400'
            }`}
          >
            <List size={18} />
            <span className="text-[9px] font-semibold tracking-wider font-display">Records</span>
          </button>

          <button
            onClick={() => handleTabChange('stats')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative ${
              activeTab === 'stats' ? 'text-teal-400' : 'text-slate-400'
            }`}
          >
            <BarChart3 size={18} />
            <span className="text-[9px] font-semibold tracking-wider font-display">Analytics</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
