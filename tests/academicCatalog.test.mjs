import assert from "node:assert/strict";
import test from "node:test";

import { buildCellLabels } from "../lib/kpi/academicCatalog.ts";

const catalog = {
  programs: [
    { code: "PH", label: "สาธารณสุขศาสตร์", sortOrder: 1 },
    { code: "BM", label: "ชีวการแพทย์", sortOrder: 5 },
  ],
  curricula: [
    { code: "PHB", programCode: "PH", label: "ส.บ. สาธารณสุขศาสตร์", sortOrder: 1 },
    { code: "BMM", programCode: "BM", label: "วท.ม. ชีวการแพทย์", sortOrder: 9 },
  ],
};

test("academic catalog labels include seeded program and curriculum codes", () => {
  const labels = buildCellLabels(
    [{ id: "fac-1", name: "Dr. Faculty" }],
    catalog,
  );

  assert.deepEqual(labels, {
    PH: "สาธารณสุขศาสตร์",
    BM: "ชีวการแพทย์",
    PHB: "ส.บ. สาธารณสุขศาสตร์",
    BMM: "วท.ม. ชีวการแพทย์",
    "fac-1": "Dr. Faculty",
  });
});

test("unknown catalog values fall back to their stored code", () => {
  const labels = buildCellLabels([], catalog);
  assert.equal(labels.Unknown, undefined);
});
