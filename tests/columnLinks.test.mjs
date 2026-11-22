import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRefLookups,
  checkRefConsistency,
  duplicateItems,
  entryLayout,
  expandEntry,
  filterChoicesByRef,
  fractionFor,
  programCode,
  refValueFor,
  validateColumnConfig,
} from "../lib/kpi/columnLinks.ts";

const col = (colKey, dataType, extra = {}) => ({
  colKey,
  label: colKey,
  dataType,
  isRequired: false,
  ...extra,
});

// The Research publications shape: one row per SHS author.
const PUBS = [
  col("title", "text", { isRequired: true }),
  col("faculty", "faculty", { isRequired: true, isMultiple: true, refColKey: "program" }),
  col("program", "program"),
  col("fraction", "number", { autoFill: "share" }),
];

const FACULTY = [
  { id: "fac-001", program: "PH" },
  { id: "fac-002", program: "BioMed" },
  { id: "fac-003", program: "PH" },
  { id: "fac-004", program: "SHS Office" },
];
const CATALOG = {
  programs: [],
  curricula: [
    { code: "PHB", programCode: "PH" },
    { code: "BMB", programCode: "BM" },
  ],
};
const LOOKUPS = buildRefLookups(FACULTY, CATALOG);

test("a valid publications config has no problems", () => {
  assert.deepEqual(validateColumnConfig(PUBS), []);
});

test("a ref target must exist, not be itself, and be a Programs column", () => {
  assert.match(validateColumnConfig([col("f", "faculty", { refColKey: "gone" })])[0], /no longer exists/);
  assert.match(validateColumnConfig([col("f", "faculty", { refColKey: "f" })])[0], /itself/);
  assert.match(
    validateColumnConfig([col("f", "faculty", { refColKey: "t" }), col("t", "text")])[0],
    /only be ref by a Programs column/,
  );
  assert.match(
    validateColumnConfig([col("x", "text", { refColKey: "p" }), col("p", "program")])[0],
    /cannot be ref by another column/,
  );
});

test("curriculum may be ref by a program column", () => {
  assert.deepEqual(
    validateColumnConfig([col("c", "curriculum", { refColKey: "p" }), col("p", "program")]),
    [],
  );
});

test("a program column can be ref by only one column, and cannot itself be multiple", () => {
  const two = validateColumnConfig([
    col("f", "faculty", { refColKey: "p" }),
    col("c", "curriculum", { refColKey: "p" }),
    col("p", "program"),
  ]);
  assert.ok(two.some((p) => /only one column can be ref by it/.test(p)));
  const multiTarget = validateColumnConfig([
    col("f", "faculty", { refColKey: "p" }),
    col("p", "program", { isMultiple: true }),
  ]);
  assert.ok(multiTarget.some((p) => /cannot be multiple itself/.test(p)));
});

test("at most one multiple column, and only of a listable type", () => {
  assert.ok(
    validateColumnConfig([col("a", "faculty", { isMultiple: true }), col("b", "text", { isMultiple: true })])
      .some((p) => /Only one column/.test(p)),
  );
  assert.ok(validateColumnConfig([col("n", "number", { isMultiple: true })]).some((p) => /cannot take multiple/.test(p)));
});

test("a share column must be a number and needs a multiple column", () => {
  assert.ok(
    validateColumnConfig([col("s", "text", { autoFill: "share" }), col("f", "faculty", { isMultiple: true })])
      .some((p) => /number column/.test(p)),
  );
  assert.ok(validateColumnConfig([col("s", "number", { autoFill: "share" })]).some((p) => /no column takes multiple/.test(p)));
});

test("refValueFor maps faculty to the catalog code and curricula to their program", () => {
  assert.equal(programCode("Sport Science"), "SHS");
  assert.equal(refValueFor({ dataType: "faculty" }, "fac-002", LOOKUPS), "BM");
  assert.equal(refValueFor({ dataType: "faculty" }, "fac-004", LOOKUPS), null);
  assert.equal(refValueFor({ dataType: "faculty" }, "fac-999", LOOKUPS), undefined);
  assert.equal(refValueFor({ dataType: "curriculum" }, "PHB", LOOKUPS), "PH");
});

test("choices narrow to the chosen program; no program leaves them all", () => {
  const choices = FACULTY.map((f) => ({ code: f.id }));
  assert.deepEqual(
    filterChoicesByRef({ dataType: "faculty" }, choices, "PH", LOOKUPS).map((c) => c.code),
    ["fac-001", "fac-003"],
  );
  assert.equal(filterChoicesByRef({ dataType: "faculty" }, choices, null, LOOKUPS).length, 4);
});

test("the layout moves the multiple pair and share columns to the right", () => {
  const layout = entryLayout(PUBS);
  assert.deepEqual(layout.left.map((c) => c.colKey), ["title"]);
  assert.equal(layout.groups.length, 1);
  assert.equal(layout.groups[0].main.colKey, "faculty");
  assert.equal(layout.groups[0].target.colKey, "program");
  assert.deepEqual(layout.shares.map((c) => c.colKey), ["fraction"]);
});

test("a ref pair without a multiple column is a single right-hand group", () => {
  const layout = entryLayout([col("c", "curriculum", { refColKey: "p" }), col("p", "program"), col("n", "number")]);
  assert.deepEqual(layout.left.map((c) => c.colKey), ["n"]);
  assert.equal(layout.groups[0].multiple, false);
  const rows = expandEntry(layout, { n: 3 }, { c: [{ main: "PHB", target: "PH" }] });
  assert.deepEqual(rows, [{ n: 3, c: "PHB", p: "PH" }]);
});

test("three authors expand to three rows with their own program and 1/3 each", () => {
  const layout = entryLayout(PUBS);
  const rows = expandEntry(layout, { title: "Paper" }, {
    faculty: [
      { main: "fac-001", target: "PH" },
      { main: "", target: null }, // a blank row is dropped
      { main: "fac-002", target: "BM" },
      { main: "fac-003", target: "PH" },
    ],
  });
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((r) => r.program), ["PH", "BM", "PH"]);
  assert.ok(rows.every((r) => r.title === "Paper" && r.fraction === fractionFor(3)));
  assert.ok(Math.abs(rows.reduce((s, r) => s + r.fraction, 0) - 1) < 1e-5);
});

test("one or zero authors is one row with the full share", () => {
  const layout = entryLayout(PUBS);
  assert.deepEqual(expandEntry(layout, { title: "A" }, { faculty: [{ main: "fac-001", target: "PH" }] }), [
    { title: "A", faculty: "fac-001", program: "PH", fraction: 1 },
  ]);
  assert.deepEqual(expandEntry(layout, { title: "A" }, {}), [
    { title: "A", faculty: null, program: null, fraction: 1 },
  ]);
});

test("duplicate authors are reported", () => {
  assert.deepEqual(
    duplicateItems([{ main: "fac-001" }, { main: "fac-002" }, { main: "fac-001" }, { main: "" }, { main: "" }]),
    ["fac-001"],
  );
});

test("the server check catches a faculty under the wrong program", () => {
  assert.deepEqual(checkRefConsistency(PUBS, { faculty: "fac-001", program: "PH" }, LOOKUPS), []);
  assert.match(checkRefConsistency(PUBS, { faculty: "fac-001", program: "BM" }, LOOKUPS)[0], /belongs to program PH/);
  assert.match(checkRefConsistency(PUBS, { faculty: "fac-001", program: null }, LOOKUPS)[0], /is blank/);
  // SHS Office has no catalog program, so the program must stay blank.
  assert.deepEqual(checkRefConsistency(PUBS, { faculty: "fac-004", program: null }, LOOKUPS), []);
  assert.match(checkRefConsistency(PUBS, { faculty: "fac-004", program: "PH" }, LOOKUPS)[0], /must be blank/);
  // No faculty picked: nothing to check.
  assert.deepEqual(checkRefConsistency(PUBS, { faculty: null, program: "PH" }, LOOKUPS), []);
});
