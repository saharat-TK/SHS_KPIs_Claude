import assert from "node:assert/strict";
import test from "node:test";
import {
  allExpandableKeys,
  areaKey,
  buildDataTable,
  buildDataTableCsv,
  groupKey,
  indicatorKey,
  kpiKey,
  metricsByKpi,
  NO_EDPEX_AREA,
  NO_INDICATOR_CODE,
  yearCells,
} from "../lib/kpi/dataTable.ts";
import {
  groupByEdpexTopic,
  groupsInUse,
  NO_EDPEX_TOPIC,
  UNCATEGORISED,
} from "../lib/kpi/dashboard.ts";

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
  assert.ok(collapsed[0].startsWith("Level,Group,Area,Indicator,Name,Unit,Y1 Value,Y1 Target,Y1 %,Y2 Value"));
  assert.ok(collapsed[0].endsWith(",5-Year Target"));
  assert.ok(collapsed[1].startsWith("Group,Research,,,Research,,,,100,"));

  const groupOpen = lines([groupKey("research")]);
  assert.equal(groupOpen.length, 3);
  assert.ok(groupOpen[2].startsWith('KPI,Research,,,"Rate, overall",Percent,80,80,100,'));
  assert.ok(groupOpen[2].endsWith(",90"));

  const allOpen = lines(allExpandableKeys(table));
  assert.equal(allOpen.length, 4);
  assert.ok(allOpen[3].startsWith("Sub-KPI,Research,,,Part,Persons,"));
});

// ── EdPEx area and indicator levels ──────────────────────────────────────────

const CATALOG = [
  { id: "7.1", name: "Learning", areas: [{ id: "7.1ก", name: "A" }, { id: "7.1ข", name: "B" }, { id: "7.1ค", name: "C" }] },
  { id: "7.2", name: "Customers", areas: [{ id: "7.2ก", name: "A" }] },
];

function edpexTable(kpis, { catalog = CATALOG, metrics = new Map() } = {}) {
  const { kpis: keyed, categories } = groupByEdpexTopic(kpis, CATALOG);
  return buildDataTable({
    kpis: keyed,
    groups: groupsInUse(keyed, categories),
    categories,
    metrics,
    quarter: 4,
    edpexCatalog: catalog ?? undefined,
  });
}

test("EdPEx topics split into their areas, in catalog order, with a last no-area bucket", () => {
  const table = edpexTable([
    kpi({ id: 1, name: "z in B", edpexTopicId: "7.1", edpexAreaId: "7.1ข", progress: [q(1, 4, 40)] }),
    kpi({ id: 2, name: "in A", edpexTopicId: "7.1", edpexAreaId: "7.1ก", progress: [q(1, 4, 80)] }),
    kpi({ id: 3, name: "a in B", edpexTopicId: "7.1", edpexAreaId: "7.1ข", progress: [q(1, 4, 80)] }),
    kpi({ id: 4, name: "no area", edpexTopicId: "7.1" }),
    kpi({ id: 5, name: "wrong topic's area", edpexTopicId: "7.1", edpexAreaId: "7.2ก" }),
    kpi({ id: 6, name: "no topic" }),
  ]);

  assert.deepEqual(table.map((g) => g.id), ["7.1", NO_EDPEX_TOPIC]);
  const [topic, noTopic] = table;
  // 7.1ค has no KPIs and drops out; the bucket comes last.
  assert.deepEqual(
    topic.areas.map((a) => [a.id, a.label, a.kpis.map((k) => k.name)]),
    [
      ["7.1ก", "7.1ก A", ["in A"]],
      ["7.1ข", "7.1ข B", ["a in B", "z in B"]],
      [`7.1${NO_EDPEX_AREA}`, "No EdPEx area", ["no area", "wrong topic's area"]],
    ],
  );
  // The topic still carries every KPI; its average covers all of them.
  assert.equal(topic.kpis.length, 5);
  assert.equal(topic.areas[0].years[0].pct, 100);
  // Area B: (50% + 100%) / 2.
  assert.equal(topic.areas[1].years[0].pct, 75);
  assert.equal(topic.years[0].pct, (100 + 50 + 100) / 3);
  // KPIs with no EdPEx topic stay flat.
  assert.equal(noTopic.areas, undefined);
  assert.deepEqual(noTopic.kpis.map((k) => k.name), ["no topic"]);
});

test("without a catalog no group gets areas", () => {
  const table = edpexTable([kpi({ edpexTopicId: "7.1", edpexAreaId: "7.1ก" })], { catalog: null });
  assert.equal(table[0].areas, undefined);
});

test("area and indicator keys expand, and the CSV nests KPIs under their open indicator", () => {
  const table = edpexTable(
    [
      kpi({ id: 1, name: "in A", edpexTopicId: "7.1", edpexAreaId: "7.1ก", edpexIndicatorCode: "7.1ก-1" }),
      kpi({ id: 2, name: "loose", edpexTopicId: "7.1" }),
    ],
    {
      metrics: metricsByKpi([
        { id: 9, perfKpiId: 1, name: "Part", unit: null, thresholdGreen: null, thresholdAmber: null },
      ]),
    },
  );
  const noArea = `7.1${NO_EDPEX_AREA}`;
  assert.deepEqual(allExpandableKeys(table), [
    groupKey("7.1"),
    areaKey("7.1ก"),
    indicatorKey("7.1ก|7.1ก-1"),
    areaKey(noArea),
    indicatorKey(`${noArea}${NO_INDICATOR_CODE}`),
    kpiKey(1),
  ]);

  const yearLabels = ["Y1", "Y2", "Y3", "Y4", "Y5"];
  const lines = (expanded) =>
    buildDataTableCsv(table, { expanded: new Set(expanded), yearLabels })
      .replace(/^\uFEFF/, "")
      .trimEnd()
      .split("\n")
      .slice(1)
      .map((l) => l.split(",").slice(0, 5).join(","));

  assert.deepEqual(lines([]), ["Group,7.1 Learning,,,7.1 Learning"]);
  assert.deepEqual(lines([groupKey("7.1")]), [
    "Group,7.1 Learning,,,7.1 Learning",
    "Area,7.1 Learning,7.1ก A,,7.1ก A",
    "Area,7.1 Learning,No EdPEx area,,No EdPEx area",
  ]);
  // An open area lists its indicators; their KPIs wait for the indicator.
  assert.deepEqual(lines([groupKey("7.1"), areaKey("7.1ก")]), [
    "Group,7.1 Learning,,,7.1 Learning",
    "Area,7.1 Learning,7.1ก A,,7.1ก A",
    "Indicator,7.1 Learning,7.1ก A,7.1ก-1,7.1ก-1",
    "Area,7.1 Learning,No EdPEx area,,No EdPEx area",
  ]);
  assert.deepEqual(lines(allExpandableKeys(table)), [
    "Group,7.1 Learning,,,7.1 Learning",
    "Area,7.1 Learning,7.1ก A,,7.1ก A",
    "Indicator,7.1 Learning,7.1ก A,7.1ก-1,7.1ก-1",
    "KPI,7.1 Learning,7.1ก A,7.1ก-1,in A",
    "Sub-KPI,7.1 Learning,7.1ก A,7.1ก-1,Part",
    "Area,7.1 Learning,No EdPEx area,,No EdPEx area",
    "Indicator,7.1 Learning,No EdPEx area,No indicator code,No indicator code",
    "KPI,7.1 Learning,No EdPEx area,No indicator code,loose",
  ]);
});

test("areas split by indicator code, in numeric order, with a last no-code bucket", () => {
  const table = edpexTable([
    kpi({ id: 1, name: "ten", edpexTopicId: "7.1", edpexAreaId: "7.1ก", edpexIndicatorCode: "7.1ก-10", progress: [q(1, 4, 40)] }),
    kpi({ id: 2, name: "two b", edpexTopicId: "7.1", edpexAreaId: "7.1ก", edpexIndicatorCode: "7.1ก-2", progress: [q(1, 4, 80)] }),
    kpi({ id: 3, name: "two a", edpexTopicId: "7.1", edpexAreaId: "7.1ก", edpexIndicatorCode: " 7.1ก-2 ", progress: [q(1, 4, 40)] }),
    kpi({ id: 4, name: "uncoded", edpexTopicId: "7.1", edpexAreaId: "7.1ก", edpexIndicatorCode: "  " }),
    kpi({ id: 5, name: "coded, no area", edpexTopicId: "7.1", edpexIndicatorCode: "7.1-9" }),
  ]);
  const [areaA, noArea] = table[0].areas;
  assert.deepEqual(
    areaA.indicators.map((i) => [i.id, i.label, i.kpis.map((k) => k.name)]),
    [
      ["7.1ก|7.1ก-2", "7.1ก-2", ["two a", "two b"]],
      ["7.1ก|7.1ก-10", "7.1ก-10", ["ten"]],
      [`7.1ก${NO_INDICATOR_CODE}`, "No indicator code", ["uncoded"]],
    ],
  );
  // Indicator 7.1ก-2: (50% + 100%) / 2; 7.1ก-10 alone at 50%.
  assert.equal(areaA.indicators[0].years[0].pct, 75);
  assert.equal(areaA.indicators[1].years[0].pct, 50);
  // The no-area bucket is split by code as well.
  assert.deepEqual(noArea.indicators.map((i) => i.label), ["7.1-9"]);
});
