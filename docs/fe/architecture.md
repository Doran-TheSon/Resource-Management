# Frontend Architecture

> Kiến trúc tổng thể cho Frontend React App — Resource Allocation Management System

---

## 1. Tech Stack

| Layer | Technology | Mục đích |
|-------|-----------|----------|
| **UI Library** | React 19 | Component-based UI |
| **Build Tool** | Vite 8 | Fast HMR, optimized builds |
| **Routing** | react-router-dom v7 | Client-side routing |
| **HTTP Client** | Fetch API (native) | REST API calls |
| **Styling** | CSS Modules + custom properties | Scoped styles, theming |
| **Charts** | Recharts (optional) | Utilization charts |
| **Lint** | oxlint | Code quality |

---

## 2. Folder Structure

```
fe/src/
├── api/                    # API layer
│   ├── client.js           # Axios/fetch wrapper with interceptors
│   ├── employeeApi.js      # Employee endpoints
│   ├── projectApi.js       # Project endpoints
│   ├── allocationApi.js    # Allocation endpoints
│   ├── reportApi.js        # Report endpoints
│   └── aiApi.js            # AI endpoints
├── components/             # Shared components
│   ├── layout/
│   │   ├── AppLayout.jsx       # Main layout: sidebar + header + content
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   ├── Header.jsx          # Top header bar
│   │   └── PageHeader.jsx      # Page title + actions
│   ├── common/
│   │   ├── DataTable.jsx       # Reusable table with sort/filter/page
│   │   ├── FormField.jsx       # Form input wrapper with label + error
│   │   ├── StatusBadge.jsx     # Project status badge
│   │   ├── AllocationGauge.jsx # % allocation bar
│   │   ├── LoadingSpinner.jsx  # Loading indicator
│   │   ├── Toast.jsx           # Notification toast
│   │   ├── ConfirmDialog.jsx   # Confirmation modal
│   │   ├── PageError.jsx       # Error state
│   │   └── EmptyState.jsx      # Empty data state
│   └── forms/
│       ├── EmployeeForm.jsx    # Employee create/edit form
│       ├── ProjectForm.jsx     # Project create/edit form
│       ├── AllocationForm.jsx  # Allocation create/edit form
│       └── AiQueryForm.jsx     # AI query input form
├── pages/
│   ├── Dashboard/
│   │   └── DashboardPage.jsx
│   ├── employees/
│   │   ├── EmployeeListPage.jsx
│   │   └── EmployeeFormPage.jsx
│   ├── projects/
│   │   ├── ProjectListPage.jsx
│   │   └── ProjectFormPage.jsx
│   ├── allocations/
│   │   ├── AllocationListPage.jsx
│   │   └── AllocationFormPage.jsx
│   ├── workload/
│   │   └── WorkloadPage.jsx
│   ├── reports/
│   │   ├── UtilizationReportPage.jsx
│   │   ├── AvailableResourcesPage.jsx
│   │   └── OverloadedPage.jsx
│   └── ai/
│       ├── AiRecommendPage.jsx
│       └── AiRiskAnalysisPage.jsx
├── hooks/
│   ├── useApi.js            # Generic fetch hook
│   └── useForm.js           # Form state management
├── utils/
│   ├── constants.js         # Status enums, colors, thresholds
│   ├── validators.js        # Form validation helpers
│   └── formatters.js        # Date, % formatting
├── styles/
│   ├── variables.css        # CSS custom properties (theme)
│   ├── reset.css            # CSS reset
│   ├── global.css           # Global styles
│   └── animations.css       # Reusable keyframe animations
├── App.jsx                  # Root component with Router
├── App.css                  # App-level styles
├── main.jsx                 # Entry point
└── index.css                # Base styles
```

---

## 3. Layer Architecture

```
┌─────────────────────────────────────────┐
│            React Components             │
│  (Pages, Layouts, Shared Components)    │
├─────────────────────────────────────────┤
│            Custom Hooks                 │
│  (useApi, useForm — state + lifecycle)  │
├─────────────────────────────────────────┤
│              API Layer                  │
│  (client.js + resource-specific APIs)   │
├─────────────────────────────────────────┤
│           REST API (BE)                 │
│  http://localhost:8080/api/v1/...       │
└─────────────────────────────────────────┘
```

### Data Flow Pattern

```
User Action → Component → useApi hook → API function → fetch → BE
                                                              │
Component ← setState ← useApi ← parse response ←←←←←←←←←←←←┘
```

### Component - Hook - API relationship

- **Pages** use `useApi` hook for data fetching
- `useApi` calls specific API functions from `api/` layer
- API functions use shared `client.js` for HTTP calls
- `client.js` handles: base URL, headers, error normalization, token (future)

---

## 4. State Management Approach

**No global state library** (Redux/Zustand) — keeping it simple:

| State Type | Location | Example |
|-----------|----------|---------|
| Server data | `useApi` hook (local state) | Employee list, project list |
| Form state | `useForm` hook (local state) | Form field values, errors |
| UI state | Component `useState` | Modal open/close, active tab |
| URL state | React Router params | `:id`, query params for filters |

For a project this size, prop drilling is minimal — each page is self-contained.

---

## 5. Animation Strategy

Using **CSS-only animations** (no Framer Motion dependency):

| Effect | Technique | Usage |
|--------|-----------|-------|
| Page transitions | `@keyframes fadeIn + slideUp` | Content wrapper |
| Sidebar | CSS `transition` on width | Collapse/expand |
| Table rows | `@keyframes fadeInRow` | Staggered appearance |
| Modal/Dialog | `transition` opacity + transform | Open/close |
| Notification toast | `@keyframes slideInRight` | Auto dismiss |
| Progress bar | CSS `transition` on width | Percentage change |
| Hover effects | `transition` on transform/color | Cards, buttons, rows |
| Loading shimmer | `@keyframes shimmer` | Skeleton loading |

All animations respect `prefers-reduced-motion`.

---

## 6. Theme System

Using **CSS Custom Properties** for theming:

```css
:root {
  /* Colors */
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;

  /* Neutral */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

---

## 7. Routing Strategy

Using **React Router v7** with nested layouts:

```
<BrowserRouter>
  <Routes>
    <Route element={<AppLayout />}>       ← Sidebar + Header wrapper
      <Route index element={<DashboardPage />} />
      <Route path="employees">
        <Route index element={<EmployeeListPage />} />
        <Route path="new" element={<EmployeeFormPage />} />
        <Route path=":id/edit" element={<EmployeeFormPage />} />
      </Route>
      <Route path="projects">
        <Route index element={<ProjectListPage />} />
        <Route path="new" element={<ProjectFormPage />} />
        <Route path=":id/edit" element={<ProjectFormPage />} />
      </Route>
      <Route path="allocations">
        <Route index element={<AllocationListPage />} />
        <Route path="new" element={<AllocationFormPage />} />
        <Route path=":id/edit" element={<AllocationFormPage />} />
      </Route>
      <Route path="employees/:id/workload" element={<WorkloadPage />} />
      <Route path="reports">
        <Route path="utilization" element={<UtilizationReportPage />} />
        <Route path="available" element={<AvailableResourcesPage />} />
        <Route path="overloaded" element={<OverloadedPage />} />
      </Route>
      <Route path="ai">
        <Route path="recommend" element={<AiRecommendPage />} />
        <Route path="risk-analysis" element={<AiRiskAnalysisPage />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
```

---

## 8. Error Handling

| Scenario | UX |
|----------|-----|
| API call fails (network) | Toast notification + retry button |
| API returns 4xx | Show field errors on form OR toast |
| API returns 5xx | Generic error page with "Try again" |
| Empty data | EmptyState illustration + CTA |
| Loading | Skeleton or spinner per section |
| Not found (404) | "Resource not found" message |

---

## 9. Performance Considerations

| Pattern | Implementation |
|---------|---------------|
| Lazy loading | `React.lazy()` for page components |
| Debounced search | 300ms debounce on filter inputs |
| Pagination | Server-side via BE `page`/`size` params |
| CSS animations | GPU-accelerated (`transform`, `opacity`) |
| No unnecessary re-renders | Keep state close to where it's used |
