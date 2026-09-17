'use client';
import { useState } from 'react';
import { X, Save, Bot, Building2, SlidersHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Project, SDLCMethodology, WATERFALL_PHASES, AGILE_PHASES, PHASE_LABELS, PHASE_COLORS, DEFAULT_WATERFALL_PHASES, DEFAULT_AGILE_PHASES } from '@/lib/types';

interface SettingsModalProps {
  project: Project;
  aiApiKey: string;
  aiEnabled: boolean;
  onSaveProject: (project: Project) => void;
  onSaveAI: (key: string, enabled: boolean) => void;
  onClose: () => void;
}

const METHODOLOGY_OPTIONS: { value: SDLCMethodology; label: string; description: string }[] = [
  { value: 'waterfall', label: 'Waterfall / PeopleSoft', description: 'Sequential phases: Initiation → Fit-Gap → Design → Development → Testing → Deployment' },
  { value: 'agile',     label: 'Agile / Scrum',          description: 'Iterative sprints: Planning → Development → Review → QA → Release' },
  { value: 'hybrid',    label: 'Hybrid',                  description: 'Combination of waterfall planning with agile execution' },
];

export default function SettingsModal({ project, aiApiKey, aiEnabled, onSaveProject, onSaveAI, onClose }: SettingsModalProps) {
  const [proj, setProj] = useState(project);
  const [apiKey, setApiKey] = useState(aiApiKey);
  const [enabled, setEnabled] = useState(aiEnabled);
  const [activeTab, setActiveTab] = useState<'project' | 'phases' | 'ai'>('project');

  const phaseKeys = proj.methodology === 'agile' ? AGILE_PHASES : WATERFALL_PHASES;
  const weights = proj.phaseWeights as Record<string, number>;
  const phaseTotal = phaseKeys.reduce((s, k) => s + (weights[k] || 0), 0);
  const phasesValid = Math.abs(phaseTotal - 100) < 0.5;

  function setWeight(key: string, value: number) {
    setProj(p => ({ ...p, phaseWeights: { ...p.phaseWeights, [key]: value } }));
  }

  function resetWeights() {
    const defaults = proj.methodology === 'agile' ? DEFAULT_AGILE_PHASES : DEFAULT_WATERFALL_PHASES;
    setProj(p => ({ ...p, phaseWeights: { ...defaults } }));
  }

  function onMethodologyChange(m: SDLCMethodology) {
    const defaults = m === 'agile' ? DEFAULT_AGILE_PHASES : DEFAULT_WATERFALL_PHASES;
    setProj(p => ({ ...p, methodology: m, phaseWeights: { ...defaults } }));
  }

  function handleSave() {
    onSaveProject({ ...proj, updatedAt: new Date().toISOString() });
    onSaveAI(apiKey, enabled);
    onClose();
  }

  const tabs = [
    { id: 'project' as const, label: 'Project',      icon: Building2         },
    { id: 'phases'  as const, label: 'Phase Weights', icon: SlidersHorizontal },
    { id: 'ai'      as const, label: 'AI',            icon: Bot               },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg, var(--fiscal-navy) 0%, var(--fiscal-navy-light) 100%)' }}>
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Project Tab ─────────────────────────────────── */}
          {activeTab === 'project' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={proj.name}
                  onChange={e => setProj(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. PeopleSoft HCM Implementation"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client / Agency</label>
                <input
                  type="text"
                  value={proj.client}
                  onChange={e => setProj(p => ({ ...p, client: e.target.value }))}
                  placeholder="e.g. California Department of Transportation"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Programme</label>
                <input
                  type="text"
                  value={proj.programme}
                  onChange={e => setProj(p => ({ ...p, programme: e.target.value }))}
                  placeholder="e.g. ERP Modernisation Programme"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={proj.description || ''}
                  onChange={e => setProj(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              {/* Methodology */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Methodology</label>
                <div className="space-y-2">
                  {METHODOLOGY_OPTIONS.map(opt => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      proj.methodology === opt.value
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="methodology"
                        value={opt.value}
                        checked={proj.methodology === opt.value}
                        onChange={() => onMethodologyChange(opt.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Start</label>
                  <input
                    type="date"
                    value={proj.startDate}
                    onChange={e => setProj(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project End</label>
                  <input
                    type="date"
                    value={proj.endDate}
                    onChange={e => setProj(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Phase Weights Tab ────────────────────────────── */}
          {activeTab === 'phases' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-sm font-semibold text-blue-900 mb-1">
                  {proj.methodology === 'agile' ? 'Agile Phase Weights' : 'Waterfall / PeopleSoft Phase Weights'}
                </div>
                <div className="text-xs text-blue-700">
                  Set the % of project duration each SDLC phase should represent. These become the default weights
                  for new schedule items. Adjust sliders so they total 100%.
                </div>
              </div>

              {/* Validation badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${phasesValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {phasesValid ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  Total: {phaseTotal.toFixed(0)}% {phasesValid ? '— Balanced' : '— Must equal 100%'}
                </span>
                <button
                  onClick={resetWeights}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Reset to defaults
                </button>
              </div>

              {/* Visual distribution bar */}
              <div className="flex h-6 rounded-lg overflow-hidden gap-px shadow-inner bg-gray-100">
                {phaseKeys.map(key => {
                  const pct = weights[key] || 0;
                  return pct > 0 ? (
                    <div
                      key={key}
                      style={{ width: `${pct}%`, background: PHASE_COLORS[key] }}
                      title={`${PHASE_LABELS[key]}: ${pct}%`}
                      className="transition-all duration-300 flex items-center justify-center"
                    >
                      {pct >= 8 && <span className="text-white text-[9px] font-bold">{pct}%</span>}
                    </div>
                  ) : null;
                })}
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                {phaseKeys.map(key => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: PHASE_COLORS[key] }} />
                        <span className="text-sm font-medium text-gray-700">{PHASE_LABELS[key]}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color: PHASE_COLORS[key] }}>
                        {weights[key] || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0} max={50} step={1}
                      value={weights[key] || 0}
                      onChange={e => setWeight(key, Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: PHASE_COLORS[key] }}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>0%</span><span>25%</span><span>50%</span>
                    </div>
                  </div>
                ))}
              </div>

              {!phasesValid && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Phase weights must total exactly 100%. Current total: <strong>{phaseTotal.toFixed(0)}%</strong>.
                  {phaseTotal < 100
                    ? ` Increase one or more phases by ${100 - phaseTotal}%.`
                    : ` Decrease one or more phases by ${phaseTotal - 100}%.`}
                </div>
              )}
            </>
          )}

          {/* ── AI Tab ──────────────────────────────────────── */}
          {activeTab === 'ai' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Bot size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">NVIDIA NIM AI Integration</h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Generate schedule items, suggest SDLC phases, and analyse risks using AI.
                      Get your free API key from <strong>build.nvidia.com</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700">Enable AI Assistant</div>
                  <div className="text-xs text-gray-500">Shows the AI tab in the main navigation</div>
                </div>
                <button
                  onClick={() => setEnabled(!enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">NVIDIA NIM API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="nvapi-xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Stored in browser session only. Never sent to any server other than NVIDIA's API.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={activeTab === 'phases' && !phasesValid}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--fiscal-navy)' }}
          >
            <Save size={15} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
