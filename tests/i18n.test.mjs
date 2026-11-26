import assert from "node:assert/strict";
import test from "node:test";
import { DICTIONARIES, translate } from "../lib/i18n/dictionaries.ts";
import { formatEntryPeriod, coerceCellValue, validateEntryValues } from "../lib/kpi/dataSources.ts";
import { validateColumnConfig } from "../lib/kpi/columnLinks.ts";
import { parseDate, parseYearBE } from "../lib/kpi/cellFormats.ts";

/** Every dotted key of a dictionary with its string, in a stable order. */
function flatten(node, prefix = "") {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[`${prefix}${key}`, value]]
      : flatten(value, `${prefix}${key}.`),
  );
}

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const TH = (key, vars) => translate("th", key, vars);

test("every English key has a Thai twin, and no Thai key is orphaned", () => {
  const en = new Map(flatten(DICTIONARIES.en));
  const th = new Map(flatten(DICTIONARIES.th));
  assert.deepEqual([...th.keys()].sort(), [...en.keys()].sort());
});

test("a Thai string keeps every {placeholder} its English string takes", () => {
  // Typechecking proves the keys line up, but not that a translator dropped a
  // {name}, which would show the user a literal hole in the sentence.
  const th = new Map(flatten(DICTIONARIES.th));
  const dropped = [];
  for (const [key, english] of flatten(DICTIONARIES.en)) {
    const missing = placeholders(english).filter((p) => !placeholders(th.get(key)).includes(p));
    if (missing.length > 0) dropped.push(`${key}: ${missing.join(", ")}`);
  }
  // A few Thai strings intentionally ignore an English-only example placeholder.
  const allowed = new Set([
    "format.yearInvalid: example",
    "format.monthInvalid: example",
    "format.dateInvalid: example",
    "format.dateNotReal: example",
  ]);
  const unexpected = dropped.filter((d) => !allowed.has(d.replace("dataSources.", "")));
  assert.deepEqual(unexpected, []);
});

test("Thai strings come back for the data source keys", () => {
  assert.equal(TH("dataSources.title"), "แหล่งข้อมูล");
  assert.equal(TH("dataSources.aggregation.sum"), "ผลรวมของ");
  assert.equal(translate("en", "dataSources.aggregation.sum"), "Sum of");
  assert.equal(
    TH("dataSources.detail.deleteMessageBody", { entries: 5, links: 2 }).includes("5"),
    true,
  );
});

test("formatEntryPeriod reads in Thai for the UI and stays English for CSV", () => {
  assert.equal(formatEntryPeriod(2569, 3, "th"), "ไตรมาส 3 ปี 2569");
  assert.equal(formatEntryPeriod(2569, 3), "2569 Q3");
  assert.equal(formatEntryPeriod(2569, null, "th"), "2569");
});

test("validation messages are English by default and Thai when a translator is passed", () => {
  const column = { colKey: "n", label: "Count", dataType: "number", isRequired: true };
  assert.throws(() => coerceCellValue(column, "abc"), /"Count" must be a number/);
  assert.throws(
    () => coerceCellValue(column, "abc", (key, vars) => TH(key, vars)),
    /ต้องระบุ "Count" เป็นตัวเลข/,
  );
  assert.throws(
    () => validateEntryValues([column], {}, {}, (key, vars) => TH(key, vars)),
    /ต้องระบุ "Count"/,
  );
});

test("format errors keep their English wording by default and translate on request", () => {
  assert.throws(() => parseYearBE("2026"), /looks like a CE year — the BE year is 2569/);
  assert.throws(() => parseYearBE("2026", (k, v) => TH(k, v)), /ปี พ\.ศ\. คือ 2569/);
  assert.throws(() => parseDate("31/02/2569", (k, v) => TH(k, v)), /ไม่ใช่วันที่ที่มีอยู่จริง/);
});

test("validateColumnConfig problems translate without changing the English ones", () => {
  const cols = [
    { colKey: "a", label: "A", dataType: "text", isRequired: false, refColKey: "a", isMultiple: false, autoFill: null },
  ];
  assert.deepEqual(validateColumnConfig(cols), ['"A" cannot be ref by itself']);
  assert.deepEqual(validateColumnConfig(cols, (k, v) => TH(k, v)), ['"A" อ้างอิงตามตัวเองไม่ได้']);
});
