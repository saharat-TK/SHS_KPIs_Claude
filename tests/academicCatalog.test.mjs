import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCellLabels,
  catalogOptionLabel,
  curriculaForProgram,
} from "../lib/kpi/academicCatalog.ts";

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

test("buildCellLabels tolerates a catalog that has not loaded yet", () => {
  assert.deepEqual(buildCellLabels([{ id: "fac-1", name: "Dr. Faculty" }]), {
    "fac-1": "Dr. Faculty",
  });
});

// The cascade has no live fixture — no data source currently collects both a
// program and a curriculum — so it is pinned here instead.
test("curriculaForProgram narrows to the selected program", () => {
  assert.deepEqual(
    curriculaForProgram(catalog.curricula, "PH").map((c) => c.code),
    ["PHB"],
  );
  assert.deepEqual(
    curriculaForProgram(catalog.curricula, "BM").map((c) => c.code),
    ["BMM"],
  );
});

test("curriculaForProgram offers every curriculum when no program is chosen", () => {
  for (const empty of [null, undefined, ""]) {
    assert.deepEqual(
      curriculaForProgram(catalog.curricula, empty).map((c) => c.code),
      ["PHB", "BMM"],
    );
  }
});

test("curriculaForProgram yields nothing for a program with no curricula", () => {
  assert.deepEqual(curriculaForProgram(catalog.curricula, "OHS"), []);
});

test("catalogOptionLabel shows the stored code beside its Thai name", () => {
  assert.equal(catalogOptionLabel(catalog.programs[0]), "PH — สาธารณสุขศาสตร์");
});
