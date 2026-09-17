'use client';
import { useState } from 'react';
import {
  ScheduleItem, ItemType, ItemStatus, ItemPriority,
  ITEM_TYPE_COLORS, STATUS_COLORS, PRIORITY_COLORS
} from '@/lib/types';
import { formatDate, getDurationDays } from '@/lib/utils';
import {
  Plus, Pencil, Trash2, Search, Filter, ChevronUp, ChevronDown,
  ChevronsUpDown, Copy, Eye
} from 'lucide-react';

interface ScheduleTableProps {
  items: ScheduleItem[];
  onAdd: () => void;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: ScheduleItem) => void;
}

type SortKey = 'name' | 'type' | 'status' | 'priority' | 'startDate' | 'endDate' | 'completionPct';
type SortDir = 'asc' | 'desc';

const ALL_TYPES: ItemType[] = [
  'Epic', 'Story', 'Task', 'Requirement',
  'Design', 'Development', 'Testing', 'Business Process',
];
const ALL_STATUSES: ItemStatus[] = ['Not Started', 'In Progress', 'Complete', 'On Hold', 'At Risk'];

export default function ScheduleTable({ items, onAdd, onEdit, onDelete, onDuplicate }: ScheduleTableProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('startDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const filtered = items
    .filter(i => filterType === 'all' || i.type === filterType)
    .filter(i => filterStatus === 'all' || i.status === filterStatus)
    .filter(i =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.owner || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.description || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let va: string | number = a[sortKey as keyof ScheduleItem] as string | number;
      let vb: string | number = b[sortKey as keyof ScheduleItem] as string | number;
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={12} className="text-gray-400" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-blue-600" />
      : <ChevronDown size={12} className="text-blue-600" />;
  }

  function ColHeader({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-blue-50 transition-colors"
        onClick={() => toggleSort(col)}
      >
        <span className="flex items-center gap-1">
          {label}
          <SortIcon col={col} />
        </span>
      </th>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all no-print"
          style={{ background: 'var(--fiscal-navy)' }}
        >
          <Plus size={15} />
          Add Item
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--fiscal-navy)' } as React.CSSProperties}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none bg-white"
          >
            <option value="all">All Types</option>
            {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none bg-white"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length} of {items.length} items
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-medium text-gray-600">No items yet</div>
            <div className="text-sm mt-1">Click "Add Item" to create your first schedule item</div>
            <button
              onClick={onAdd}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--fiscal-navy)' }}
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="w-8 px-3 py-3" />
                <ColHeader col="name" label="Item Name" />
                <ColHeader col="type" label="Type" />
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner</th>
                <ColHeader col="status" label="Status" />
                <ColHeader col="priority" label="Priority" />
                <ColHeader col="startDate" label="Start" />
                <ColHeader col="endDate" label="End" />
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Days</th>
                <ColHeader col="completionPct" label="Complete" />
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item, idx) => {
                const typeColors = ITEM_TYPE_COLORS[item.type];
                const isDeleteConfirm = deleteConfirm === item.id;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Row indicator */}
                    <td className="pl-3 pr-1 py-3">
                      <div className="w-1 h-8 rounded-full" style={{ background: typeColors?.hex }} />
                    </td>

                    {/* Name + description */}
                    <td className="px-3 py-3 max-w-[220px]">
                      <div className="font-medium text-sm text-gray-900 truncate">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-400 truncate mt-0.5">{item.description}</div>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {item.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Type badge */}
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap"
                        style={{
                          background: typeColors?.hex + '18',
                          color: typeColors?.hex,
                          border: `1px solid ${typeColors?.hex}30`,
                        }}
                      >
                        {item.type}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {item.owner || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                        {item.priority}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDate(item.startDate, 'dd MMM yy')}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDate(item.endDate, 'dd MMM yy')}</td>

                    {/* Duration */}
                    <td className="px-3 py-3 text-sm font-medium text-gray-700">
                      {getDurationDays(item.startDate, item.endDate)}d
                    </td>

                    {/* Completion bar */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.completionPct}%`,
                              background: typeColors?.hex,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-9 text-right">{item.completionPct}%</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      {isDeleteConfirm ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { onDelete(item.id); setDeleteConfirm(null); }}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => onDuplicate(item)}
                            className="p-1.5 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
