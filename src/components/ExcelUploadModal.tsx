'use client';
import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx-js-style';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Table, Plus } from 'lucide-react';
import { ScheduleItem, ItemType, ItemStatus, ItemPriority, SDLCMethodology, DEFAULT_WATERFALL_PHASES, DEFAULT_AGILE_PHASES } from '@/lib/types';
import { generateId, todayISOString, daysFromNow, distributeItemsAcrossRange } from '@/lib/utils';

interface ExcelUploadModalProps {
  onImport: (items: ScheduleItem[]) => void;
  onClose: () => void;
  projectMethodology: SDLCMethodology;
  projectStartDate: string;
  projectEndDate: string;
}

const ITEM_TYPES: ItemType[] = ['Epic', 'Story', 'Task', 'Requirement', 'Design', 'Development', 'Testing', 'Business Process'];
const STATUSES: ItemStatus[] = ['Not Started', 'In Progress', 'Complete', 'On Hold', 'At Risk'];
const PRIORITIES: ItemPriority[] = ['Critical', 'High', 'Medium', 'Low'];

// Fuzzy match column names from uploaded file to ScheduleItem fields
function detectColumn(headers: string[], candidates: string[]): number {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.findIndex(h => h.includes(c.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseType(raw: string | undefined): ItemType {
  if (!raw) return 'Task';
  const v = raw.toLowerCase();
  if (v.includes('epic'))        return 'Epic';
  if (v.includes('story'))       return 'Story';
  if (v.includes('requirement')) return 'Requirement';
  if (v.includes('design'))      return 'Design';
  if (v.includes('dev') || v.includes('build') || v.includes('config')) return 'Development';
  if (v.includes('test') || v.includes('qa') || v.includes('uat') || v.includes('sit')) return 'Testing';
  if (v.includes('process') || v.includes('business')) return 'Business Process';
  return 'Task';
}

function parseStatus(raw: string | undefined): ItemStatus {
  if (!raw) return 'Not Started';
  const v = raw.toLowerCase();
  if (v.includes('complete') || v.includes('done') || v.includes('finish')) return 'Complete';
  if (v.includes('progress') || v.includes('active') || v.includes('wip')) return 'In Progress';
  if (v.includes('hold') || v.includes('paused')) return 'On Hold';
  if (v.includes('risk') || v.includes('block')) return 'At Risk';
  return 'Not Started';
}

function parsePriority(raw: string | undefined): ItemPriority {
  if (!raw) return 'Medium';
  const v = raw.toLowerCase();
  if (v.includes('critical') || v.includes('urgent')) return 'Critical';
  if (v.includes('high'))   return 'High';
  if (v.includes('low'))    return 'Low';
  return 'Medium';
}

function parseDate(raw: string | number | undefined): string {
  if (!raw) return todayISOString();
  if (typeof raw === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(raw);
    if (date) {
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${date.y}-${m}-${d}`;
    }
  }
  const s = String(raw).trim();
  // Try dd/mm/yyyy
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  // Try yyyy-mm-dd or ISO
  const iso = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  return todayISOString();
}

interface ParsedItem {
  name: string;
  description: string;
  type: ItemType;
  startDate: string;
  endDate: string;
  owner: string;
  status: ItemStatus;
  priority: ItemPriority;
  completionPct: number;
  notes: string;
}

function parseRows(rows: (string | number)[][]): ParsedItem[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => String(h ?? ''));

  const colName    = detectColumn(headers, ['name', 'task', 'activity', 'work item', 'title', 'item', 'description of work']);
  const colDesc    = detectColumn(headers, ['description', 'detail', 'notes', 'summary']);
  const colType    = detectColumn(headers, ['type', 'category', 'work type', 'item type']);
  const colStart   = detectColumn(headers, ['start', 'start date', 'begin', 'from date', 'planned start']);
  const colEnd     = detectColumn(headers, ['end', 'end date', 'finish', 'due date', 'planned end', 'completion date']);
  const colOwner   = detectColumn(headers, ['owner', 'resource', 'assigned to', 'lead', 'responsible', 'assignee']);
  const colStatus  = detectColumn(headers, ['status', 'state', 'progress status']);
  const colPrio    = detectColumn(headers, ['priority', 'importance', 'criticality']);
  const colPct     = detectColumn(headers, ['% complete', 'completion', 'progress', '% done', 'pct', 'percent']);
  const colNotes   = detectColumn(headers, ['notes', 'comments', 'remark', 'observation']);

  const results: ParsedItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const nameVal = colName !== -1 ? String(row[colName] ?? '').trim() : '';
    if (!nameVal) continue;

    results.push({
      name:          nameVal,
      description:   colDesc  !== -1 ? String(row[colDesc]  ?? '') : '',
      type:          parseType(colType !== -1 ? String(row[colType] ?? '') : ''),
      startDate:     parseDate(colStart !== -1 ? row[colStart] : undefined),
      endDate:       parseDate(colEnd   !== -1 ? row[colEnd]   : undefined),
      owner:         colOwner  !== -1 ? String(row[colOwner]  ?? '') : '',
      status:        parseStatus(colStatus !== -1 ? String(row[colStatus] ?? '') : ''),
      priority:      parsePriority(colPrio !== -1 ? String(row[colPrio] ?? '') : ''),
      completionPct: colPct !== -1 ? Math.min(100, Math.max(0, parseInt(String(row[colPct] ?? '0').replace('%', '')) || 0)) : 0,
      notes:         colNotes !== -1 ? String(row[colNotes] ?? '') : '',
    });
  }

  return results;
}

export default function ExcelUploadModal({ onImport, onClose, projectMethodology, projectStartDate, projectEndDate }: ExcelUploadModalProps) {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError('');
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file.');
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'array', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, raw: true });
        const items = parseRows(rows as (string | number)[][]);
        if (items.length === 0) {
          setError('No valid rows found. Ensure your file has a header row and a "Name" or "Task" column.');
          return;
        }
        setParsedItems(items);
        setSelectedRows(new Set(items.map((_, i) => i)));
      } catch {
        setError('Failed to parse file. Please ensure it is a valid Excel or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function toggleRow(idx: number) {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  function toggleAll() {
    if (selectedRows.size === parsedItems.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(parsedItems.map((_, i) => i)));
    }
  }

  function handleImport() {
    const phases = projectMethodology === 'agile' ? DEFAULT_AGILE_PHASES : DEFAULT_WATERFALL_PHASES;
    const selectedParsed = parsedItems.filter((_, i) => selectedRows.has(i));

    // Auto-distribute dates for items that are missing start/end date
    const needsAutoDates = selectedParsed.some(p => !p.startDate || p.startDate === todayISOString());
    const autoDates = needsAutoDates
      ? distributeItemsAcrossRange(selectedParsed, projectStartDate, projectEndDate)
      : null;

    const items: ScheduleItem[] = selectedParsed.map((p, i) => {
      const hasStart = p.startDate && p.startDate !== todayISOString();
      const hasEnd   = p.endDate && p.endDate !== todayISOString() && p.endDate > p.startDate;
      const start = hasStart ? p.startDate : (autoDates ? autoDates[i].startDate : projectStartDate);
      const end   = hasEnd   ? p.endDate   : (autoDates ? autoDates[i].endDate   : projectEndDate);
      return {
        id: generateId(),
        name: p.name,
        description: p.description || undefined,
        type: p.type,
        startDate: start,
        endDate: end > start ? end : daysFromNow(30),
        owner: p.owner || undefined,
        status: p.status,
        priority: p.priority,
        methodology: projectMethodology,
        phases: { ...phases },
        completionPct: p.completionPct,
        notes: p.notes || undefined,
        tags: [],
      };
    });
    onImport(items);
    onClose();
  }

  const downloadTemplate = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const headers = ['Name', 'Description', 'Type', 'Start Date', 'End Date', 'Owner', 'Status', 'Priority', '% Complete', 'Notes'];
    const examples = [
      ['Requirements Gathering', 'Collect all business requirements from stakeholders', 'Requirement', '01/01/2025', '28/02/2025', 'Business Analyst', 'In Progress', 'High', '50', 'Focus on HR and Payroll modules'],
      ['Solution Design', 'Develop functional and technical design documents', 'Design', '01/03/2025', '30/04/2025', 'Solution Architect', 'Not Started', 'High', '0', ''],
      ['Module Development', 'Configure and customise PeopleSoft modules', 'Development', '01/05/2025', '31/08/2025', 'Dev Lead', 'Not Started', 'Critical', '0', ''],
      ['SIT Testing', 'System integration testing across all modules', 'Testing', '01/09/2025', '31/10/2025', 'QA Lead', 'Not Started', 'High', '0', ''],
      ['UAT', 'User acceptance testing with business users', 'Testing', '01/11/2025', '30/11/2025', 'UAT Lead', 'Not Started', 'Critical', '0', ''],
      ['Go-Live', 'Production deployment and cutover', 'Business Process', '15/12/2025', '31/12/2025', 'PMO Lead', 'Not Started', 'Critical', '0', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
    ws['!cols'] = headers.map((_, i) => ({ wch: i === 0 || i === 1 ? 35 : 18 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule Template');
    XLSX.writeFile(wb, 'GanttBuilder_Import_Template.xlsx');
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg, var(--fiscal-navy) 0%, var(--fiscal-navy-light) 100%)' }}>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload size={18} /> Import from Excel / CSV
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">Upload your requirements list to auto-populate the Gantt chart</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {parsedItems.length === 0 ? (
            <div className="p-6 space-y-5">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <FileSpreadsheet size={48} className="mx-auto mb-3 text-blue-400" />
                <div className="text-base font-semibold text-gray-700">
                  Drop your Excel or CSV file here
                </div>
                <div className="text-sm text-gray-400 mt-1">or click to browse</div>
                <div className="text-xs text-gray-400 mt-3">Supports .xlsx, .xls, .csv</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <div className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                  <Table size={15} /> Expected Columns (auto-detected)
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-800">
                  {[
                    ['Name / Task / Activity', 'Required — work item name'],
                    ['Description / Details', 'Optional — item description'],
                    ['Type / Category', 'Optional — maps to item type'],
                    ['Start Date', 'Optional — dd/mm/yyyy or yyyy-mm-dd'],
                    ['End Date / Due Date', 'Optional — dd/mm/yyyy or yyyy-mm-dd'],
                    ['Owner / Resource', 'Optional — person responsible'],
                    ['Status', 'Optional — Not Started / In Progress etc.'],
                    ['Priority', 'Optional — Critical / High / Medium / Low'],
                    ['% Complete', 'Optional — 0–100'],
                    ['Notes / Comments', 'Optional — additional context'],
                  ].map(([col, desc]) => (
                    <div key={col} className="flex flex-col">
                      <span className="font-semibold">{col}</span>
                      <span className="text-blue-600">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download template */}
              <div className="text-center">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors"
                >
                  <FileSpreadsheet size={15} />
                  Download Import Template
                </button>
                <div className="text-xs text-gray-400 mt-1">Includes example rows with the correct format</div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* File info */}
              <div className="flex items-center justify-between mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle2 size={16} />
                  <span className="font-semibold">{fileName}</span>
                  <span className="text-green-600">— {parsedItems.length} rows detected</span>
                </div>
                <button
                  onClick={() => { setParsedItems([]); setFileName(''); setSelectedRows(new Set()); }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Upload different file
                </button>
              </div>

              {/* Preview table */}
              <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                <span>Select rows to import ({selectedRows.size} of {parsedItems.length} selected)</span>
                <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                  {selectedRows.size === parsedItems.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--fiscal-navy)' }} className="text-white">
                        <th className="px-2 py-2 w-8">
                          <input type="checkbox"
                            checked={selectedRows.size === parsedItems.length}
                            onChange={toggleAll}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">Name</th>
                        <th className="px-3 py-2 text-left font-semibold">Type</th>
                        <th className="px-3 py-2 text-left font-semibold">Start</th>
                        <th className="px-3 py-2 text-left font-semibold">End</th>
                        <th className="px-3 py-2 text-left font-semibold">Owner</th>
                        <th className="px-3 py-2 text-left font-semibold">Status</th>
                        <th className="px-3 py-2 text-left font-semibold">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedItems.map((item, i) => (
                        <tr
                          key={i}
                          onClick={() => toggleRow(i)}
                          className={`border-t border-gray-100 cursor-pointer transition-colors ${
                            selectedRows.has(i) ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-2 py-2 text-center">
                            <input type="checkbox" checked={selectedRows.has(i)} onChange={() => toggleRow(i)} className="cursor-pointer" onClick={e => e.stopPropagation()} />
                          </td>
                          <td className="px-3 py-1.5 font-medium text-gray-800 max-w-[180px] truncate">{item.name}</td>
                          <td className="px-3 py-1.5 text-gray-600">{item.type}</td>
                          <td className="px-3 py-1.5 text-gray-500">{item.startDate}</td>
                          <td className="px-3 py-1.5 text-gray-500">{item.endDate}</td>
                          <td className="px-3 py-1.5 text-gray-500">{item.owner || '—'}</td>
                          <td className="px-3 py-1.5 text-gray-500">{item.status}</td>
                          <td className="px-3 py-1.5 text-gray-500">{item.priority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Dates are optional — items without dates will be auto-distributed evenly across the project timeline ({projectStartDate} → {projectEndDate}).
                Phase weights are set to project defaults. You can edit individual items after import.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          {parsedItems.length > 0 && (
            <button
              onClick={handleImport}
              disabled={selectedRows.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--fiscal-navy)' }}
            >
              <Plus size={15} />
              Import {selectedRows.size} Item{selectedRows.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
