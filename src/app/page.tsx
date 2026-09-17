'use client';
import { useState, useCallback } from 'react';
import { Project, ScheduleItem, SDLCMethodology, DEFAULT_WATERFALL_PHASES, DEFAULT_AGILE_PHASES } from '@/lib/types';
import { SAMPLE_PROJECT } from '@/lib/sampleData';
import { exportToExcel } from '@/lib/excelExport';
import { generateId } from '@/lib/utils';
import Header from '@/components/Header';
import ScheduleTable from '@/components/ScheduleTable';
import ScheduleForm from '@/components/ScheduleForm';
import GanttChart from '@/components/GanttChart';
import AIAssistant from '@/components/AIAssistant';
import SettingsModal from '@/components/SettingsModal';
import ExcelUploadModal from '@/components/ExcelUploadModal';

export default function Home() {
  const [project, setProject] = useState<Project>(SAMPLE_PROJECT);
  const [activeTab, setActiveTab] = useState<'schedule' | 'gantt' | 'ai'>('gantt');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);

  const handleAddItem = useCallback(() => {
    setEditingItem(null);
    setIsFormOpen(true);
  }, []);

  const handleEditItem = useCallback((item: ScheduleItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  }, []);

  const handleSaveItem = useCallback((item: ScheduleItem) => {
    setProject(p => {
      const exists = p.items.some(i => i.id === item.id);
      const items = exists
        ? p.items.map(i => i.id === item.id ? item : i)
        : [...p.items, item];
      return { ...p, items, updatedAt: new Date().toISOString() };
    });
    setIsFormOpen(false);
    setEditingItem(null);
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setProject(p => ({
      ...p,
      items: p.items.filter(i => i.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleDuplicateItem = useCallback((item: ScheduleItem) => {
    const duplicate: ScheduleItem = {
      ...item,
      id: generateId(),
      name: `${item.name} (Copy)`,
      status: 'Not Started',
      completionPct: 0,
    };
    setProject(p => ({ ...p, items: [...p.items, duplicate] }));
  }, []);

  const handleAddAIItems = useCallback((items: ScheduleItem[]) => {
    setProject(p => ({
      ...p,
      items: [...p.items, ...items],
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab('gantt');
  }, []);

  const handleImportItems = useCallback((items: ScheduleItem[]) => {
    setProject(p => ({
      ...p,
      items: [...p.items, ...items],
      updatedAt: new Date().toISOString(),
    }));
    setActiveTab('gantt');
  }, []);

  const handleExport = useCallback(() => {
    exportToExcel(project);
  }, [project]);

  const handleSaveSettings = useCallback((updated: Project) => {
    setProject(updated);
  }, []);

  const handleSaveAI = useCallback((key: string, enabled: boolean) => {
    setAiApiKey(key);
    setAiEnabled(enabled);
  }, []);

  const handleProjectNameChange = useCallback((name: string) => {
    setProject(p => ({ ...p, name, updatedAt: new Date().toISOString() }));
  }, []);

  const handleMethodologyChange = useCallback((methodology: SDLCMethodology) => {
    const defaults = methodology === 'agile' ? DEFAULT_AGILE_PHASES : DEFAULT_WATERFALL_PHASES;
    setProject(p => ({
      ...p,
      methodology,
      phaseWeights: { ...defaults },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--fiscal-bg)' }}>
      <Header
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExport={handleExport}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onUploadOpen={() => setIsUploadOpen(true)}
        onProjectNameChange={handleProjectNameChange}
        onMethodologyChange={handleMethodologyChange}
        aiEnabled={aiEnabled}
      />

      <main className="flex-1 overflow-hidden">
        {activeTab === 'schedule' && (
          <div className="h-full bg-white shadow-sm">
            <ScheduleTable
              items={project.items}
              onAdd={handleAddItem}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onDuplicate={handleDuplicateItem}
            />
          </div>
        )}

        {activeTab === 'gantt' && (
          <div className="h-full bg-white shadow-sm">
            <GanttChart
              project={project}
              items={project.items}
              onAdd={handleAddItem}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="h-full">
            <AIAssistant
              apiKey={aiApiKey}
              onApiKeyChange={setAiApiKey}
              projectName={project.name}
              projectDescription={project.description || ''}
              items={project.items}
              onAddItems={handleAddAIItems}
            />
          </div>
        )}
      </main>

      <footer className="px-4 py-1.5 text-xs text-center border-t border-gray-200 bg-white"
        style={{ color: 'var(--fiscal-text-muted)' }}>
        <span style={{ color: 'var(--fiscal-navy)' }} className="font-semibold">{project.name || 'My Project'}</span>
        {' '}·{' '}{project.methodology.charAt(0).toUpperCase() + project.methodology.slice(1)}
        {' '}·{' '}{project.items.length} items
        {project.client && <> · {project.client}</>}
      </footer>

      {isFormOpen && (
        <ScheduleForm
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
          defaultMethodology={project.methodology}
          defaultPhaseWeights={project.phaseWeights}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          project={project}
          aiApiKey={aiApiKey}
          aiEnabled={aiEnabled}
          onSaveProject={handleSaveSettings}
          onSaveAI={handleSaveAI}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isUploadOpen && (
        <ExcelUploadModal
          onImport={handleImportItems}
          onClose={() => setIsUploadOpen(false)}
          projectMethodology={project.methodology}
          projectStartDate={project.startDate}
          projectEndDate={project.endDate}
        />
      )}
    </div>
  );
}
