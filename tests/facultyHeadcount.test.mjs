import assert from "node:assert/strict";
import test from "node:test";
import { facultyHeadcount } from "../lib/kpi/facultyHeadcount.ts";

const ACADEMIC = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"];

const roster = [
  { rank: "Professor", status: "active" },
  { rank: "Lecturer", status: "active" },
  { rank: "Lecturer", status: "active" },
  { rank: "Support Staff", status: "active" },
  { rank: "Support Staff", status: "active" },
  // Someone who has left must never inflate a per-head metric.
  { rank: "Lecturer", status: "inactive" },
];

test("the academic headcount excludes support staff and inactive people", () => {
  assert.equal(facultyHeadcount(roster, ACADEMIC), 3);
});

test("adding support staff to the rank list grows the count by exactly that many", () => {
  assert.equal(facultyHeadcount(roster, [...ACADEMIC, "Support Staff"]), 5);
});

test("a narrower rank list counts only those ranks", () => {
  assert.equal(facultyHeadcount(roster, ["Lecturer"]), 2);
  assert.equal(facultyHeadcount(roster, ["Professor"]), 1);
  // Nobody holds this rank — a real zero, which aggregate() turns into "—".
  assert.equal(facultyHeadcount(roster, ["Associate Professor"]), 0);
});

test("an empty roster or an empty rank list is zero", () => {
  assert.equal(facultyHeadcount([], ACADEMIC), 0);
  assert.equal(facultyHeadcount(roster, []), 0);
});
