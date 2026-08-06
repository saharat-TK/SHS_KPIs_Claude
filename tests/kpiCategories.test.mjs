import assert from "node:assert/strict";
import test from "node:test";
import { categoriesOfType } from "../lib/kpi/categories.ts";

const CATEGORIES = [
  { id: "student_success", kpiType: "strategic", label: "Student Success", sortOrder: 1 },
  { id: "routine_area_1", kpiType: "routine", label: "ด้านที่ 1-การผลิตบัณฑิต", sortOrder: 1 },
  { id: "research_output", kpiType: "strategic", label: "Research Output", sortOrder: 2 },
  { id: "routine_area_2", kpiType: "routine", label: "ด้านที่ 2-ด้านการวิจัย", sortOrder: 2 },
];

test("returns only the categories of the requested taxonomy", () => {
  assert.deepEqual(
    categoriesOfType(CATEGORIES, "strategic").map((c) => c.id),
    ["student_success", "research_output"],
  );
  assert.deepEqual(
    categoriesOfType(CATEGORIES, "routine").map((c) => c.id),
    ["routine_area_1", "routine_area_2"],
  );
});

test("the two taxonomies partition the list — nothing is dropped or shared", () => {
  const strategic = categoriesOfType(CATEGORIES, "strategic");
  const routine = categoriesOfType(CATEGORIES, "routine");
  assert.equal(strategic.length + routine.length, CATEGORIES.length);
  assert.equal(strategic.filter((c) => routine.includes(c)).length, 0);
});

test("incoming order is preserved, so the API's sort_order still governs", () => {
  assert.deepEqual(
    categoriesOfType(CATEGORIES, "strategic").map((c) => c.sortOrder),
    [1, 2],
  );
});

test("a type with no categories yields an empty list, not undefined", () => {
  assert.deepEqual(categoriesOfType(CATEGORIES, "operational"), []);
  assert.deepEqual(categoriesOfType([], "strategic"), []);
});
