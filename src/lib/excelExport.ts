import * as XLSX from 'xlsx-js-style';
import {
  Project, ScheduleItem, ITEM_TYPE_COLORS, PHASE_LABELS,
  WATERFALL_PHASES, AGILE_PHASES, PHASE_COLORS,
} from './types';
import { formatDate, getDurationDays, getWeeksInRange, getProjectDateRange, isItemActiveInWeek } from './utils';
import { format } from 'date-fns';

const NAVY        = '1B3A6B';
const NAVY_DARK   = '122951';
const GOLD        = 'C4872B';
const ORANGE      = 'E8822E';
const LIGHT_BLUE  = 'EEF3F8';
const WHITE       = 'FFFFFF';
const DARK_TEXT   = '1F2937';
const LIGHT_TEXT  = 'F0F4F8';

function hex6(hex: string): string {
  return hex.replace('#', '').padStart(6, '0').slice(0, 6);
}

function border(color = 'CCCCCC', style: string = 'thin') {
  return { style, color: { rgb: color } };
}

function makeStyle(
  bgColor = WHITE,
  fontColor = DARK_TEXT,
  bold = false,
  size = 10,
  hAlign: string = 'left',
  wrapText = true,
) {
  return {
    fill: { patternType: 'solid', fgColor: { rgb: hex6(bgColor) } },
    font: { color: { rgb: fontColor }, bold, sz: size, name: 'Calibri' },
    alignment: { horizontal: hAlign, vertical: 'center', wrapText },
    border: {
      top:    border(),
      bottom: border(),
      left:   border(),
      right:  border(),
    },
  };
}

function headerStyle(bg = NAVY, fg = WHITE, size = 11, hAlign = 'center') {
  return makeStyle(bg, fg, true, size, hAlign);
}

function dataStyle(bg = WHITE, bold = false, hAlign = 'left') {
  return makeStyle(bg, DARK_TEXT, bold, 10, hAlign);
}

function titleStyle() {
  return {
    font: { bold: true, sz: 16, color: { rgb: NAVY }, name: 'Calibri' },
    alignment: { horizontal: 'left', vertical: 'center' },
  };
}

function cell(value: string | number, style?: object): XLSX.CellObject {
  const t = typeof value === 'number' ? 'n' : 's';
  return { v: value, t, s: style } as XLSX.CellObject;
}

function emptyCell(bg = WHITE): XLSX.CellObject {
  return { v: '', t: 's', s: makeStyle(bg) } as XLSX.CellObject;
}

// ─── Summary Sheet ────────────────────────────────────────────────────────────

function buildSummarySheet(project: Project): { ws: XLSX.WorkSheet; sheetName: string } {
  const headers = [
    '#', 'Item Name', 'Type', 'Owner', 'Status', 'Priority',
    'Methodology', 'Start Date', 'End Date', 'Duration (Days)', '% Complete', 'Notes',
  ];

  const aoa: XLSX.CellObject[][] = [];

  // Title
  aoa.push([
    { v: `${project.name} — Schedule Summary`, t: 's', s: titleStyle() },
    ...Array(headers.length - 1).fill(emptyCell()),
  ]);

  // Sub-title row
  aoa.push([
    { v: `Client: ${project.client || '—'}   |   Programme: ${project.programme || '—'}   |   Methodology: ${project.methodology.charAt(0).toUpperCase() + project.methodology.slice(1)}`, t: 's', s: { font: { sz: 11, color: { rgb: '444444' }, italic: true, name: 'Calibri' }, alignment: { horizontal: 'left', vertical: 'center' } } },
    ...Array(headers.length - 1).fill(emptyCell()),
  ]);

  aoa.push(Array(headers.length).fill(emptyCell())); // spacer

  // Header row
  aoa.push(headers.map((h, i) => cell(h, headerStyle(i === 0 ? NAVY_DARK : NAVY))));

  // Status color map
  const STATUS_BG: Record<string, string> = {
    'Complete':    'D1FAE5',
    'In Progress': 'DBEAFE',
    'At Risk':     'FEE2E2',
    'On Hold':     'FEF9C3',
    'Not Started': 'F3F4F6',
  };

  project.items.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? WHITE : LIGHT_BLUE;
    const typeHex = hex6(ITEM_TYPE_COLORS[item.type]?.hex || '#666666');
    const statusBg = STATUS_BG[item.status] || 'F3F4F6';

    aoa.push([
      cell(`${idx + 1}`, dataStyle(rowBg, true, 'center')),
      cell(item.name, dataStyle(rowBg, true)),
      { v: item.type, t: 's', s: { ...dataStyle(rowBg), font: { color: { rgb: typeHex }, bold: true, sz: 10, name: 'Calibri' }, fill: { patternType: 'solid', fgColor: { rgb: hex6(ITEM_TYPE_COLORS[item.type]?.hex + '22' || 'EEEEEE') } } } } as XLSX.CellObject,
      cell(item.owner || '—', dataStyle(rowBg)),
      { v: item.status, t: 's', s: { ...dataStyle(statusBg, true, 'center') } } as XLSX.CellObject,
      cell(item.priority, dataStyle(rowBg, false, 'center')),
      cell(item.methodology.charAt(0).toUpperCase() + item.methodology.slice(1), dataStyle(rowBg, false, 'center')),
      cell(formatDate(item.startDate, 'dd/MM/yyyy'), dataStyle(rowBg, false, 'center')),
      cell(formatDate(item.endDate, 'dd/MM/yyyy'), dataStyle(rowBg, false, 'center')),
      cell(getDurationDays(item.startDate, item.endDate), dataStyle(rowBg, false, 'center')),
      cell(`${item.completionPct}%`, { ...dataStyle(rowBg, true, 'center'), font: { color: { rgb: item.completionPct === 100 ? '16A34A' : item.completionPct > 50 ? '2563EB' : DARK_TEXT }, bold: true, sz: 10, name: 'Calibri' } }),
      cell(item.notes || '', dataStyle(rowBg)),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    { wch: 5 }, { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
    { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 12 }, { wch: 30 },
  ];
  ws['!rows'] = [{ hpx: 30 }, { hpx: 22 }, { hpx: 8 }, { hpx: 26 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
  ];

  return { ws, sheetName: 'Schedule Summary' };
}

// ─── Gantt Sheet ──────────────────────────────────────────────────────────────

function buildGanttSheet(project: Project): { ws: XLSX.WorkSheet; sheetName: string } {
  const { start, end } = getProjectDateRange(project.items);
  const weeks = getWeeksInRange(start, end);

  const fixedCols = ['Item Name', 'Type', 'Owner', 'Start', 'End', '%'];
  const headers = [...fixedCols, ...weeks.map(w => format(w, 'dd/MM'))];

  const aoa: XLSX.CellObject[][] = [];

  // Title
  aoa.push([
    { v: `${project.name} — Weekly Gantt Chart`, t: 's', s: titleStyle() },
    ...Array(headers.length - 1).fill(emptyCell()),
  ]);
  aoa.push(Array(headers.length).fill(emptyCell()));

  // Month header row
  const monthRow: XLSX.CellObject[] = fixedCols.map(() =>
    cell('', headerStyle(LIGHT_BLUE, NAVY))
  );
  let prevMonth = '';
  weeks.forEach(w => {
    const month = format(w, 'MMMM yyyy');
    if (month !== prevMonth) {
      monthRow.push(cell(month, headerStyle(NAVY_DARK)));
      prevMonth = month;
    } else {
      monthRow.push(cell('', headerStyle(NAVY_DARK)));
    }
  });
  aoa.push(monthRow);

  // Week header row
  const weekRow = headers.map((h, i) =>
    cell(h, headerStyle(i < fixedCols.length ? NAVY : '2C5AA0', WHITE, 9, 'center'))
  );
  aoa.push(weekRow);

  // Data rows
  project.items.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? WHITE : LIGHT_BLUE;
    const typeHex = hex6(ITEM_TYPE_COLORS[item.type]?.hex || '#666666');

    const row: XLSX.CellObject[] = [
      cell(item.name, dataStyle(rowBg, true)),
      { v: item.type, t: 's', s: { ...dataStyle(rowBg), font: { color: { rgb: typeHex }, bold: true, sz: 9, name: 'Calibri' } } } as XLSX.CellObject,
      cell(item.owner || '—', dataStyle(rowBg)),
      cell(formatDate(item.startDate, 'dd/MM/yyyy'), dataStyle(rowBg, false, 'center')),
      cell(formatDate(item.endDate, 'dd/MM/yyyy'), dataStyle(rowBg, false, 'center')),
      cell(`${item.completionPct}%`, dataStyle(rowBg, true, 'center')),
    ];

    weeks.forEach(weekStart => {
      const active = isItemActiveInWeek(item, weekStart);
      if (active) {
        const typeColor = hex6(ITEM_TYPE_COLORS[item.type]?.hex || '#666666');
        row.push({
          v: ' ',
          t: 's',
          s: {
            fill: { patternType: 'solid', fgColor: { rgb: typeColor } },
            font: { color: { rgb: typeColor }, sz: 8 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: { right: border('FFFFFF', 'hair') },
          },
        } as XLSX.CellObject);
      } else {
        row.push(emptyCell(rowBg));
      }
    });

    aoa.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 7 },
    ...weeks.map(() => ({ wch: 4.5 })),
  ];
  ws['!rows'] = [{ hpx: 30 }, { hpx: 8 }, { hpx: 22 }, { hpx: 20 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
  ];

  return { ws, sheetName: 'Gantt Chart' };
}

// ─── Phase Detail Sheet ───────────────────────────────────────────────────────

function buildPhaseSheet(project: Project): { ws: XLSX.WorkSheet; sheetName: string } {
  const isWaterfall = project.methodology !== 'agile';
  const phaseKeys = isWaterfall ? WATERFALL_PHASES : AGILE_PHASES;
  const phaseCols = phaseKeys.map(p => PHASE_LABELS[p] || p);

  const headers = [
    '#', 'Item Name', 'Type', 'Methodology',
    ...phaseCols,
    'Total %',
    'Duration (Days)', 'Start Date', 'End Date',
  ];

  const aoa: XLSX.CellObject[][] = [];

  // Title
  aoa.push([
    { v: `${project.name} — Phase Detail Breakdown`, t: 's', s: titleStyle() },
    ...Array(headers.length - 1).fill(emptyCell()),
  ]);
  aoa.push(Array(headers.length).fill(emptyCell()));

  // Phase group header
  const groupRow: XLSX.CellObject[] = [
    emptyCell(LIGHT_BLUE), emptyCell(LIGHT_BLUE), emptyCell(LIGHT_BLUE), emptyCell(LIGHT_BLUE),
    cell(isWaterfall ? 'WATERFALL / PEOPLESOFT PHASES' : 'AGILE PHASES', headerStyle(ORANGE, WHITE)),
    ...Array(phaseCols.length - 1).fill(cell('', headerStyle(ORANGE, WHITE))),
    emptyCell(LIGHT_BLUE),
    emptyCell(LIGHT_BLUE), emptyCell(LIGHT_BLUE), emptyCell(LIGHT_BLUE),
  ];
  aoa.push(groupRow);

  // Column headers — phase headers coloured by phase
  aoa.push(headers.map((h, i) => {
    if (i >= 4 && i < 4 + phaseCols.length) {
      const phaseKey = phaseKeys[i - 4];
      const phaseColor = hex6(PHASE_COLORS[phaseKey] || '#666666');
      return cell(h, headerStyle(phaseColor, WHITE, 10, 'center'));
    }
    return cell(h, headerStyle(NAVY));
  }));

  project.items.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? WHITE : LIGHT_BLUE;
    const typeHex = hex6(ITEM_TYPE_COLORS[item.type]?.hex || '#666666');
    const phases = item.phases as Record<string, number>;
    const total = phaseKeys.reduce((s, p) => s + (phases[p] || 0), 0);

    const row: XLSX.CellObject[] = [
      cell(idx + 1, dataStyle(rowBg, true, 'center')),
      cell(item.name, dataStyle(rowBg, true)),
      { v: item.type, t: 's', s: { ...dataStyle(rowBg), font: { color: { rgb: typeHex }, bold: true, sz: 10, name: 'Calibri' } } } as XLSX.CellObject,
      cell(item.methodology.charAt(0).toUpperCase() + item.methodology.slice(1), dataStyle(rowBg, false, 'center')),
      ...phaseKeys.map(p => {
        const pct = phases[p] || 0;
        const phaseColor = hex6(PHASE_COLORS[p] || '#666666');
        if (pct > 0) {
          return { v: `${pct}%`, t: 's', s: { ...dataStyle(rowBg, true, 'center'), font: { color: { rgb: phaseColor }, bold: true, sz: 10, name: 'Calibri' } } } as XLSX.CellObject;
        }
        return cell('—', dataStyle(rowBg, false, 'center'));
      }),
      cell(total > 0 ? `${total}%` : '—', dataStyle(rowBg, true, 'center')),
      cell(getDurationDays(item.startDate, item.endDate), dataStyle(rowBg, false, 'center')),
      cell(formatDate(item.startDate, 'dd/MM/yyyy'), dataStyle(rowBg, false, 'center')),
      cell(formatDate(item.endDate, 'dd/MM/yyyy'), dataStyle(rowBg, false, 'center')),
    ];

    aoa.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    { wch: 5 }, { wch: 35 }, { wch: 18 }, { wch: 14 },
    ...phaseCols.map(() => ({ wch: 17 })),
    { wch: 10 },
    { wch: 16 }, { wch: 14 }, { wch: 14 },
  ];
  ws['!rows'] = [{ hpx: 30 }, { hpx: 8 }, { hpx: 24 }, { hpx: 26 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 4 + phaseCols.length - 1 } },
  ];

  return { ws, sheetName: 'Phase Detail' };
}

// ─── Phase Weights Summary Sheet ──────────────────────────────────────────────

function buildPhaseWeightsSheet(project: Project): { ws: XLSX.WorkSheet; sheetName: string } {
  const isWaterfall = project.methodology !== 'agile';
  const phaseKeys = isWaterfall ? WATERFALL_PHASES : AGILE_PHASES;
  const weights = project.phaseWeights as Record<string, number>;

  const aoa: XLSX.CellObject[][] = [];

  aoa.push([
    { v: `${project.name} — Phase Weights & Timeline`, t: 's', s: titleStyle() },
    emptyCell(), emptyCell(), emptyCell(),
  ]);
  aoa.push([emptyCell(), emptyCell(), emptyCell(), emptyCell()]);

  aoa.push([
    cell('SDLC Phase', headerStyle(NAVY)),
    cell('Weight %', headerStyle(NAVY, WHITE, 11, 'center')),
    cell('Phase Colour', headerStyle(NAVY, WHITE, 11, 'center')),
    cell('Description', headerStyle(NAVY)),
  ]);

  const phaseDescriptions: Record<string, string> = {
    initiation:     'Project charter, governance setup, team onboarding',
    fitGap:         'Analysis of business requirements vs system capabilities',
    design:         'Technical and functional solution design',
    development:    'Configuration, customisation, and development',
    unitTesting:    'Developer-level testing of individual components',
    sit:            'End-to-end system integration testing',
    uat:            'Business user acceptance and sign-off testing',
    training:       'End user training delivery and documentation',
    deployment:     'Production cutover and go-live execution',
    postGoLive:     'Hypercare, stabilisation, and handover to support',
    sprintPlanning: 'Sprint backlog planning and estimation',
    sprintReview:   'Sprint demo and stakeholder review',
    qa:             'QA testing and defect resolution',
    release:        'Release to production and deployment',
  };

  phaseKeys.forEach((key, idx) => {
    const rowBg = idx % 2 === 0 ? WHITE : LIGHT_BLUE;
    const phaseColor = hex6(PHASE_COLORS[key] || '#666666');
    const w = weights[key] || 0;

    aoa.push([
      cell(PHASE_LABELS[key] || key, dataStyle(rowBg, true)),
      { v: `${w}%`, t: 's', s: { ...dataStyle(rowBg, true, 'center'), font: { color: { rgb: phaseColor }, bold: true, sz: 12, name: 'Calibri' } } } as XLSX.CellObject,
      { v: '■■■', t: 's', s: { ...dataStyle(rowBg, false, 'center'), font: { color: { rgb: phaseColor }, bold: true, sz: 14, name: 'Calibri' } } } as XLSX.CellObject,
      cell(phaseDescriptions[key] || '', dataStyle(rowBg)),
    ]);
  });

  const total = phaseKeys.reduce((s, k) => s + (weights[k] || 0), 0);
  aoa.push([
    cell('TOTAL', headerStyle(NAVY_DARK)),
    cell(`${total}%`, headerStyle(total === 100 ? '16A34A' : 'DC2626')),
    cell('', headerStyle(NAVY_DARK)),
    cell(total === 100 ? 'Phase weights are correctly balanced to 100%' : `Warning: weights sum to ${total}%, not 100%`, headerStyle(total === 100 ? '16A34A' : 'DC2626')),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 14 }, { wch: 50 }];
  ws['!rows'] = [{ hpx: 30 }, { hpx: 8 }, { hpx: 24 }];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

  return { ws, sheetName: 'Phase Weights' };
}

// ─── Export Entry Point ───────────────────────────────────────────────────────

export function exportToExcel(project: Project): void {
  const wb = XLSX.utils.book_new();

  const { ws: s1, sheetName: n1 } = buildSummarySheet(project);
  const { ws: s2, sheetName: n2 } = buildGanttSheet(project);
  const { ws: s3, sheetName: n3 } = buildPhaseSheet(project);
  const { ws: s4, sheetName: n4 } = buildPhaseWeightsSheet(project);

  XLSX.utils.book_append_sheet(wb, s1, n1);
  XLSX.utils.book_append_sheet(wb, s2, n2);
  XLSX.utils.book_append_sheet(wb, s3, n3);
  XLSX.utils.book_append_sheet(wb, s4, n4);

  const filename = `${(project.name || 'Project').replace(/[^a-z0-9]/gi, '_')}_Gantt_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
