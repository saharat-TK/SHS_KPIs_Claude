import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv } from "../lib/csv.ts";
import { KPI_BATCH_COLUMNS, readKpiTemplateCsv } from "../lib/kpi/kpiBatch.ts";
import {
  buildKpiExportCsv,
  buildKpiExportFilename,
  kpiExportDetailHeaders,
} from "../lib/kpi/kpiExport.ts";

const LOOKUPS = {
  kpiTypes: [
    { id: "strategic", label: "Strategic" },
    { id: "operational", label: "Operational" },
    { id: "routine", label: "Routine" },
  ],
  categories: [
    { id: "student_success", kpiType: "strategic", label: "Student Success" },
    { id: "routine_area_1", kpiType: "routine", label: "ด้านที่ 1-การผลิตบัณฑิต" },
    // Same label in both taxonomies: a round trip must land on the row's own.
    { id: "research_output", kpiType: "strategic", label: "Research Output" },
    { id: "routine_research", kpiType: "routine", label: "Research Output" },
  ],
  committees: [
    { id: "C01", name: "Academic Affairs" },
    { id: "C02", name: "Research" },
  ],
  edpex: [
    {
      id: "7.1",
      name: "ผลลัพธ์ด้านการเรียนรู้",
      areas: [{ id: "7.1ข", topicId: "7.1", code: "ข", name: "กระบวนการ", sortOrder: 1 }],
    },
  ],
};

const SET = { startYear: 2565, endYear: 2569 };

const kpi = (over = {}) => ({
  name: "Graduate employment rate",
  kpiType: "strategic",
  categoryId: "student_success",
  routineCategoryId: null,
  committeeId: "C01",
  description: null,
  edpexTopicId: null,
  edpexAreaId: null,
  edpexIndicatorCode: null,
  weight: 10,
  unit: "Percent",
  fiveYearTarget: 90,
  calculationType: "weighted_sum",
  thresholdGreen: 80,
  thresholdAmber: 60,
  collectionPeriod: "every_quarter",
  isDraft: false,
  metricCount: 3,
  annualTargets: [
    { yearNo: 1, targetValue: 70 },
    { yearNo: 2, targetValue: 75 },
    { yearNo: 5, targetValue: 90 },
  ],
  ...over,
});

const cells = (csv) => parseCsv(csv).filter((r) => r.some((c) => c !== ""));

test("the header starts with the template columns, then the details", () => {
  const [header] = cells(buildKpiExportCsv([kpi()], LOOKUPS, SET));
  const templateLabels = KPI_BATCH_COLUMNS.map((c) => c.label);
  assert.deepEqual(header.slice(0, templateLabels.length), templateLabels);
  assert.deepEqual(header.slice(templateLabels.length), kpiExportDetailHeaders(SET));
});

test("target columns name the set's B.E. years", () => {
  const headers = kpiExportDetailHeaders(SET);
  assert.ok(headers.includes("Target Y1 (2565)"));
  assert.ok(headers.includes("Target Y5 (2569)"));
});

test("a row writes readable labels and every detail", () => {
  const [header, row] = cells(buildKpiExportCsv([kpi()], LOOKUPS, SET));
  const at = (h) => row[header.indexOf(h)];
  assert.equal(at("Type"), "Strategic");
  assert.equal(at("Category"), "Student Success");
  assert.equal(at("Committee"), "Academic Affairs");
  assert.equal(at("Weight (%)"), "10");
  assert.equal(at("Target Y1 (2565)"), "70");
  assert.equal(at("Target Y3 (2567)"), ""); // missing year stays blank
  assert.equal(at("Target Y5 (2569)"), "90");
  assert.equal(at("Calculation"), "Weighted sum");
  assert.equal(at("Collection Period"), "Every quarter");
  assert.equal(at("Draft"), "No");
  assert.equal(at("Sub-KPIs"), "3");
});

test("a Routine KPI exports its routine category, not the strategic one", () => {
  const [header, row] = cells(
    buildKpiExportCsv(
      [kpi({ kpiType: "routine", categoryId: "student_success", routineCategoryId: "routine_area_1" })],
      LOOKUPS,
      SET,
    ),
  );
  assert.equal(row[header.indexOf("Category")], "ด้านที่ 1-การผลิตบัณฑิต");
});

test("commas, quotes, newlines and Thai survive", () => {
  const name = 'อัตรา "การมีงานทำ", ของบัณฑิต';
  const description = "line one\nline two";
  const [, row] = cells(buildKpiExportCsv([kpi({ name, description })], LOOKUPS, SET));
  assert.equal(row[0], name);
  assert.equal(row[4], description);
});

test("an export re-imports through the template reader", () => {
  const exported = [
    kpi({ edpexTopicId: "7.1", edpexAreaId: "7.1ข", edpexIndicatorCode: "7.1ข-4" }),
    kpi({
      name: "Research grants",
      kpiType: "routine",
      categoryId: null,
      routineCategoryId: "routine_research",
      committeeId: "C02",
      description: "Grants, per year",
    }),
  ];
  const rows = readKpiTemplateCsv(buildKpiExportCsv(exported, LOOKUPS, SET), LOOKUPS);
  assert.deepEqual(rows, [
    {
      name: "Graduate employment rate",
      kpiType: "strategic",
      categoryId: "student_success",
      committeeId: "C01",
      description: "",
      edpexTopicId: "7.1",
      edpexAreaId: "7.1ข",
      edpexIndicatorCode: "7.1ข-4",
    },
    {
      name: "Research grants",
      kpiType: "routine",
      // "Research Output" is in both taxonomies; the routine row gets its own.
      categoryId: "routine_research",
      committeeId: "C02",
      description: "Grants, per year",
      edpexTopicId: "",
      edpexAreaId: "",
      edpexIndicatorCode: "",
    },
  ]);
});

test("the filename carries the set's years and the date", () => {
  assert.equal(
    buildKpiExportFilename(SET, new Date(2026, 10, 26)),
    "kpis-2565-2569-2026-11-26.csv",
  );
});
