# Data Flow

> Mô tả data flow từ User Action → API → Response → UI

---

## 1. Generic Data Flow Pattern

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │───→│  Page    │───→│  useApi  │───→│  API fn  │
│  Action  │    │Component │    │  Hook    │    │          │
└──────────┘    └──────────┘    └──────────┘    └─────┬────┘
                                                      │
                                                      ▼
                                               ┌──────────┐
                                               │  client  │
                                               │  .js     │
                                               └─────┬────┘
                                                      │ fetch()
                                                      ▼
                                               ┌──────────┐
                                               │  BE API  │
                                               │:8080/api │
                                               └─────┬────┘
                                                      │ JSON
                                                      ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Render  │←───│ setState │←───│  Parse   │
│  UI      │    │          │    │  + check │
└──────────┘    └──────────┘    └──────────┘
```

---

## 2. API Client Flow (client.js)

```
fetch(url, options)
  │
  ├── Base URL prepended (/api/v1)
  ├── Content-Type: application/json
  ├── Body serialized (JSON.stringify)
  │
  ▼
Response
  │
  ├── OK (200-299) → parse JSON → unwrap ApiResponse.data
  ├── 400-499      → parse ErrorResponse → throw with message
  ├── 500          → throw generic error
  └── Network fail → throw network error
```

### Error Normalization

```javascript
// Raw BE error response:
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": { "email": "Invalid email format" }
}

// Normalized in API layer:
{
  message: "Validation failed",
  code: "VALIDATION_ERROR",
  fields: { email: "Invalid email format" }
}
```

---

## 3. Employee Data Flow

### List Employees

```
EmployeeListPage mount
  → useApi('employees', employeeApi.getAll)
    → fetch GET /api/v1/employees?page=0&size=20&department=&role=
    → Response: ApiResponse<List<EmployeeResponse>>
    → Set loading=false, data=response.data
  → Render DataTable with columns
```

### Create Employee

```
User fills EmployeeForm
  → Click "Save"
  → validate() — check required fields
  → employeeApi.create(formData)
    → fetch POST /api/v1/employees (body: EmployeeRequest)
    → Success: ApiResponse<EmployeeResponse> + "Employee created successfully"
    → Navigate to /employees
    → Error 409: "Employee code already exists"
    → Error 400: Validation errors mapped to form fields
```

---

## 4. Project Data Flow

### List Projects

```
ProjectListPage mount
  → useApi('projects', projectApi.getAll)
    → fetch GET /api/v1/projects?status=&customer=&page=0&size=20
    → Render DataTable with StatusBadge
```

---

## 5. Allocation Data Flow

### Create Allocation

```
AllocationFormPage mount
  → Fetch employees: GET /api/v1/employees → populate employee dropdown
  → Fetch projects: GET /api/v1/projects → populate project dropdown
  → Filter out COMPLETED projects

User selects employee → load current workload:
  → GET /api/v1/employees/{employeeId}/workload
  → Display current allocation gauge
  → Compute remaining: available = 100 - totalAllocation
  → Validate new allocation ≤ available

User fills form + submits:
  → POST /api/v1/allocations
  → Success → navigate to /allocations
  → Error 400: AllocationExceededException → show warning
  → Error 409: AllocationOverlapException → show overlap warning
```

### Allocation List & Delete

```
AllocationListPage
  → useApi('allocations', allocationApi.getAll)
  → Table with allocation data
  → Click delete → ConfirmDialog
    → DELETE /api/v1/allocations/{id}
    → 204 No Content → remove row from list + toast
```

---

## 6. Workload Data Flow

```
WorkloadPage mount
  → Get employeeId from URL params / URL state
  → Get employee list for selector dropdown
  → useApi('workload', () => workloadApi.getEmployeeWorkload(id))
    → GET /api/v1/employees/{id}/workload
    → Response: WorkloadResponse
      - employeeId, employeeName
      - totalAllocation (sum)
      - available (100 - sum)
      - allocations[] (detailed list)

  → Render:
    - Employee info header
    - Overall gauge (totalAllocation / 100)
    - Allocation cards (one per project)
    - Color coding by %:
      - Green: < 50%
      - Yellow: 50-80%
      - Red: > 80%
```

---

## 7. Report Data Flow

### Utilization Report

```
UtilizationReportPage mount
  → useApi('utilization', reportApi.getUtilization)
    → GET /api/v1/reports/utilization
    → Response: ApiResponse<List<EmployeeUtilizationDTO>>
    → Render table + bar chart

Each row:
  Employee Name | Total Allocation | Available | Bar
```

### Available Resources

```
AvailableResourcesPage mount
  → useApi('available', reportApi.getAvailableResources)
    → GET /api/v1/reports/available-resources
    → Response: ApiResponse<List<EmployeeUtilizationDTO>> (only < 100%)
    → Render cards or table with green status
```

### Overloaded

```
OverloadedPage mount
  → useApi('overloaded', reportApi.getOverloaded)
    → GET /api/v1/reports/overloaded
    → Response: ApiResponse<List<EmployeeUtilizationDTO>> (only > 90%)
    → Render table with red warning
```

---

## 8. AI Data Flow

### Resource Recommendation

```
AiRecommendPage
  → User types: "Tìm Java Developer còn tối thiểu 50% available"
  → Click "Analyze"
  → POST /api/v1/ai/recommend (body: { query: "..." })
  → Response: AiRecommendationResponse
    - query (echo)
    - explanation (AI text)
    - recommendedResources[] (with name, role, available, currentProjects)
    - warnings[] (if any)
  → Render result cards + explanation
```

### Risk Analysis

```
AiRiskAnalysisPage
  → User types: "Sprint tới cần thêm 2 Java Developer"
  → Click "Analyze Risk"
  → POST /api/v1/ai/risk-analysis (body: { query: "..." })
  → Response: RiskAnalysisResponse
    - query (echo)
    - overallAssessment (AI summary)
    - risks[] (type, description, severity, impact)
    - suggestions[] (action items)
  → Render risk cards with severity badges
```

---

## 9. Dashboard Data Flow

```
DashboardPage mount
  → Parallel fetches (Promise.all):
    → GET /api/v1/reports/utilization → for total employees + avg utilization
    → GET /api/v1/reports/available-resources → count available
    → GET /api/v1/reports/overloaded → count overloaded
    → GET /api/v1/employees?size=1 → total count from headers
    → GET /api/v1/projects?size=1 → total count from headers

  → Compute dashboard stats:
    - Total Employees
    - Total Projects
    - Active Projects
    - Avg Utilization
    - Available resources count
    - Overloaded count

  → Render stat cards + quick links
```

---

## 10. Form Submission Pattern

```javascript
// Generic form submission flow
async function handleSubmit(formData) {
  setSubmitting(true);
  setErrors({});
  try {
    const result = editing
      ? await api.update(id, formData)   // PUT
      : await api.create(formData);      // POST
    showToast('Success!', 'success');
    navigate(listPath);
  } catch (err) {
    if (err.fields) {
      setErrors(err.fields);  // Field-level errors
    } else {
      showToast(err.message, 'error');
    }
  } finally {
    setSubmitting(false);
  }
}
```
