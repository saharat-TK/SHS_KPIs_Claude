import assert from "node:assert/strict";
import test from "node:test";

import {
  categorySeries,
  categoryDetail,
  groupsInUse,
  healthMix,
  kpiStatusAsOf,
  kpisInGroup,
  pickActiveRecord,
  quarterSeries,
  statusesAsOf,
  summarize,
  targetsMet,
  recordingStateAsOf,
  recordingMix,
  recordingSlices,
  issuesAsOf,
  yearSeries,
  UNCATEGORISED,
} from "../lib/kpi/dashboard.ts";
import { valueAsOfQuarter } from "../lib/kpi/progress.ts";

// A leaf KPI shaped like the perf-kpis payload. `progress` rows carry only the
// fields the dashboard reads.
function kpi(over = {}) {
  return {
    id: 1,
    name: "KPI",
    unit: "Item",
    categoryId: "research_output",
    thresholdGreen: 80,
    thresholdAmber: 60,
    quarterlyTargetMode: "divide_equally",
    annualTargets: [{ yearNo: 1, targetValue: 100 }],
    progress: [],
    ...over,
  };
}

// `notes` is optional so the 300-odd existing three-arg calls keep their
// issue/solution nulls.
const q = (yearNo, quarterNo, progressValue, notes = {}) => ({
  yearNo,
  quarterNo,
  progressValue,
  issue: null,
  solution: null,
  ...notes,
});

// ── valueAsOfQuarter ────────────────────────────────────────────────────────

test("valueAsOfQuarter reads the quarter itself when it has a value", () => {
  assert.equal(valueAsOfQuarter([q(1, 2, 12)], 1, 2), 12);
});

test("valueAsOfQuarter falls back to the newest earlier quarter", () => {
  // use_annual KPIs typically record Q3 and Q4 only — asking for Q4 must not
  // stop at an empty Q4 row when Q3 holds the value.
  const rows = [q(1, 1, null), q(1, 3, 76.2), q(1, 4, null)];
  assert.equal(valueAsOfQuarter(rows, 1, 4), 76.2);
});

test("valueAsOfQuarter never looks forward", () => {
  assert.equal(valueAsOfQuarter([q(1, 3, 76.2)], 1, 2), null);
});

test("valueAsOfQuarter stays inside its year", () => {
  assert.equal(valueAsOfQuarter([q(1, 4, 90)], 2, 4), null);
});

test("valueAsOfQuarter returns null for an all-null or missing year", () => {
  assert.equal(valueAsOfQuarter([q(1, 1, null), q(1, 2, null)], 1, 4), null);
  assert.equal(valueAsOfQuarter(undefined, 1, 4), null);
});

// ── kpiStatusAsOf ───────────────────────────────────────────────────────────

test("divide_equally grades against a quarter slice of the annual target", () => {
  const k = kpi({ progress: [q(1, 1, 25)] });
  const s = kpiStatusAsOf(k, 1, 1);
  assert.equal(s.quarterTarget, 25); // 100 * 1/4
  assert.equal(s.pct, 100);
  assert.equal(s.health, "healthy");
});

test("use_annual grades against the whole annual target every quarter", () => {
  const k = kpi({ quarterlyTargetMode: "use_annual", progress: [q(1, 1, 25)] });
  const s = kpiStatusAsOf(k, 1, 1);
  assert.equal(s.quarterTarget, 100);
  assert.equal(s.pct, 25);
  assert.equal(s.health, "at_risk");
});

test("the live Y2Q4 innovation-patents reading is 84% and healthy", () => {
  // Record 2, "Number of Innovation patent and inventions": Y2 target 25,
  // Q4 value 21, divide_equally → Q4 target is the full 25.
  const k = kpi({
    annualTargets: [{ yearNo: 2, targetValue: 25 }],
    progress: [q(2, 1, 6), q(2, 2, 12), q(2, 3, 16), q(2, 4, 21)],
  });
  const s = kpiStatusAsOf(k, 2, 4);
  assert.equal(s.pct, 84);
  assert.equal(s.health, "healthy");
});

test("over-achievement stays healthy and is reported past 100%", () => {
  const k = kpi({
    quarterlyTargetMode: "use_annual",
    thresholdGreen: 100,
    thresholdAmber: 70,
    progress: [q(1, 3, 104.4444)],
  });
  const s = kpiStatusAsOf(k, 1, 3);
  assert.ok(s.pct > 104 && s.pct < 105);
  assert.equal(s.health, "healthy");
});

test("a KPI with no thresholds has an achievement but no health", () => {
  const k = kpi({ thresholdGreen: null, thresholdAmber: null, progress: [q(1, 4, 90)] });
  const s = kpiStatusAsOf(k, 1, 4);
  assert.equal(s.pct, 90);
  assert.equal(s.health, null);
});

test("a missing target or value leaves both pct and health null", () => {
  assert.equal(kpiStatusAsOf(kpi({ annualTargets: [] , progress: [q(1, 4, 9)] }), 1, 4).pct, null);
  assert.equal(kpiStatusAsOf(kpi(), 1, 4).pct, null);
  assert.equal(kpiStatusAsOf(kpi(), 1, 4).health, null);
});

test("a zero target cannot produce an achievement", () => {
  const k = kpi({ annualTargets: [{ yearNo: 1, targetValue: 0 }], progress: [q(1, 4, 5)] });
  assert.equal(kpiStatusAsOf(k, 1, 4).pct, null);
});

// ── summarize ───────────────────────────────────────────────────────────────

test("summarize counts data, grading and health separately", () => {
  const statuses = statusesAsOf(
    [
      // Mixed units on purpose: only the achievement % is comparable.
      kpi({ id: 1, unit: "Item", progress: [q(1, 4, 100)] }), // 100% healthy
      kpi({ id: 2, unit: "Percent", progress: [q(1, 4, 65)] }), // 65% watch
      kpi({ id: 3, unit: "Ratio", progress: [q(1, 4, 10)] }), // 10% at risk
      kpi({ id: 4, thresholdGreen: null, thresholdAmber: null, progress: [q(1, 4, 90)] }),
      kpi({ id: 5 }), // nothing recorded
    ],
    1,
    4,
  );
  const s = summarize(statuses);
  assert.equal(s.total, 5);
  assert.equal(s.withData, 4);
  assert.equal(s.graded, 3);
  assert.equal(s.onTarget, 1);
  assert.equal(s.watch, 1);
  assert.equal(s.atRisk, 1);
  assert.equal(s.noData, 1);
  // Share of GRADED KPIs, not of all five.
  assert.ok(Math.abs(s.pctOnTarget - 100 / 3) < 1e-9);
  // Mean over the four with data, including the ungraded one.
  assert.equal(s.avgAchievement, (100 + 65 + 10 + 90) / 4);
});

test("summarize of an empty scope reports nulls, not zeros", () => {
  const s = summarize([]);
  assert.equal(s.total, 0);
  assert.equal(s.pctOnTarget, null);
  assert.equal(s.avgAchievement, null);
});

test("summarize with data but no thresholds cannot report on-target", () => {
  const statuses = statusesAsOf(
    [kpi({ thresholdGreen: null, thresholdAmber: null, progress: [q(1, 4, 90)] })],
    1,
    4,
  );
  const s = summarize(statuses);
  assert.equal(s.withData, 1);
  assert.equal(s.graded, 0);
  assert.equal(s.pctOnTarget, null);
});

test("healthMix keeps its slice order and includes the no-data slice", () => {
  const mix = healthMix(summarize(statusesAsOf([kpi()], 1, 4)));
  assert.deepEqual(
    mix.map((m) => m.key),
    ["healthy", "watch", "at_risk", "no_data"],
  );
  assert.equal(mix[3].value, 1);
});

// ── pickActiveRecord ────────────────────────────────────────────────────────

const rec = (over) => ({ id: 1, status: "active", activatedAt: "2026-07-03 17:11:14", ...over });

test("pickActiveRecord ignores closed and archived records", () => {
  assert.equal(pickActiveRecord([rec({ id: 1, status: "closed" }), rec({ id: 2, status: "archived" })]), null);
  assert.equal(pickActiveRecord([]), null);
  assert.equal(pickActiveRecord(undefined), null);
});

test("pickActiveRecord prefers the record with open recording periods", () => {
  // The live pair: record 1 was activated first but has no open periods.
  const picked = pickActiveRecord([
    rec({ id: 2, activatedAt: "2026-07-04 11:41:51", openPeriodCount: 12 }),
    rec({ id: 1, activatedAt: "2026-07-03 17:11:14", openPeriodCount: 0 }),
  ]);
  assert.equal(picked.id, 2);
});

test("open periods outrank a later activation", () => {
  const picked = pickActiveRecord([
    rec({ id: 1, activatedAt: "2026-01-01 00:00:00", openPeriodCount: 4 }),
    rec({ id: 2, activatedAt: "2026-09-09 00:00:00", openPeriodCount: 0 }),
  ]);
  assert.equal(picked.id, 1);
});

test("with periods equal, the most recent activation wins, then the id", () => {
  assert.equal(
    pickActiveRecord([
      rec({ id: 1, activatedAt: "2026-01-01 00:00:00" }),
      rec({ id: 2, activatedAt: "2026-09-09 00:00:00" }),
    ]).id,
    2,
  );
  assert.equal(
    pickActiveRecord([
      rec({ id: 1, activatedAt: "2026-01-01 00:00:00" }),
      rec({ id: 7, activatedAt: "2026-01-01 00:00:00" }),
    ]).id,
    7,
  );
});

// ── grouping ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "student_success", label: "Student Success" },
  { id: "research_output", label: "Research Output" },
  { id: "community_services", label: "Community Services" },
];

test("groupsInUse omits categories the record does not use", () => {
  const kpis = [kpi({ id: 1, categoryId: "research_output" })];
  assert.deepEqual(
    groupsInUse(kpis, CATEGORIES).map((g) => g.id),
    ["research_output"],
  );
});

test("groupsInUse keeps the categories' own order", () => {
  const kpis = [
    kpi({ id: 1, categoryId: "research_output" }),
    kpi({ id: 2, categoryId: "student_success" }),
  ];
  assert.deepEqual(
    groupsInUse(kpis, CATEGORIES).map((g) => g.id),
    ["student_success", "research_output"],
  );
});

test("KPIs with a null or unknown category fall into one Uncategorised group", () => {
  const kpis = [kpi({ id: 1, categoryId: null }), kpi({ id: 2, categoryId: "deleted_cat" })];
  const groups = groupsInUse(kpis, CATEGORIES);
  assert.deepEqual(groups.map((g) => g.id), [UNCATEGORISED]);
  // Given the categories, both land in the group that groupsInUse offered — a
  // KPI pointing at a deleted category is never left unreachable.
  assert.deepEqual(kpisInGroup(kpis, UNCATEGORISED, CATEGORIES).map((k) => k.id), [1, 2]);
  // Without them, only the genuinely null one can be identified.
  assert.deepEqual(kpisInGroup(kpis, UNCATEGORISED).map((k) => k.id), [1]);
});

test("categorySeries reports one row per used group, worst health winning", () => {
  const kpis = [
    kpi({ id: 1, categoryId: "research_output", progress: [q(1, 4, 100)] }), // healthy
    kpi({ id: 2, categoryId: "research_output", progress: [q(1, 4, 10)] }), // at risk
    kpi({ id: 3, categoryId: "student_success", progress: [q(1, 4, 100)] }), // healthy
  ];
  const rows = categorySeries(kpis, CATEGORIES, 1, 4);
  assert.equal(rows.length, 2);
  const research = rows.find((r) => r.id === "research_output");
  assert.equal(research.health, "at_risk");
  assert.equal(research.pct, 55); // (100 + 10) / 2
  assert.equal(research.onTarget, 1);
  assert.equal(rows.find((r) => r.id === "student_success").health, "healthy");
});

test("a group with no gradable data has null health rather than at_risk", () => {
  const rows = categorySeries([kpi({ id: 1, categoryId: "research_output" })], CATEGORIES, 1, 4);
  assert.equal(rows[0].health, null);
  assert.equal(rows[0].pct, null);
});

// ── series builders ─────────────────────────────────────────────────────────

test("quarterSeries walks Q1..Q4 and omits quarters with no data", () => {
  const kpis = [kpi({ id: 1, progress: [q(1, 3, 75), q(1, 4, 100)] })];
  const { rows, lines } = quarterSeries(kpis, CATEGORIES, 1);
  assert.deepEqual(rows.map((r) => r.quarter), ["Q1", "Q2", "Q3", "Q4"]);
  assert.equal(rows[0].overall, undefined); // nothing recorded by Q1
  assert.equal(rows[2].overall, 100); // 75 against a 75 quarter target
  assert.equal(rows[3].overall, 100); // 100 against the full 100
  // One group in scope → the overall line only, no redundant per-group line.
  assert.deepEqual(lines.map((l) => l.key), ["overall"]);
});

test("quarterSeries adds a line per group once more than one is in scope", () => {
  const kpis = [
    kpi({ id: 1, categoryId: "research_output", progress: [q(1, 4, 100)] }),
    kpi({ id: 2, categoryId: "student_success", progress: [q(1, 4, 50)] }),
  ];
  const { rows, lines } = quarterSeries(kpis, CATEGORIES, 1);
  assert.deepEqual(lines.map((l) => l.key), [
    "overall",
    "g_student_success",
    "g_research_output",
  ]);
  assert.equal(rows[3].overall, 75);
  assert.equal(rows[3].g_research_output, 100);
  assert.equal(rows[3].g_student_success, 50);
});

test("yearSeries spans the record and labels calendar years from startYear", () => {
  const kpis = [
    kpi({
      id: 1,
      annualTargets: [
        { yearNo: 1, targetValue: 100 },
        { yearNo: 2, targetValue: 100 },
      ],
      progress: [q(1, 4, 90), q(2, 4, 100)],
    }),
  ];
  const rows = yearSeries(kpis, 4, 2565);
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((r) => r.year), ["2565", "2566", "2567", "2568", "2569"]);
  assert.equal(rows[0].achievement, 90);
  assert.equal(rows[1].achievement, 100);
  assert.equal(rows[2].achievement, null); // year 3 has neither target nor value
  assert.equal(rows[0].recorded, 1);
  assert.equal(rows[2].recorded, 0);
  assert.ok(rows.every((r) => r.target === 100));
});

// ── targetsMet ──────────────────────────────────────────────────────────────

// The same mixed scope the summarize test uses, so the two headline numbers can
// be compared directly.
function mixedScope() {
  return statusesAsOf(
    [
      kpi({ id: 1, unit: "Item", progress: [q(1, 4, 100)] }), // 100% healthy
      kpi({ id: 2, unit: "Percent", progress: [q(1, 4, 65)] }), // 65% watch
      kpi({ id: 3, unit: "Ratio", progress: [q(1, 4, 10)] }), // 10% at risk
      kpi({ id: 4, thresholdGreen: null, thresholdAmber: null, progress: [q(1, 4, 90)] }),
      kpi({ id: 5 }), // nothing recorded
    ],
    1,
    4,
  );
}

test("targetsMet divides by every KPI in scope, not just the graded ones", () => {
  const t = targetsMet(mixedScope());
  assert.equal(t.met, 1);
  assert.equal(t.graded, 3);
  assert.equal(t.total, 5);
  assert.equal(t.pctOfAll, 20);
});

test("targetsMet is a different quantity from summarize().pctOnTarget", () => {
  // This gap is the whole point: 1 of 5 KPIs met target, but pctOnTarget reports
  // 1 of the 3 that could be graded and reads 33%. Both are true; only one
  // answers "how many KPIs met target".
  const statuses = mixedScope();
  const t = targetsMet(statuses);
  const s = summarize(statuses);
  assert.ok(t.pctOfAll < s.pctOnTarget);
  assert.equal(t.met, s.onTarget);
  assert.equal(t.graded, s.graded);
});

test("targetsMet of an empty scope reports null, not zero percent", () => {
  const t = targetsMet([]);
  assert.equal(t.total, 0);
  assert.equal(t.met, 0);
  assert.equal(t.pctOfAll, null);
});

test("targetsMet reaches 100 only when every KPI in scope met target", () => {
  const statuses = statusesAsOf(
    [kpi({ id: 1, progress: [q(1, 4, 100)] }), kpi({ id: 2, progress: [q(1, 4, 120)] })],
    1,
    4,
  );
  assert.equal(targetsMet(statuses).pctOfAll, 100);
});

// ── recordingStateAsOf ──────────────────────────────────────────────────────

test("a value entered for the asked quarter is recorded", () => {
  assert.equal(recordingStateAsOf(kpi({ progress: [q(1, 3, 50)] }), 1, 3), "recorded");
});

test("a value from an earlier quarter of the same year is carried, not recorded", () => {
  // The use_annual shape: Q3 holds the number, Q4 is empty, and the rest of the
  // dashboard still shows 50 at Q4 via valueAsOfQuarter.
  const k = kpi({ progress: [q(1, 3, 50), q(1, 4, null)] });
  assert.equal(recordingStateAsOf(k, 1, 4), "carried");
  assert.equal(valueAsOfQuarter(k.progress, 1, 4), 50);
});

test("a quarter row that exists with no value is missing, not recorded", () => {
  // An issue can be typed before the number arrives, which creates the row.
  const k = kpi({ progress: [q(1, 4, null, { issue: "late data" })] });
  assert.equal(recordingStateAsOf(k, 1, 4), "missing");
});

test("recording state never reaches across years", () => {
  assert.equal(recordingStateAsOf(kpi({ progress: [q(1, 4, 50)] }), 2, 4), "missing");
});

test("recording state never looks forward", () => {
  assert.equal(recordingStateAsOf(kpi({ progress: [q(1, 4, 50)] }), 1, 2), "missing");
});

// ── recordingMix / recordingSlices ──────────────────────────────────────────

test("recordingMix counts the three states and they sum to the total", () => {
  const kpis = [
    kpi({ id: 1, progress: [q(1, 4, 10)] }), // recorded
    kpi({ id: 2, progress: [q(1, 2, 10)] }), // carried
    kpi({ id: 3, progress: [q(1, 4, null)] }), // missing (row, no value)
    kpi({ id: 4 }), // missing (no rows at all)
  ];
  const m = recordingMix(kpis, 1, 4);
  assert.equal(m.recorded, 1);
  assert.equal(m.carried, 1);
  assert.equal(m.missing, 2);
  assert.equal(m.total, 4);
  assert.equal(m.recorded + m.carried + m.missing, m.total);
});

test("recordingMix separates this quarter's entries from any reading at all", () => {
  const kpis = [kpi({ id: 1, progress: [q(1, 4, 10)] }), kpi({ id: 2, progress: [q(1, 2, 10)] })];
  const m = recordingMix(kpis, 1, 4);
  assert.equal(m.pctThisQuarter, 50); // only one was entered for Q4
  assert.equal(m.pctWithReading, 100); // but both show a number as of Q4
  assert.notEqual(m.pctThisQuarter, m.pctWithReading);
});

test("recordingMix of an empty scope reports nulls, not zeros", () => {
  const m = recordingMix([], 1, 4);
  assert.equal(m.total, 0);
  assert.equal(m.pctThisQuarter, null);
  assert.equal(m.pctWithReading, null);
});

test("recordingSlices keeps a fixed key order so the donut colours never shuffle", () => {
  const slices = recordingSlices(recordingMix([kpi({ progress: [q(1, 4, 10)] })], 1, 4));
  assert.deepEqual(
    slices.map((s) => s.key),
    ["recorded", "carried", "missing"],
  );
  assert.equal(slices[0].value, 1);
});

// ── issuesAsOf ──────────────────────────────────────────────────────────────

test("issuesAsOf returns only rows with an issue actually typed", () => {
  const kpis = [
    kpi({
      id: 1,
      name: "Graduate employment",
      progress: [
        q(1, 1, 10, { issue: "  ", solution: "ignored" }), // whitespace only
        q(1, 2, 10), // both null
        q(1, 3, 10, { issue: "Survey returns late", solution: "Chase deans" }),
      ],
    }),
  ];
  const rows = issuesAsOf(kpis, 1, 4);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].issue, "Survey returns late");
  assert.equal(rows[0].solution, "Chase deans");
  assert.equal(rows[0].kpiName, "Graduate employment");
  assert.equal(rows[0].quarterNo, 3);
});

test("issuesAsOf keeps an issue that has no remedy yet", () => {
  const rows = issuesAsOf([kpi({ progress: [q(1, 2, 10, { issue: "No data source" })] })], 1, 4);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].solution, null);
});

test("issuesAsOf is cumulative and inclusive of the asked quarter", () => {
  const k = kpi({
    progress: [
      q(1, 1, 10, { issue: "Q1 problem" }),
      q(1, 2, 10, { issue: "Q2 problem" }),
      q(1, 3, 10, { issue: "Q3 problem" }),
    ],
  });
  const rows = issuesAsOf([k], 1, 2);
  assert.deepEqual(
    rows.map((r) => r.quarterNo),
    [2, 1],
  );
});

test("issuesAsOf defaults to the whole year", () => {
  const k = kpi({
    progress: [q(1, 1, 10, { issue: "a" }), q(1, 4, 10, { issue: "b" })],
  });
  assert.equal(issuesAsOf([k], 1).length, 2);
});

test("issuesAsOf leads with the newest quarter, then the KPIs' own order", () => {
  const kpis = [
    kpi({ id: 1, name: "First", progress: [q(1, 2, 10, { issue: "older" })] }),
    kpi({ id: 2, name: "Second", progress: [q(1, 4, 10, { issue: "newest" })] }),
    kpi({ id: 3, name: "Third", progress: [q(1, 2, 10, { issue: "also older" })] }),
  ];
  const rows = issuesAsOf(kpis, 1, 4);
  assert.deepEqual(
    rows.map((r) => r.kpiName),
    ["Second", "First", "Third"],
  );
});

test("issuesAsOf never reaches into another year", () => {
  const k = kpi({
    progress: [q(1, 4, 10, { issue: "year one" }), q(2, 4, 10, { issue: "year two" })],
  });
  const rows = issuesAsOf([k], 2, 4);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].issue, "year two");
});

// ── categoryDetail ──────────────────────────────────────────────────────────

test("categoryDetail divides met by the group total, not by the graded count", () => {
  const kpis = [
    kpi({ id: 1, categoryId: "research_output", progress: [q(1, 4, 100)] }), // healthy
    kpi({ id: 2, categoryId: "research_output", progress: [q(1, 4, 10)] }), // at risk
    kpi({ id: 3, categoryId: "research_output" }), // nothing recorded
  ];
  const row = categoryDetail(kpis, CATEGORIES, 1, 4)[0];
  assert.equal(row.onTarget, 1);
  assert.equal(row.total, 3);
  assert.ok(Math.abs(row.pctMet - 100 / 3) < 1e-9);
});

test("pctMet and pct answer different questions and can diverge sharply", () => {
  // Both KPIs over-achieve on average, but only one clears its threshold — the
  // group averages 105% while half its KPIs missed. Leading with the average
  // would flatter the group, which is why the card highlights pctMet.
  const kpis = [
    kpi({ id: 1, categoryId: "research_output", progress: [q(1, 4, 140)] }), // 140% healthy
    kpi({ id: 2, categoryId: "research_output", progress: [q(1, 4, 70)] }), // 70% watch
  ];
  const row = categoryDetail(kpis, CATEGORIES, 1, 4)[0];
  assert.equal(row.pct, 105);
  assert.equal(row.pctMet, 50);
  assert.notEqual(row.pct, row.pctMet);
});

test("categoryDetail attaches the group's own KPIs in input order", () => {
  const kpis = [
    kpi({ id: 7, categoryId: "research_output", progress: [q(1, 4, 100)] }),
    kpi({ id: 3, categoryId: "student_success" }),
    kpi({ id: 9, categoryId: "research_output" }),
  ];
  const rows = categoryDetail(kpis, CATEGORIES, 1, 4);
  const research = rows.find((r) => r.id === "research_output");
  assert.deepEqual(
    research.statuses.map((s) => s.kpiId),
    [7, 9],
  );
  assert.equal(research.statuses.length, research.total);
  assert.equal(rows.find((r) => r.id === "student_success").statuses.length, 1);
});

test("a group with no gradable data reports pctMet 0, and null achievement", () => {
  // 0 is right here, not null: the group HAS a KPI, and none of them met target.
  // Only an empty group has nothing to divide by.
  const row = categoryDetail([kpi({ id: 1, categoryId: "research_output" })], CATEGORIES, 1, 4)[0];
  assert.equal(row.pctMet, 0);
  assert.equal(row.pct, null);
  assert.equal(row.health, null);
});

test("categorySeries is exactly categoryDetail without the extra fields", () => {
  // Guards the delegation: the bar chart's row must not gain or lose anything.
  const kpis = [
    kpi({ id: 1, categoryId: "research_output", progress: [q(1, 4, 100)] }),
    kpi({ id: 2, categoryId: "student_success", progress: [q(1, 4, 10)] }),
  ];
  const lean = categorySeries(kpis, CATEGORIES, 1, 4);
  const full = categoryDetail(kpis, CATEGORIES, 1, 4);
  assert.deepEqual(
    lean,
    full.map(({ pctMet, statuses, ...rest }) => rest),
  );
  assert.deepEqual(Object.keys(lean[0]).sort(), [
    "health",
    "id",
    "label",
    "onTarget",
    "pct",
    "total",
  ]);
});
