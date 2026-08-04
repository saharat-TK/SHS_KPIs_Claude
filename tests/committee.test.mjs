import assert from "node:assert/strict";
import test from "node:test";
import {
  committeeIdFromName,
  describeCommitteeUsage,
  diffCounselorLeadSlots,
  diffOneSlot,
  mergeKpiFocus,
} from "../lib/kpi/committee.ts";

const NONE = {
  memberships: 0,
  dataSources: 0,
  libraryKpis: 0,
  libraryMetrics: 0,
  performanceKpis: 0,
};

test("a committee with nothing attached is safe to delete", () => {
  assert.equal(describeCommitteeUsage(NONE), null);
});

test("each kind of attachment blocks deletion on its own", () => {
  // Only data_source fails loudly at the DB level. library_kpi/library_metric
  // SET NULL and perf_kpi has no FK at all, so for those the count is the only
  // thing that catches the silent unassignment.
  for (const key of Object.keys(NONE)) {
    const reason = describeCommitteeUsage({ ...NONE, [key]: 1 });
    assert.ok(reason, `${key} should block deletion`);
    assert.match(reason, /Still in use: 1 /);
    assert.match(reason, /Inactive instead\.$/);
  }
});

test("counts are singularised so the reason reads as a sentence", () => {
  assert.match(describeCommitteeUsage({ ...NONE, memberships: 1 }), /1 roster member\./);
  assert.match(describeCommitteeUsage({ ...NONE, memberships: 2 }), /2 roster members\./);
  assert.match(describeCommitteeUsage({ ...NONE, dataSources: 1 }), /1 data source\./);
  assert.match(describeCommitteeUsage({ ...NONE, libraryKpis: 3 }), /3 library KPIs\./);
  assert.match(describeCommitteeUsage({ ...NONE, libraryMetrics: 1 }), /1 library metric\./);
});

test("every attachment is named, in a stable order", () => {
  // The real cmt-curriculum, as of this change.
  assert.equal(
    describeCommitteeUsage({
      memberships: 13,
      dataSources: 2,
      libraryKpis: 5,
      libraryMetrics: 31,
      performanceKpis: 10,
    }),
    "Still in use: 13 roster members, 2 data sources, 5 library KPIs, 31 library metrics, " +
      "10 recorded KPIs. Detach them, or set the committee to Inactive instead.",
  );
});

test("zero counts are left out of the reason entirely", () => {
  const reason = describeCommitteeUsage({ ...NONE, memberships: 4, libraryKpis: 1 });
  assert.equal(
    reason,
    "Still in use: 4 roster members, 1 library KPI. " +
      "Detach them, or set the committee to Inactive instead.",
  );
  assert.doesNotMatch(reason, /data source/);
});

test("a new committee gets a readable id, not a random one", () => {
  assert.equal(committeeIdFromName("Quality Assurance Committee"), "cmt-quality-assurance");
  assert.equal(committeeIdFromName("EdPEx Committee"), "cmt-edpex");
  assert.equal(committeeIdFromName("KM"), "cmt-km");
});

test("the id survives punctuation, spacing and case", () => {
  assert.equal(
    committeeIdFromName("  Research, Innovation & Ethics  "),
    "cmt-research-innovation-ethics",
  );
  assert.equal(committeeIdFromName("Green   Office"), "cmt-green-office");
});

test("the id stays inside the VARCHAR(30) column, without a trailing dash", () => {
  const id = committeeIdFromName(
    "Curriculum Teaching Assessment and Accreditation Committee",
  );
  assert.ok(id.length <= 30, `${id} is ${id.length} chars`);
  assert.doesNotMatch(id, /-$/);
});

test("a name with no ASCII to slug yields nothing, so the caller can fall back", () => {
  assert.equal(committeeIdFromName("คณะกรรมการบริหาร"), "");
  assert.equal(committeeIdFromName("Committee"), "");
  assert.equal(committeeIdFromName("   "), "");
});

// ── mergeKpiFocus ────────────────────────────────────────────────────────────

test("mergeKpiFocus collapses equal values to one, not a duplicate", () => {
  assert.equal(mergeKpiFocus("Student Success", "Student Success"), "Student Success");
});

test("mergeKpiFocus joins differing values", () => {
  assert.equal(mergeKpiFocus("Student Success", "Budget"), "Student Success / Budget");
});

test("mergeKpiFocus trims before comparing, so whitespace-only differences still collapse", () => {
  assert.equal(mergeKpiFocus("  Student Success  ", "Student Success"), "Student Success");
});

// ── diffOneSlot ──────────────────────────────────────────────────────────────
// The primitive both the Committee-and-Secretary slot and (indirectly, via
// the no-merge branch) diffCounselorLeadSlots build on.

test("diffOneSlot: unchanged slot produces nothing", () => {
  assert.deepEqual(diffOneSlot(null, null, "Committee and Secretary"), []);
  const filled = { facultyId: "fac-A", kpiFocus: "Records" };
  assert.deepEqual(diffOneSlot(filled, { ...filled }, "Committee and Secretary"), []);
});

test("diffOneSlot: empty to filled creates; filled to empty removes", () => {
  assert.deepEqual(diffOneSlot(null, { facultyId: "fac-A", kpiFocus: "Records" }, "Committee and Secretary"), [
    { type: "create", facultyId: "fac-A", position: "Committee and Secretary", kpiFocus: "Records" },
  ]);
  assert.deepEqual(diffOneSlot({ facultyId: "fac-A", kpiFocus: "Records" }, null, "Committee and Secretary"), [
    { type: "remove", facultyId: "fac-A" },
  ]);
});

test("diffOneSlot: same person, edited focus, updates; different person, removes then creates", () => {
  assert.deepEqual(
    diffOneSlot(
      { facultyId: "fac-A", kpiFocus: "Records" },
      { facultyId: "fac-A", kpiFocus: "Minutes" },
      "Committee and Secretary",
    ),
    [{ type: "update", facultyId: "fac-A", kpiFocus: "Minutes" }],
  );
  assert.deepEqual(
    diffOneSlot(
      { facultyId: "fac-A", kpiFocus: "Records" },
      { facultyId: "fac-B", kpiFocus: "Records" },
      "Committee and Secretary",
    ),
    [
      { type: "remove", facultyId: "fac-A" },
      { type: "create", facultyId: "fac-B", position: "Committee and Secretary", kpiFocus: "Records" },
    ],
  );
});

// ── diffCounselorLeadSlots ───────────────────────────────────────────────────

const slot = (facultyId, kpiFocus) => (facultyId ? { facultyId, kpiFocus } : null);
const pair = (counselor, committeeLead) => ({ counselor, committeeLead });

// Branch: no merge before or after — must match today's independent-slot
// behavior exactly, since this is the overwhelmingly common case.
test("no merge, either side: both empty is a no-op", () => {
  assert.deepEqual(diffCounselorLeadSlots(pair(null, null), pair(null, null)), []);
});

test("no merge: counselor alone goes empty to filled", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(pair(null, null), pair(slot("fac-A", "Final approval"), null)),
    [{ type: "create", facultyId: "fac-A", position: "Counselor", kpiFocus: "Final approval" }],
  );
});

test("no merge: committee lead alone goes filled to empty", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(pair(null, slot("fac-B", "Forwarding")), pair(null, null)),
    [{ type: "remove", facultyId: "fac-B" }],
  );
});

test("no merge: same person in one slot, only the KPI Focus text changes", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Final approval"), null),
      pair(slot("fac-A", "Sign-off"), null),
    ),
    [{ type: "update", facultyId: "fac-A", kpiFocus: "Sign-off" }],
  );
});

test("no merge: one slot swaps to a different, non-overlapping person", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Final approval"), null),
      pair(slot("fac-C", "Final approval"), null),
    ),
    [
      { type: "remove", facultyId: "fac-A" },
      { type: "create", facultyId: "fac-C", position: "Counselor", kpiFocus: "Final approval" },
    ],
  );
});

test("no merge: both slots change independently in the same save, counselor's actions before lead's", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Final approval"), slot("fac-B", "Forwarding")),
      pair(slot("fac-C", "Final approval"), null),
    ),
    [
      { type: "remove", facultyId: "fac-A" },
      { type: "create", facultyId: "fac-C", position: "Counselor", kpiFocus: "Final approval" },
      { type: "remove", facultyId: "fac-B" },
    ],
  );
});

// Branch: a merge newly forms.
test("merge forms: the existing counselor absorbs the lead slot too (update in place, no duplicate create)", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Final approval"), null),
      pair(slot("fac-A", "Final approval"), slot("fac-A", "Forwarding")),
    ),
    [
      {
        type: "update",
        facultyId: "fac-A",
        position: "Counselor and Committee Lead",
        kpiFocus: "Final approval / Forwarding",
      },
    ],
  );
});

test("merge forms: the existing counselor absorbs the lead slot, displacing the old lead", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Final approval"), slot("fac-B", "Forwarding")),
      pair(slot("fac-A", "Final approval"), slot("fac-A", "Forwarding")),
    ),
    [
      { type: "remove", facultyId: "fac-B" },
      {
        type: "update",
        facultyId: "fac-A",
        position: "Counselor and Committee Lead",
        kpiFocus: "Final approval / Forwarding",
      },
    ],
  );
});

test("merge forms: the existing lead absorbs the counselor slot, displacing the old counselor", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Final approval"), slot("fac-B", "Forwarding")),
      pair(slot("fac-B", "Forwarding"), slot("fac-B", "Forwarding")),
    ),
    [
      { type: "remove", facultyId: "fac-A" },
      {
        type: "update",
        facultyId: "fac-B",
        position: "Counselor and Committee Lead",
        kpiFocus: "Forwarding",
      },
    ],
  );
});

test("merge forms: a brand-new third person takes both empty slots at once", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(pair(null, null), pair(slot("fac-C", "Both"), slot("fac-C", "Both"))),
    [{ type: "create", facultyId: "fac-C", position: "Counselor and Committee Lead", kpiFocus: "Both" }],
  );
});

test("merge forms: a brand-new third person displaces two previously separate people", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Final approval"), slot("fac-B", "Forwarding")),
      pair(slot("fac-C", "Approve"), slot("fac-C", "Forward")),
    ),
    [
      { type: "remove", facultyId: "fac-A" },
      { type: "remove", facultyId: "fac-B" },
      { type: "create", facultyId: "fac-C", position: "Counselor and Committee Lead", kpiFocus: "Approve / Forward" },
    ],
  );
});

// Branch: an existing merge splits apart.
test("merge splits: the merged person keeps Counselor, Lead goes empty", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Both"), slot("fac-A", "Both")),
      pair(slot("fac-A", "Approve only"), null),
    ),
    [{ type: "update", facultyId: "fac-A", position: "Counselor", kpiFocus: "Approve only" }],
  );
});

test("merge splits: the merged person keeps Counselor, a new person takes Lead", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Both"), slot("fac-A", "Both")),
      pair(slot("fac-A", "Approve only"), slot("fac-C", "Forward only")),
    ),
    [
      { type: "update", facultyId: "fac-A", position: "Counselor", kpiFocus: "Approve only" },
      { type: "create", facultyId: "fac-C", position: "Committee Lead", kpiFocus: "Forward only" },
    ],
  );
});

test("merge splits: the merged person keeps Lead, a new person takes Counselor", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Both"), slot("fac-A", "Both")),
      pair(slot("fac-C", "Approve only"), slot("fac-A", "Forward only")),
    ),
    [
      { type: "update", facultyId: "fac-A", position: "Committee Lead", kpiFocus: "Forward only" },
      { type: "create", facultyId: "fac-C", position: "Counselor", kpiFocus: "Approve only" },
    ],
  );
});

test("merge splits: the merged person is displaced from both slots by two new people", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Both"), slot("fac-A", "Both")),
      pair(slot("fac-C", "Approve"), slot("fac-D", "Forward")),
    ),
    [
      { type: "remove", facultyId: "fac-A" },
      { type: "create", facultyId: "fac-C", position: "Counselor", kpiFocus: "Approve" },
      { type: "create", facultyId: "fac-D", position: "Committee Lead", kpiFocus: "Forward" },
    ],
  );
});

test("merge splits: both slots simply cleared", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(pair(slot("fac-A", "Both"), slot("fac-A", "Both")), pair(null, null)),
    [{ type: "remove", facultyId: "fac-A" }],
  );
});

// Branch: still merged.
test("still merged, no edits: reload-then-save is a no-op (the idempotency case)", () => {
  // buildRosterState loads a combined row's one stored value into both boxes.
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Approve / Forward"), slot("fac-A", "Approve / Forward")),
      pair(slot("fac-A", "Approve / Forward"), slot("fac-A", "Approve / Forward")),
    ),
    [],
  );
});

test("still merged, same person: editing one focus box updates the shared row, with no position change", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Approve / Forward"), slot("fac-A", "Approve / Forward")),
      pair(slot("fac-A", "Approve and finalize"), slot("fac-A", "Approve / Forward")),
    ),
    [{ type: "update", facultyId: "fac-A", kpiFocus: "Approve and finalize / Approve / Forward" }],
  );
});

test("still merged, but swapped for an entirely different person", () => {
  assert.deepEqual(
    diffCounselorLeadSlots(
      pair(slot("fac-A", "Both"), slot("fac-A", "Both")),
      pair(slot("fac-C", "Both"), slot("fac-C", "Both")),
    ),
    [
      { type: "remove", facultyId: "fac-A" },
      { type: "create", facultyId: "fac-C", position: "Counselor and Committee Lead", kpiFocus: "Both" },
    ],
  );
});
