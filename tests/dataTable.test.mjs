import assert from "node:assert/strict";
import test from "node:test";
import {
  allExpandableKeys,
  buildDataTable,
  buildDataTableCsv,
  groupKey,
  kpiKey,
  metricsByKpi,
  yearCells,
} from "../lib/kpi/dataTable.ts";
import { UNCATEGORISED } from "../lib/kpi/dashboard.ts";

const q = (yearNo, quarterNo, progressValue) => ({
  yearNo,
  quarterNo,
  progressValue,
  issue: null,
  solution: null,
});

function kpi(over = {}) {
  return {
    id: 1,
    name: "KPI",
    unit: "Percent",
    categoryId: "research",
    thresholdGreen: 100,
    thresholdAmber: 70,
    quarterlyTargetMode: "divide_equally",
    fiveYearTarget: 90,
    annualTargets: [
      { yearNo: 1, targetValue: 80 },
      { yearNo: 2, targetValue: 100 },
    ],
    progress: [],
    ...over,
  };
}

const GROUPS = [
  { id: "research", label: "Research" },
  { id: "students", label: "Students" },
];

test("year cells read every year as of the chosen quarter", () => {
  const cells = yearCells(kpi({ progress: [q(1, 2, 40), q(2, 4, 50)] }), 2);
  assert.equal(cells.length, 5);
  // divide_equally: the Q2 target is half the annual target.
  assert.deepEqual(cells[0], { yearNo: 1, value: 40, target: 40, pct: 100, health: "healthy" });
  // Year 2 has nothing recorded by Q2.
  assert.equal(cells[1].value, null);
  assert.equal(cells[1].target, 50);
  // No target set for year 3.
  assert.deepEqual(cells[2], { yearNo: 3, value: null, target: null, pct: null, health: null });

  const annual = yearCells(kpi({ quarterlyTargetMode: "use_annual", progress: [q(1, 2, 40)] }), 2);
  assert.equal(annual[0].target, 80);
  assert.equal(annual[0].pct, 50);
  assert.equal(annual[0].health, "at_risk");
});

test("buildDataTable groups, sorts and nests sub-KPIs with the parent's target mode", () => {
  const kpis = [
    kpi({ id: 1, name: "b KPI", progress: [q(1, 4, 80)] }),
    kpi({ id: 2, name: "A KPI", progress: [q(1, 4, 40)] }),
    kpi({ id: 3, name: "Lonely", categoryId: "students", quarterlyTargetMode: "use_annual" }),
    kpi({ id: 4, name: "Orphan", categoryId: "deleted_cat" }),
  ];
  const metrics = metricsByKpi([
    {
      id: 30,
      perfKpiId: 3,
      name: "Sub",
      unit: "Persons",
      fiveYearTarget: 10,
      thresholdGreen: 100,
      thresholdAmber: 70,
      annualTargets: [{ yearNo: 1, targetValue: 10 }],
      progress: [q(1, 1, 5)],
    },
  ]);
  const groups = [...GROUPS, { id: UNCATEGORISED, label: "Uncategorised" }];
  const table = buildDataTable({ kpis, groups, categories: GROUPS, metrics, quarter: 4 });

  assert.deepEqual(
    table.map((g) => [g.id, g.kpis.map((k) => k.name)]),
    [
      ["research", ["A KPI", "b KPI"]],
      ["students", ["Lonely"]],
      [UNCATEGORISED, ["Orphan"]],
    ],
  );
  // Group summary = mean achievement of its KPIs: (50% + 100%) / 2.
  assert.equal(table[0].years[0].pct, 75);
  assert.equal(table[0].years[0].health, "watch");
  assert.equal(table[0].years[1].pct, null);
  assert.equal(table[0].kpis[0].fiveYearTarget, 90);
  assert.deepEqual(table[0].kpis[0].subKpis, []);

  // The sub-KPI inherits use_annual: as of Q1 its target is the full 10.
  const [sub] = table[1].kpis[0].subKpis;
  assert.equal(sub.name, "Sub");
  assert.equal(sub.unit, "Persons");
  assert.equal(sub.fiveYearTarget, 10);
  assert.deepEqual(sub.years[0], { yearNo: 1, value: 5, target: 10, pct: 50, health: "at_risk" });
});

test("groups with no KPIs drop out", () => {
  const table = buildDataTable({
    kpis: [kpi()],
    groups: GROUPS,
    categories: GROUPS,
    metrics: new Map(),
    quarter: 4,
  });
  assert.deepEqual(table.map((g) => g.id), ["research"]);
});

test("expand-all keys cover groups and only KPIs that have sub-KPIs", () => {
  const table = buildDataTable({
    kpis: [kpi({ id: 1 }), kpi({ id: 2 })],
    groups: GROUPS,
    categories: GROUPS,
    metrics: metricsByKpi([{ id: 9, perfKpiId: 2, name: "m", unit: null, thresholdGreen: null, thresholdAmber: null }]),
    quarter: 4,
  });
  assert.deepEqual(allExpandableKeys(table), [groupKey("research"), kpiKey(2)]);
});

test("the CSV contains only the rows currently shown", () => {
  const table = buildDataTable({
    kpis: [kpi({ id: 1, name: "Rate, overall", progress: [q(1, 4, 80)] })],
    groups: GROUPS,
    categories: GROUPS,
    metrics: metricsByKpi([
      { id: 9, perfKpiId: 1, name: "Part", unit: "Persons", thresholdGreen: null, thresholdAmber: null },
    ]),
    quarter: 4,
  });
  const yearLabels = ["Y1", "Y2", "Y3", "Y4", "Y5"];
  const lines = (expanded) =>
    buildDataTableCsv(table, { expanded: new Set(expanded), yearLabels })
      .replace(/^﻿/, "")
      .trimEnd()
      .split("\n");

  const collapsed = lines([]);
  assert.equal(collapsed.length, 2);
  assert.ok(collapsed[0].startsWith("Level,Group,Name,Unit,Y1 Value,Y1 Target,Y1 %,Y2 Value"));
  assert.ok(collapsed[0].endsWith(",5-Year Target"));
  assert.ok(collapsed[1].startsWith("Group,Research,Research,,,,100,"));

  const groupOpen = lines([groupKey("research")]);
  assert.equal(groupOpen.length, 3);
  assert.ok(groupOpen[2].startsWith('KPI,Research,"Rate, overall",Percent,80,80,100,'));
  assert.ok(groupOpen[2].endsWith(",90"));

  const allOpen = lines(allExpandableKeys(table));
  assert.equal(allOpen.length, 4);
  assert.ok(allOpen[3].startsWith("Sub-KPI,Research,Part,Persons,"));
});
