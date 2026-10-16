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
  edpex: [
    {
      id: "7.1",
      name: "ผลลัพธ์ด้านการเรียนรู้ของผู้เรียนและด้านกระบวนการ",
      areas: [
        { id: "7.1ก", topicId: "7.1", code: "ก", name: "ผลลัพธ์ด้านการเรียนรู้ของผู้เรียน", sortOrder: 1 },
        { id: "7.1ข", topicId: "7.1", code: "ข", name: "ผลลัพธ์ด้านประสิทธิผลของกระบวนการทำงาน", sortOrder: 2 },
      ],
    },
    {
      id: "7.2",
      name: "ผลลัพธ์ด้านลูกค้า",
      areas: [
        { id: "7.2ก", topicId: "7.2", code: "ก", name: "ผลลัพธ์ด้านการมุ่งเน้นผู้เรียนและลูกค้ากลุ่มอื่น", sortOrder: 3 },
      ],
    },
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
    edpexTopicId: "",
    edpexAreaId: "",
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
  const template = buildKpiTemplateCsv(LOOKUPS);
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
      edpexTopicId: "",
      edpexAreaId: "",
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
    edpexTopicId: "",
    edpexAreaId: "",
  });
  assert.deepEqual(normalizeKpiBatchRow(null), emptyKpiBatchRow());
});

// ── EdPEx topic / area ───────────────────────────────────────────────────────

test("the EdPEx area must belong to the EdPEx topic", () => {
  assert.equal(kpiBatchRowError(row({ edpexTopicId: "7.1", edpexAreaId: "7.1ข" }), LOOKUPS), null);
  assert.equal(kpiBatchRowError(row({ edpexTopicId: "7.2" }), LOOKUPS), null);
  assert.match(
    kpiBatchRowError(row({ edpexTopicId: "7.2", edpexAreaId: "7.1ข" }), LOOKUPS),
    /7\.1ข is not part of topic 7\.2/,
  );
  assert.match(kpiBatchRowError(row({ edpexTopicId: "7.9" }), LOOKUPS), /Unknown EdPEx topic/);
  assert.match(kpiBatchRowError(row({ edpexAreaId: "7.1ง" }), LOOKUPS), /Unknown EdPEx area/);
});

test("an EdPEx area given alone fills in its topic on create", () => {
  const input = toKpiCreateInput(row({ edpexAreaId: "7.2ก" }), LOOKUPS);
  assert.equal(input.edpexTopicId, "7.2");
  assert.equal(input.edpexAreaId, "7.2ก");
  const none = toKpiCreateInput(row(), LOOKUPS);
  assert.equal(none.edpexTopicId, null);
  assert.equal(none.edpexAreaId, null);
});

test("EdPEx is optional and filling it does not make a row touched", () => {
  assert.equal(
    checkKpiBatch([emptyKpiBatchRow({ edpexTopicId: "7.1", edpexAreaId: "7.1ก" })], LOOKUPS).rows[0]
      .blank,
    true,
  );
});

test("pasted EdPEx cells resolve by code, bare letter or name", () => {
  const rows = parseKpiPaste(
    "A KPI\tstrategic\t\t\t\t7.1\tข\n" +
      "B KPI\tstrategic\t\t\t\tผลลัพธ์ด้านลูกค้า\t7.2 ก.\n" +
      "C KPI\tstrategic\t\t\t\t\t7.1ก\n" +
      "D KPI\tstrategic\t\t\t\t7.2\tค\n",
    LOOKUPS,
  );
  assert.deepEqual(
    rows.map((r) => [r.edpexTopicId, r.edpexAreaId]),
    [
      ["7.1", "7.1ข"],
      ["7.2", "7.2ก"],
      ["7.1", "7.1ก"], // topic filled in from the area
      ["7.2", "ค"], // no such area in 7.2: kept verbatim and flagged
    ],
  );
  assert.match(kpiBatchRowError(rows[3], LOOKUPS), /Unknown EdPEx area "ค"/);
});

test("the template explains every column and lists the allowed values", () => {
  const template = buildKpiTemplateCsv(LOOKUPS, "Set 2567");
  assert.ok(template.startsWith("\uFEFF# SHS Batch Add KPIs template — Set 2567"));
  for (const expected of [
    "Lines starting with # are instructions",
    "Name — required",
    "strategic = Strategic",
    "For Strategic / Operational KPIs:",
    "routine_area_1 = ด้านที่ 1-การผลิตบัณฑิต",
    "C01 = Academic Affairs",
    "EdPEx Topic — optional",
    "7.1 = ผลลัพธ์ด้านการเรียนรู้ของผู้เรียนและด้านกระบวนการ",
    "Topic 7.2:",
    "7.2ก = ผลลัพธ์ด้านการมุ่งเน้นผู้เรียนและลูกค้ากลุ่มอื่น",
  ]) {
    assert.ok(template.includes(expected), `template should mention ${expected}`);
  }
  // Every non-header line is an instruction, so the file reads back empty…
  const lines = template.replace(/^\uFEFF/, "").trimEnd().split("\n");
  assert.equal(
    lines.at(-1),
    "Name,Type,Category,Committee,Description,EdPEx Topic,EdPEx Area",
  );
  assert.ok(lines.slice(0, -1).every((l) => l.startsWith("#") || l.startsWith('"#')));
  assert.deepEqual(readKpiTemplateCsv(template, LOOKUPS), []);

  // …and fills in as downloaded.
  const filled = template + "Graduate count,Routine,,C02,,7.1,ข\n";
  assert.deepEqual(readKpiTemplateCsv(filled, LOOKUPS), [
    {
      name: "Graduate count",
      kpiType: "routine",
      categoryId: "",
      committeeId: "C02",
      description: "",
      edpexTopicId: "7.1",
      edpexAreaId: "7.1ข",
    },
  ]);
});

test("template headers match loosely, and a pre-EdPEx file still imports", () => {
  const aliases = "kpi name,EdPEx-area,edpex_topic\nRetention,7.1ก,\n";
  assert.deepEqual(
    readKpiTemplateCsv(aliases, LOOKUPS).map((r) => [r.name, r.edpexTopicId, r.edpexAreaId]),
    [["Retention", "7.1", "7.1ก"]],
  );
  const old = "Name,Type,Category,Committee,Description\nOld KPI,strategic,,,notes\n";
  const [imported] = readKpiTemplateCsv(old, LOOKUPS);
  assert.equal(imported.description, "notes");
  assert.equal(imported.edpexTopicId, "");
});
