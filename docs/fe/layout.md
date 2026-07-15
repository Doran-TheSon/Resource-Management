# Layout System

> Thiết kế layout tổng thể cho FE application

---

## 1. Main Layout Structure

```
┌─────────────────────────────────────────────┐
│                  Header                      │
│  [MenuToggle]  [App Title]       [User]      │
├──────────┬──────────────────────────────────┤
│          │                                   │
│ Sidebar  │         Main Content              │
│          │                                   │
│ - Dashboard │   <Outlet /> — React Router    │
│ - Employees │                                 │
│ - Projects  │    ┌─────────────────────┐     │
│ - Alloc.    │    │   PageHeader         │     │
│ - Reports   │    │   [Title] [Actions]  │     │
│   ▸ Util.   │    ├─────────────────────┤     │
│   ▸ Avail.  │    │                     │     │
│   ▸ Overld. │    │   Page Content       │     │
│ - AI        │    │   (Table / Form /    │     │
│   ▸ Recom.  │    │    Cards / Charts)   │     │
│   ▸ Risk    │    │                     │     │
│          │    └─────────────────────┘     │
│          │                                   │
├──────────┴──────────────────────────────────┤
│                  Footer                      │
│  © 2026 Resource Management System           │
└─────────────────────────────────────────────┘
```

---

## 2. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Desktop | ≥ 1024px | Full sidebar + content |
| Tablet | 768px - 1023px | Collapsed sidebar + content |
| Mobile | < 768px | Hidden sidebar (overlay) |

---

## 3. Sidebar Navigation

```
Sidebar (width: 260px / collapsed: 64px)
├── Logo / Brand
├── Dashboard
├── Employees
│   └── (sub: List, Add)
├── Projects
│   └── (sub: List, Add)
├── Allocations
│   └── (sub: List, Add)
├── Reports
│   ├── Utilization
│   ├── Available Resources
│   └── Overloaded
└── AI Tools
    ├── Resource Recommend
    └── Risk Analysis
```

### States

| State | Visual |
|-------|--------|
| Active route | Highlighted with left border accent |
| Hover | Background color change |
| Collapsed | Icons only, tooltip on hover |
| Mobile | Overlay with backdrop blur |

---

## 4. Header

```
Header (height: 64px)
┌───────────────────────────────────────────┐
│ ☰    Resource Management    [🔔] [👤]    │
└───────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| ☰ Hamburger | Toggle sidebar (mobile: show/hide, desktop: collapse) |
| App Title | "Resource Management" with link to dashboard |
| 🔔 Notification | Placeholder for future notifications |
| 👤 User avatar | Placeholder for future auth |

---

## 5. Page Header (Inside Content)

```
PageHeader
┌───────────────────────────────────────────┐
│ Employee List                    [+ Add]  │
│ Breadcrumb: Home > Employees              │
└───────────────────────────────────────────┘
```

### Breadcrumb Pattern

```
Home > Section > Subsection (optional)
```

### Action Buttons

- Primary action: `+ Add New` (right-aligned)
- Secondary actions: Export, Refresh icons
- Context actions: Edit, Delete (inside table row)
