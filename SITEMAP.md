# Health Sciences KPI Dashboard — Sitemap & Page Relationships

> Analysis of the Stitch-generated UI mockups in this repository.
> Each screen is a standalone `code.html` (with a `screen.png` preview) and uses
> `href="#"` placeholders — there are **no real links between pages**. The
> relationships below are inferred from each page's nav menus, breadcrumbs, and
> functional content.

## Repository contents

| File | Purpose |
|---|---|
| `DESIGN-nvidia.md` | NVIDIA-style design-system spec (green `#76b900`, 2px radius, black/white/gray). |
| `stitch_health_science_kpi_dashboard/kinetic_precision/DESIGN.md` | Material-style token set (same green primary) — the design language the mockups actually use. |
| `stitch_health_science_kpi_dashboard/*/code.html` | 11 dashboard screens. |

## Relationship map

```
                       ┌─────────────────────────────────────────────┐
                       │        Health sciences analytics             │
                       │  (shared app shell)                          │
                       │  Dashboard · Departments · Reports · Admin    │
                       └──────┬─────────────┬──────────────┬──────────┘
                              │             │              │
                ┌─────────────▼──┐  ┌───────▼──────────┐  ┌▼────────────────┐
                │ Faculty &      │  │ KPI configuration│  │ Analytics &     │
                │ departments    │  │ engine           │  │ monitoring      │
                │ (data source)  │  │ (definitions)    │  │ (consumption)   │
                │                │  │                  │  │                 │
                │ Departments &  │  │ KPI & sub-KPI    │  │ Student success │
                │ faculties      │  │ mgmt             │  │ view            │
                │     │          │  │     │            │  │                 │
                │ Faculty mgmt   │  │ KPI configuration│  │ Validation      │
                │ roster         │  │ (calc · v1 · v2) │  │ workflow        │
                │     │          │  │                  │  │                 │
                │ Global roster  │  │ Metrics mgmt     │  │                 │
                │ export         │  │                  │  │                 │
                │                │  │ Custom formula   │  │                 │
                │                │  │ builder          │  │                 │
                │                │  │     │            │  │                 │
                │                │  │ Version history  │  │                 │
                │                │  │ & audit          │  │                 │
                └────────────────┘  └──────────────────┘  └─────────────────┘
                       └──── feeds ────►  └──── drives ────►
```

Data pipeline reads left → right: faculty/department data **feeds** the KPI
configuration engine, which **drives** the analytics and monitoring views.

## Functional areas

### 1. Faculty & departments — the data source

| Page | Folder | Notes |
|---|---|---|
| Departments & faculties | [`departments_faculty_management/`](stitch_health_science_kpi_dashboard/departments_faculty_management/code.html) | Org tree (Nursing, PT, OT, Pharmacy, Public Health…) + faculty rosters. |
| Faculty management roster | [`global_faculty_management_roster/`](stitch_health_science_kpi_dashboard/global_faculty_management_roster/code.html) | Global faculty list with performance scores. |
| Global roster export | [`global_roster_export_workflow/`](stitch_health_science_kpi_dashboard/global_roster_export_workflow/code.html) | Export workflow — reached from the roster page's "Export List". |

### 2. KPI configuration engine — the definitions

| Page | Folder | Notes |
|---|---|---|
| KPI & sub-KPI management | [`kpi_sub_kpi_management/`](stitch_health_science_kpi_dashboard/kpi_sub_kpi_management/code.html) | Core config, sub-KPI structure, departmental mapping, thresholds. |
| KPI configuration + calc logic | [`kpi_configuration_with_calculation_logic_1/`](stitch_health_science_kpi_dashboard/kpi_configuration_with_calculation_logic_1/code.html) | Same screen extended with a "KPI Calculation Logic" panel. |
| Metrics management | [`metrics_management_assignment/`](stitch_health_science_kpi_dashboard/metrics_management_assignment/code.html) | Metric definitions, targets, data sources, department assignment. |
| Custom formula builder | [`custom_formula_builder/`](stitch_health_science_kpi_dashboard/custom_formula_builder/code.html) | Define/test formulas (variable library, validation). |
| Formula version history & audit | [`formula_version_history_audit_log/`](stitch_health_science_kpi_dashboard/formula_version_history_audit_log/code.html) | Version log with "Revert to v2.3" — the audit trail behind the builder. |

### 3. Analytics & monitoring — consumption

| Page | Folder | Notes |
|---|---|---|
| Student success deep-dive | [`detailed_kpi_deep_dive_student_success/`](stitch_health_science_kpi_dashboard/detailed_kpi_deep_dive_student_success/code.html) | KPI drill-down (overall → departmental → sub-KPI), quarterly filters. |
| Validation workflow | [`validation_workflow_approval_tracking/`](stitch_health_science_kpi_dashboard/validation_workflow_approval_tracking/code.html) | Validation queue + approve / reject / request-clarification. |

## Key relationships

- **Two navigation systems coexist** in the mockups and have not been unified:
  - Top bar: Dashboard · Departments · Reports · Administration
  - Left sidebar: Overview · Performance · Forecasting · Faculty Data · Audit Log
    (a variant uses Overview · Research Stats · Faculty Metrics · System Logs · Help Center)
- **Drill-down pairs:** roster → export; formula builder → version history;
  KPI/sub-KPI → calculation logic.
- **Cross-area dependency:** the KPI config pages reference "Departmental Mapping
  (17 tracked)," so the configuration engine depends on faculty/department data,
  and the analytics pages consume the configured KPIs.
- **Shared KPI taxonomy** (sub-nav on the config pages):
  Student Success · Faculty Excellence · Research Output · Operational Efficiency · Financial Health.

## Duplicate note

A `kpi_configuration_with_calculation_logic_2/` folder previously existed and was
**byte-identical** to `_1` (verified with `diff`, no `screen.png`). It was a stray
duplicate and has been removed.
