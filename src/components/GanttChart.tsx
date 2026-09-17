'use client';
import { useRef, useMemo, useState } from 'react';
import {
  format, parseISO, differenceInDays, startOfDay,
  addDays, startOfMonth, endOfMonth, isSameMonth,
} from 'date-fns';
import {
  ScheduleItem, ITEM_TYPE_COLORS, PHASE_COLORS, Project,
} from '@/lib/types';
import { getMonthsInRange, getWeeksInRange } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface GanttChartProps {
  project: Project;
  items: ScheduleItem[];
  onAdd: () => void;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
}

const ROW_HEIGHT    = 48;
const HEADER_HEIGHT = 60;
const LABEL_WIDTH   = 280;
const MONTH_WIDTH   = 90;
const WEEK_WIDTH    = 36;

export default function GanttChart({ project, items, onAdd, onEdit, onDelete }: GanttChartProps) {
  const scrollRef   = useRef<HTMLDivElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const isMonthly   = project.methodology !== 'agile';

  // Always use project dates as the base range; expand if items extend beyond
  const projStart = useMemo(() => {
    const base = parseISO(project.startDate);
    if (items.length === 0) return base;
    const earliest = Math.min(...items.map(i => parseISO(i.startDate).getTime()));
    return new Date(Math.min(base.getTime(), earliest));
  }, [project.startDate, items]);

  const projEnd = useMemo(() => {
    const base = parseISO(project.endDate);
    if (items.length === 0) return base;
    const latest = Math.max(...items.map(i => parseISO(i.endDate).getTime()));
    return new Date(Math.max(base.getTime(), latest));
  }, [project.endDate, items]);

  const months = useMemo(() => getMonthsInRange(projStart, projEnd), [projStart, projEnd]);
  const weeks  = useMemo(() => getWeeksInRange(projStart, projEnd), [projStart, projEnd]);

  const colCount  = isMonthly ? months.length : weeks.length;
  const colWidth  = isMonthly ? MONTH_WIDTH : WEEK_WIDTH;
  const chartWidth = colCount * colWidth;
  const totalDays  = Math.max(1, differenceInDays(projEnd, projStart) + 1);
  const totalHeight = HEADER_HEIGHT + items.length * ROW_HEIGHT + 40;

  function getBarProps(item: ScheduleItem) {
    const itemStart = parseISO(item.startDate);
    const itemEnd   = parseISO(item.endDate);
    const offsetDays   = differenceInDays(startOfDay(itemStart), startOfDay(projStart));
    const durationDays = Math.max(1, differenceInDays(startOfDay(itemEnd), startOfDay(itemStart)) + 1);
    const x = Math.max(0, (offsetDays / totalDays) * chartWidth);
    const w = Math.max(colWidth * 0.3, (durationDays / totalDays) * chartWidth);
    return { x, w };
  }

  function getTodayX(): number {
    const today  = startOfDay(new Date());
    const offset = differenceInDays(today, startOfDay(projStart));
    return (offset / totalDays) * chartWidth;
  }

  const today  = new Date();
  const todayX = getTodayX();

  // Month groups for week-mode header
  const monthGroups = useMemo(() => {
    const groups: { label: string; count: number; start: number }[] = [];
    let cur = '';
    weeks.forEach((w, i) => {
      const m = format(w, 'MMM yyyy');
      if (m !== cur) { groups.push({ label: m, count: 1, start: i }); cur = m; }
      else groups[groups.length - 1].count++;
    });
    return groups;
  }, [weeks]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-semibold text-gray-600">Gantt Chart — {project.name}</span>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
            style={{ background: 'var(--fiscal-navy)' }}
          >
            <Plus size={15} /> Add First Item
          </button>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
          <div className="text-5xl mb-4">📊</div>
          <div className="font-semibold text-gray-600 text-lg">No schedule items yet</div>
          <div className="text-sm mt-1 mb-6">Add items or upload an Excel file to build your Gantt chart</div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--fiscal-navy)' }}
          >
            <Plus size={15} /> Add Schedule Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">{project.name}</span>
          <span className="text-xs text-gray-400 hidden sm:inline">
            {format(parseISO(project.startDate), 'dd MMM yyyy')} → {format(parseISO(project.endDate), 'dd MMM yyyy')}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--fiscal-bg-blue)', color: 'var(--fiscal-navy)' }}>
            {project.methodology === 'agile' ? 'Agile — Weekly' : 'Waterfall — Monthly'}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90"
          style={{ background: 'var(--fiscal-navy)' }}
        >
          <Plus size={13} /> Add Item
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-1.5 border-b border-gray-100 bg-white shrink-0">
        {Object.entries(ITEM_TYPE_COLORS).map(([type, colors]) => (
          <span key={type} className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm" style={{ background: colors.hex }} />
            {type}
          </span>
        ))}
        <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
          <span className="w-0.5 h-3 bg-red-500 inline-block" />
          Today ({format(today, 'dd MMM yyyy')})
        </span>
      </div>

      {/* Chart layout: fixed labels + scrollable chart */}
      <div className="flex flex-1 overflow-hidden">

        {/* Fixed left label panel */}
        <div className="shrink-0 border-r border-gray-200 bg-white z-10 overflow-y-hidden" style={{ width: LABEL_WIDTH }}>
          {/* Column header */}
          <div
            className="flex items-end px-3 pb-2 border-b border-gray-200"
            style={{ height: HEADER_HEIGHT, background: 'var(--fiscal-bg-blue)' }}
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Item</span>
          </div>

          {/* Item rows */}
          {items.map((item, idx) => {
            const typeColors = ITEM_TYPE_COLORS[item.type];
            return (
              <div
                key={item.id}
                className="group flex items-center px-2 border-b border-gray-100"
                style={{ height: ROW_HEIGHT, background: idx % 2 === 0 ? '#ffffff' : '#F8FAFC' }}
              >
                <div className="w-1 h-7 rounded-full mr-2 shrink-0" style={{ background: typeColors?.hex }} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-800 truncate leading-tight" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: typeColors?.hex }}>
                    {item.type}
                  </div>
                </div>
                {/* Action buttons — visible on row hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit item"
                  >
                    <Pencil size={12} />
                  </button>
                  {deleteConfirm === item.id ? (
                    <button
                      onClick={() => { onDelete(item.id); setDeleteConfirm(null); }}
                      className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-500 text-white"
                    >
                      Delete?
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Gantt area */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden">
          <svg width={chartWidth} height={totalHeight} className="block">

            {/* ── MONTHLY HEADER (Waterfall) ── */}
            {isMonthly && months.map((m, i) => (
              <g key={i}>
                <rect
                  x={i * MONTH_WIDTH} y={0}
                  width={MONTH_WIDTH} height={HEADER_HEIGHT}
                  fill={i % 2 === 0 ? '#1B3A6B' : '#2C5AA0'}
                />
                <text
                  x={i * MONTH_WIDTH + MONTH_WIDTH / 2} y={24}
                  textAnchor="middle" fontSize={11} fontWeight="700" fill="white"
                  fontFamily="system-ui, sans-serif"
                >
                  {format(m, 'MMM')}
                </text>
                <text
                  x={i * MONTH_WIDTH + MONTH_WIDTH / 2} y={42}
                  textAnchor="middle" fontSize={9} fontWeight="400" fill="#B5CCE8"
                  fontFamily="system-ui, sans-serif"
                >
                  {format(m, 'yyyy')}
                </text>
              </g>
            ))}

            {/* ── WEEKLY HEADER (Agile) ── */}
            {!isMonthly && (
              <>
                {/* Month row */}
                {monthGroups.map((g, i) => (
                  <g key={i}>
                    <rect
                      x={g.start * WEEK_WIDTH} y={0}
                      width={g.count * WEEK_WIDTH} height={28}
                      fill={i % 2 === 0 ? '#1B3A6B' : '#2C5AA0'}
                    />
                    <text
                      x={g.start * WEEK_WIDTH + (g.count * WEEK_WIDTH) / 2} y={18}
                      textAnchor="middle" fontSize={10} fontWeight="600" fill="white"
                      fontFamily="system-ui, sans-serif"
                    >
                      {g.label}
                    </text>
                  </g>
                ))}
                {/* Week row */}
                {weeks.map((w, i) => (
                  <g key={i}>
                    <rect
                      x={i * WEEK_WIDTH} y={28}
                      width={WEEK_WIDTH} height={32}
                      fill={i % 2 === 0 ? '#EEF3F8' : '#E2EBF5'}
                      stroke="#D1D9E6" strokeWidth={0.5}
                    />
                    <text
                      x={i * WEEK_WIDTH + WEEK_WIDTH / 2} y={48}
                      textAnchor="middle" fontSize={8} fill="#4B5563"
                      fontFamily="system-ui, sans-serif"
                    >
                      {format(w, 'dd/MM')}
                    </text>
                  </g>
                ))}
              </>
            )}

            {/* ── Grid columns ── */}
            {Array.from({ length: colCount }).map((_, i) => (
              <rect
                key={i}
                x={i * colWidth} y={HEADER_HEIGHT}
                width={colWidth} height={items.length * ROW_HEIGHT}
                fill={i % 2 === 0 ? '#ffffff' : '#F8FAFC'}
                stroke="#F0F4F8" strokeWidth={0.5}
              />
            ))}

            {/* Month dividers for monthly view */}
            {isMonthly && months.map((_, i) => i > 0 && (
              <line
                key={i}
                x1={i * MONTH_WIDTH} y1={HEADER_HEIGHT}
                x2={i * MONTH_WIDTH} y2={totalHeight}
                stroke="#D1D9E6" strokeWidth={1}
              />
            ))}

            {/* ── Gantt bars ── */}
            {items.map((item, idx) => {
              const { x, w } = getBarProps(item);
              const y       = HEADER_HEIGHT + idx * ROW_HEIGHT + 8;
              const barH    = ROW_HEIGHT - 16;
              const typeColor = ITEM_TYPE_COLORS[item.type]?.hex || '#1B3A6B';
              const phases    = item.phases as Record<string, number>;
              const phaseEntries = Object.entries(phases).filter(([, pct]) => pct > 0);

              return (
                <g key={item.id} style={{ cursor: 'pointer' }} onClick={() => onEdit(item)}>
                  {/* Drop shadow */}
                  <rect x={x + 2} y={y + 2} width={w} height={barH} rx={5} fill="rgba(0,0,0,0.10)" />

                  {/* Background (faint type colour) */}
                  <rect x={x} y={y} width={w} height={barH} rx={5} fill={typeColor} opacity={0.12} />

                  {/* Phase segments */}
                  {(() => {
                    let phaseX = x;
                    const segs = phaseEntries.map(([key, pct], si) => {
                      const segW = (pct / 100) * w;
                      const isFirst = si === 0;
                      const isLast  = si === phaseEntries.length - 1;
                      const seg = (
                        <rect
                          key={key}
                          x={phaseX} y={y}
                          width={segW} height={barH}
                          rx={isFirst || isLast ? 5 : 0}
                          fill={PHASE_COLORS[key] || typeColor}
                          opacity={0.85}
                        />
                      );
                      phaseX += segW;
                      return seg;
                    });
                    return segs;
                  })()}

                  {/* Border */}
                  <rect x={x} y={y} width={w} height={barH} rx={5} fill="none" stroke={typeColor} strokeWidth={1.2} opacity={0.5} />

                  {/* Item name label */}
                  {w > 40 && (
                    <text
                      x={x + 6} y={y + barH / 2 + 4}
                      fontSize={9} fontWeight="600" fill="white"
                      fontFamily="system-ui, sans-serif"
                      style={{ pointerEvents: 'none' }}
                    >
                      {item.name.length > Math.floor(w / 6) ? item.name.slice(0, Math.floor(w / 6)) + '…' : item.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── Today line ── */}
            {todayX >= 0 && todayX <= chartWidth && (
              <g>
                <line
                  x1={todayX} y1={0}
                  x2={todayX} y2={totalHeight}
                  stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 3"
                />
                <circle cx={todayX} cy={HEADER_HEIGHT} r={4} fill="#EF4444" />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
