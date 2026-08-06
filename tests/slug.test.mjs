import assert from "node:assert/strict";
import test from "node:test";
import { slugify } from "../lib/kpi/slug.ts";

test("an ASCII name slugs to lowercase underscores", () => {
  assert.equal(slugify("Research Output"), "research_output");
  assert.equal(slugify("  Student Success  "), "student_success");
  assert.equal(slugify("Marketing & Comms"), "marketing_comms");
});

test("leading and trailing separators are trimmed", () => {
  assert.equal(slugify("-Financial Health-"), "financial_health");
});

test("the result is capped at 40 characters", () => {
  assert.equal(slugify("a".repeat(60)).length, 40);
});

// The bug this guards: the character class is ASCII-only, so every Thai
// codepoint is stripped and "ด้านที่ 1-การผลิตบัณฑิต" used to slug to "1".
test("a Thai name does not collapse to a bare number", () => {
  const slug = slugify("ด้านที่ 1-การผลิตบัณฑิต");
  assert.notEqual(slug, "1");
  assert.equal(slug, "category");
});

test("two Thai names slug identically, so the caller's collision loop numbers them", () => {
  assert.equal(
    slugify("ด้านที่ 2-ด้านการวิจัยและนวัตกรรม"),
    slugify("ด้านที่ 3-การสร้างรายได้จากบริการวิชาการ"),
  );
});

test("a name with no usable characters falls back", () => {
  assert.equal(slugify("!!!"), "category");
  assert.equal(slugify(""), "category");
});

test("the fallback is caller-supplied", () => {
  assert.equal(slugify("###", "routine_area"), "routine_area");
});

test("a name that merely contains digits keeps them", () => {
  assert.equal(slugify("Tier 1 Outcomes"), "tier_1_outcomes");
});
