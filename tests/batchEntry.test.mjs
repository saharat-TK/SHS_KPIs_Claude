import assert from "node:assert/strict";
import test from "node:test";

import {
  availableBatchModes,
  batchColumnKey,
  batchDuplicateKey,
  buildBatchRows,
  entryRowsFromPaste,
  isBlankEntryRow,
  recordedBatchKeys,
  resolveChoiceText,
} from "../lib/kpi/batchEntry.ts";

// A trimmed catalog with the real cascade shape: PH owns three curricula, BM one.
const catalog = {
  programs: [
    { code: "PH", label: "สาขาวิชาสาธารณสุขศาสตร์", sortOrder: 1 },
    { code: "BM", label: "สาขาวิชาเทคโนโลยีชีวการแพทย์", sortOrder: 5 },
  ],
  curricula: [
    { code: "PHB", programCode: "PH", label: "สาธารณสุขศาสตร์", sortOrder: 1 },
    { code: "PHM", programCode: "PH", label: "การจัดการสุขภาพชายแดน", sortOrder: 2 },
    { code: "PHD", programCode: "PH", label: "ระบาดและวัคซีนวิทยา", sortOrder: 3 },
    { code: "BMM", programCode: "BM", label: "เทคโนโลยีชีวการแพทย์", sortOrder: 9 },
  ],
};

const col = (colKey, dataType, extra = {}) => ({
  colKey,
  label: colKey,
  dataType,
  isRequired: false,
  ...extra,
});

const BOTH = [col("program", "program"), col("curriculum", "curriculum"), col("headcount", "number")];

test("both batch modes are offered when both columns exist", () => {
  assert.deepEqual(availableBatchModes(BOTH), ["single", "rows", "programs", "curricula"]);
});

test("a mode is withheld when its column is missing", () => {
  assert.deepEqual(
    availableBatchModes([col("program", "program"), col("n", "number")]),
    ["single", "rows", "programs"],
  );
  assert.deepEqual(
    availableBatchModes([col("curriculum", "curriculum")]),
    ["single", "rows", "curricula"],
  );
  // Nothing to distinguish catalog rows by, so only the free-form batch.
  assert.deepEqual(availableBatchModes([col("n", "number"), col("who", "faculty")]), [
    "single",
    "rows",
  ]);
});

test("the program batch builds one row per program, in catalog order", () => {
  const rows = buildBatchRows("programs", catalog, BOTH);

  assert.deepEqual(
    rows.map((r) => r.code),
    ["PH", "BM"],
  );
  assert.deepEqual(rows[0], {
    code: "PH",
    label: "สาขาวิชาสาธารณสุขศาสตร์",
    locked: { program: "PH" },
  });
  // A program owns several curricula and none of them is the right guess, so the
  // curriculum column stays free for the user to fill in.
  assert.equal("curriculum" in rows[0].locked, false);
});

test("the curriculum batch also locks in each curriculum's parent program", () => {
  const rows = buildBatchRows("curricula", catalog, BOTH);

  assert.deepEqual(
    rows.map((r) => r.code),
    ["PHB", "PHM", "PHD", "BMM"],
  );
  // All three of PH's curricula resolve back to PH; BM's resolves to BM.
  assert.deepEqual(
    rows.map((r) => r.locked.program),
    ["PH", "PH", "PH", "BM"],
  );
  assert.deepEqual(rows[3].locked, { curriculum: "BMM", program: "BM" });
});

test("a curriculum batch on a source with no program column locks only the curriculum", () => {
  const rows = buildBatchRows("curricula", catalog, [
    col("curriculum", "curriculum"),
    col("headcount", "number"),
  ]);

  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0].locked, { curriculum: "PHB" });
});

test("a batch whose column is missing builds nothing rather than guessing", () => {
  assert.deepEqual(buildBatchRows("programs", catalog, [col("n", "number")]), []);
  assert.deepEqual(buildBatchRows("curricula", catalog, [col("program", "program")]), []);
});

test("the identity column is the one the mode fills", () => {
  assert.equal(batchColumnKey("programs", BOTH), "program");
  assert.equal(batchColumnKey("curricula", BOTH), "curriculum");
  assert.equal(batchColumnKey("curricula", [col("program", "program")]), null);
});

test("duplicate keys separate quarters, years, and annual entries", () => {
  const q1 = batchDuplicateKey(2568, 1, "program", "PH");
  assert.notEqual(q1, batchDuplicateKey(2568, 2, "program", "PH"));
  assert.notEqual(q1, batchDuplicateKey(2569, 1, "program", "PH"));
  assert.notEqual(q1, batchDuplicateKey(2568, 1, "program", "BM"));
  // An annual source stores quarter null; it must not collide with any quarter.
  assert.notEqual(batchDuplicateKey(2568, null, "program", "PH"), q1);
});

test("recorded keys ignore blank cells and cover non-string stored values", () => {
  const keys = recordedBatchKeys(
    [
      { year: 2568, quarter: 1, values: { program: "PH", headcount: 12 } },
      { year: 2568, quarter: 2, values: { program: "BM" } },
      // No program recorded — not a prior run of the program batch.
      { year: 2568, quarter: 1, values: { program: "", headcount: 3 } },
      { year: 2568, quarter: 1, values: { headcount: 4 } },
      { year: 2568, quarter: 1, values: { program: null } },
    ],
    "program",
  );

  assert.equal(keys.size, 2);
  assert.equal(keys.has(batchDuplicateKey(2568, 1, "program", "PH")), true);
  assert.equal(keys.has(batchDuplicateKey(2568, 2, "program", "BM")), true);
  // Same code, different quarter, is not a repeat.
  assert.equal(keys.has(batchDuplicateKey(2568, 2, "program", "PH")), false);
});

// ── Free-form rows ──────────────────────────────────────────────────────────

const PASTE_COLUMNS = [
  { colKey: "program", label: "Program", dataType: "program", isRequired: true },
  { colKey: "who", label: "Faculty", dataType: "faculty", isRequired: false },
  { colKey: "count", label: "Count", dataType: "number", isRequired: false },
];
const PASTE_CHOICES = {
  program: [
    { code: "PH", label: "สาขาวิชาสาธารณสุขศาสตร์" },
    { code: "BM", label: "สาขาวิชาเทคโนโลยีชีวการแพทย์" },
  ],
  who: [{ code: "F001", label: "Dr. Somchai Jaidee", hint: "PH" }],
};

test("a free-form row is blank until something is typed", () => {
  assert.equal(isBlankEntryRow({ values: { program: "", count: "  " }, note: "" }), true);
  assert.equal(isBlankEntryRow({ values: { program: "", count: "3" }, note: "" }), false);
  assert.equal(isBlankEntryRow({ values: { program: "" }, note: "see memo" }), false);
});

test("typed derived cells resolve by code or label, case-insensitively", () => {
  assert.equal(resolveChoiceText(" ph ", PASTE_CHOICES.program), "PH");
  assert.equal(resolveChoiceText("สาขาวิชาเทคโนโลยีชีวการแพทย์", PASTE_CHOICES.program), "BM");
  assert.equal(resolveChoiceText("dr.  somchai jaidee", PASTE_CHOICES.who), "F001");
  // Unknown text is kept so validation can name it.
  assert.equal(resolveChoiceText("Nursing", PASTE_CHOICES.program), "Nursing");
  assert.equal(resolveChoiceText("12", undefined), "12");
});

test("pasted Excel rows map onto the columns, skipping a header and blank lines", () => {
  const text =
    "Program\tFaculty\tCount\tNote\r\n" +
    "สาขาวิชาสาธารณสุขศาสตร์\tDr. Somchai Jaidee\t12\tfirst batch\r\n" +
    "\t\t\t\r\n" +
    "bm\t\t7\r\n" +
    "Nursing\tF999\t\"1,200\"\r\n";
  assert.deepEqual(entryRowsFromPaste(text, PASTE_COLUMNS, PASTE_CHOICES), [
    { values: { program: "PH", who: "F001", count: "12" }, note: "first batch" },
    { values: { program: "BM", who: "", count: "7" }, note: "" },
    { values: { program: "Nursing", who: "F999", count: "1,200" }, note: "" },
  ]);
  // Without a header, the first line is data; a header matched by key is skipped too.
  assert.equal(entryRowsFromPaste("PH\t\t1", PASTE_COLUMNS, PASTE_CHOICES).length, 1);
  assert.equal(entryRowsFromPaste("program\twho\nPH\t\t1", PASTE_COLUMNS, PASTE_CHOICES).length, 1);
  // Pasting into the Count column fills from there on, then the Note.
  assert.deepEqual(entryRowsFromPaste("5\tlate\n6", PASTE_COLUMNS, PASTE_CHOICES, 2), [
    { values: { program: "", who: "", count: "5" }, note: "late" },
    { values: { program: "", who: "", count: "6" }, note: "" },
  ]);
});
