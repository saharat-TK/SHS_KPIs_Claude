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

Authority runs on **two independent axes**, and conflating them is the usual
source of confusion:

| Axis | Values | Source of truth |
|---|---|---|
| **App role** — page and nav access | `admin`, `reviewer`, `committee`, `viewer` | `MATRIX` in [`lib/auth/can.ts`](lib/auth/can.ts) |
| **Stage role** — approval workflow actions | `member`, `lead`, `counselor`, `admin` | `committee_memberships.position`, resolved by [`lib/kpi/approvalWorkflow.ts`](lib/kpi/approvalWorkflow.ts) |

A demo **persona switcher** lives in the top-right (no login in Phase 1). The
three committee personas all carry role `committee` and differ only by their
committee position — that is what gives them different workflow powers.

### App role → page access

| | Admin | Reviewer | Committee | Viewer |
|---|---|---|---|---|
| View dashboards / analytics | ✓ | ✓ | ✓ | ✓ |
| Configure KPIs / metrics / formulas | ✓ | — | — | — |
| Submit metric values | ✓ | — | ✓ (own committee) | — |
| Review submissions (validation queue) | ✓ | ✓ | — | — |
| Record performance (approvals queue) | ✓ | ✓ | ✓ | — |
| Manage faculty / committees / export | ✓ | view | view | view |

Gated nav items and action buttons appear/disappear as you switch personas;
gated routes show an "access restricted" state.

### Committee position → workflow actions

Opening the approvals queue is an app-role question; *acting* on a row is a
position question. A reviewer holds no committee position, so the queue is
read-only for them.

| Position | Stage | May perform |
|---|---|---|
| `Committee`, `Committee and Secretary` | `member` | `submit` (from draft or returned) |
| `Committee Lead` | `lead` | `return` (note required), `forward`; may also edit data while `submitted` |
| `Counselor` | `counselor` | `approve` (final, locks the row), `reject` (note required); may also edit data while `forwarded` |
| `faculty.system_role = 'admin'` | `admin` | `reverse` — unlocks an approved row back to `returned` |

```
draft ──submit──> submitted ──forward──> forwarded ──approve──> approved (LOCKED)
          ▲            │                     │                        │
          └──return────┘        reject───────┘                        │
          └─────────────────── reverse (admin only) ──────────────────┘
```

Two things worth knowing:

- **Admin is additive, not a superset.** It grants `reverse` on top of whatever
  the person's committee position already allows — it does not replace it. A
  Committee Lead who is also an administrator keeps `return`/`forward` *and*
  gains `reverse`; see `resolveStageRoles`. An administrator with no committee
  position can only `reverse`, and cannot submit, forward or approve.
- **Admin authority is read server-side** from `faculty.system_role`, never
  from anything the client sends. Run `npm run migrate:admin-system-role` once
  to seed the administrator row.

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
