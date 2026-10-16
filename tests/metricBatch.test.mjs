import assert from "node:assert/strict";
import test from "node:test";

import { planBatchRows } from "../lib/kpi/metricBatch.ts";

const entries = [
  { code: "PH", label: "สาขาวิชาสาธารณสุขศาสตร์" },
  { code: "BM", label: "สาขาวิชาเทคโนโลยีชีวการแพทย์และสารสนเทศสุขภาพ" },
];
const parent = "Graduate employment rate";
const row = (id, name, catalogCode = null) => ({ id, name, catalogCode });

test("a KPI with no sub-KPIs creates one per entry, named by label_th", () => {
  assert.deepEqual(planBatchRows(entries, parent, []), [
    { code: "PH", name: "สาขาวิชาสาธารณสุขศาสตร์", status: "create" },
    { code: "BM", name: "สาขาวิชาเทคโนโลยีชีวการแพทย์และสารสนเทศสุขภาพ", status: "create" },
  ]);
});

test("a linked row already named by the label is skipped", () => {
  const rows = planBatchRows(entries, parent, [row(7, "สาขาวิชาสาธารณสุขศาสตร์", "PH")]);
  assert.equal(rows[0].status, "exists");
  assert.equal(rows[1].status, "create");
});

test("a linked row whose label changed is renamed, not duplicated", () => {
  const rows = planBatchRows(entries, parent, [row(7, "สาธารณสุขศาสตร์", "PH")]);
  assert.deepEqual(rows[0], {
    code: "PH",
    name: "สาขาวิชาสาธารณสุขศาสตร์",
    status: "rename",
    metricId: 7,
    oldName: "สาธารณสุขศาสตร์",
  });
});

test("an unlinked row named by the label is only linked", () => {
  const rows = planBatchRows(entries, parent, [row(7, "สาขาวิชาสาธารณสุขศาสตร์")]);
  assert.deepEqual(rows[0], {
    code: "PH",
    name: "สาขาวิชาสาธารณสุขศาสตร์",
    status: "link",
    metricId: 7,
  });
});

test("an old CODE-parent name is renamed in place", () => {
  const rows = planBatchRows(entries, parent, [row(9, `PH-${parent}`)]);
  assert.equal(rows[0].status, "rename");
  assert.equal(rows[0].metricId, 9);
  assert.equal(rows[1].status, "create");
});

test("a hand-edited old name still matches on its CODE- prefix", () => {
  const rows = planBatchRows(entries, parent, [row(3, "PH-edited wording")]);
  assert.equal(rows[0].status, "rename");
  assert.equal(rows[0].metricId, 3);
});

test("a longer code sharing the prefix is not mistaken for the shorter one", () => {
  const rows = planBatchRows(entries, parent, [row(4, `PHB-${parent}`)]);
  assert.equal(rows[0].status, "create");
});

test("with several old rows for one code, the exact CODE-parent row is renamed", () => {
  const rows = planBatchRows(entries, parent, [
    row(5, "PH-edited wording"),
    row(6, `PH-${parent}`),
  ]);
  assert.equal(rows[0].metricId, 6);
});

test("a linked row wins over an old-format row, which is left alone", () => {
  const rows = planBatchRows(entries, parent, [
    row(9, `PH-${parent}`),
    row(7, "สาขาวิชาสาธารณสุขศาสตร์", "PH"),
  ]);
  assert.equal(rows[0].status, "exists");
});

test("a row linked to another code is never claimed by name", () => {
  const rows = planBatchRows(entries, parent, [row(7, "PH-something", "BM")]);
  assert.equal(rows[0].status, "create");
  assert.equal(rows[1].status, "rename");
  assert.equal(rows[1].metricId, 7);
});
