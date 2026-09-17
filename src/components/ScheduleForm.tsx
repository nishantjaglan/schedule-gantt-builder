'use client';
import { useState, useEffect } from 'react';
import {
  ScheduleItem, ItemType, SDLCMethodology, ItemStatus, ItemPriority,
  WATERFALL_PHASES, AGILE_PHASES, PHASE_LABELS, PHASE_COLORS,
  DEFAULT_WATERFALL_PHASES, DEFAULT_AGILE_PHASES,
  ITEM_TYPE_COLORS,
  WaterfallPhases, AgilePhases,
} from '@/lib/types';
import { generateId, todayISOString, daysFromNow, validatePhaseTotal } from '@/lib/utils';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

const ITEM_TYPES: ItemType[] = [
  'Epic', 'Story', 'Task', 'Requirement',
  'Design', 'Development', 'Testing', 'Business Process',
];
const STATUSES: ItemStatus[] = ['Not Started', 'In Progress', 'Complete', 'On Hold', 'At Risk'];
const PRIORITIES: ItemPriority[] = ['Critical', 'High', 'Medium', 'Low'];
const METHODOLOGIES: { value: SDLCMethodology; label: string }[] = [
  { value: 'waterfall', label: 'Waterfall / PeopleSoft' },
  { value: 'agile',     label: 'Agile / Scrum' },
  { value: 'hybrid',    label: 'Hybrid' },
];

interface ScheduleFormProps {
  item?: ScheduleItem | null;
  onSave: (item: ScheduleItem) => void;
  onClose: () => void;
  defaultMethodology?: SDLCMethodology;
  defaultPhaseWeights?: Partial<WaterfallPhases & AgilePhases>;
}

export default function ScheduleForm({
  item, onSave, onClose, defaultMethodology = 'waterfall', defaultPhaseWeights,
}: ScheduleFormProps) {
  const isEdit = !!item;

  const getDefaultPhases = (m: SDLCMethodology) => {
    if (defaultPhaseWeights && Object.keys(defaultPhaseWeights).length > 0) {
      return { ...defaultPhaseWeights };
    }
    if (m === 'agile') return { ...DEFAULT_AGILE_PHASES };
    return { ...DEFAULT_WATERFALL_PHASES };
  };

  const [form, setForm] = useState<Partial<ScheduleItem>>({
    id:            item?.id            || generateId(),
    name:          item?.name          || '',
    description:   item?.description   || '',
    type:          item?.type          || 'Task',
    startDate:     item?.startDate     || todayISOString(),
    endDate:       item?.endDate       || daysFromNow(30),
    owner:         item?.owner         || '',
    status:        item?.status        || 'Not Started',
    priority:      item?.priority      || 'Medium',
    methodology:   item?.methodology   || defaultMethodology,
    phases:        item?.phases        || getDefaultPhases(item?.methodology || defaultMethodology),
    completionPct: item?.completionPct ?? 0,
    notes:         item?.notes         || '',
    tags:          item?.tags          || [],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEdit) {
      setForm(f => ({
        ...f,
        phases: getDefaultPhases(f.methodology || 'waterfall'),
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.methodology]);

  function setField<K extends keyof ScheduleItem>(key: K, value: ScheduleItem[K]) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => { const copy = { ...e }; delete copy[key]; return copy; });
  }

  function setPhase(key: string, value: number) {
    setForm(f => ({ ...f, phases: { ...f.phases, [key]: value } }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = 'Item name is required';
    if (!form.startDate)    e.startDate = 'Start date is required';
    if (!form.endDate)      e.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      e.endDate = 'End date must be after start date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave(form as ScheduleItem);
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !(form.tags || []).includes(tag)) {
      setField('tags', [...(form.tags || []), tag]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setField('tags', (form.tags || []).filter(t => t !== tag));
  }

  const phases = form.phases as Record<string, number>;
  const activePhaseKeys = form.methodology === 'agile' ? AGILE_PHASES
    : form.methodology === 'waterfall' ? WATERFALL_PHASES
    : [...WATERFALL_PHASES, ...AGILE_PHASES];

  const phaseTotal = activePhaseKeys.reduce((s, k) => s + (phases[k] || 0), 0);
  const phasesValid = Math.abs(phaseTotal - 100) < 0.5;
  const typeColor = ITEM_TYPE_COLORS[form.type as ItemType]?.hex || '#1B3A6B';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg, var(--fiscal-navy) 0%, var(--fiscal-navy-light) 100%)' }}>
          <div>
            <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Schedule Item' : 'Add Schedule Item'}</h2>
            <p className="text-xs text-blue-200 mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="e.g. HR Module Fit-Gap Analysis"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={2}
              placeholder="Brief description..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>

          {/* Type + Methodology */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Type</label>
              <select
                value={form.type}
                onChange={e => setField('type', e.target.value as ItemType)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: typeColor }} />
                <span className="text-xs text-gray-500">{form.type}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">SDLC Methodology</label>
              <select
                value={form.methodology}
                onChange={e => setField('methodology', e.target.value as SDLCMethodology)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                {METHODOLOGIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setField('startDate', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.startDate ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'}`}
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setField('endDate', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${errors.endDate ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200'}`}
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Owner + Status + Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Owner</label>
              <input
                type="text"
                value={form.owner}
                onChange={e => setField('owner', e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setField('status', e.target.value as ItemStatus)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={e => setField('priority', e.target.value as ItemPriority)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Completion */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Completion: <span style={{ color: typeColor }}>{form.completionPct}%</span>
            </label>
            <input
              type="range"
              min={0} max={100} step={5}
              value={form.completionPct}
              onChange={e => setField('completionPct', Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: typeColor }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>

          {/* Phase breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">SDLC Phase Breakdown</label>
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${phasesValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {phasesValid ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                Total: {phaseTotal.toFixed(0)}%
              </span>
            </div>

            {/* Visual phase bar */}
            <div className="flex h-4 rounded-full overflow-hidden mb-3 gap-px">
              {activePhaseKeys.map(key => {
                const pct = phases[key] || 0;
                return pct > 0 ? (
                  <div
                    key={key}
                    style={{ width: `${pct}%`, background: PHASE_COLORS[key] }}
                    title={`${PHASE_LABELS[key]}: ${pct}%`}
                    className="transition-all duration-300"
                  />
                ) : null;
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {activePhaseKeys.map(key => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: PHASE_COLORS[key] }} />
                  <span className="text-xs text-gray-600 w-32 shrink-0 truncate" title={PHASE_LABELS[key]}>{PHASE_LABELS[key]}</span>
                  <input
                    type="range"
                    min={0} max={100} step={5}
                    value={phases[key] || 0}
                    onChange={e => setPhase(key, Number(e.target.value))}
                    className="flex-1 h-1.5 appearance-none cursor-pointer rounded"
                    style={{ accentColor: PHASE_COLORS[key] }}
                  />
                  <span className="text-xs font-medium w-8 text-right" style={{ color: PHASE_COLORS[key] }}>
                    {phases[key] || 0}%
                  </span>
                </div>
              ))}
            </div>

            {!phasesValid && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle size={11} />
                Phase percentages must total 100% (currently {phaseTotal.toFixed(0)}%)
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.tags || []).map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag, press Enter"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button type="button" onClick={addTag} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={2}
              placeholder="Any additional notes, risks, or dependencies..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!phasesValid}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--fiscal-navy)' }}
          >
            {isEdit ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
