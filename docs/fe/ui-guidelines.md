# UI/UX Design Guidelines

> Design system, animation, và UI patterns cho FE application

---

## 1. Color Palette

### Brand Colors

```css
--color-primary: #4f46e5;        /* Indigo 600 */
--color-primary-hover: #4338ca;  /* Indigo 700 */
--color-primary-light: #eef2ff;  /* Indigo 50 */
```

### Semantic Colors

```css
--color-success: #10b981;        /* Emerald 500 */
--color-success-bg: #ecfdf5;    /* Emerald 50 */
--color-warning: #f59e0b;        /* Amber 500 */
--color-warning-bg: #fffbeb;    /* Amber 50 */
--color-danger: #ef4444;         /* Red 500 */
--color-danger-bg: #fef2f2;     /* Red 50 */
--color-info: #3b82f6;          /* Blue 500 */
--color-info-bg: #eff6ff;       /* Blue 50 */
```

### Neutral Colors

```css
--color-bg: #f8fafc;            /* Slate 50 */
--color-surface: #ffffff;        /* White */
--color-border: #e2e8f0;        /* Slate 200 */
--color-text: #1e293b;          /* Slate 800 */
--color-text-secondary: #64748b; /* Slate 500 */
--color-text-disabled: #94a3b8; /* Slate 400 */
```

---

## 2. Typography

```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

---

## 3. Spacing

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

---

## 4. Shadows

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
```

---

## 5. Border Radius

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

---

## 6. Animation Specifications

### 6.1 Page Transition

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-content {
  animation: fadeInUp 0.3s ease-out;
}
```

### 6.2 Table Row Stagger

```css
@keyframes fadeInRow {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.table-row {
  animation: fadeInRow 0.3s ease-out both;
}
.table-row:nth-child(1) { animation-delay: 0.02s; }
.table-row:nth-child(2) { animation-delay: 0.04s; }
.table-row:nth-child(3) { animation-delay: 0.06s; }
/* etc — use JS inline style for dynamic delays */
```

### 6.3 Sidebar Slide

```css
.sidebar {
  transition: width 0.25s ease, transform 0.25s ease;
}
.sidebar.collapsed {
  width: 64px;
}
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: translateX(0);
  }
}
```

### 6.4 Modal/Dialog

```css
.modal-overlay {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.modal-overlay.open {
  opacity: 1;
}

.modal-content {
  transform: scale(0.95) translateY(8px);
  transition: transform 0.2s ease, opacity 0.2s ease;
  opacity: 0;
}
.modal-overlay.open .modal-content {
  transform: scale(1) translateY(0);
  opacity: 1;
}
```

### 6.5 Notification Toast

```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast {
  animation: slideInRight 0.3s ease-out;
}
.toast.exiting {
  animation: slideOutRight 0.3s ease-in forwards;
}
```

### 6.6 Loading Shimmer

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### 6.7 Gauge/Progress Animation

```css
.gauge-fill {
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
```

### 6.8 Button Hover

```css
.btn {
  transition: all 0.15s ease;
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.btn:active {
  transform: translateY(0);
}
```

### 6.9 Card Hover

```css
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}
```

---

## 7. Component States

Every interactive component must handle these states:

| State | Visual |
|-------|--------|
| Default | Normal appearance |
| Hover | Slight elevation / color change |
| Active/Focus | Ring outline |
| Disabled | Opacity 50%, no pointer events |
| Loading | Spinner or shimmer |
| Error | Red border / error message |
| Empty | "No data" illustration |

---

## 8. Responsive Behavior

| Element | Desktop (≥1024) | Tablet (768-1023) | Mobile (<768) |
|---------|----------------|-------------------|---------------|
| Sidebar | Fixed 260px | Collapsed 64px | Hidden overlay |
| DataTable | Full columns | Hide less important cols | Card layout |
| Forms | 2-column grid | 1-column | 1-column full width |
| Stat Cards | 4 in row | 2 in row | 1 in row |
| Buttons | Label + icon | Icon only (mobile) | Full width |

---

## 9. Accessibility

- All interactive elements have `:focus-visible` ring
- Color not the only indicator (use icons + text)
- Form inputs have associated `<label>` elements
- Loading states announced by aria-live regions
- Keyboard navigable (Tab, Enter, Escape)
- `prefers-reduced-motion` respected for all animations

---

## 10. Loading States (Skeleton)

### Table Skeleton

```
┌─────────────────────────────────────────────┐
│ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░       │ ← header shimmer
│ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░      │
│ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░      │ ← 5 rows
│ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░      │
│ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░░░ ░░░░░      │
└─────────────────────────────────────────────┘
```

### Card Skeleton

```
┌────────────┐  ┌────────────┐  ┌────────────┐
│ ░░░░░░░░░  │  │ ░░░░░░░░░  │  │ ░░░░░░░░░  │
│ ░░░░░░░░░  │  │ ░░░░░░░░░  │  │ ░░░░░░░░░  │
│ ░░░░░░░░░  │  │ ░░░░░░░░░  │  │ ░░░░░░░░░  │
└────────────┘  └────────────┘  └────────────┘
```
