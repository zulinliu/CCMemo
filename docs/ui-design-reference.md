# CCMemo Web UI Design Reference

Comprehensive design system extracted from Anthropic, Linear, Raycast, and Warp.
Tailored for a developer-focused session management tool.

---

## 1. Design Philosophy

### What Makes Developer Tool UIs Feel Premium

After analyzing Anthropic (claude.ai, anthropic.com), Linear, Raycast, and Warp:

1. **Restrained color palettes** - Neutral warm grays with a single accent color. No gradients, no rainbow palettes.
2. **Generous whitespace** - Content breathes. Density comes from typography hierarchy, not cramming.
3. **Typography as texture** - Variable fonts with precise weight control create visual rhythm without decoration.
4. **Subtle depth** - Layered shadows (not flat, not skeuomorphic). Cards float gently above backgrounds.
5. **Micro-interactions** - 150-300ms transitions on hover/focus. Nothing instant, nothing slow.
6. **Monospace for data** - Code, IDs, commands always in mono. Prose always in sans/serif.
7. **Dark-first or light-first, never accidental** - Both themes are designed, not inverted.

### CCMemo Visual Direction

**"Engineering Console"** - Calm, warm-neutral, high information density with clear hierarchy.

- Inspired by Anthropic's warm ivory/slate palette (not cold tech blue)
- Linear's keyboard-first interaction model
- Terminal aesthetics for data display (session IDs, commands, file paths)
- Clean sans-serif for UI, monospace for code/data

---

## 2. Color System

### 2.1 Color Palette (Exact Values)

Based on Anthropic's design system, adapted for a developer tool:

#### Primary Neutral Scale

```css
:root {
  /* Warm Slate - Primary text and backgrounds */
  --color-slate-dark: #141413;       /* Primary text, dark theme bg */
  --color-slate-medium: #3d3d3a;     /* Secondary text, dark surface */
  --color-slate-light: #5e5d59;      /* Tertiary text, muted labels */

  /* Warm Ivory - Light theme backgrounds */
  --color-ivory-light: #faf9f5;      /* Light theme primary bg */
  --color-ivory-medium: #f0eee6;     /* Light theme secondary bg (cards) */
  --color-ivory-dark: #e8e6dc;       /* Light theme borders, dividers */

  /* Cloud - Neutral mid-tones */
  --color-cloud-light: #d1cfc5;      /* Disabled text, placeholder borders */
  --color-cloud-medium: #b0aea5;     /* Muted text, inactive states */
  --color-cloud-dark: #87867f;       /* Subtle text on dark bg */
}
```

#### Accent Colors

```css
:root {
  /* Primary Accent - Clay/Terracotta (from Anthropic) */
  --color-accent: #c6613f;           /* Primary actions, active states */
  --color-accent-hover: #d97757;     /* Hover state */

  /* Semantic Colors */
  --color-olive: #788c5d;            /* Success, positive states */
  --color-sky: #6a9bcc;              /* Info, user messages */
  --color-fig: #c46686;              /* Warning, important */
  --color-coral: #ebcece;            /* Error background (light) */

  /* Supporting Neutrals */
  --color-oat: #e3dacc;              /* Subtle highlight bg */
  --color-cactus: #bcd1ca;           /* Success background (light) */
  --color-manilla: #ebdbbc;          /* Warning background (light) */
  --color-kraft: #d4a27f;            /* Warm accent, links */
}
```

#### Opacity Scale (for borders, overlays)

```css
:root {
  --opacity-5: #1414130d;
  --opacity-10: #1414131a;           /* Light theme borders */
  --opacity-20: #14141333;           /* Hover overlays */
  --opacity-30: #1414134d;
  --opacity-50: #14141380;
  --opacity-80: #141413cc;
}
```

### 2.2 Theme System

```css
/* Light Theme (default) */
:root,
[data-theme="light"] {
  --color-bg-primary: #faf9f5;       /* ivory-light */
  --color-bg-secondary: #f0eee6;     /* ivory-medium */
  --color-bg-tertiary: #e8e6dc;      /* ivory-dark */
  --color-bg-elevated: #ffffff;       /* Cards, dropdowns */

  --color-text-primary: #141413;      /* slate-dark */
  --color-text-secondary: #5e5d59;    /* slate-light */
  --color-text-tertiary: #87867f;     /* cloud-dark */
  --color-text-muted: #b0aea5;        /* cloud-medium */

  --color-border-primary: #1414131a;  /* slate-faded-10 */
  --color-border-secondary: #d1cfc5;  /* cloud-light */
  --color-border-focus: #c6613f;      /* accent */

  --color-surface-hover: #1414130d;   /* opacity-5 */
  --color-surface-active: #1414131a;  /* opacity-10 */

  --shadow-sm: 0 2px 2px #00000003, 0 4px 4px #00000005, 0 16px 24px #0000000a;
  --shadow-lg: 0 4px 3px #00000005, 0 10px 8px #00000008,
    0 19px 15px #0000000a, 0 34px 27px #0000000a,
    0 63px 50px #0000000d, 0 150px 120px #00000012;
}

/* Dark Theme */
[data-theme="dark"] {
  --color-bg-primary: #141413;       /* slate-dark */
  --color-bg-secondary: #1e1e1c;     /* slate-dark + 10 */
  --color-bg-tertiary: #2a2a28;      /* slate-dark + 20 */
  --color-bg-elevated: #3d3d3a;      /* slate-medium */

  --color-text-primary: #faf9f5;     /* ivory-light */
  --color-text-secondary: #d1cfc5;   /* cloud-light */
  --color-text-tertiary: #b0aea5;    /* cloud-medium */
  --color-text-muted: #87867f;       /* cloud-dark */

  --color-border-primary: #faf9f51a; /* ivory-faded-10 */
  --color-border-secondary: #3d3d3a; /* slate-medium */
  --color-border-focus: #d97757;     /* accent-hover */

  --color-surface-hover: #faf9f50d;
  --color-surface-active: #faf9f51a;

  --shadow-sm: 0 2px 2px #00000000, 0 4px 4px #00000008, 0 16px 24px #00000014;
  --shadow-lg: 0 4px 3px #00000008, 0 10px 8px #00000014,
    0 19px 15px #0000001a, 0 34px 27px #0000001a,
    0 63px 50px #00000024, 0 150px 120px #00000033;
}
```

### 2.3 Semantic Color Mapping for CCMemo

```css
:root {
  /* Session Status Colors */
  --color-status-active: #788c5d;     /* olive - in progress */
  --color-status-completed: #5e5d59;  /* slate-light - done */
  --color-status-interrupted: #c46686;/* fig - interrupted */
  --color-status-unrecoverable: #c6613f; /* accent - cannot resume */

  /* Timeline Event Colors */
  --color-timeline-user: #6a9bcc;     /* sky - user prompts */
  --color-timeline-ai: #788c5d;       /* olive - AI responses */
  --color-timeline-file: #d4a27f;     /* kraft - file operations */
  --color-timeline-command: #87867f;  /* cloud-dark - shell commands */
  --color-timeline-error: #c6613f;    /* accent - errors/fixes */

  /* Token Usage Gradient */
  --color-token-low: #788c5d;         /* olive */
  --color-token-medium: #ebdbbc;      /* manilla */
  --color-token-high: #c6613f;        /* accent */
}
```

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  /* Primary UI Font - Clean sans-serif */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;

  /* Monospace - For code, IDs, paths, commands */
  --font-mono: "JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code",
    "Consolas", monospace;

  /* Alternative: Use Anthropic's fonts if licensing allows */
  /* --font-sans: "Anthropic Sans", Arial, sans-serif; */
  /* --font-mono: "Anthropic Mono", "JetBrains Mono", monospace; */
}
```

**Recommendation**: Use **Inter** (variable font, free for commercial use, excellent at all sizes). For monospace, use **JetBrains Mono** (designed for developers, ligatures optional).

### 3.2 Type Scale

Based on Anthropic's scale, adapted for data-dense tool UI:

```css
:root {
  /* Display - Page titles, empty states */
  --text-display-l: 2rem;       /* 32px - Page title */
  --text-display-m: 1.5rem;     /* 24px - Section title */
  --text-display-s: 1.25rem;    /* 20px - Card title */

  /* Body - Content, descriptions */
  --text-body-l: 1.125rem;      /* 18px - Prominent body text */
  --text-body-m: 1rem;          /* 16px - Default body text */
  --text-body-s: 0.875rem;      /* 14px - Compact body text */

  /* Detail - Labels, metadata, tags */
  --text-detail-l: 1rem;        /* 16px - Large label */
  --text-detail-m: 0.875rem;    /* 14px - Default label */
  --text-detail-s: 0.75rem;     /* 12px - Small label, badge */

  /* Monospace - Code, IDs, commands */
  --text-mono-m: 0.875rem;      /* 14px - Default code */
  --text-mono-s: 0.8125rem;     /* 13px - Compact code */
  --text-mono-xs: 0.75rem;      /* 12px - Tiny IDs */
}
```

### 3.3 Font Weights

```css
:root {
  --weight-regular: 400;         /* Body text */
  --weight-medium: 500;          /* Labels, navigation */
  --weight-semibold: 600;        /* Headings, emphasis */
  --weight-bold: 700;            /* Page titles */
}
```

### 3.4 Line Heights

```css
:root {
  --leading-tight: 1.2;          /* Headings */
  --leading-normal: 1.4;         /* Body text */
  --leading-relaxed: 1.5;        /* Long-form content */
  --leading-mono: 1.6;           /* Code blocks */
}
```

### 3.5 Letter Spacing

```css
:root {
  --tracking-tight: -0.02em;     /* Display headings */
  --tracking-normal: 0;          /* Body text */
  --tracking-wide: 0.02em;       /* Labels, uppercase text */
  --tracking-mono: 0;            /* Monospace (use font default) */
}
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;     /* 4px  - Tight gaps */
  --space-2: 0.5rem;      /* 8px  - Default gap */
  --space-3: 0.75rem;     /* 12px - Compact padding */
  --space-4: 1rem;        /* 16px - Default padding */
  --space-5: 1.25rem;     /* 20px - Comfortable padding */
  --space-6: 1.5rem;      /* 24px - Section gap */
  --space-8: 2rem;        /* 32px - Large gap */
  --space-10: 2.5rem;     /* 40px - Section padding */
  --space-12: 3rem;       /* 48px - Page section padding */
  --space-16: 4rem;       /* 64px - Hero spacing */
  --space-20: 5rem;       /* 80px - Major section breaks */
}
```

### 4.2 Layout Constants

```css
:root {
  /* Container Widths */
  --container-max: 89.5rem;     /* 1432px - Max page width */
  --container-narrow: 56.25rem; /* 900px  - Content reading width */
  --container-sidebar: 16rem;   /* 256px  - Sidebar width */
  --container-detail: 24rem;    /* 384px  - Detail panel width */

  /* Border Radius */
  --radius-sm: 0.25rem;         /* 4px  - Small elements, badges */
  --radius-md: 0.5rem;          /* 8px  - Buttons, inputs */
  --radius-lg: 1rem;            /* 16px - Cards, modals */
  --radius-xl: 1.5rem;          /* 24px - Large panels */
  --radius-full: 100vw;         /* Pill shape */

  /* Borders */
  --border-width: 0.0625rem;    /* 1px */
}
```

### 4.3 Responsive Breakpoints

```css
/* Mobile first, adapted from Anthropic's breakpoints */
--breakpoint-sm: 479px;    /* Mobile */
--breakpoint-md: 767px;    /* Tablet */
--breakpoint-lg: 991px;    /* Small desktop */
--breakpoint-xl: 1279px;   /* Desktop (3-column collapses) */
--breakpoint-2xl: 1439px;  /* Wide desktop */
```

### 4.4 Grid System

12-column grid with responsive gutters:

```css
:root {
  --grid-columns: 12;
  --grid-gutter: var(--space-4);  /* 16px default */
  --grid-margin: var(--space-6);  /* 24px page margin */
}

/* At breakpoints */
@media (max-width: 991px) {
  :root {
    --grid-gutter: var(--space-3); /* 12px */
    --grid-margin: var(--space-4); /* 16px */
  }
}

@media (max-width: 479px) {
  :root {
    --grid-margin: var(--space-3); /* 12px */
  }
}
```

---

## 5. Component Specifications

### 5.1 Buttons

Three tiers (matching Anthropic's system):

```css
/* Base button styles */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 2.25rem;            /* 36px */
  padding: 0.5rem 1rem;
  font-family: var(--font-sans);
  font-size: var(--text-detail-m); /* 14px */
  font-weight: var(--weight-medium);
  line-height: 1;
  border-radius: var(--radius-md); /* 8px */
  border: var(--border-width) solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.button:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* Primary - Main actions (Resume, Export, Generate) */
.button-primary {
  background: var(--color-slate-dark);
  color: var(--color-ivory-light);
  border-color: var(--color-slate-dark);
}
.button-primary:hover {
  background: var(--color-slate-medium);
}
[data-theme="dark"] .button-primary {
  background: var(--color-ivory-light);
  color: var(--color-slate-dark);
}
[data-theme="dark"] .button-primary:hover {
  background: var(--color-ivory-medium);
}

/* Secondary - Supporting actions */
.button-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
}
.button-secondary:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-secondary);
}

/* Tertiary - Subtle actions (inline, icon-only) */
.button-tertiary {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: 0.375rem 0.5rem;
  min-height: auto;
}
.button-tertiary:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

/* Danger - Destructive actions */
.button-danger {
  background: transparent;
  color: var(--color-accent);
  border-color: var(--color-accent);
}
.button-danger:hover {
  background: var(--color-accent);
  color: var(--color-ivory-light);
}

/* Button Sizes */
.button-sm { min-height: 1.75rem; padding: 0.25rem 0.75rem; font-size: var(--text-detail-s); }
.button-lg { min-height: 2.75rem; padding: 0.625rem 1.5rem; font-size: var(--text-body-m); }
```

### 5.2 Cards

```css
.card {
  background: var(--color-bg-elevated);
  border: var(--border-width) solid var(--color-border-primary);
  border-radius: var(--radius-lg);    /* 16px */
  padding: var(--space-6);            /* 24px */
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.card-hover:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border-secondary);
}

.card-interactive {
  cursor: pointer;
}
.card-interactive:hover {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-sm);
}

/* Session Card Variant */
.session-card {
  padding: var(--space-4) var(--space-5);  /* 16px 20px */
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
}
```

### 5.3 Input Fields

```css
.input {
  width: 100%;
  min-height: 2.25rem;
  padding: 0.5rem 0.75rem;
  font-family: var(--font-sans);
  font-size: var(--text-body-s);      /* 14px */
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: var(--border-width) solid var(--color-border-primary);
  border-radius: var(--radius-md);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px #c6613f1a;
}

.input::placeholder {
  color: var(--color-text-muted);
}

/* Search Input Variant */
.search-input {
  padding-left: 2.5rem;               /* Space for search icon */
  background-image: url("data:image/svg+xml,..."); /* Search icon */
  background-repeat: no-repeat;
  background-position: 0.75rem center;
  background-size: 1rem;
}

/* Monospace Input (command, ID) */
.input-mono {
  font-family: var(--font-mono);
  font-size: var(--text-mono-s);      /* 13px */
  letter-spacing: var(--tracking-mono);
}
```

### 5.4 Tags / Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.125rem 0.5rem;
  font-family: var(--font-sans);
  font-size: var(--text-detail-s);    /* 12px */
  font-weight: var(--weight-medium);
  border-radius: var(--radius-full);  /* Pill shape */
  white-space: nowrap;
}

/* Status Badges */
.badge-active    { background: var(--color-olive);    color: #fff; }
.badge-completed { background: var(--color-slate-light); color: #fff; }
.badge-interrupted { background: var(--color-fig);    color: #fff; }
.badge-error     { background: var(--color-accent);   color: #fff; }

/* Neutral Badges */
.badge-default {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

/* Monospace Badge (session ID, branch name) */
.badge-mono {
  font-family: var(--font-mono);
  font-size: var(--text-mono-xs);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
}
```

### 5.5 Timeline Component

```css
.timeline {
  position: relative;
  padding-left: var(--space-6);       /* 24px */
}

/* Vertical line */
.timeline::before {
  content: "";
  position: absolute;
  left: 0.4375rem;                    /* 7px - center of dot */
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-border-primary);
}

.timeline-item {
  position: relative;
  padding-bottom: var(--space-4);
}

/* Timeline dot */
.timeline-dot {
  position: absolute;
  left: calc(-1 * var(--space-6) + 0.1875rem); /* Align with line */
  top: 0.375rem;
  width: 0.5rem;                      /* 8px */
  height: 0.5rem;
  border-radius: 50%;
  border: 2px solid;
}

/* Color coding by event type */
.timeline-dot-user     { border-color: var(--color-timeline-user);     background: var(--color-timeline-user); }
.timeline-dot-ai       { border-color: var(--color-timeline-ai);       background: var(--color-timeline-ai); }
.timeline-dot-file     { border-color: var(--color-timeline-file);     background: transparent; }
.timeline-dot-command  { border-color: var(--color-timeline-command);  background: transparent; }
.timeline-dot-error    { border-color: var(--color-timeline-error);    background: var(--color-timeline-error); }
```

### 5.6 Code Block / Terminal

```css
.code-block {
  font-family: var(--font-mono);
  font-size: var(--text-mono-s);      /* 13px */
  line-height: var(--leading-mono);
  background: var(--color-slate-dark);
  color: var(--color-ivory-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  overflow-x: auto;
  position: relative;
}

/* macOS-style window dots */
.code-block-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid #2a2a28;
}

.code-dot { width: 0.75rem; height: 0.75rem; border-radius: 50%; }
.code-dot-red    { background: #ed6a5e; }
.code-dot-yellow { background: #f4bf4f; }
.code-dot-green  { background: #61c554; }

/* Inline code */
.code-inline {
  font-family: var(--font-mono);
  font-size: 0.875em;                 /* Relative to parent */
  background: var(--color-bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
  color: var(--color-accent);
}
```

### 5.7 Command Capsule (Copy-to-clipboard)

```css
.command-capsule {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-slate-dark);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-mono-s);
  color: var(--color-ivory-light);
  overflow-x: auto;
}

.command-capsule-code {
  flex: 1;
  white-space: nowrap;
}

.command-capsule-copy {
  flex-shrink: 0;
  color: var(--color-cloud-medium);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: color 0.15s;
}
.command-capsule-copy:hover {
  color: var(--color-ivory-light);
}
```

---

## 6. Layout Patterns for CCMemo

### 6.1 App Shell

```
+------+----------------------------------------------+
|      |  Top Bar (search, theme, status)              |
| Side +----------------------------------------------+
| bar  |                                              |
|      |  Main Content Area                           |
| Nav  |                                              |
|      |  (variable per page)                         |
|      |                                              |
+------+----------------------------------------------+
```

```css
.app-shell {
  display: grid;
  grid-template-columns: var(--container-sidebar) 1fr;
  grid-template-rows: auto 1fr;
  height: 100vh;
  background: var(--color-bg-primary);
}

.app-topbar {
  grid-column: 1 / -1;
  height: 3.5rem;
  border-bottom: var(--border-width) solid var(--color-border-primary);
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  gap: var(--space-3);
}

.app-sidebar {
  border-right: var(--border-width) solid var(--color-border-primary);
  padding: var(--space-3);
  overflow-y: auto;
  background: var(--color-bg-secondary);
}

.app-main {
  overflow-y: auto;
  padding: var(--space-6);
}
```

### 6.2 Session List Page

```
+------+----------------------------------------------+
|      |  [Search Bar]         [Filters] [View Toggle]|
| Side +----------------------------------------------+
| bar  |  Session Card                                |
|      |  Session Card                                |
| Proj |  Session Card                                |
| List |  Session Card                                |
|      |  Session Card                                |
|      |  ...                                         |
+------+----------------------------------------------+
```

```css
.session-list-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: var(--container-narrow); /* 900px - readable width */
  margin: 0 auto;
  width: 100%;
}

.session-list-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: var(--border-width) solid var(--color-border-primary);
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);               /* 8px between cards */
}
```

### 6.3 Session Inspector (3-Column)

```
+------+-------------------+------------------+--------+
|      |                   |                  |        |
| Side |  Timeline         |  Content Viewer  | Detail |
| bar  |  (scrollable)     |  (scrollable)    | Panel  |
|      |                   |                  |        |
+------+-------------------+------------------+--------+
```

```css
.session-inspector {
  display: grid;
  grid-template-columns: 1fr 1.5fr var(--container-detail);
  gap: 0;
  height: calc(100vh - 3.5rem);       /* Minus topbar */
}

.inspector-timeline {
  border-right: var(--border-width) solid var(--color-border-primary);
  overflow-y: auto;
  padding: var(--space-4);
}

.inspector-content {
  overflow-y: auto;
  padding: var(--space-6);
}

.inspector-detail {
  border-left: var(--border-width) solid var(--color-border-primary);
  overflow-y: auto;
  padding: var(--space-4);
  background: var(--color-bg-secondary);
}

/* Responsive collapse */
@media (max-width: 1279px) {
  .session-inspector {
    grid-template-columns: 1fr 1.5fr;
  }
  .inspector-detail {
    display: none; /* Shown as bottom sheet on toggle */
  }
}

@media (max-width: 991px) {
  .session-inspector {
    grid-template-columns: 1fr;
  }
  .inspector-content {
    display: none; /* Tab-based switching */
  }
}
```

### 6.4 Empty States

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-8);
  text-align: center;
}

.empty-state-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-text-muted);
}

.empty-state-title {
  font-size: var(--text-display-s);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.empty-state-description {
  font-size: var(--text-body-m);
  color: var(--color-text-secondary);
  max-width: 28rem;
}

.empty-state-action {
  margin-top: var(--space-2);
}
```

---

## 7. Animation & Motion

### 7.1 Duration Scale

```css
:root {
  --duration-instant: 75ms;    /* Hover color change */
  --duration-fast: 150ms;      /* Button hover, tooltip */
  --duration-normal: 250ms;    /* Panel expand, tab switch */
  --duration-slow: 350ms;      /* Page transition, modal */
  --duration-slower: 500ms;    /* Complex layout changes */
}
```

### 7.2 Easing Functions

```css
:root {
  --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Subtle overshoot */
}
```

### 7.3 Transition Patterns

```css
/* Hover/Active state */
.interactive {
  transition: background-color var(--duration-fast) var(--ease-default),
              border-color var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);
}

/* Panel expand/collapse */
.expandable {
  transition: height var(--duration-normal) var(--ease-out),
              opacity var(--duration-normal) var(--ease-out);
}

/* Page content fade-in */
.page-enter {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Skeleton loading pulse */
.skeleton {
  animation: pulse 1.5s var(--ease-in-out) infinite;
  background: var(--color-bg-tertiary);
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Tailwind CSS Configuration

### 8.1 Tailwind v4 Theme Extension

For projects using Tailwind, map the design tokens:

```css
/* In your main CSS file with Tailwind v4 */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-bg-primary: var(--color-bg-primary);
  --color-bg-secondary: var(--color-bg-secondary);
  --color-bg-tertiary: var(--color-bg-tertiary);
  --color-bg-elevated: var(--color-bg-elevated);

  --color-text-primary: var(--color-text-primary);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-tertiary: var(--color-text-tertiary);
  --color-text-muted: var(--color-text-muted);

  --color-accent: #c6613f;
  --color-accent-hover: #d97757;
  --color-olive: #788c5d;
  --color-sky: #6a9bcc;
  --color-fig: #c46686;
  --color-kraft: #d4a27f;

  /* Fonts */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  /* Shadows */
  --shadow-sm: 0 2px 2px #00000003, 0 4px 4px #00000005, 0 16px 24px #0000000a;
  --shadow-lg: 0 4px 3px #00000005, 0 10px 8px #00000008,
    0 19px 15px #0000000a, 0 34px 27px #0000000a,
    0 63px 50px #0000000d, 0 150px 120px #00000012;
}
```

### 8.2 Usage Examples with Tailwind Classes

```html
<!-- Session Card -->
<div class="card-hover bg-bg-elevated rounded-lg border border-[var(--color-border-primary)] p-5">
  <h3 class="text-text-primary text-display-s font-semibold">Session Title</h3>
  <p class="text-text-secondary text-body-s mt-1">Last updated 2h ago</p>
  <span class="badge-active rounded-full px-2 py-0.5 text-xs font-medium text-white">Active</span>
</div>

<!-- Command Capsule -->
<div class="flex items-center gap-2 rounded-md bg-[#141413] p-3">
  <code class="flex-1 font-mono text-sm text-[#faf9f5]">claude --resume abc123</code>
  <button class="text-[#b0aea5] hover:text-[#faf9f5] transition-colors duration-150">
    <CopyIcon />
  </button>
</div>

<!-- Timeline Item -->
<div class="relative pl-6 pb-4">
  <div class="absolute left-[7px] top-1.5 h-2 w-2 rounded-full border-2 border-sky bg-sky"></div>
  <span class="text-detail-s text-text-muted">2:34 PM</span>
  <p class="text-body-s text-text-primary mt-0.5">User prompt content...</p>
</div>
```

---

## 9. Reference Analysis: What Makes Each Tool Work

### 9.1 Anthropic / Claude

**Design DNA**: Warm, human, editorial. Feels like a well-designed book or magazine.

- **Warm ivory backgrounds** (#faf9f5) instead of cold white - reduces eye strain, feels approachable
- **Terracotta/clay accent** (#c6613f, #d97757) - earthy, not techy. Unique in the AI space.
- **Typography hierarchy** - Three font families (Sans, Serif, Mono) create clear content zones
- **Subtle layered shadows** - Multiple shadow layers at different blur radii create realistic depth
- **Variable font weights** - 300-800 range allows fine-tuned emphasis without bold-or-nothing

**What to borrow**: Warm palette, shadow system, typography scale, terminal component styling.

### 9.2 Linear

**Design DNA**: Crisp, fast, keyboard-first. Every pixel earns its place.

- **Near-black theme** (#08090a) - Maximum contrast, developer-friendly
- **Inter font** - Clean, excellent at small sizes, variable weight support
- **Command palette (Cmd+K)** - Keyboard-first navigation pattern
- **Micro-animations on state changes** - Status transitions, assignments feel tactile
- **Dense but scannable list views** - Compact rows with color-coded status dots

**What to borrow**: Cmd+K command palette pattern, keyboard shortcuts, list density, status dot system.

### 9.3 Raycast

**Design DNA**: Native macOS feel, fun but professional.

- **Keyboard-first everything** - The app IS a command palette
- **Detail panels that slide in** - Non-disruptive navigation
- **Native platform aesthetics** - Blurs, vibrancy, system font integration
- **Playful but purposeful** - Extensions store feels curated, not overwhelming

**What to borrow**: Slide-in detail panels, command-first interaction, platform-native feel.

### 9.4 Warp

**Design DNA**: Terminal reimagined, modern meets classic.

- **Blocks-based terminal** - Commands and outputs are discrete visual blocks
- **Rich text in terminal** - Selectable, clickable elements within command output
- **AI integration feels native** - Not a chatbot bolted on, but woven into the terminal flow
- **Collaborative features** - Shared workflows, team command history

**What to borrow**: Block-based event display, AI integration patterns, terminal styling.

---

## 10. Practical Recommendations for CCMemo

### 10.1 Session List - Card Design

Each session card should show:

```
+-------------------------------------------------------+
| [Status Dot] Session Auto Title              [Actions] |
| project-name  |  main  |  2h ago                       |
| 12 tool calls  3 file changes  1 error                 |
+-------------------------------------------------------+
```

- Title: `text-body-m` (16px), weight-semibold, text-primary
- Metadata: `text-detail-s` (12px), weight-regular, text-muted
- Mono elements: Session ID, branch name in `badge-mono`
- Status: Color-coded dot (8px circle) + optional text badge
- Hover: `card-hover` shadow + subtle border color change

### 10.2 Timeline - Event Rendering

Timeline events should be compact but scannable:

```
  User Prompt                                    2:34 PM
    "Fix the authentication middleware..."
  ──
  Assistant Response                             2:34 PM
    Analyzed auth flow, identified JWT expiry...
  ──
  File Edit: src/auth/middleware.ts              2:35 PM
    - 12 lines  +8 lines
  ──
  Shell Command                                  2:36 PM
    $ cargo test auth::middleware
    ✓ 3 tests passed
```

- Timestamp right-aligned, `text-detail-s`, text-muted
- Event type icon + label in timeline dot color
- Content preview: 2-3 lines max, expandable
- Code/commands in mono, syntax-highlighted

### 10.3 Search - Command Palette

```
+-------------------------------------------+
| 🔍  Search sessions...                    |
|   project:ccmemo  branch:main  status:    |
+-------------------------------------------+
| Recent Sessions                            |
|   Fix auth middleware  |  ccmemo | 2h ago |
|   Implement FTS5      |  ccmemo | 1d ago |
|   Design UI system    |  ccmemo | 3d ago |
+-------------------------------------------+
| type @project for project filter           |
| type #status for status filter             |
| type >command for commands                 |
+-------------------------------------------+
```

- Triggered by Ctrl+K / Cmd+K
- Full-width overlay with backdrop blur
- Real-time filtering with debounce (300ms)
- IME-safe composition handling

### 10.4 Progress Indicators

For AI generation, scanning, and export operations:

```
+-----------------------------------------------+
| Generating Bug Fix Runbook                     |
|                                                |
|  ✓ Reading session transcript                  |
|  ✓ Applying redaction rules                    |
|  ◐ Sending to AI provider...                   |
|  ○ Generating document                         |
|  ○ Quality self-check                           |
|                                                |
|  [Cancel]                          45s elapsed |
+-----------------------------------------------+
```

- Each step: icon + label + state
- States: complete (checkmark, olive), active (spinner, accent), pending (empty, muted)
- Elapsed time in mono
- Cancel button always available

---

## 11. Iconography

### 11.1 Icon System

Use **Lucide Icons** (open-source, clean line style, React-friendly):

```bash
npm install lucide-react
```

Key icons for CCMemo:

| Area | Icon | Lucide Name |
|------|------|-------------|
| Search | Magnifying glass | `Search` |
| Session | Message square | `MessageSquare` |
| Timeline | Activity | `Activity` |
| File | File / FileCode | `File`, `FileCode` |
| Terminal | Terminal | `Terminal` |
| Command | Play | `Play` |
| Export | Download | `Download` |
| Copy | Copy / Check | `Copy`, `Check` |
| Settings | Settings | `Settings` |
| Theme | Sun / Moon | `Sun`, `Moon` |
| Error | AlertCircle | `AlertCircle` |
| Success | CheckCircle | `CheckCircle` |
| Loading | Loader2 (spin) | `Loader2` |
| Keyboard | Command | `Command` |
| Branch | GitBranch | `GitBranch` |
| Tag | Tag | `Tag` |
| Skill | Zap | `Zap` |
| Playbook | BookOpen | `BookOpen` |
| Privacy | Shield | `Shield` |
| AI | Sparkles | `Sparkles` |

### 11.2 Icon Sizing

```css
:root {
  --icon-sm: 0.875rem;     /* 14px - Inline, badge */
  --icon-md: 1rem;         /* 16px - Default */
  --icon-lg: 1.25rem;      /* 20px - Navigation, heading */
  --icon-xl: 1.5rem;       /* 24px - Empty state, feature */
}
```

---

## 12. Accessibility Checklist

- [ ] All colors meet WCAG 2.1 AA contrast ratios (4.5:1 for text, 3:1 for UI)
- [ ] Focus indicators visible (2px outline with 2px offset)
- [ ] Keyboard navigation for all interactive elements
- [ ] ARIA labels on icons, status badges, and interactive regions
- [ ] Screen reader announcements for async operations (aria-live regions)
- [ ] Reduced motion respected (prefers-reduced-motion media query)
- [ ] Color never the only indicator (always paired with icon/text)
- [ ] Focus trap in modals and command palette
- [ ] Skip-to-content link
- [ ] Semantic HTML (nav, main, aside, section with aria-labelledby)

### Contrast Verification (Light Theme)

| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| Primary text | #141413 | #faf9f5 | 16.8:1 |
| Secondary text | #5e5d59 | #faf9f5 | 5.7:1 |
| Muted text | #b0aea5 | #faf9f5 | 2.9:1 (large text only) |
| Accent on light | #c6613f | #faf9f5 | 4.6:1 |
| Badge on dark | #faf9f5 | #788c5d | 6.2:1 |

---

## 13. File Structure for React Implementation

```
src/
  styles/
    tokens.css          # CSS custom properties (this document)
    global.css          # Reset, base styles, theme switch
    animations.css      # Keyframes and transition utilities
  components/
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Input.tsx
      CommandCapsule.tsx
      CodeBlock.tsx
      EmptyState.tsx
      ProgressBar.tsx
    layout/
      AppShell.tsx
      Sidebar.tsx
      TopBar.tsx
      CommandPalette.tsx
    session/
      SessionCard.tsx
      SessionList.tsx
      SessionInspector.tsx
    timeline/
      Timeline.tsx
      TimelineItem.tsx
      TimelineDot.tsx
  hooks/
    useTheme.ts
    useKeyboard.ts
    useReducedMotion.ts
  lib/
    theme.ts            # Theme detection, toggle, persistence
```
