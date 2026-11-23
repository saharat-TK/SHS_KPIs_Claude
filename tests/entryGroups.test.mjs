import assert from "node:assert/strict";
import test from "node:test";
import { groupEntries, notesDiffer, perRowColKeys, planGroupSave } from "../lib/kpi/entryGroups.ts";

const col = (colKey, dataType, extra = {}) => ({
  colKey,
  label: colKey,
  dataType,
  isRequired: false,
  ...extra,
});

// The Research publications shape: one row per SHS author.
const PUBS = [
  col("title", "text"),
  col("faculty", "faculty", { isMultiple: true, refColKey: "program" }),
  col("program", "program"),
  col("fraction", "number", { autoFill: "share" }),
];
const PLAIN = [col("title", "text"), col("count", "number")];

let nextId = 1;
const row = (values, extra = {}) => ({
  id: nextId++,
  year: 2569,
  quarter: 1,
  note: null,
  values,
  ...extra,
});
const author = (title, faculty, program = "PH", fraction = 0.5) =>
  row({ title, faculty, program, fraction });
const ids = (groups) => groups.map((g) => g.rows.map((r) => r.id));

test("per-row columns are the multiple column, its target and the shares", () => {
  assert.deepEqual([...perRowColKeys(PUBS)].sort(), ["faculty", "fraction", "program"]);
  assert.deepEqual([...perRowColKeys(PLAIN)], []);
});

test("a source without a multiple column is never grouped", () => {
  const a = row({ title: "A", count: 1 });
  const b = row({ title: "A", count: 1 });
  assert.deepEqual(ids(groupEntries([a, b], PLAIN)), [[a.id], [b.id]]);
});

test("the authors of one paper form one group, in order", () => {
  const rows = [author("P1", "fac-001"), author("P1", "fac-002"), author("P1", "fac-003")];
  const groups = groupEntries(rows, PUBS);
  assert.equal(groups.length, 1);
  assert.deepEqual(ids(groups), [rows.map((r) => r.id)]);
});

test("interleaved papers regroup, ordered by each group's first row", () => {
  const a1 = author("A", "fac-001");
  const b1 = author("B", "fac-001");
  const a2 = author("A", "fac-002");
  const groups = groupEntries([a1, b1, a2], PUBS);
  assert.deepEqual(ids(groups), [
    [a1.id, a2.id],
    [b1.id],
  ]);
});

test("a different period starts a new group", () => {
  const base = author("A", "fac-001");
  const otherYear = { ...author("A", "fac-002"), year: 2570 };
  const otherQuarter = { ...author("A", "fac-003"), quarter: 2 };
  assert.equal(groupEntries([base, otherYear, otherQuarter], PUBS).length, 3);
});

test("per-row notes (an import) do not split a paper", () => {
  const rows = ["fac-001", "fac-002", "fac-003"].map((f) => ({
    ...author("A", f),
    note: `pub:a:${f}`,
  }));
  assert.equal(groupEntries(rows, PUBS).length, 1);
});

test("notesDiffer tells a shared note from per-row notes", () => {
  assert.equal(notesDiffer([{ note: "x" }, { note: "x" }]), false);
  assert.equal(notesDiffer([{ note: null }, { note: "" }]), false);
  assert.equal(notesDiffer([{ note: "a" }, { note: "b" }]), true);
  assert.equal(notesDiffer([{ note: "a" }, { note: null }]), true);
});

test("blank and missing shared values count as equal", () => {
  const a = row({ title: "A", faculty: "fac-001", program: "PH", fraction: 0.5, extra: "" });
  const b = row({ title: "A", faculty: "fac-002", program: "PH", fraction: 0.5 });
  const cols = [...PUBS, col("extra", "text")];
  assert.equal(groupEntries([a, b], cols).length, 1);
});

test("planGroupSave updates kept rows, inserts new ones, removes dropped ones", () => {
  assert.deepEqual(planGroupSave([1, 2, 3], [{ id: 1 }, { id: 3 }, {}, {}]), {
    update: [1, 3],
    insert: 2,
    remove: [2],
  });
});

test("planGroupSave with no rows removes the whole entry", () => {
  assert.deepEqual(planGroupSave([4, 5], []), { update: [], insert: 0, remove: [4, 5] });
});

test("planGroupSave rejects ids outside the entry and repeated ids", () => {
  assert.throws(() => planGroupSave([1, 2], [{ id: 9 }]), /does not belong/);
  assert.throws(() => planGroupSave([1, 2], [{ id: 1 }, { id: 1 }]), /twice/);
});
