import { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { TimeEntry, Category } from '../types';
import DynamicIcon from './DynamicIcon';

interface StatsDashboardProps {
  entries: TimeEntry[];
  categories: Category[];
}

export default function StatsDashboard({ entries, categories }: StatsDashboardProps) {
  // Aggregate duration per category
  const stats = useMemo(() => {
    const totalDuration = entries.reduce((acc, entry) => acc + entry.duration, 0);

    const breakdown = categories.map((cat) => {
      const catEntries = entries.filter((e) => e.category === cat.id);
      const seconds = catEntries.reduce((acc, e) => acc + e.duration, 0);
      const percentage = totalDuration > 0 ? (seconds / totalDuration) * 100 : 0;

      return {
        ...cat,
        seconds,
        percentage,
        count: catEntries.length,
      };
    }).sort((a, b) => b.seconds - a.seconds);

    return {
      totalDuration,
      breakdown,
    };
  }, [entries, categories]);

  const formatDurationText = (totalSecs: number) => {
    if (totalSecs === 0) return '0 mins';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.round((totalSecs % 3600) / 60);

    if (hrs === 0) return `${mins} mins`;
    return `${hrs}h ${mins}m`;
  };

  const hasData = stats.totalDuration > 0;

  // Pie chart calculation
  const pieRadius = 55;
  const pieCircumference = 2 * Math.PI * pieRadius;

  let aggregatedOffset = 0;

  return (
    <div className="space-y-6">
      {/* Top Total visual overview */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="text-teal-600" size={16} />
            <h3 className="text-sm font-bold text-slate-900 font-display">Focus Metrics</h3>
          </div>
          <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp size={10} />
            <span>Interactive analytics</span>
          </span>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <AlertCircle size={28} className="text-slate-400 mb-2.5" />
            <h4 className="text-xs font-semibold text-slate-700">No track metrics yet</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Complete your first focus timer on the dashboard to populate these charts!
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            {/* Custom SVG Pie Chart */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                {stats.breakdown.map((cat, idx) => {
                  if (cat.seconds === 0) return null;
                  const segmentLength = (cat.percentage / 100) * pieCircumference;
                  const currentOffset = aggregatedOffset;
                  // Update accumulator
                  aggregatedOffset += segmentLength;

                  // Hex mapped color helpers
                  const strokeColor = 
                    cat.color === 'teal' ? '#0d9488' :
                    cat.color === 'indigo' ? '#4f46e5' :
                    cat.color === 'amber' ? '#d97706' :
                    cat.color === 'rose' ? '#e11d48' : '#059669';

                  return (
                    <motion.circle
                      key={cat.id}
                      cx="56"
                      cy="56"
                      r={pieRadius}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="10"
                      strokeDasharray={`${segmentLength} ${pieCircumference}`}
                      strokeDashoffset={-currentOffset}
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 0, opacity: 0 }}
                      animate={{ strokeDashoffset: -currentOffset, opacity: 1 }}
                      transition={{ duration: 0.8, delay: idx * 0.05 }}
                    />
                  );
                })}
              </svg>

              {/* Central stat box */}
              <div className="text-center z-10 select-none">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                <div className="text-xs font-bold text-slate-800 mt-px">
                  {formatDurationText(stats.totalDuration)}
                </div>
              </div>
            </div>

            {/* List mini markers */}
            <div className="flex-1 w-full space-y-2">
              {stats.breakdown.slice(0, 4).map((item) => {
                if (item.seconds === 0) return null;
                const bulletColor = 
                  item.color === 'teal' ? 'bg-teal-500' :
                  item.color === 'indigo' ? 'bg-indigo-505' :
                  item.color === 'amber' ? 'bg-amber-500' :
                  item.color === 'rose' ? 'bg-rose-500' : 'bg-emerald-500';

                return (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${bulletColor}`} />
                      <span className="font-semibold truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                      {Math.round(item.percentage)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bar charts detailed Breakdown */}
      {hasData && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Activity Distribution</h4>
          </div>

          <div className="space-y-4">
            {stats.breakdown.map((cat) => {
              const themeColor = 
                cat.color === 'teal' ? 'text-teal-600 bg-teal-50 border-teal-100' :
                cat.color === 'indigo' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' :
                cat.color === 'amber' ? 'text-amber-600 bg-amber-50 border-amber-105' :
                cat.color === 'rose' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100';

              const barBg = 
                cat.color === 'teal' ? 'bg-teal-500 shadow-sm' :
                cat.color === 'indigo' ? 'bg-indigo-550 shadow-sm' :
                cat.color === 'amber' ? 'bg-amber-500 shadow-sm' :
                cat.color === 'rose' ? 'bg-rose-500 shadow-sm' : 'bg-emerald-555 shadow-sm';

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-md border text-slate-700 ${themeColor}`}>
                        <DynamicIcon name={cat.icon} size={11} />
                      </span>
                      <span className="font-bold text-slate-850 font-display">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">({cat.count} {cat.count === 1 ? 'log' : 'logs'})</span>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono text-xs">
                        {formatDurationText(cat.seconds)}
                      </div>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    <motion.div
                      className={`h-full rounded-full ${barBg}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
