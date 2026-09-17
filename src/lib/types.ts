export type ItemType =
  | 'Epic'
  | 'Story'
  | 'Task'
  | 'Requirement'
  | 'Design'
  | 'Development'
  | 'Testing'
  | 'Business Process';

export type SDLCMethodology = 'waterfall' | 'agile' | 'hybrid';

export type ItemStatus = 'Not Started' | 'In Progress' | 'Complete' | 'On Hold' | 'At Risk';
export type ItemPriority = 'Critical' | 'High' | 'Medium' | 'Low';

// Standard government ERP waterfall phases
export interface WaterfallPhases {
  requirementGathering: number;
  design: number;
  build: number;
  functionalTest: number;
  uat: number;
  uuat: number;
  deployment: number;
}

export interface AgilePhases {
  sprintPlanning: number;
  development: number;
  sprintReview: number;
  qa: number;
  release: number;
}

export interface ScheduleItem {
  id: string;
  name: string;
  description?: string;
  type: ItemType;
  startDate: string;
  endDate: string;
  owner?: string;
  status: ItemStatus;
  priority: ItemPriority;
  methodology: SDLCMethodology;
  phases: Partial<WaterfallPhases & AgilePhases>;
  dependencies?: string[];
  completionPct: number;
  notes?: string;
  tags?: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client: string;
  programme: string;
  startDate: string;
  endDate: string;
  methodology: SDLCMethodology;
  phaseWeights: Partial<WaterfallPhases & AgilePhases>;
  items: ScheduleItem[];
  createdAt: string;
  updatedAt: string;
}

export const ITEM_TYPE_COLORS: Record<ItemType, { bg: string; text: string; light: string; hex: string }> = {
  'Epic':             { bg: 'bg-purple-600',  text: 'text-purple-700',  light: 'bg-purple-50',  hex: '#7C3AED' },
  'Story':            { bg: 'bg-blue-600',    text: 'text-blue-700',    light: 'bg-blue-50',    hex: '#2563EB' },
  'Task':             { bg: 'bg-sky-600',     text: 'text-sky-700',     light: 'bg-sky-50',     hex: '#0284C7' },
  'Requirement':      { bg: 'bg-orange-600',  text: 'text-orange-700',  light: 'bg-orange-50',  hex: '#EA580C' },
  'Design':           { bg: 'bg-pink-600',    text: 'text-pink-700',    light: 'bg-pink-50',    hex: '#DB2777' },
  'Development':      { bg: 'bg-green-600',   text: 'text-green-700',   light: 'bg-green-50',   hex: '#16A34A' },
  'Testing':          { bg: 'bg-red-600',     text: 'text-red-700',     light: 'bg-red-50',     hex: '#DC2626' },
  'Business Process': { bg: 'bg-indigo-600',  text: 'text-indigo-700',  light: 'bg-indigo-50',  hex: '#4338CA' },
};

export const STATUS_COLORS: Record<ItemStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-700 border-gray-300',
  'In Progress':  'bg-blue-100 text-blue-700 border-blue-300',
  'Complete':     'bg-green-100 text-green-700 border-green-300',
  'On Hold':      'bg-yellow-100 text-yellow-700 border-yellow-300',
  'At Risk':      'bg-red-100 text-red-700 border-red-300',
};

export const PRIORITY_COLORS: Record<ItemPriority, string> = {
  'Critical': 'bg-red-100 text-red-800',
  'High':     'bg-orange-100 text-orange-800',
  'Medium':   'bg-yellow-100 text-yellow-800',
  'Low':      'bg-gray-100 text-gray-600',
};

export const WATERFALL_PHASES: (keyof WaterfallPhases)[] = [
  'requirementGathering', 'design', 'build', 'functionalTest', 'uat', 'uuat', 'deployment',
];

export const AGILE_PHASES: (keyof AgilePhases)[] = [
  'sprintPlanning', 'development', 'sprintReview', 'qa', 'release',
];

export const PHASE_LABELS: Record<string, string> = {
  requirementGathering: 'Requirement Gathering',
  design:               'Design',
  build:                'Build',
  functionalTest:       'Functional Test',
  uat:                  'UAT',
  uuat:                 'UUAT',
  deployment:           'Deployment',
  sprintPlanning:       'Sprint Planning',
  development:          'Development',
  sprintReview:         'Sprint Review',
  qa:                   'QA Testing',
  release:              'Release',
};

export const PHASE_COLORS: Record<string, string> = {
  requirementGathering: '#6366F1',
  design:               '#EC4899',
  build:                '#22C55E',
  functionalTest:       '#F97316',
  uat:                  '#EF4444',
  uuat:                 '#F59E0B',
  deployment:           '#14B8A6',
  sprintPlanning:       '#6366F1',
  sprintReview:         '#F59E0B',
  qa:                   '#EF4444',
  release:              '#14B8A6',
};

export const DEFAULT_WATERFALL_PHASES: WaterfallPhases = {
  requirementGathering: 20,
  design:               15,
  build:                30,
  functionalTest:       15,
  uat:                  10,
  uuat:                  5,
  deployment:            5,
};

export const DEFAULT_AGILE_PHASES: AgilePhases = {
  sprintPlanning: 10,
  development:    50,
  sprintReview:   15,
  qa:             20,
  release:         5,
};
