'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Settings, FileSpreadsheet, Menu, X, BarChart2, Calendar, Bot,
  Upload, Pencil, Check, RefreshCw,
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

  useEffect(() => {
    setNameValue(project.name);
  }, [project.name]);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

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
    <header className="w-full shadow-md" style={{ background: 'var(--fiscal-navy-dark)' }}>
      {/* Top utility bar */}
      <div className="flex items-center justify-between px-4 py-1 text-xs text-blue-200"
        style={{ background: 'var(--fiscal-navy)' }}>
        <span className="hidden sm:flex items-center gap-2">
          <span className="opacity-70">State of California</span>
          <span className="mx-1 opacity-40">|</span>
          <a href="https://ca.gov" target="_blank" rel="noopener noreferrer"
            className="hover:text-white transition-colors">ca.gov</a>
        </span>
        <span className="text-blue-300 font-medium tracking-wide">PMO Schedule & Gantt Builder</span>
      </div>

      {/* Main header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 gap-3">

        {/* Logo — State of California */}
        <div className="flex items-center gap-3 shrink-0">
          {/* CA Bear Seal */}
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md shrink-0">
            <svg viewBox="0 0 40 40" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
              {/* Gold outer ring */}
              <circle cx="20" cy="20" r="19" fill="#1B3A6B" stroke="#C4872B" strokeWidth="2"/>
              {/* Bear silhouette */}
              <g fill="#C4872B">
                {/* Body */}
                <ellipse cx="20" cy="24" rx="8" ry="7"/>
                {/* Head */}
                <circle cx="20" cy="15" r="5.5"/>
                {/* Left ear */}
                <circle cx="15.5" cy="11" r="2.5"/>
                {/* Right ear */}
                <circle cx="24.5" cy="11" r="2.5"/>
                {/* Snout */}
                <ellipse cx="20" cy="17" rx="3" ry="2"/>
                {/* Left front leg */}
                <rect x="12" y="27" width="3" height="6" rx="1.5"/>
                {/* Right front leg */}
                <rect x="25" y="27" width="3" height="6" rx="1.5"/>
              </g>
              {/* Star */}
              <text x="20" y="8" textAnchor="middle" fontSize="5" fill="#FFD700" fontFamily="serif">★</text>
            </svg>
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-black tracking-tight leading-none">
              <span className="text-white">California</span>
              <span style={{ color: 'var(--fiscal-gold)' }}> PMO</span>
            </div>
            <div className="text-xs text-blue-300 leading-none mt-0.5">Schedule & Gantt Builder</div>
          </div>
        </div>

        {/* Project name — editable inline */}
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
                className="flex-1 px-2 py-1 rounded text-sm font-semibold text-white bg-blue-700 border border-blue-400 outline-none min-w-0"
                placeholder="Project name..."
              />
              <button onClick={commitName} className="p-1 rounded text-green-300 hover:text-green-100">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 group cursor-pointer"
              onClick={() => setEditingName(true)}
              title="Click to edit project name"
            >
              <div className="text-sm font-semibold text-white leading-tight truncate">
                {project.name || 'My Project'}
              </div>
              <Pencil size={11} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
          <div className="text-xs text-blue-300 leading-tight truncate">{project.client || 'Click project name to edit'}</div>
        </div>

        {/* Methodology selector */}
        <div className="hidden md:flex items-center gap-1 bg-blue-900/50 rounded-lg p-1 border border-blue-700">
          {METHODOLOGY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onMethodologyChange(opt.value)}
              title={opt.label}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                project.methodology === opt.value
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-blue-700'
              }`}
            >
              {opt.short}
            </button>
          ))}
        </div>

        {/* Desktop nav tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onUploadOpen}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-700 hover:text-white transition-all border border-blue-600"
            title="Upload Excel to import tasks"
          >
            <Upload size={14} />
            <span className="hidden lg:inline">Upload</span>
          </button>
          <button
            onClick={onExport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-white shadow transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--fiscal-orange)' }}
          >
            <FileSpreadsheet size={14} />
            <span className="hidden lg:inline">Export Excel</span>
          </button>
          <button
            onClick={onSettingsOpen}
            className="p-2 rounded-md text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            className="md:hidden p-2 rounded-md text-blue-200 hover:bg-blue-700"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-blue-700 px-4 pb-3 space-y-1">
          {/* Mobile project name */}
          <div className="py-2 border-b border-blue-700 mb-2">
            <div className="text-xs text-blue-400 mb-1">Project</div>
            <input
              type="text"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={() => onProjectNameChange(nameValue.trim() || 'My Project')}
              className="w-full px-2 py-1.5 rounded text-sm font-semibold text-white bg-blue-700 border border-blue-500 outline-none"
              placeholder="Project name..."
            />
          </div>

          {/* Mobile methodology */}
          <div className="flex gap-1 mb-2">
            {METHODOLOGY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onMethodologyChange(opt.value)}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                  project.methodology === opt.value
                    ? 'bg-white text-blue-900'
                    : 'text-blue-200 bg-blue-800'
                }`}
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
                  activeTab === tab.id ? 'bg-white text-blue-900' : 'text-blue-100 hover:bg-blue-700'
                }`}
              >
                <Icon size={16} />{tab.label}
              </button>
            );
          })}
          <button
            onClick={() => { onUploadOpen(); setMobileOpen(false); }}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-blue-100 bg-blue-800 mt-1"
          >
            <Upload size={16} />Upload Excel
          </button>
          <button
            onClick={() => { onExport(); setMobileOpen(false); }}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-white"
            style={{ background: 'var(--fiscal-orange)' }}
          >
            <FileSpreadsheet size={16} />Export to Excel
          </button>
        </div>
      )}
    </header>
  );
}
