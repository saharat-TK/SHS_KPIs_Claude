# Units Admin Continuation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the in-progress Units administration feature as a working, verified CRUD reference table, then optionally reuse it in KPI and metric unit fields.

**Architecture:** Keep the first pass as a vertical slice: MySQL `units` table, Next API routes, typed repository functions, TanStack Query hooks, and an admin-only UI page. Do not change existing KPI/metric schemas in this pass; those still store `unit` as free text, so integration can safely be a UI selector over the existing string field.

**Tech Stack:** Next.js 14 App Router, TypeScript, React, TanStack Query, Tailwind, mysql2, MariaDB/MySQL.

---

## Recommendation

Finish the current Units admin slice first. It is already mostly built, and the remaining work is validation, consistency, and verification. After that, make a second small pass that swaps free-text unit inputs in the main KPI/metric editors for a reusable unit picker while still saving the existing string column.

## File Structure

- Modify `app/api/units/route.ts`: tighten request parsing and duplicate handling for list/create.
- Modify `app/api/units/[id]/route.ts`: validate IDs, reject blank required fields, and normalize update responses.
- Modify `app/(app)/admin/units/page.tsx`: improve pending states, error display, duplicate feedback, and deletion UX.
- Modify `lib/types.ts`: keep `UnitRecord` as the shared API/UI type.
- Modify `lib/data/repositories.ts`: keep `unitsRepo` as the client data access layer.
- Modify `lib/data/hooks.ts`: keep `useUnits`, `useCreateUnit`, `useUpdateUnit`, and `useDeleteUnit` as the UI mutation hooks.
- Modify `components/shell/nav.ts` and `components/shell/Breadcrumb.tsx`: keep admin navigation and breadcrumb labels.
- Optional later create `components/ui/UnitSelect.tsx`: reusable picker backed by `useUnits`.
- Optional later modify KPI/metric editor pages that currently render `<Input value={unit} ... />`.

## Task 1: Stabilize Units API Validation

**Files:**
- Modify: `app/api/units/route.ts`
- Modify: `app/api/units/[id]/route.ts`

- [x] **Step 1: Add local request helpers**

Add helpers near the top of both route files:

```ts
function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}
```

- [x] **Step 2: Validate required fields on create**

In `POST`, normalize input before insertion:

```ts
const unitNameTh = cleanString(body.unitNameTh);
const unitNameEn = cleanString(body.unitNameEn);
const description = cleanNullableString(body.description);

if (!unitNameTh || !unitNameEn) {
  return NextResponse.json(
    { error: "Thai and English unit names are required" },
    { status: 400 },
  );
}
```

Insert with:

```ts
[unitNameTh, unitNameEn, description]
```

- [x] **Step 3: Validate IDs and blank updates**

In `PATCH` and `DELETE`, parse the route param once:

```ts
const id = Number(params.id);
if (!Number.isInteger(id) || id <= 0) {
  return NextResponse.json({ error: "Invalid unit id" }, { status: 400 });
}
```

When patching `unitNameTh` or `unitNameEn`, reject blank values:

```ts
if ((key === "unitNameTh" || key === "unitNameEn") && !cleanString(v)) {
  return NextResponse.json(
    { error: "Thai and English unit names cannot be blank" },
    { status: 400 },
  );
}
```

- [x] **Step 4: Run static checks**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both complete without TypeScript or lint errors.

## Task 2: Polish Admin Units UI

**Files:**
- Modify: `app/(app)/admin/units/page.tsx`

- [x] **Step 1: Disable duplicate submissions**

Change the Add button to respect mutation state:

```tsx
const isMutating = create.isPending || update.isPending || del.isPending;
```

Use it on destructive/edit actions:

```tsx
<Button icon="add" disabled={isMutating} onClick={() => setEditing({ isNew: true })}>
  Add Unit
</Button>
```

- [x] **Step 2: Keep delete buttons from firing while a mutation is pending**

Update the delete button:

```tsx
disabled={del.isPending}
className="text-mute hover:text-error p-xs rounded hover:bg-surface-soft disabled:opacity-50"
```

- [x] **Step 3: Surface mutation errors near the modal footer**

Inside `UnitModal`, accept an optional `error` prop:

```ts
error?: string;
```

Render it above the form fields:

```tsx
{error && (
  <div className="rounded border border-error/30 bg-error/10 px-md py-sm text-body-sm text-error">
    {error}
  </div>
)}
```

Pass the error from the page:

```tsx
error={
  (create.error instanceof Error && create.error.message) ||
  (update.error instanceof Error && update.error.message) ||
  undefined
}
```

- [x] **Step 4: Run static checks**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both pass.

## Task 3: Verify Database-Backed CRUD Manually

**Files:**
- Read: `.env.local` or existing environment setup if present.
- Read: `schema/SHS_Units_schema.sql`

- [x] **Step 1: Confirm environment variables**

Check that these values exist for local development:

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=<local user>
DB_PASSWORD=<local password>
DB_NAME=shs_kpis_claude
```

- [x] **Step 2: Apply schema if needed**

Apply `schema/SHS_Units_schema.sql` to the local MySQL/MariaDB database.

- [x] **Step 3: Start the app**

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/admin/units
```

- [ ] **Step 4: Exercise the UI**

Verify:

- Admin role can see `/admin/units`.
- Non-admin roles cannot access the page.
- Existing seed units load.
- Search filters English name, Thai name, and description.
- Add creates a unit and closes the modal.
- Duplicate English name shows the API error.
- Edit updates English name, Thai name, and description.
- Delete removes the row after confirmation.

## Task 4: Optional Unit Picker Integration

**Files:**
- Create: `components/ui/UnitSelect.tsx`
- Modify: `app/(app)/kpis/page.tsx`
- Modify: `app/(app)/kpis/[id]/page.tsx`
- Modify: `app/(app)/metrics/page.tsx`
- Modify: `app/(app)/kpi-management/library/[setId]/page.tsx`
- Modify: `app/(app)/kpi-management/library/[setId]/kpis/[kpiId]/page.tsx`
- Modify: `app/(app)/kpi-management/library/[setId]/kpis/[kpiId]/MetricEditor.tsx`

- [ ] **Step 1: Create a reusable picker**

Implement `components/ui/UnitSelect.tsx` as a client component that calls `useUnits()` and emits the selected `unitNameEn` string.

- [ ] **Step 2: Replace free-text unit fields**

Replace each unit `<Input>` in editor forms with `UnitSelect`, keeping the saved value as the current string field.

- [ ] **Step 3: Preserve manual fallback**

If units fail to load, render the original text input so KPI editing remains usable even when the reference table is unavailable.

- [ ] **Step 4: Run final checks**

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all pass.

## Suggested Commit Split

- [ ] Commit 1: `feat: add units admin CRUD`
- [ ] Commit 2: `chore: harden units API validation`
- [ ] Commit 3: `feat: use managed units in KPI editors` if Task 4 is included

## Self-Review

- Spec coverage: The plan covers the existing DB schema, API routes, hooks, repositories, admin UI, nav, and optional KPI/metric integration.
- Placeholder scan: No task depends on unspecified code or a future unknown function.
- Type consistency: `UnitRecord`, `unitNameTh`, `unitNameEn`, and `description` match the current code.
