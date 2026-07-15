export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const PROJECT_STATUS = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
};

export const STATUS_COLORS = {
  PLANNING: 'var(--color-status-planning)',
  ACTIVE: 'var(--color-status-active)',
  COMPLETED: 'var(--color-status-completed)',
};

export const STATUS_LABELS = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

export const ALLOCATION_THRESHOLDS = {
  MAX: 100,
  WARNING: 80,
  DANGER: 90,
};

export const ALLOCATION_COLORS = {
  LOW: 'var(--color-success)',
  MEDIUM: 'var(--color-warning)',
  HIGH: 'var(--color-danger)',
};

export const PAGE_SIZE = 20;

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  {
    label: 'Employees',
    icon: '👥',
    children: [
      { path: '/employees', label: 'All Employees' },
      { path: '/employees/new', label: 'Add Employee' },
    ],
  },
  {
    label: 'Projects',
    icon: '📁',
    children: [
      { path: '/projects', label: 'All Projects' },
      { path: '/projects/new', label: 'Add Project' },
    ],
  },
  {
    label: 'Allocations',
    icon: '🔗',
    children: [
      { path: '/allocations', label: 'All Allocations' },
      { path: '/allocations/new', label: 'New Allocation' },
    ],
  },
  {
    label: 'Workload',
    icon: '📋',
    path: '/employees/:id/workload',
    dynamic: true,
  },
  {
    label: 'Reports',
    icon: '📈',
    children: [
      { path: '/reports/utilization', label: 'Utilization' },
      { path: '/reports/available', label: 'Available Resources' },
      { path: '/reports/overloaded', label: 'Overloaded' },
    ],
  },
  {
    label: 'AI Tools',
    icon: '🤖',
    children: [
      { path: '/ai/recommend', label: 'Recommend Resources' },
      { path: '/ai/risk-analysis', label: 'Risk Analysis' },
    ],
  },
];

export const SEVERITY_COLORS = {
  HIGH: 'var(--color-danger)',
  MEDIUM: 'var(--color-warning)',
  LOW: 'var(--color-info)',
};
