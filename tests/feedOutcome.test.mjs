import assert from "node:assert/strict";
import test from "node:test";
import {
  describeOutcome,
  emptyOutcome,
  mergeOutcomes,
} from "../lib/kpi/feedOutcome.ts";

// The one line a user sees after a link save or a "recompute from sources".
// It is the only report of what the feed did, so it has to stay honest about
// all three counters without becoming noise on an ordinary run.

const skip = (reason, quarterNo = 1) => ({
  target: "K1-1",
  yearNo: 1,
  quarterNo,
  reason,
});

test("emptyOutcome starts at zero on every counter", () => {
  assert.deepEqual(emptyOutcome(), { updated: 0, cleared: 0, skipped: [] });
});

test("describeOutcome reports the update count, pluralised", () => {
  assert.equal(describeOutcome({ ...emptyOutcome(), updated: 1 }), "1 quarter updated");
  assert.equal(describeOutcome({ ...emptyOutcome(), updated: 2 }), "2 quarters updated");
  // Zero is still worth stating — it tells the user the save did nothing.
  assert.equal(describeOutcome(emptyOutcome()), "0 quarters updated");
});

test("describeOutcome mentions cleared only when something was cleared", () => {
  // Clearing is rare; "0 cleared" on every ordinary save would read as a fault.
  assert.equal(describeOutcome({ ...emptyOutcome(), updated: 4 }), "4 quarters updated");
  assert.equal(
    describeOutcome({ ...emptyOutcome(), updated: 4, cleared: 2 }),
    "4 quarters updated · 2 cleared",
  );
});

test("describeOutcome groups skipped quarters by reason", () => {
  const outcome = {
    ...emptyOutcome(),
    updated: 9,
    skipped: [skip("period closed", 1), skip("period closed", 2), skip("approved", 3)],
  };
  assert.equal(
    describeOutcome(outcome),
    "9 quarters updated · 3 skipped (2 period closed, 1 approved)",
  );
});

test("describeOutcome composes all three clauses in order", () => {
  // The live shape: a source that fed some quarters, cleared some orphans, and
  // was held off others.
  assert.equal(
    describeOutcome({ updated: 72, cleared: 2, skipped: [skip("period closed")] }),
    "72 quarters updated · 2 cleared · 1 skipped (1 period closed)",
  );
});

test("mergeOutcomes sums the counters and concatenates the skips", () => {
  const a = { updated: 3, cleared: 1, skipped: [skip("period closed")] };
  const b = { updated: 4, cleared: 2, skipped: [skip("approved")] };

  assert.deepEqual(mergeOutcomes(a, b), {
    updated: 7,
    cleared: 3,
    skipped: [skip("period closed"), skip("approved")],
  });
  // Merging is how per-link outcomes roll into a per-source one, so it must not
  // mutate either side.
  assert.deepEqual(a, { updated: 3, cleared: 1, skipped: [skip("period closed")] });
  assert.deepEqual(mergeOutcomes(emptyOutcome(), a), a);
});
