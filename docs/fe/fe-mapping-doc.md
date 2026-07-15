# FE-BE Mapping Document

> Tài liệu này mapping toàn bộ **BE API endpoints** → **FE Screens/Components**, bao gồm data flow, DTO mapping, và business rules.

---

## 1. Employee Management

### BE Endpoints

| Method | Endpoint | FE Screen | FE Component |
|--------|----------|-----------|-------------|
| `GET` | `/api/v1/employees` | Employee List | `pages/employees/EmployeeListPage.jsx` |
| `GET` | `/api/v1/employees/{id}` | Employee Detail / Edit Form | `pages/employees/EmployeeFormPage.jsx` |
| `POST` | `/api/v1/employees` | Create Employee | `pages/employees/EmployeeFormPage.jsx` |
| `PUT` | `/api/v1/employees/{id}` | Edit Employee | `pages/employees/EmployeeFormPage.jsx` |

### Request → Form Mapping

```yaml
EmployeeRequest (BE):
  employeeCode: String  →  TextInput (required, uppercase regex)
  fullName: String      →  TextInput (required)
  email: String         →  EmailInput (required, email validation)
  role: String          →  Select or TextInput (required)
  department: String    →  Select or TextInput (required)

Response → List Columns:
  employeeId           →  hidden / row key
  employeeCode         →  column #1
  fullName             →  column #2 (sortable)
  email                →  column #3
  role                 →  column #4 (filterable)
  department           →  column #5 (filterable)
  createdAt            →  column #6 (date)
```

### Filter Mapping

| Query Param | FE Control | Type |
|-------------|-----------|------|
| `department` | Department dropdown filter | `string` |
| `role` | Role dropdown filter | `string` |
| `page` | Pagination | `int` |
| `size` | Page size selector | `int` |

---

## 2. Project Management

### BE Endpoints

| Method | Endpoint | FE Screen | FE Component |
|--------|----------|-----------|-------------|
| `GET` | `/api/v1/projects` | Project List | `pages/projects/ProjectListPage.jsx` |
| `GET` | `/api/v1/projects/{id}` | Project Detail / Edit Form | `pages/projects/ProjectFormPage.jsx` |
| `POST` | `/api/v1/projects` | Create Project | `pages/projects/ProjectFormPage.jsx` |
| `PUT` | `/api/v1/projects/{id}` | Edit Project | `pages/projects/ProjectFormPage.jsx` |

### Request → Form Mapping

```yaml
ProjectRequest (BE):
  projectCode: String     →  TextInput (required)
  projectName: String     →  TextInput (required)
  customer: String        →  TextInput (required)
  status: String          →  Select: PLANNING | ACTIVE | COMPLETED
  startDate: LocalDate    →  DatePicker (required)
  endDate: LocalDate      →  DatePicker (nullable)

Response → List Columns:
  projectId              →  hidden / row key
  projectCode            →  column #1
  projectName            →  column #2 (sortable)
  customer               →  column #3 (filterable)
  status                 →  column #4 (badge, filterable)
  startDate              →  column #5
  endDate                →  column #6
```

### Status Badge Colors

| Status | Color |
|--------|-------|
| `PLANNING` | Blue / Info |
| `ACTIVE` | Green / Success |
| `COMPLETED` | Gray / Default |

---

## 3. Resource Allocation

### BE Endpoints

| Method | Endpoint | FE Screen | FE Component |
|--------|----------|-----------|-------------|
| `POST` | `/api/v1/allocations` | Create Allocation | `pages/allocations/AllocationFormPage.jsx` |
| `PUT` | `/api/v1/allocations/{id}` | Edit Allocation | `pages/allocations/AllocationFormPage.jsx` |
| `DELETE` | `/api/v1/allocations/{id}` | Delete from list | `pages/allocations/AllocationListPage.jsx` |
| `GET` | `/api/v1/employees/{id}/workload` | Employee Workload | `pages/workload/WorkloadPage.jsx` |

### Request → Form Mapping

```yaml
AllocationRequest (BE):
  employeeId: Long         →  Employee Select (searchable dropdown)
  projectId: Long          →  Project Select (searchable dropdown)
  allocationPercent: Int   →  Slider / NumberInput (1-100)
  roleInProject: String    →  TextInput
  startDate: LocalDate     →  DatePicker
  endDate: LocalDate       →  DatePicker
```

### Response → List Columns

```yaml
AllocationResponse:
  allocationId             →  hidden / row key
  employeeName             →  column #1
  projectName              →  column #2
  projectCode              →  column #3
  allocationPercent        →  column #4 (progress bar)
  roleInProject            →  column #5
  startDate                →  column #6
  endDate                  →  column #7
```

### Business Rules (FE Validation)

| Rule | Validation |
|------|-----------|
| 0% < allocation ≤ 100% | `min=1, max=100` |
| Tổng allocation ≤ 100% | Show live total + warning |
| Không allocate vào COMPLETED | Disable project selection |
| endDate ≥ startDate | Validate date range |
| Unique employee+project+time | Show overlap warning |

---

## 4. Workload

### BE Endpoints

| Method | Endpoint | FE Screen | FE Component |
|--------|----------|-----------|-------------|
| `GET` | `/api/v1/employees/{id}/workload` | Employee Workload | `pages/workload/WorkloadPage.jsx` |

### Response Structure

```yaml
WorkloadResponse:
  employeeId              →  header info
  employeeName            →  header info
  totalAllocation         →  progress bar (total %)
  available               →  available % display
  allocations[]:          →  allocation list cards
    allocationId
    projectName           →  project info
    projectCode           →  project info
    allocationPercent     →  per-project %
    roleInProject         →  role
    startDate             →  date range
    endDate               →  date range
```

### Utilization Gauge Colors

| Range | Color | Meaning |
|-------|-------|---------|
| 0-50% | Green | Available |
| 51-80% | Yellow | Moderate |
| 81-100% | Red | Overloaded |

---

## 5. Reports

### BE Endpoints

| Method | Endpoint | FE Screen | FE Component |
|--------|----------|-----------|-------------|
| `GET` | `/api/v1/reports/utilization` | Utilization Report | `pages/reports/UtilizationReportPage.jsx` |
| `GET` | `/api/v1/reports/available-resources` | Available Resources | `pages/reports/AvailableResourcesPage.jsx` |
| `GET` | `/api/v1/reports/overloaded` | Overloaded Report | `pages/reports/OverloadedPage.jsx` |

### DTO Structure

```yaml
EmployeeUtilizationDTO:
  employeeId            →  row key
  fullName              →  column #1
  totalAllocation       →  column #2 (progress bar)
  available             →  column #3 (100 - totalAllocation)
```

### Report Thresholds

| Report | Condition | FE Display |
|--------|-----------|------------|
| Utilization | All employees | Table + bar chart |
| Available | `totalAllocation < 100` | Green indicator |
| Overloaded | `totalAllocation > 90` | Red warning badge |

---

## 6. AI Features

### BE Endpoints

| Method | Endpoint | FE Screen | FE Component |
|--------|----------|-----------|-------------|
| `POST` | `/api/v1/ai/recommend` | AI Resource Recommend | `pages/ai/AiRecommendPage.jsx` |
| `POST` | `/api/v1/ai/risk-analysis` | AI Risk Analysis | `pages/ai/AiRiskAnalysisPage.jsx` |

### Request

```yaml
AiRequest:
  query: String  →  TextArea with natural language input
```

### AI Recommend Response

```yaml
AiRecommendationResponse:
  query                 →  displayed query
  explanation           →  AI explanation text
  recommendedResources[]:
    employeeId          →  link to employee
    employeeName        →  name
    role                →  role
    department          →  department
    email               →  email
    available           →  available %
    currentProjects[]   →  current project tags
  warnings[]            →  warning messages
```

### AI Risk Analysis Response

```yaml
RiskAnalysisResponse:
  query                 →  displayed query
  overallAssessment     →  summary text
  risks[]:
    type                →  risk category
    description         →  risk detail
    severity            →  HIGH / MEDIUM / LOW
    impact              →  impact description
  suggestions[]         →  recommendation list
```

---

## 7. Shared API Response Structure

### Success

```json
{
  "success": true,
  "status": 200,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-07-15T10:30:00.000Z"
}
```

### Error

```json
{
  "success": false,
  "status": 400,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "timestamp": "2026-07-15T10:30:00.000Z",
  "errors": {
    "fieldName": "Field error message"
  }
}
```

### FE Error Handling

| HTTP Status | FE Behavior |
|-------------|-------------|
| 400 | Show field-level validation errors |
| 404 | Show "Not found" notification |
| 409 | Show conflict warning + retry option |
| 500 | Show generic error toast |

---

## 8. Navigation Mapping

| Route Path | FE Screen | BE Data Required |
|------------|-----------|-----------------|
| `/` | Dashboard | All stats |
| `/employees` | Employee List | GET /employees |
| `/employees/new` | Create Employee | — |
| `/employees/:id/edit` | Edit Employee | GET /employees/:id |
| `/projects` | Project List | GET /projects |
| `/projects/new` | Create Project | — |
| `/projects/:id/edit` | Edit Project | GET /projects/:id |
| `/allocations` | Allocation List | GET /allocations |
| `/allocations/new` | Create Allocation | GET /employees, GET /projects |
| `/allocations/:id/edit` | Edit Allocation | GET /allocation/:id |
| `/employees/:id/workload` | Workload Detail | GET /employees/:id/workload |
| `/reports/utilization` | Utilization Report | GET /reports/utilization |
| `/reports/available` | Available Resources | GET /reports/available-resources |
| `/reports/overloaded` | Overloaded Report | GET /reports/overloaded |
| `/ai/recommend` | AI Recommend | POST /ai/recommend |
| `/ai/risk-analysis` | AI Risk Analysis | POST /ai/risk-analysis |
