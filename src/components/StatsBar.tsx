'use client';
import { ScheduleItem, ITEM_TYPE_COLORS, STATUS_COLORS } from '@/lib/types';
import { getDurationDays } from '@/lib/utils';
import { BarChart2, CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface StatsBarProps {
  items: ScheduleItem[];
}

export default function StatsBar({ items }: StatsBarProps) {
  const total = items.length;
  const complete = items.filter(i => i.status === 'Complete').length;
  const inProgress = items.filter(i => i.status === 'In Progress').length;
  const atRisk = items.filter(i => i.status === 'At Risk').length;
  const avgCompletion = total > 0
    ? Math.round(items.reduce((s, i) => s + i.completionPct, 0) / total)
    : 0;

  const typeCounts = items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: 'Total Items', value: total, icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Complete', value: complete, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'At Risk', value: atRisk, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Avg Completion', value: `${avgCompletion}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <Icon size={14} className={s.color} />
              </div>
              <div>
                <div className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 leading-tight">{s.label}</div>
              </div>
            </div>
          );
        })}

        <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block" />

        {/* Type breakdown pills */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(typeCounts).map(([type, count]) => {
            const colors = ITEM_TYPE_COLORS[type as keyof typeof ITEM_TYPE_COLORS];
            return (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: colors?.hex + '18',
                  color: colors?.hex,
                  border: `1px solid ${colors?.hex}40`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors?.hex }} />
                {type.replace('RICEF-', 'R-')} ({count})
              </span>
            );
          })}
        </div>
      </div>

      {/* Overall progress bar */}
      {total > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-xs text-gray-500 w-24 shrink-0">Programme Progress</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${avgCompletion}%`,
                background: 'linear-gradient(90deg, var(--fiscal-navy) 0%, var(--fiscal-navy-light) 100%)',
              }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-10 text-right">{avgCompletion}%</span>
        </div>
      )}
    </div>
  );
}
