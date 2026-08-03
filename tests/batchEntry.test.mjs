import assert from "node:assert/strict";
import test from "node:test";

import {
  availableBatchModes,
  batchColumnKey,
  batchDuplicateKey,
  buildBatchRows,
  recordedBatchKeys,
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
  assert.deepEqual(availableBatchModes(BOTH), ["single", "programs", "curricula"]);
});

test("a mode is withheld when its column is missing", () => {
  assert.deepEqual(
    availableBatchModes([col("program", "program"), col("n", "number")]),
    ["single", "programs"],
  );
  assert.deepEqual(
    availableBatchModes([col("curriculum", "curriculum")]),
    ["single", "curricula"],
  );
  // Nothing to distinguish the rows by, so no batch at all.
  assert.deepEqual(availableBatchModes([col("n", "number"), col("who", "faculty")]), [
    "single",
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
