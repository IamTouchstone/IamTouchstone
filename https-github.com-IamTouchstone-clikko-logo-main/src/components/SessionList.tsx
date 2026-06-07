import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Plus, 
  Sparkles, 
  Share2, 
  Calendar,
  CheckCircle2,
  Lock,
  Download
} from 'lucide-react';
import { TimeEntry, Category } from '../types';
import { playClick, playSoftDelete, playTapIn } from './SoundEngine';
import DynamicIcon from './DynamicIcon';

interface SessionListProps {
  entries: TimeEntry[];
  categories: Category[];
  onDeleteEntry: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onAddManualEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  soundEnabled: boolean;
}

export default function SessionList({
  entries,
  categories,
  onDeleteEntry,
  onUpdateNotes,
  onAddManualEntry,
  soundEnabled,
}: SessionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Manual entry states
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState(categories[0]?.id || '');
  const [manualMin, setManualMin] = useState<number>(15);
  const [manualHrs, setManualHrs] = useState<number>(0);
  const [manualNote, setManualNote] = useState('');

  // Filtered lists
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.taskName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getCategoryDetails = (catId: string) => {
    return categories.find((c) => c.id === catId) || categories[0];
  };

  const formatDurationText = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    let text = '';
    if (hrs > 0) text += `${hrs}h `;
    if (mins > 0 || hrs > 0) text += `${mins}m `;
    text += `${secs}s`;
    return text;
  };

  const handleStartEdit = (entry: TimeEntry) => {
    if (soundEnabled) playClick();
    setEditingId(entry.id);
    setEditNotes(entry.notes || '');
  };

  const handleSaveNotes = (id: string) => {
    if (soundEnabled) playClick();
    onUpdateNotes(id, editNotes.trim());
    setEditingId(null);
  };

  const handleAddRetroactive = (e: React.FormEvent) => {
    e.preventDefault();
    if (soundEnabled) playTapIn();

    const calculatedSeconds = (manualHrs * 3600) + (manualMin * 60);
    if (calculatedSeconds <= 0) return;

    const end = new Date();
    const start = new Date(end.getTime() - calculatedSeconds * 1000);

    onAddManualEntry({
      taskName: manualTitle.trim() || `${getCategoryDetails(manualCategory).name} Log`,
      category: manualCategory,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: calculatedSeconds,
      notes: manualNote.trim() || undefined,
    });

    // Reset Form
    setManualTitle('');
    setManualNote('');
    setManualMin(15);
    setManualHrs(0);
    setShowManualForm(false);
  };

  const handleExportData = () => {
    if (soundEnabled) playClick();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `clikko_time_entries_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-4">
      {/* Header operations with Manual toggle button and Export trigger */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 font-display">Time Records ({filteredEntries.length})</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (soundEnabled) playClick();
              setShowManualForm(!showManualForm);
            }}
            className="text-[11px] text-teal-600 font-bold flex items-center gap-1 hover:text-teal-700 transition-colors cursor-pointer"
          >
            <Plus size={12} />
            <span>retroactive log</span>
          </button>
          
          <button
            onClick={handleExportData}
            title="Export to JSON"
            className="p-1 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
          >
            <Download size={11} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Retroactive Manual Form Section */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.95, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddRetroactive} className="bg-slate-50 border border-slate-205 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="text-teal-600" />
                  <span>Manual Time Seed</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Task name or focus topic"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 placeholder:text-slate-405"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Space Category</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Duration Needed</label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="Hr"
                        value={manualHrs || ''}
                        onChange={(e) => setManualHrs(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-1.5 text-xs text-center text-slate-800 focus:outline-none placeholder:text-slate-400"
                      />
                      <span className="text-slate-400 text-xs">:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="Min"
                        value={manualMin || ''}
                        onChange={(e) => setManualMin(parseInt(e.target.value) || 0)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-1.5 text-xs text-center text-slate-800 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Write a custom note... (optional)"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 placeholder:text-slate-405"
                />

                <button
                  type="submit"
                  className="w-full mt-2 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/10"
                >
                  <CheckCircle2 size={13} />
                  <span>Log Retroactive Record</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar controls */}
      <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-2xl p-2 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search focus logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-8 pr-2.5 py-1 text-xs text-slate-800 focus:outline-none placeholder:text-slate-408"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none font-semibold cursor-pointer"
        >
          <option value="all">All space tags</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Entry Rows */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredEntries.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-slate-200 rounded-3xl bg-white shadow-xs">
            <Calendar size={22} className="text-slate-400 mx-auto mb-2.5" />
            <h4 className="text-xs font-bold text-slate-700">No time recorded here</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Adjust filters or record session in Timer space.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredEntries.map((entry) => {
              const cat = getCategoryDetails(entry.category);
              const isEditing = editingId === entry.id;

              const labelTheme = 
                cat.color === 'teal' ? 'text-teal-600 bg-teal-50 border-teal-100' :
                cat.color === 'indigo' ? 'text-indigo-600 bg-indigo-50 border-indigo-120' :
                cat.color === 'amber' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                cat.color === 'rose' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-400 bg-emerald-50';

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 relative group hover:border-slate-350 transition-all shadow-xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Name header */}
                      <h4 className="text-xs font-bold text-slate-900 truncate pr-4">
                        {entry.taskName}
                      </h4>
                      {/* Date + tag pill */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <span className={`px-2.2 py-0.5 border rounded-full text-[9px] font-bold tracking-wide uppercase ${labelTheme}`}>
                          {cat.name}
                        </span>
                        <span className="font-mono text-slate-500">
                          {new Date(entry.startTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Duration badge and options */}
                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className="font-mono text-xs font-bold text-teal-600">
                        {formatDurationText(entry.duration)}
                      </span>
                      <div className="flex gap-1.5 mt-1.5 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(entry)}
                          className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer transition-colors"
                          title="Edit Notes"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={() => {
                            if (soundEnabled) playSoftDelete();
                            onDeleteEntry(entry.id);
                          }}
                          className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 cursor-pointer transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes space / Editor */}
                  {isEditing ? (
                    <div className="mt-1 space-y-1">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Edit session notes or outcomes..."
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-teal-500 resize-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-semibold rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNotes(entry.id)}
                          className="px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold rounded cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    entry.notes && (
                      <div className="mt-1.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[11px] text-slate-600 leading-relaxed italic pr-4">
                        {entry.notes}
                      </div>
                    )
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
