'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Settings, FileSpreadsheet, Menu, X, BarChart2, Calendar, Bot,
  Upload, Pencil, Check,
} from 'lucide-react';
import { Project, SDLCMethodology } from '@/lib/types';

interface HeaderProps {
  project: Project;
  activeTab: 'schedule' | 'gantt' | 'ai';
  onTabChange: (tab: 'schedule' | 'gantt' | 'ai') => void;
  onExport: () => void;
  onSettingsOpen: () => void;
  onUploadOpen: () => void;
  onProjectNameChange: (name: string) => void;
  onMethodologyChange: (m: SDLCMethodology) => void;
  aiEnabled: boolean;
}

const METHODOLOGY_OPTIONS: { value: SDLCMethodology; label: string; short: string }[] = [
  { value: 'waterfall', label: 'Waterfall / PeopleSoft', short: 'Waterfall' },
  { value: 'agile',     label: 'Agile / Scrum',          short: 'Agile'     },
  { value: 'hybrid',    label: 'Hybrid',                  short: 'Hybrid'    },
];

export default function Header({
  project, activeTab, onTabChange, onExport, onSettingsOpen,
  onUploadOpen, onProjectNameChange, onMethodologyChange, aiEnabled,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNameValue(project.name); }, [project.name]);
  useEffect(() => { if (editingName) nameInputRef.current?.focus(); }, [editingName]);

  function commitName() {
    const trimmed = nameValue.trim() || 'My Project';
    setNameValue(trimmed);
    onProjectNameChange(trimmed);
    setEditingName(false);
  }

  const tabs = [
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
    { id: 'gantt'    as const, label: 'Gantt Chart', icon: BarChart2 },
    ...(aiEnabled ? [{ id: 'ai' as const, label: 'AI Assistant', icon: Bot }] : []),
  ];

  return (
    <header className="w-full">

      {/* ── Top utility bar (FISCal blue) ── */}
      <div className="flex items-center justify-between px-4 py-1.5 text-xs text-white"
        style={{ background: 'var(--fiscal-utility)' }}>
        <span className="flex items-center gap-2">
          {/* CA state circular logo */}
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 font-bold text-[10px] tracking-tight border border-white/30">
            CA
          </span>
          <span className="hidden sm:inline opacity-80">State of California</span>
          <span className="hidden sm:inline opacity-40 mx-0.5">|</span>
          <a href="https://ca.gov" target="_blank" rel="noopener noreferrer"
            className="hidden sm:inline hover:underline opacity-80 hover:opacity-100">ca.gov</a>
        </span>
        <span className="font-medium tracking-wide opacity-90 hidden sm:block">
          FI$Cal Programme Management Office
        </span>
      </div>

      {/* ── Main white header ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">

          {/* Logo — FI$Cal style */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Bear seal */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--fiscal-utility)' }}>
              <svg viewBox="0 0 40 40" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                <g fill="white">
                  <ellipse cx="20" cy="25" rx="8" ry="7"/>
                  <circle cx="20" cy="15.5" r="5.5"/>
                  <circle cx="15.5" cy="11.5" r="2.5"/>
                  <circle cx="24.5" cy="11.5" r="2.5"/>
                  <ellipse cx="20" cy="17.5" rx="3" ry="2"/>
                  <rect x="12" y="28" width="3" height="5" rx="1.5"/>
                  <rect x="25" y="28" width="3" height="5" rx="1.5"/>
                </g>
                <text x="20" y="7" textAnchor="middle" fontSize="5" fill="#FFD700" fontFamily="serif">★</text>
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-black tracking-tight leading-none">
                <span style={{ color: 'var(--fiscal-gold)' }}>FI$</span><span style={{ color: 'var(--fiscal-navy)' }}>Cal</span>
              </div>
              <div className="text-[11px] text-gray-400 leading-none mt-0.5 font-medium">
                Schedule &amp; Gantt Builder
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-gray-200 shrink-0" />

          {/* Project name — editable */}
          <div className="hidden lg:flex flex-col min-w-0 flex-1 max-w-xs">
            {editingName ? (
              <div className="flex items-center gap-1">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitName();
                    if (e.key === 'Escape') { setNameValue(project.name); setEditingName(false); }
                  }}
                  className="flex-1 px-2 py-1 rounded text-sm font-semibold text-gray-800 bg-gray-50 border border-blue-300 outline-none ring-2 ring-blue-100 min-w-0"
                  placeholder="Project name..."
                />
                <button onClick={commitName} className="p-1 rounded text-green-600 hover:bg-green-50">
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 group cursor-pointer"
                onClick={() => setEditingName(true)}
                title="Click to edit project name"
              >
                <div className="text-sm font-bold text-gray-800 leading-tight truncate">
                  {project.name || 'My Project'}
                </div>
                <Pencil size={11} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
            <div className="text-xs text-gray-400 leading-tight truncate">
              {project.client || 'Click project name to edit'}
            </div>
          </div>

          {/* Methodology pills */}
          <div className="hidden md:flex items-center gap-0.5 rounded-lg p-0.5 border border-gray-200 bg-gray-50">
            {METHODOLOGY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onMethodologyChange(opt.value)}
                title={opt.label}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  project.methodology === opt.value
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white'
                }`}
                style={project.methodology === opt.value ? { background: 'var(--fiscal-navy)' } : {}}
              >
                {opt.short}
              </button>
            ))}
          </div>

          {/* Nav tabs */}
          <nav className="hidden md:flex items-center gap-0.5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={isActive ? { background: 'var(--fiscal-navy)' } : {}}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
            <button
              onClick={onUploadOpen}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200"
              title="Upload Excel to import tasks"
            >
              <Upload size={14} />
              <span className="hidden lg:inline">Upload</span>
            </button>
            <button
              onClick={onExport}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--fiscal-gold)' }}
            >
              <FileSpreadsheet size={14} />
              <span className="hidden lg:inline">Export Excel</span>
            </button>
            <button
              onClick={onSettingsOpen}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile nav ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 pb-4 space-y-2 bg-white">
            <div className="py-2 border-b border-gray-100 mb-2">
              <div className="text-xs text-gray-400 mb-1 font-medium">Project</div>
              <input
                type="text"
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={() => onProjectNameChange(nameValue.trim() || 'My Project')}
                className="w-full px-2 py-1.5 rounded text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 outline-none"
                placeholder="Project name..."
              />
            </div>
            <div className="flex gap-1 mb-2">
              {METHODOLOGY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onMethodologyChange(opt.value)}
                  className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                    project.methodology === opt.value
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100'
                  }`}
                  style={project.methodology === opt.value ? { background: 'var(--fiscal-navy)' } : {}}
                >
                  {opt.short}
                </button>
              ))}
            </div>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={activeTab === tab.id ? { background: 'var(--fiscal-navy)' } : {}}
                >
                  <Icon size={16} />{tab.label}
                </button>
              );
            })}
            <button
              onClick={() => { onUploadOpen(); setMobileOpen(false); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 bg-gray-100 mt-1"
            >
              <Upload size={16} />Upload Excel
            </button>
            <button
              onClick={() => { onExport(); setMobileOpen(false); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-white"
              style={{ background: 'var(--fiscal-gold)' }}
            >
              <FileSpreadsheet size={16} />Export to Excel
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
