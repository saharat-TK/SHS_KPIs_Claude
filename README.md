# Health Sciences Analytics — KPI System

A practical, role-aware KPI management & analytics application for the MFU School
of Health Sciences. Built with **Next.js 14 (App Router) + TypeScript + Tailwind**.

This is **Phase 1**: a fully interactive app running on a seeded in-memory data
layer. No backend is required to run or demo it. The data access is hidden behind
a typed repository seam so Phase 2 can drop in a real backend (Firebase / Supabase /
Postgres) without changing the UI.

> The original Stitch mockups that this app was built from are preserved under
> [`design-reference/`](design-reference/). The page-relationship analysis is in
> [`SITEMAP.md`](SITEMAP.md).

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## What's inside

| Route | Page |
|---|---|
| `/` | Overview dashboard (KPI health by category, at-risk KPIs, review queue) |
| `/analytics/student-success` | Deep-dive: quarter filters, trend + bar charts, departmental breakdown |
| `/committee` | Committees & their faculty rosters |
| `/faculty` | Global faculty roster — search / filter / sort / paginate / add |
| `/faculty/export` | Roster export workflow — row + column selection → CSV download |
| `/kpis`, `/kpis/[id]` | KPI management by category; per-KPI config, calc logic, thresholds, departmental mapping |
| `/metrics` | Sub-KPI (metric) CRUD with targets, weights, data sources |
| `/formulas/builder` | Formula authoring with live `mathjs` validation (sandboxed) |
| `/formulas/history` | Version history / audit log with revert |
| `/validation` | Validation queue — approve / reject / request clarification |

## Roles (RBAC)

A demo **role switcher** lives in the top-right (no login in Phase 1). The
permission model is real — see [`lib/auth/can.ts`](lib/auth/can.ts).

| | Admin | Reviewer | Department | Viewer |
|---|---|---|---|---|
| View dashboards / analytics | ✓ | ✓ | ✓ | ✓ |
| Configure KPIs / metrics / formulas | ✓ | — | — | — |
| Submit metric values | ✓ | — | ✓ (own dept) | — |
| Approve / reject / clarify | ✓ | ✓ | — | — |
| Manage faculty / departments / export | ✓ | — | view | view |

Gated nav items and action buttons appear/disappear as you switch roles; gated
routes show an "access restricted" state.

## Architecture

```
app/(app)/*           Routes (dashboard chrome via app/(app)/layout.tsx)
components/ui/*        Design-system primitives (Button, Card, Table, Modal, …)
components/shell/*     Sidebar, Topbar, Breadcrumb, RoleSwitcher, route Guard
lib/types.ts          Domain types
lib/auth/*            Mock auth context + can() policy
lib/data/seed.ts      Seed dataset
lib/data/store.ts     In-memory store (Phase 1 only)
lib/data/repositories.ts  The swap seam — typed async data functions
lib/data/hooks.ts     TanStack Query hooks consumed by pages
lib/formula.ts        Sandboxed mathjs formula validator
```

Design tokens (the Material palette, type scale, spacing) were ported from the
mockups' inline Tailwind config into [`tailwind.config.ts`](tailwind.config.ts).

## Phase 2 (deferred)

1. Pick a backend (Firebase / Supabase / Postgres+Prisma).
2. Reimplement the function bodies in `lib/data/repositories.ts` against it — the
   signatures and every consuming hook/component stay the same. Delete
   `lib/data/store.ts`.
3. Replace `lib/auth/AuthContext.tsx` with real auth + session-derived roles, and
   enforce `can()` server-side.
4. Migrate `lib/data/seed.ts` into the database.
# SHS_KPIs_Claude
