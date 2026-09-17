import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { addDays, differenceInDays, eachWeekOfInterval, eachMonthOfInterval, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { ScheduleItem } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function getDurationDays(startDate: string, endDate: string): number {
  return Math.max(1, differenceInDays(parseISO(endDate), parseISO(startDate)) + 1);
}

export function getProjectDateRange(items: ScheduleItem[]): { start: Date; end: Date } {
  if (items.length === 0) {
    const now = new Date();
    return { start: now, end: addDays(now, 90) };
  }
  const starts = items.map(i => parseISO(i.startDate));
  const ends = items.map(i => parseISO(i.endDate));
  return {
    start: new Date(Math.min(...starts.map(d => d.getTime()))),
    end: new Date(Math.max(...ends.map(d => d.getTime()))),
  };
}

export function getWeeksInRange(start: Date, end: Date) {
  return eachWeekOfInterval(
    { start: startOfWeek(start, { weekStartsOn: 1 }), end: endOfWeek(end, { weekStartsOn: 1 }) },
    { weekStartsOn: 1 }
  );
}

export function getMonthsInRange(start: Date, end: Date): Date[] {
  return eachMonthOfInterval({ start: startOfMonth(start), end: endOfMonth(end) });
}

export function distributeItemsAcrossRange(
  items: { name: string; description?: string }[],
  projectStart: string,
  projectEnd: string,
): { startDate: string; endDate: string }[] {
  const start = parseISO(projectStart);
  const end = parseISO(projectEnd);
  const totalDays = Math.max(1, differenceInDays(end, start));
  const slotDays = Math.floor(totalDays / items.length);

  return items.map((_, i) => {
    const itemStart = addDays(start, i * slotDays);
    const itemEnd = i === items.length - 1 ? end : addDays(start, (i + 1) * slotDays - 1);
    return {
      startDate: itemStart.toISOString().split('T')[0],
      endDate:   itemEnd.toISOString().split('T')[0],
    };
  });
}

export function isItemActiveInWeek(item: ScheduleItem, weekStart: Date): boolean {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const itemStart = parseISO(item.startDate);
  const itemEnd = parseISO(item.endDate);
  return !(itemEnd < weekStart || itemStart > weekEnd);
}

export function getPhaseAtWeek(
  item: ScheduleItem,
  weekStart: Date
): { phaseKey: string; pct: number } | null {
  const itemStart = parseISO(item.startDate);
  const itemEnd = parseISO(item.endDate);
  const totalDays = differenceInDays(itemEnd, itemStart) || 1;
  const dayOffset = differenceInDays(startOfDay(weekStart), startOfDay(itemStart));

  if (dayOffset < 0 || dayOffset > totalDays) return null;

  const progressPct = (dayOffset / totalDays) * 100;
  const phases = item.phases as Record<string, number>;
  let cumulative = 0;

  for (const [key, pct] of Object.entries(phases)) {
    cumulative += pct;
    if (progressPct <= cumulative) {
      return { phaseKey: key, pct: pct as number };
    }
  }
  return null;
}

export function validatePhaseTotal(phases: Record<string, number>): boolean {
  const total = Object.values(phases).reduce((sum, v) => sum + (v || 0), 0);
  return Math.abs(total - 100) < 0.01;
}

export function getPhaseTotalLabel(phases: Record<string, number>): string {
  const total = Object.values(phases).reduce((sum, v) => sum + (v || 0), 0);
  return `${total.toFixed(0)}%`;
}

export function getItemsByType(items: ScheduleItem[]) {
  return items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function getItemsByStatus(items: ScheduleItem[]) {
  return items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function todayISOString(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysFromNow(days: number): string {
  return addDays(new Date(), days).toISOString().split('T')[0];
}
