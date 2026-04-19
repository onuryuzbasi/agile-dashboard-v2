---
name: css-theme-tokens
description: "Reference for the 3-layer depth theme system. Use when (1) Adding new components that need theming (2) Updating existing styles for dark/light mode (3) Ensuring consistent visual hierarchy"
---

# CSS Theme Tokens Skill

Quick reference for the Agile Dashboard's 3-layer depth theme system.

## Layer System

| Layer | Purpose | Dark Mode | Light Mode |
|-------|---------|-----------|------------|
| Canvas | Main content background | `#0d1117` | `#F4F5F7` |
| Surface | Sidebar, Header | `#161b22` | `#FFFFFF` |
| Elevated | Cards, Modals, Rows | `#21262d` | `#FFFFFF` |

## CSS Variables

### Background Tokens
```css
var(--bg-canvas)    /* Main content area */
var(--bg-surface)   /* Sidebar, Header */
var(--bg-elevated)  /* Cards, modals, table rows */
var(--bg-hover)     /* Hover states */
```

### Border Tokens
```css
var(--border-subtle)   /* Very light separators */
var(--border-default)  /* Standard borders */
var(--border-strong)   /* Emphasized borders */
```

### Text Tokens
```css
var(--text-primary)    /* Main text */
var(--text-secondary)  /* Muted text */
var(--text-tertiary)   /* Very muted text */
var(--text-inverse)    /* Text on colored backgrounds */
```

### Semantic Colors
```css
var(--success)     /* Green - #22c55e */
var(--warning)     /* Amber - #f59e0b */
var(--danger)      /* Red - #ef4444 */
var(--info)        /* Blue - #3b82f6 */
var(--accent)      /* Brand accent */
```

## Component Patterns

### Sidebar
```css
.sidebar {
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
}
```

### Main Content
```css
.main-content {
  background: var(--bg-canvas);
}
```

### Card
```css
.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
}
```

### Table Row
```css
.list-row {
  background-color: var(--bg-elevated);
  border-bottom: 1px solid var(--border-default);
}
```

### Modal
```css
.modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
}
```

## Dark Mode Selector
```css
[data-theme="dark"] {
  /* Dark mode overrides */
}
```

## Theme Toggle (in projectStore.js)
```javascript
toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'dark' ? 'light' : 'dark' 
}))
```

## File Location
Main CSS file: `/src/index.css`
Theme variables: Lines 1-185
