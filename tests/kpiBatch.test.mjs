import assert from "node:assert/strict";
import test from "node:test";
import {
  buildKpiTemplateCsv,
  checkKpiBatch,
  emptyKpiBatchRow,
  kpiBatchRowError,
  normalizeKpiBatchRow,
  parseKpiPaste,
  readKpiTemplateCsv,
  toKpiCreateInput,
} from "../lib/kpi/kpiBatch.ts";

const LOOKUPS = {
  kpiTypes: [
    { id: "strategic", label: "Strategic" },
    { id: "operational", label: "Operational" },
    { id: "routine", label: "Routine" },
  ],
  categories: [
    { id: "student_success", kpiType: "strategic", label: "Student Success" },
    { id: "research_output", kpiType: "strategic", label: "Research Output" },
    { id: "routine_area_1", kpiType: "routine", label: "ด้านที่ 1-การผลิตบัณฑิต" },
    // Same label in both taxonomies: resolution must prefer the row's own.
    { id: "routine_research", kpiType: "routine", label: "Research Output" },
  ],
  committees: [
    { id: "C01", name: "Academic Affairs" },
    { id: "C02", name: "Research" },
  ],
};

const row = (over = {}) =>
  emptyKpiBatchRow({ name: "Graduate employment rate", kpiType: "strategic", ...over });

test("a complete row has no error", () => {
  assert.equal(
    kpiBatchRowError(row({ categoryId: "student_success", committeeId: "C01" }), LOOKUPS),
    null,
  );
});

test("name, type and committee are validated", () => {
  assert.match(kpiBatchRowError(row({ name: " a " }), LOOKUPS), /at least 2/);
  assert.match(kpiBatchRowError(row({ kpiType: "" }), LOOKUPS), /Choose a KPI type/);
  assert.match(kpiBatchRowError(row({ kpiType: "bogus" }), LOOKUPS), /Unknown KPI type "bogus"/);
  assert.match(kpiBatchRowError(row({ committeeId: "C99" }), LOOKUPS), /Unknown committee/);
  assert.match(kpiBatchRowError(row({ categoryId: "nope" }), LOOKUPS), /Unknown category/);
});

test("a category must belong to the taxonomy of the row's type", () => {
  // Operational uses the Strategic taxonomy.
  assert.equal(kpiBatchRowError(row({ kpiType: "operational", categoryId: "student_success" }), LOOKUPS), null);
  assert.match(
    kpiBatchRowError(row({ kpiType: "routine", categoryId: "student_success" }), LOOKUPS),
    /not a Routine category/,
  );
  assert.match(
    kpiBatchRowError(row({ kpiType: "strategic", categoryId: "routine_area_1" }), LOOKUPS),
    /not a Strategic category/,
  );
});

test("Routine rows store their category as routineCategoryId", () => {
  const routine = toKpiCreateInput(row({ kpiType: "routine", categoryId: "routine_area_1" }));
  assert.equal(routine.categoryId, null);
  assert.equal(routine.routineCategoryId, "routine_area_1");

  const strategic = toKpiCreateInput(row({ categoryId: "student_success", description: "  " }));
  assert.equal(strategic.categoryId, "student_success");
  assert.equal(strategic.routineCategoryId, null);
  assert.equal(strategic.description, null);
  assert.equal(strategic.weight, 0);
  assert.equal(strategic.unit, "Item");
});

test("checkKpiBatch ignores blank rows and flags duplicates without blocking", () => {
  const result = checkKpiBatch(
    [
      row({ name: "Placement rate" }),
      emptyKpiBatchRow({ kpiType: "strategic", committeeId: "C01" }), // pre-filled only
      row({ name: "placement   RATE" }),
      row({ name: "Existing KPI" }),
      row({ name: "x" }),
    ],
    LOOKUPS,
    ["existing kpi"],
  );
  assert.deepEqual(
    result.rows.map((r) => [r.blank, r.duplicate, r.error !== null]),
    [
      [false, true, false],
      [true, false, false],
      [false, true, false],
      [false, true, false],
      [false, false, true],
    ],
  );
  assert.equal(result.readyCount, 3);
  assert.equal(result.errorCount, 1);
  assert.equal(result.duplicateCount, 3);
});

test("pasted Excel rows resolve labels and fall back to defaults", () => {
  const text =
    "Name\tType\tCategory\tCommittee\tDescription\r\n" +
    "Employment rate\tstrategic\tstudent success\tacademic affairs\tWithin 1 year\r\n" +
    "Papers published\tRoutine\tResearch Output\t\t\r\n" +
    "\"Multi\nline\"\r\n" +
    "\t\t\t\t\r\n";
  const rows = parseKpiPaste(text, LOOKUPS, { kpiType: "operational", committeeId: "C02" });
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], {
    name: "Employment rate",
    kpiType: "strategic",
    categoryId: "student_success",
    committeeId: "C01",
    description: "Within 1 year",
  });
  // Same label in both taxonomies → the Routine one, matching the row's type.
  assert.equal(rows[1].categoryId, "routine_research");
  assert.equal(rows[1].committeeId, "C02");
  // A name-only paste takes the default type.
  assert.equal(rows[2].name, "Multi\nline");
  assert.equal(rows[2].kpiType, "operational");
});

test("unknown text is kept so the grid can show it as an error", () => {
  const [pasted] = parseKpiPaste("Something\tKPI-ish\tNo such cat", LOOKUPS);
  assert.equal(pasted.kpiType, "KPI-ish");
  assert.equal(pasted.categoryId, "No such cat");
  assert.match(kpiBatchRowError(pasted, LOOKUPS), /Unknown KPI type/);
});

test("the CSV template round-trips, with columns matched by header", () => {
  const template = buildKpiTemplateCsv();
  assert.deepEqual(readKpiTemplateCsv(template, LOOKUPS), []);

  const filled =
    template.trimEnd() +
    "\nGraduate count,Routine,ด้านที่ 1-การผลิตบัณฑิต,C02,\"Counts, by year\"\n,,,,\n";
  assert.deepEqual(readKpiTemplateCsv(filled, LOOKUPS), [
    {
      name: "Graduate count",
      kpiType: "routine",
      categoryId: "routine_area_1",
      committeeId: "C02",
      description: "Counts, by year",
    },
  ]);

  const reordered = "Description,KPI Name\nnotes,Retention rate\n";
  assert.deepEqual(readKpiTemplateCsv(reordered, LOOKUPS, { kpiType: "strategic" }), [
    emptyKpiBatchRow({ name: "Retention rate", kpiType: "strategic", description: "notes" }),
  ]);

  assert.throws(() => readKpiTemplateCsv("Type\nstrategic\n", LOOKUPS), /"Name" column/);
  assert.throws(() => readKpiTemplateCsv("", LOOKUPS), /empty/);
});

test("normalizeKpiBatchRow coerces a JSON body to strings", () => {
  assert.deepEqual(normalizeKpiBatchRow({ name: "A KPI", kpiType: null, committeeId: 7 }), {
    name: "A KPI",
    kpiType: "",
    categoryId: "",
    committeeId: "7",
    description: "",
  });
  assert.deepEqual(normalizeKpiBatchRow(null), emptyKpiBatchRow());
});
