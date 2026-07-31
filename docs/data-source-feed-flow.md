# How data-source rows become performance progress

How a committee's raw data source (schema **LAYER D**) turns into the numbers shown
on a performance record (**LAYER B**), and where the auto-computed vs. user-entered
parts come from.

## 1. Two layers, bridged by provenance columns

- **Links are defined at the library layer.** `data_source_link` stores
  `library_kpi_id` / `library_metric_id` plus its `mappings` (which rows count,
  how they aggregate).
- **Progress lives at the performance layer:** `perf_kpi_quarter_progress` /
  `perf_metric_quarter_progress`.
- **The bridge is the snapshot provenance columns** `perf_kpi.source_kpi_id` /
  `perf_metric.source_metric_id`, populated when a strategic set is activated into
  a record (`copySetIntoRecord` in `lib/kpi/performance.ts`).

Because the join is on those columns filtered to `performance_record.status =
'active'`, **one library link fans out to every currently-active record** that
snapshotted that KPI/metric — producing one set of progress writes per record.

## 2. Linking stores a definition; the *feed* writes progress (same transaction)

`LinkKpiModal.tsx` → `useCreateDataSourceLink` / `useUpdateDataSourceLink` →
`POST /api/data-sources/[id]/links` / `PATCH /api/data-source-links/[id]`.

Those routes `INSERT`/`UPDATE` **`data_source_link` only** — no progress SQL of
their own — then call `feedFromDataSource()` (`lib/kpi/dataSourceFeed.ts`) before
commit. The route comment is explicit: a new link must not leave the KPIs it now
governs reading whatever they said before it existed.

So: a link with no matching entries writes no progress yet; once entries exist (or
already exist at link time), progress rows are written synchronously in that same
request.

## 3. What the feed writes (`applyLink`, `lib/kpi/dataSourceFeed.ts`)

- Target = **metric** → writes `perf_metric_quarter_progress` (`is_computed = 1`),
  then calls `recomputeKpiQuarter()` so the change rolls up into the parent KPI's
  `perf_kpi_quarter_progress`.
- Target = **KPI** → writes `perf_kpi_quarter_progress` (`is_computed = 1`),
  whether or not it has sub-KPIs. Linking a KPI to a source is a statement that
  the source owns its value, so `recomputeKpiQuarter` stands down for it
  (`rollsUpFromChildren` in `lib/kpi/performance.ts`). **Precedence: link >
  roll-up > manual.** A link can express what no `calculation_type` can — K2-1
  is "publications (Scopus Q1-Q2) per faculty member", whose divisor is the
  staff roster and whose numerator excludes two of its own sub-KPIs.
- The feed writes only `progress_value` plus `variable1_value` / `variable2_value`
  — on metric rows as well as KPI rows. It **never** writes `issue` / `solution` —
  a computed number has no narrative, so it bypasses the HTTP progress routes that
  require them.
- The feed **respects guards** (unlike the roll-up): a closed recording period, an
  approval-locked/under-review quarter, or a period with no rows is skipped and
  reported, never stamped over.

## 4. Feed triggers (all synchronous — there is no cron)

| Trigger | Route |
|---|---|
| Link create | `app/api/data-sources/[id]/links/route.ts` |
| Link update | `app/api/data-source-links/[id]/route.ts` |
| Entry create | `app/api/data-sources/[id]/entries/route.ts` |
| Entry update / delete | `app/api/data-source-entries/[id]/route.ts` |
| Manual "recompute from sources" button | `app/api/performance-records/[id]/recompute-from-sources/route.ts` (uses `feedRecord`) |

## 5. Parent-KPI computed value + save

The computed parent value is written by a **recompute that runs when metric data
changes — not when the user saves the parent's issue/solution.**

- `recomputeKpiQuarter` (`lib/kpi/performance.ts`) upserts the parent's
  `perf_kpi_quarter_progress.progress_value` via `rollup()` with `is_computed = 1`,
  **leaving issue/solution untouched**. It runs from three places: a metric-progress
  save (`app/api/perf-metrics/[id]/progress/route.ts`), the data-source feed, and
  `recomputeRecordRollups` (library re-sync). It no-ops for a KPI that has its own
  data-source link — the guard lives inside the function, not at those three call
  sites, so none of them can bypass it.
- **UI:** `page.tsx` sets `valueEditable = !kpi.hasChildren && !kpi.fedBy`. For a
  parent (or a directly-fed KPI), `ProgressPanel.tsx` / `QuarterEntry` renders the
  value **read-only** as "Computed value (Cumulative)", or "— (awaiting sub-KPI
  data)" when null. The number is read from the stored row — it is *not* recomputed
  client-side.
- **Save:** `PUT /api/perf-kpis/[id]/progress`, the `has_children` branch, upserts
  **only issue/solution**; its `ON DUPLICATE KEY UPDATE` omits `progress_value`, so
  the computed number is preserved. On a brand-new row it inserts
  `progress_value = NULL, is_computed = 1`, and a later recompute fills the number
  in. The two paths are order-independent and converge.

## 6. Column provenance

**Parent (`has_children`) KPI, not linked** — `perf_kpi_quarter_progress`. A
parent that IS linked reads as a fed KPI instead (`value_source =
'data_source'`), and the rows below describe the roll-up it no longer uses:

| Column | Source |
|---|---|
| `progress_value` | System — `rollupParts()` in `recomputeKpiQuarter` |
| `variable1_value` / `variable2_value` | System — the numerator/denominator that roll-up divided |
| `is_computed` | `1` |
| `value_source` | `'rollup'` |
| `issue` / `solution` | User — parent KPI `PUT` |

**Leaf KPI** — `progress_value` (and `variable1/2_value`) are user-entered,
`is_computed = 0`, `value_source = 'manual'`, and issue/solution are user-entered
— all in one `PUT`. A leaf KPI fed by a data source instead gets `progress_value`
from the feed (`is_computed = 1`, `value_source = 'data_source'`) and is read-only
in the UI.

**Every path fills the variable columns.** A link carries one mapping, and that
mapping already knows what it divided — `aggregateParts()` in
`lib/kpi/dataSourceFilters.ts` returns the numerator and denominator alongside
the result (a proportion's two sides, an average's total and row count, and so
on). Those parts are what the feed stores in `variable1_value` /
`variable2_value`, so a fed percent reads with the same basis a hand-entered one
would: "96 of 120 → 80%".

**Metric** — `perf_metric_quarter_progress`. A fed metric stores the same three
numbers (`progress_value` + the pair, `is_computed = 1`), and
`MetricProgressModal` shows them as "numerator / denominator / computed value".
The manual `PUT` NULLs the pair only when the incoming value differs from the
stored one: a metric has no variable inputs of its own, so the feed's pair must
not sit under a hand-typed number — but a fed metric is value-read-only and still
saves Issue/Solution through that route, echoing its value back, and that must
not strip the pair it is still the basis for. There is **no `value_source`
column** here: two engines write the table and `is_computed` already separates
them.

Every link — KPI or metric — carries exactly one mapping, so a two-part fraction
is expressed inside it: `percent_of` / `ratio_of` with `numeratorColumnKey`
totals the top on a different column from the bottom (employed ÷ graduates, both
on the same row), or with `denominatorSource: "faculty"` divides by the roster
headcount. Links once carried a `slot` naming which of the target's numbers they
fed (`value`, or the pair `variable1`/`variable2`); the pair said nothing the
proportion kinds do not, and every link that used it was misconfigured into
storing NULL. `scripts/migrate-link-value-slots.mjs` collapsed the stored ones.

`value_source` exists because `is_computed` cannot separate a roll-up from a
feed. It also marks the one provenance under which the stored pair is
re-derivable via `kpiValueFromVariables()`: `'manual'`. The computed pairs follow
`calculation_type` or the aggregation kind rather than the KPI's unit — see the
table in `lib/kpi/performance.ts#rollupParts`.
