# Router Configuration

> Chi tiết routing configuration cho FE React App

---

## 1. Route Table

| Path | Component | Type | Auth | Nav Menu |
|------|-----------|------|------|----------|
| `/` | `DashboardPage` | Public | No | ✅ |
| `/employees` | `EmployeeListPage` | Public | No | ✅ |
| `/employees/new` | `EmployeeFormPage` | Public | No | ✅ (sub) |
| `/employees/:id/edit` | `EmployeeFormPage` | Public | No | — |
| `/projects` | `ProjectListPage` | Public | No | ✅ |
| `/projects/new` | `ProjectFormPage` | Public | No | ✅ (sub) |
| `/projects/:id/edit` | `ProjectFormPage` | Public | No | — |
| `/allocations` | `AllocationListPage` | Public | No | ✅ |
| `/allocations/new` | `AllocationFormPage` | Public | No | ✅ (sub) |
| `/allocations/:id/edit` | `AllocationFormPage` | Public | No | — |
| `/employees/:id/workload` | `WorkloadPage` | Public | No | ✅ |
| `/reports/utilization` | `UtilizationReportPage` | Public | No | ✅ |
| `/reports/available` | `AvailableResourcesPage` | Public | No | ✅ |
| `/reports/overloaded` | `OverloadedPage` | Public | No | ✅ |
| `/ai/recommend` | `AiRecommendPage` | Public | No | ✅ |
| `/ai/risk-analysis` | `AiRiskAnalysisPage` | Public | No | ✅ |
| `*` | NotFound page | — | — | — |

---

## 2. Router Structure

```jsx
<BrowserRouter>
  <Routes>
    <Route element={<AppLayout />}>
      {/* Dashboard */}
      <Route index element={<DashboardPage />} />

      {/* Employees */}
      <Route path="employees">
        <Route index element={<EmployeeListPage />} />
        <Route path="new" element={<EmployeeFormPage />} />
        <Route path=":id/edit" element={<EmployeeFormPage />} />
      </Route>

      {/* Projects */}
      <Route path="projects">
        <Route index element={<ProjectListPage />} />
        <Route path="new" element={<ProjectFormPage />} />
        <Route path=":id/edit" element={<ProjectFormPage />} />
      </Route>

      {/* Allocations */}
      <Route path="allocations">
        <Route index element={<AllocationListPage />} />
        <Route path="new" element={<AllocationFormPage />} />
        <Route path=":id/edit" element={<AllocationFormPage />} />
      </Route>

      {/* Workload */}
      <Route path="employees/:id/workload" element={<WorkloadPage />} />

      {/* Reports */}
      <Route path="reports">
        <Route path="utilization" element={<UtilizationReportPage />} />
        <Route path="available" element={<AvailableResourcesPage />} />
        <Route path="overloaded" element={<OverloadedPage />} />
      </Route>

      {/* AI */}
      <Route path="ai">
        <Route path="recommend" element={<AiRecommendPage />} />
        <Route path="risk-analysis" element={<AiRiskAnalysisPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

---

## 3. Navigation Menu Items

```javascript
const navItems = [
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
    path: '/employees/:id/workload',  // dynamic — need employee selected
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
```

---

## 4. Navigation Guards

Currently **no auth** (planned for future). Route guards will be added when auth is implemented:

```javascript
// Future pattern:
<Route
  path="/employees"
  element={<ProtectedRoute><EmployeeListPage /></ProtectedRoute>}
/>
```
