# Health Sciences Analytics — KPI System

A practical, role-aware KPI management & analytics application for the MFU School
of Health Sciences. Built with **Next.js 14 (App Router) + TypeScript + Tailwind**.

Sign-in is **Google OAuth**, restricted to active faculty. Most pages are backed
by MySQL; a few prototype routes still read the seeded in-memory store behind the
typed repository seam in `lib/data/repositories.ts`.

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
| `/dashboard` | Overview dashboard (KPI health by category, at-risk KPIs, review queue). `/` redirects here. |
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
| **App role** — page and nav access | `admin`, `reviewer`, `committee`, `viewer` | `faculty.system_role`, checked against `MATRIX` in [`lib/auth/can.ts`](lib/auth/can.ts) |
| **Stage role** — approval workflow actions | `member`, `lead`, `counselor`, `admin` | `committee_memberships.position`, resolved by [`lib/kpi/approvalWorkflow.ts`](lib/kpi/approvalWorkflow.ts) |

Both axes are read server-side from the database on every request by
`getSessionActor()` ([`lib/auth/session.ts`](lib/auth/session.ts)), never from
anything the client sends. Administrators get a **View as** control in the user
menu for testing the workflow as another person; it round-trips through the
server, so the API authorizes exactly what the UI shows.

### App role → page access

| | Admin | Reviewer | Committee | Viewer |
|---|---|---|---|---|
| View dashboards / analytics | ✓ | ✓ | ✓ | ✓ |
| Configure KPIs / metrics / formulas | ✓ | — | — | — |
| Submit metric values | ✓ | — | ✓ (own committee) | — |
| Review submissions (validation queue) | ✓ | ✓ | — | — |
| Record performance (approvals queue) | ✓ | ✓ | ✓ | — |
| Manage faculty / committees / export | ✓ | view | view | view |

Gated nav items and action buttons appear and disappear with the signed-in
person's role; gated routes show an "access restricted" state. The same policy
is enforced server-side, so hiding a button is a convenience, not the control.

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
  from anything the client sends.

## Architecture

```
app/(app)/*           Routes (dashboard chrome via app/(app)/layout.tsx)
components/ui/*        Design-system primitives (Button, Card, Table, Modal, …)
components/shell/*     Sidebar, Topbar, Breadcrumb, RoleSwitcher, route Guard
lib/types.ts          Domain types
lib/auth/auth.config.ts   Edge-safe Auth.js config (no DB — middleware builds on it)
lib/auth/auth.ts          Google provider + the faculty-roster allowlist
lib/auth/session.ts       getSessionActor / requireActor / requirePermission
lib/auth/can.ts           The role → action policy matrix
middleware.ts         Coarse "is there a session" gate
lib/data/seed.ts      Seed dataset
lib/data/store.ts     In-memory store (remaining prototype pages only)
lib/data/repositories.ts  The swap seam — typed async data functions
lib/data/hooks.ts     TanStack Query hooks consumed by pages
lib/formula.ts        Sandboxed mathjs formula validator
```

Design tokens (the Material palette, type scale, spacing) were ported from the
mockups' inline Tailwind config into [`tailwind.config.ts`](tailwind.config.ts).

## Authentication

Sign-in is Google OAuth via Auth.js v5, with a JWT session cookie and no database
adapter.

**Who may sign in.** Only an address matching an `active` row in `faculty`. There
is no auto-provisioning: an unknown `@mfu.ac.th` account is refused with
`AccessDenied`. Deactivating someone in Faculty Management revokes their access on
their next request, even though their token is still valid. `faculty.email` is
uniquely indexed and is the login key.

**Setup.** Copy the `AUTH_*` block from `.env.example` into `.env.local`
(`npx auth secret` generates `AUTH_SECRET`), and register the redirect URI
`http://localhost:3000/api/auth/callback/google` in the Google Cloud Console.

**Two rules worth knowing before changing any of this:**

1. `middleware.ts` runs on the **edge runtime**, so it builds its Auth.js instance
   from `lib/auth/auth.config.ts` — which must never import the MySQL pool. It can
   only answer "is there a valid session cookie". Every role check belongs in a
   route, via `requireActor()` / `requirePermission()`.
2. `session.user.role` is stamped at sign-in and can be up to 8h stale. It is for
   display. **`getSessionActor()` is the authority** — it re-reads the faculty row
   per request, so a role change takes effect immediately.

## Still deferred

1. Move the remaining prototype pages (`/kpis`, `/metrics`, `/formulas/*`,
   `/validation`) off `lib/data/store.ts` onto MySQL.
2. Migrate `lib/data/seed.ts` into the database.
# SHS_KPIs_Claude
