# Sticky Narrow Collapsible Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop side menu remain visible while scrolling, reduce its expanded width by 10%, and support a persisted desktop-only collapsed icon rail.

**Architecture:** Keep the existing responsive shell structure. Store desktop collapse state in the app layout, pass it into the sidebar, and apply collapsed rail styling only at the `lg` breakpoint so mobile drawer behavior remains unchanged.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Tailwind CSS utility classes.

---

## Files

- Modify: `components/shell/Sidebar.tsx`
  - Change desktop width from `w-[260px]` to `w-[234px]`.
  - Add `collapsed` and `onToggleCollapsed` props.
  - Replace desktop `lg:static` behavior with sticky desktop behavior.
  - Tighten logo, footer, group, and nav-row spacing.
  - Give nav icons a fixed leading column and truncate labels so the menu reads icon-first without becoming icon-only.
  - Add a desktop-only collapse toggle in the sidebar header.
  - Collapse to a `72px` icon rail on desktop.
  - Preserve mobile fixed drawer behavior and overlay.
- Modify: `app/(app)/layout.tsx`
  - Own `sidebarCollapsed` state.
  - Persist the preference in `localStorage`.
  - Pass collapse props to `Sidebar`.
- Verify only: `components/shell/Topbar.tsx`
  - Confirm existing sticky topbar z-index does not visually fight the sidebar.

## Suggested Behavior

- Desktop (`lg` and up): sidebar should be `sticky top-0 h-screen`, 234px wide, and independently scrollable when nav content exceeds viewport height.
- Desktop collapsed state: sidebar should become a 72px icon rail, hide text labels, preserve active states, and expose labels through `title` attributes.
- Navigation should use compact rows with a fixed icon column, smaller label text, and truncated labels at the narrower width.
- Mobile/tablet below `lg`: sidebar should keep current slide-in drawer behavior with fixed positioning and overlay.
- The topbar remains sticky inside the main content area.

## Implementation Tasks

### Task 1: Confirm Baseline

**Files:**
- Read: `components/shell/Sidebar.tsx`
- Read: `app/(app)/layout.tsx`
- Read: `components/shell/Topbar.tsx`

- [ ] **Step 1: Confirm current sidebar classes**

Run:

```bash
sed -n '1,180p' components/shell/Sidebar.tsx
```

Expected: sidebar uses `w-[260px]`, `fixed`, and `lg:static`.

- [ ] **Step 2: Confirm layout wrapper**

Run:

```bash
sed -n '1,120p' 'app/(app)/layout.tsx'
```

Expected: layout uses a top-level flex container with `<Sidebar />` followed by the main content column.

### Task 2: Add Persisted Collapse State In The App Layout

**Files:**
- Modify: `app/(app)/layout.tsx`

- [x] **Step 1: Import `useEffect`**

Use:

```tsx
import { useEffect, useState } from "react";
```

- [x] **Step 2: Add the localStorage key and collapsed state**

Use:

```tsx
const SIDEBAR_COLLAPSED_KEY = "shs-sidebar-collapsed";
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
```

- [x] **Step 3: Load and persist the desktop preference**

Use:

```tsx
useEffect(() => {
  setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
}, []);

const toggleSidebarCollapsed = () => {
  setSidebarCollapsed((collapsed) => {
    const next = !collapsed;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
    return next;
  });
};
```

- [x] **Step 4: Pass collapse props to `Sidebar`**

Use:

```tsx
<Sidebar
  open={navOpen}
  onClose={() => setNavOpen(false)}
  collapsed={sidebarCollapsed}
  onToggleCollapsed={toggleSidebarCollapsed}
/>
```

Expected: desktop collapse preference survives reloads and defaults to expanded.

### Task 3: Update Sidebar Width, Sticky Desktop Position, Compact Nav Styling, And Collapsed Rail

**Files:**
- Modify: `components/shell/Sidebar.tsx`

- [ ] **Step 1: Update the aside class list**

Change the `<aside>` class from:

```tsx
"fixed inset-y-0 left-0 z-50 w-[260px] shrink-0 border-r border-hairline bg-surface-lowest flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto"
```

to:

```tsx
"fixed inset-y-0 left-0 z-50 w-[234px] shrink-0 border-r border-hairline bg-surface-lowest flex flex-col transition-transform lg:sticky lg:inset-auto lg:top-0 lg:h-screen lg:translate-x-0 lg:z-40"
```

Expected behavior:
- `w-[234px]` is exactly 10% narrower than 260px.
- `collapsed ? "lg:w-[72px]" : "lg:w-[234px]"` makes the icon rail desktop-only.
- `lg:sticky lg:top-0 lg:h-screen` keeps the sidebar visible while the page scrolls.
- `lg:inset-auto` clears the mobile drawer offsets once the sidebar becomes a desktop flex child.
- `fixed inset-y-0` still powers the mobile drawer.

- [ ] **Step 2: Check whether brand text still fits**

Inspect the logo/title block in `components/shell/Sidebar.tsx`. If "Analytics Platform" wraps awkwardly at 234px, change only the brand text container to:

```tsx
<div className="min-w-0 leading-tight">
```

and the two text nodes to include `truncate`:

```tsx
<p className="truncate text-body-strong text-on-surface">Health Sciences</p>
<p className="truncate text-caption-sm text-mute">Analytics Platform</p>
```

Expected: no layout shift or overflow in the narrower sidebar.

- [ ] **Step 3: Make nav rows icon-first and compact**

Change the nav wrapper to use tighter spacing:

```tsx
<nav className="flex-1 overflow-y-auto scroll-thin px-sm py-md flex flex-col gap-md">
```

Change group label spacing to:

```tsx
<p className="px-sm text-utility-xs uppercase tracking-wider text-stone mb-xs">
```

Change each nav link class to:

```tsx
"flex items-center gap-xs rounded-DEFAULT px-sm py-xs text-label-sm transition-colors"
```

Wrap each icon in a fixed-size leading column:

```tsx
<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-DEFAULT">
  <Icon name={item.icon} size={19} />
</span>
<span className="min-w-0 truncate">{item.label}</span>
```

Expected: icons visually lead the row, labels remain readable, and long labels do not overflow.

- [x] **Step 4: Add desktop-only collapse controls and hidden labels**

Use a header button with `lg:flex`, `aria-label`, and `title` that toggles `onToggleCollapsed`.

When collapsed:
- Hide brand text, group labels, nav labels, and long footer text with `lg:hidden`.
- Keep nav icons centered in `lg:h-10 lg:w-10`.
- Add `title={collapsed ? item.label : undefined}` to each nav link.
- Keep the mobile drawer full width because all collapsed sizing is behind `lg:`.

### Task 4: Verify Layout And Build

**Files:**
- Verify: `components/shell/Sidebar.tsx`
- Verify: `app/(app)/layout.tsx`

- [ ] **Step 1: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: exits 0.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: exits 0 with no ESLint warnings or errors.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: exits 0 and generates all routes successfully.

- [ ] **Step 4: Manual visual check**

Run:

```bash
npm run dev
```

Expected:
- Desktop: sidebar remains visible while scrolling long pages.
- Desktop: sidebar width is narrower, content column expands, and nav rows feel more icon-first.
- Desktop collapsed: sidebar becomes a 72px icon rail, labels hide, and content expands.
- Mobile: menu button opens the sidebar overlay; close behavior still works.

## Self-Review

- Requirement coverage:
  - Sticky sidebar: Task 2.
  - 10% narrower sidebar: Task 2.
  - Collapsible icon rail: Task 2 and Task 3.
  - Icon-first compact styling: Task 3.
  - Preserve responsive drawer: Task 3 and Task 4.
  - Create branch before implementation: already done on `ui/sticky-narrow-sidebar`.
- Placeholder scan: no placeholder implementation steps.
- Type consistency: only existing React/Tailwind class strings are changed.
