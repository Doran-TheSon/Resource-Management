# Screen Specifications

> Chi tiết từng màn hình trong FE application — layout, components, states, data requirements

---

## 1. Dashboard Page (`/`)

### Layout

```
┌──────────────────────────────────────────┐
│  PageHeader: "Dashboard"                  │
├──────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ Emp  │ │ Proj │ │ Avail│ │Overld│    │
│  │ 42   │ │ 12   │ │ 15   │ │  3   │    │
│  └──────┘ └──────┘ └──────┘ └──────┘    │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Utilization Overview (bar chart)    │  │
│  │ (Top 10 employees by allocation)    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ Quick Links  │  │ Recent Activity   │  │
│  │ • New Alloc  │  │ (placeholder)     │  │
│  │ • Reports    │  │                   │  │
│  └─────────────┘  └──────────────────┘  │
└──────────────────────────────────────────┘
```

### States

| State | Behavior |
|-------|----------|
| Loading | Skeleton cards + chart placeholder |
| Loaded | Full dashboard with data |
| Error | Error message with retry |
| Empty | "No data yet" with link to add employees |

### Data Requirements

| Data | Source | Cache |
|------|--------|-------|
| Employee count | GET /employees?size=1 | Session |
| Active projects count | GET /projects?status=ACTIVE&size=1 | Session |
| Utilization stats | GET /reports/utilization | Session |

---

## 2. Employee List Page (`/employees`)

### Layout

```
┌──────────────────────────────────────────┐
│  PageHeader: "Employees"    [+ Add New]  │
├──────────────────────────────────────────┤
│  Filters: [Department ▼] [Role ▼]        │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │ DataTable                            ││
│  │ ┌─────┬──────┬───────┬──────┬──────┐ ││
│  │ │Code │ Name │ Email │ Role │ Dept │ ││
│  │ │EM001│ Tuan │ t@..  │ Sr.. │ F..  │ ││
│  │ │EM002│ Nam  │ n@..  │ Jr.. │ F..  │ ││
│  │ └─────┴──────┴───────┴──────┴──────┘ ││
│  │ [Prev] Page 1 of 5 [Next]            ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### Row Actions

- Click row → navigate to workload page `/employees/:id/workload`
- Edit icon → `/employees/:id/edit`
- View workload → `/employees/:id/workload`

---

## 3. Employee Form Page (`/employees/new`, `/employees/:id/edit`)

### Layout

```
┌──────────────────────────────────────────┐
│  PageHeader: "Add Employee" / "Edit Emp" │
├──────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐│
│  │  Employee Code: [___________]        ││
│  │  Full Name:     [___________]        ││
│  │  Email:         [___________]        ││
│  │  Role:          [___________]        ││
│  │  Department:    [___________]        ││
│  │                                      ││
│  │  [Cancel]               [Save]       ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| employeeCode | Required, 3-20 uppercase | "Employee code is required" |
| fullName | Required | "Full name is required" |
| email | Required, valid email | "Invalid email format" |
| role | Required | "Role is required" |
| department | Required | "Department is required" |

### States

| State | Behavior |
|-------|----------|
| Create | Empty form, "Save" creates new |
| Edit | Pre-filled, "Save" updates |
| Loading (edit) | Show spinner while fetching existing data |
| Submitting | Button disabled + spinner |
| Error 409 | "Employee code already exists" |
| Validation error | Field-level messages below inputs |

---

## 4. Project List Page (`/projects`)

### Layout

```
┌──────────────────────────────────────────┐
│  PageHeader: "Projects"     [+ Add New]  │
├──────────────────────────────────────────┤
│  Filters: [Status ▼] [Customer ▼]        │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │ DataTable                            ││
│  │ ┌──────┬────────┬────────┬────────┐  ││
│  │ │Code  │ Name   │ Cust.. │ Status │  ││
│  │ │PRJ01 │ NCG    │ FPT    │ 🟢Act  │  ││
│  │ │PRJ02 │ GRID   │ VNPT   │ 🔵Pln  │  ││
│  │ └──────┴────────┴────────┴────────┘  ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### Status Badge

| Status | Color | Icon |
|--------|-------|------|
| PLANNING | Blue | 🔵 |
| ACTIVE | Green | 🟢 |
| COMPLETED | Gray | ⚪ |

---

## 5. Project Form Page (`/projects/new`, `/projects/:id/edit`)

### Layout

```
┌──────────────────────────────────────────┐
│  PageHeader: "Add Project"               │
├──────────────────────────────────────────┤
│  Project Code: [___________]             │
│  Project Name: [___________]             │
│  Customer:     [___________]             │
│  Status:       [ACTIVE ▼]               │
│  Start Date:   [📅 ________]             │
│  End Date:     [📅 ________]             │
│                                          │
│  [Cancel]                    [Save]       │
└──────────────────────────────────────────┘
```

---

## 6. Allocation List Page (`/allocations`)

### Layout

```
┌──────────────────────────────────────────┐
│  PageHeader: "Allocations"  [+ Add New]  │
├──────────────────────────────────────────┤
│  Filters: [Employee ▼] [Project ▼]       │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │ DataTable                            ││
│  │ ┌────────┬────────┬──────┬──────┬──┐ ││
│  │ │Employee│Project │Percent│ Role │  │ ││
│  │ │Tuan    │ NCG    │ 50% ██│ BE   │✏🗑│ │
│  │ │Nam     │ GRID   │ 80% ██│ FE   │✏🗑│ │
│  │ └────────┴────────┴──────┴──────┴──┘ ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### Allocation Bar

- Visual bar showing percentage
- Color: green (< 50%), yellow (50-80%), red (> 80%)

---

## 7. Allocation Form Page (`/allocations/new`, `/allocations/:id/edit`)

### Layout

```
┌──────────────────────────────────────────┐
│  PageHeader: "New Allocation"            │
├──────────────────────────────────────────┤
│  Employee:     [Search Select ▼]         │
│  Project:      [Search Select ▼]         │
│  Allocation %: [50% ═══●═══════] 1-100   │
│  Role:         [_________________]       │
│  Start Date:   [📅 ________]             │
│  End Date:     [📅 ________]             │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │ Current Workload:                    ││
│  │ Employee: Tuan                       ││
│  │ ████████████████░░ 80% / 100%        ││
│  │ Available: 20%                       ││
│  └──────────────────────────────────────┘│
│                                          │
│  [Cancel]                    [Save]       │
└──────────────────────────────────────────┘
```

### Dynamic Workload Preview

When an employee is selected, the form **automatically loads** their current workload and displays:
- Current total allocation (gauge bar)
- Available percentage
- List of current projects

---

## 8. Workload Page (`/employees/:id/workload`)

### Layout

```
┌──────────────────────────────────────────┐
│  PageHeader: "Employee Workload"         │
├──────────────────────────────────────────┤
│  Employee Selector: [Tuan ▼]             │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │ Employee: Tuan Ho Anh                ││
│  │ Role: Senior Developer               ││
│  │ Department: FSOFT-Q1                 ││
│  │                                      ││
│  │ Overall Allocation:                  ││
│  │ ████████████████████░░ 80%           ││
│  │ Available: 20%                       ││
│  └──────────────────────────────────────┘│
│                                          │
│  Allocation Details:                     │
│  ┌──────────────────────────────────────┐│
│  │ 🟦 NCG       50% ████████████░░░░    ││
│  │    BE Dev    Jan-Dec 2026            ││
│  ├──────────────────────────────────────┤│
│  │ 🟩 GRID      30% ██████░░░░░░░░░░    ││
│  │    FE Dev    Mar-Dec 2026            ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

---

## 9. Report Pages

### Utilization Report (`/reports/utilization`)

```
┌──────────────────────────────────────────┐
│  PageHeader: "Utilization Report"        │
├──────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐│
│  │ Bar Chart: Employee Allocation       ││
│  │ (all employees, sorted by %)         ││
│  └──────────────────────────────────────┘│
│                                          │
│  DataTable:                              │
│  Employee  | Allocation | Available      │
│  Tuan      | ██████ 80% | 20%           │
│  Nam       | ██████ 100%| 0%            │
│  Lan       | ██ 30%     | 70%           │
└──────────────────────────────────────────┘
```

### Available Resources (`/reports/available`)

```
┌──────────────────────────────────────────┐
│  PageHeader: "Available Resources"       │
├──────────────────────────────────────────┤
│  Cards layout:                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Tuan     │ │ Lan      │ │ Minh     │ │
│  │ Available│ │ Available│ │ Available│ │
│  │ ██████   │ │ ████████ │ │ ██       │ │
│  │ 40% free │ │ 70% free │ │ 20% free │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└──────────────────────────────────────────┘
```

### Overloaded (`/reports/overloaded`)

```
┌──────────────────────────────────────────┐
│  PageHeader: "Overloaded Employees"      │
├──────────────────────────────────────────┤
│  ⚠️ Warning: Employees > 90% allocation  │
│                                          │
│  DataTable (red accent):                 │
│  Employee  | Allocation | Available      │
│  Nam       | ██████████ 100% | 0% ⛔     │
│  Hoang     | █████████░ 95%  | 5%  ⚠️    │
└──────────────────────────────────────────┘
```

---

## 10. AI Pages

### AI Recommend (`/ai/recommend`)

```
┌──────────────────────────────────────────┐
│  PageHeader: "AI Resource Recommend"     │
├──────────────────────────────────────────┤
│  Query Input:                            │
│  ┌──────────────────────────────────────┐│
│  │ "Tìm Java Developer còn tối thiểu    ││
│  │  50% available"                      ││
│  └──────────────────────────────────────┘│
│  [Analyze]                               │
│                                          │
│  Result:                                 │
│  ┌──────────────────────────────────────┐│
│  │ 🤖 AI Analysis                       ││
│  │ Explanation text...                  ││
│  │                                      ││
│  │ Recommended Resources:               ││
│  │ ┌─────────────────────────────────┐  ││
│  │ │ Nguyen Van A                    │  ││
│  │ │ Java Developer | FSOFT-Q1      │  ││
│  │ │ Available: 60% ████████████░░   │  ││
│  │ │ Current: NCG (40%)             │  ││
│  │ │ [View Profile →]               │  ││
│  │ └─────────────────────────────────┘  ││
│  │                                      ││
│  │ ⚠️ Warnings:                        ││
│  │ - Only 1 resource matches criteria   ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### AI Risk Analysis (`/ai/risk-analysis`)

```
┌──────────────────────────────────────────┐
│  PageHeader: "AI Risk Analysis"          │
├──────────────────────────────────────────┤
│  Query Input:                            │
│  ┌──────────────────────────────────────┐│
│  │ "Sprint tới cần thêm 2 Java         ││
│  │  Developer"                          ││
│  └──────────────────────────────────────┘│
│  [Analyze Risk]                          │
│                                          │
│  Result:                                 │
│  ┌──────────────────────────────────────┐│
│  │ Overall Assessment:                  ││
│  │ "Team đang sử dụng 92% capacity..."  ││
│  │                                      ││
│  │ Risks:                               ││
│  │ 🔴 HIGH: Capacity almost full        ││
│  │    Description...                    ││
│  │ 🟡 MEDIUM: Only 1 resource avail     ││
│  │                                      ││
│  │ Suggestions:                         ││
│  │ ✓ Consider reallocation              ││
│  │ ✓ Prioritize critical tasks          ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```
