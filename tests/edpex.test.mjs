import assert from "node:assert/strict";
import test from "node:test";
import {
  areaAfterTopicChange,
  areasForTopic,
  buildEdpexCatalog,
  edpexAreaFitsTopic,
  edpexCode,
  edpexIndicatorCodeError,
  edpexLabel,
  normaliseEdpex,
  resolveEdpexAreaText,
  resolveEdpexTopicText,
} from "../lib/kpi/edpex.ts";
import { readEdpexAreaInput, readEdpexPatch, readEdpexTopicInput } from "../lib/kpi/edpexAdmin.ts";

const area = (topicId, code, name, sortOrder) => ({
  id: `${topicId}${code}`,
  topicId,
  code,
  name,
  sortOrder,
});

// Deliberately out of order: the catalog sorts.
const CATALOG = buildEdpexCatalog(
  [
    { id: "7.5", name: "ผลลัพธ์ด้านงบประมาณ การเงิน ตลาด และกลยุทธ์", sortOrder: 5 },
    { id: "7.1", name: "ผลลัพธ์ด้านการเรียนรู้ของผู้เรียนและด้านกระบวนการ", sortOrder: 1 },
  ],
  [
    area("7.1", "ข", "ผลลัพธ์ด้านประสิทธิผลของกระบวนการทำงาน", 2),
    area("7.5", "ก", "ผลลัพธ์ด้านงบประมาณ การเงิน และตลาด", 7),
    area("7.1", "ก", "ผลลัพธ์ด้านการเรียนรู้ของผู้เรียนและด้านบริการที่มุ่งเน้นลูกค้า", 1),
    area("7.5", "ข", "ผลลัพธ์ด้านการนำกลยุทธ์ไปปฏิบัติและด้านนวัตกรรม", 8),
  ],
);

test("buildEdpexCatalog nests areas under their topic, in order", () => {
  assert.deepEqual(
    CATALOG.map((t) => [t.id, t.areas.map((a) => a.id)]),
    [
      ["7.1", ["7.1ก", "7.1ข"]],
      ["7.5", ["7.5ก", "7.5ข"]],
    ],
  );
});

test("the area cascade follows the topic", () => {
  assert.deepEqual(
    areasForTopic(CATALOG, "7.5").map((a) => a.id),
    ["7.5ก", "7.5ข"],
  );
  assert.deepEqual(areasForTopic(CATALOG, ""), []);
  assert.equal(edpexAreaFitsTopic(CATALOG, "7.1ข", "7.1"), true);
  assert.equal(edpexAreaFitsTopic(CATALOG, "7.1ข", "7.5"), false);
  assert.equal(edpexAreaFitsTopic(CATALOG, "", "7.5"), true);
  assert.equal(areaAfterTopicChange(CATALOG, "7.1ข", "7.5"), "");
  assert.equal(areaAfterTopicChange(CATALOG, "7.1ข", "7.1"), "7.1ข");
});

test("normaliseEdpex completes, clears and refuses pairs", () => {
  assert.deepEqual(normaliseEdpex({ edpexAreaId: "7.5ข" }, CATALOG), {
    ok: true,
    value: { edpexTopicId: "7.5", edpexAreaId: "7.5ข", edpexIndicatorCode: null },
  });
  assert.deepEqual(normaliseEdpex({ edpexTopicId: " ", edpexAreaId: "" }, CATALOG), {
    ok: true,
    value: { edpexTopicId: null, edpexAreaId: null, edpexIndicatorCode: null },
  });
  assert.deepEqual(normaliseEdpex({ edpexTopicId: "7.1" }, CATALOG), {
    ok: true,
    value: { edpexTopicId: "7.1", edpexAreaId: null, edpexIndicatorCode: null },
  });
  assert.equal(normaliseEdpex({ edpexTopicId: "7.1", edpexAreaId: "7.5ก" }, CATALOG).ok, false);
  assert.equal(normaliseEdpex({ edpexTopicId: "9.9" }, CATALOG).ok, false);
  assert.equal(normaliseEdpex({ edpexAreaId: "7.1ค" }, CATALOG).ok, false);
});

test("typed text resolves by code, bare letter or name", () => {
  assert.equal(resolveEdpexTopicText(" 7.1 ", CATALOG), "7.1");
  assert.equal(resolveEdpexTopicText("ผลลัพธ์ด้านงบประมาณ การเงิน ตลาด และกลยุทธ์", CATALOG), "7.5");
  assert.equal(resolveEdpexTopicText("8.0", CATALOG), "8.0");
  assert.equal(resolveEdpexAreaText("ข", "7.5", CATALOG), "7.5ข");
  assert.equal(resolveEdpexAreaText("ข.", "7.1", CATALOG), "7.1ข");
  assert.equal(resolveEdpexAreaText("7.1 ก", "", CATALOG), "7.1ก");
  assert.equal(resolveEdpexAreaText("ผลลัพธ์ด้านงบประมาณ การเงิน และตลาด", "", CATALOG), "7.5ก");
  assert.equal(resolveEdpexAreaText("ข", "", CATALOG), "ข");
});

test("labels show names, and fall back to the bare id", () => {
  assert.equal(edpexLabel(CATALOG, "7.1", "7.1ข"), "7.1ข · ผลลัพธ์ด้านประสิทธิผลของกระบวนการทำงาน");
  assert.equal(edpexLabel(CATALOG, "7.5", null), "7.5 · ผลลัพธ์ด้านงบประมาณ การเงิน ตลาด และกลยุทธ์");
  assert.equal(edpexLabel(CATALOG, "7.4", null), "7.4");
  assert.equal(edpexLabel(CATALOG, null, null), null);
  assert.equal(edpexCode("7.1", "7.1ข"), "7.1ข");
  assert.equal(edpexCode("7.1", null), "7.1");
});

test("admin inputs are checked before they reach the database", () => {
  assert.deepEqual(readEdpexTopicInput({ id: " 7.6 ", name: " New " }), {
    ok: true,
    id: "7.6",
    name: "New",
  });
  assert.match(readEdpexTopicInput({ id: "7 .1", name: "x" }).error, /spaces/);
  assert.match(readEdpexTopicInput({ id: "7.1", name: "" }).error, /Name is required/);
  assert.match(readEdpexTopicInput({ id: "12345678901", name: "x" }).error, /longer than 10/);

  assert.deepEqual(readEdpexAreaInput({ topicId: "7.2", code: "ข", name: "Area" }), {
    ok: true,
    id: "7.2ข",
    topicId: "7.2",
    code: "ข",
    name: "Area",
  });
  assert.match(readEdpexAreaInput({ code: "ก", name: "x" }).error, /Topic is required/);

  assert.deepEqual(readEdpexPatch({ name: "Renamed", sortOrder: "3" }), {
    ok: true,
    name: "Renamed",
    sortOrder: 3,
  });
  assert.match(readEdpexPatch({ sortOrder: "x" }).error, /whole number/);
  assert.match(readEdpexPatch({}).error, /No fields/);
});

test("an indicator code must start with its area, when one is set", () => {
  assert.equal(edpexIndicatorCodeError("7.1ข-4", "7.1ข"), null);
  assert.equal(edpexIndicatorCodeError("7.1 ข-4", "7.1ข"), null); // spaces ignored
  assert.equal(edpexIndicatorCodeError("7.5ก-2-3", null), null); // no area: free text
  assert.equal(edpexIndicatorCodeError("  ", "7.1ข"), null);
  assert.match(edpexIndicatorCodeError("7.1ก-4", "7.1ข"), /must start with its EdPEx area 7\.1ข/);
  assert.match(edpexIndicatorCodeError("x".repeat(31), null), /30 characters or fewer/);
});

test("normaliseEdpex checks and trims the indicator code with the pair", () => {
  // An area given alone still fills in its topic, and the code is checked
  // against that area.
  assert.deepEqual(
    normaliseEdpex({ edpexAreaId: "7.1ข", edpexIndicatorCode: " 7.1ข-4 " }, CATALOG),
    { ok: true, value: { edpexTopicId: "7.1", edpexAreaId: "7.1ข", edpexIndicatorCode: "7.1ข-4" } },
  );
  assert.deepEqual(normaliseEdpex({ edpexTopicId: "7.5", edpexIndicatorCode: "7.5ก-2-3" }, CATALOG), {
    ok: true,
    value: { edpexTopicId: "7.5", edpexAreaId: null, edpexIndicatorCode: "7.5ก-2-3" },
  });
  const wrong = normaliseEdpex({ edpexAreaId: "7.5ก", edpexIndicatorCode: "7.1ข-4" }, CATALOG);
  assert.equal(wrong.ok, false);
  assert.match(wrong.error, /"7\.1ข-4" must start with its EdPEx area 7\.5ก/);
});
