import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTIONS_REQUIRING_COMMENT,
  TRANSITIONS,
  actionRequiresComment,
  authorizingStage,
  availableActions,
  canTransition,
  nextState,
  resolvePositionFromMemberships,
  resolveStageRole,
  resolveStageRoles,
  stageForPosition,
} from "../lib/kpi/approvalWorkflow.ts";

const STATES = ["draft", "submitted", "returned", "forwarded", "approved"];
const ACTIONS = ["submit", "return", "forward", "approve", "reject", "reverse"];
const STAGES = ["member", "lead", "counselor", "admin"];

test("the member → lead → counselor chain walks draft to approved", () => {
  assert.ok(canTransition("member", "draft", "submit"));
  assert.equal(nextState("submit"), "submitted");

  assert.ok(canTransition("lead", "submitted", "forward"));
  assert.equal(nextState("forward"), "forwarded");

  assert.ok(canTransition("counselor", "forwarded", "approve"));
  assert.equal(nextState("approve"), "approved");
});

test("send-back paths return work to the previous stage", () => {
  // Lead sends a submission back to the member, who may re-submit.
  assert.ok(canTransition("lead", "submitted", "return"));
  assert.equal(nextState("return"), "returned");
  assert.ok(canTransition("member", "returned", "submit"));

  // Counselor rejects a forwarded item back to the lead, not to the member.
  assert.ok(canTransition("counselor", "forwarded", "reject"));
  assert.equal(nextState("reject"), "submitted");
});

test("reverse is admin-only and only from approved", () => {
  assert.ok(canTransition("admin", "approved", "reverse"));
  assert.equal(nextState("reverse"), "returned");

  for (const state of STATES.filter((s) => s !== "approved")) {
    assert.equal(
      canTransition("admin", state, "reverse"),
      false,
      `admin should not reverse from "${state}"`,
    );
  }
  for (const stage of STAGES.filter((s) => s !== "admin")) {
    assert.equal(
      canTransition(stage, "approved", "reverse"),
      false,
      `${stage} should not be able to reverse`,
    );
  }
});

test("approved is terminal for every non-admin action", () => {
  for (const stage of STAGES) {
    for (const action of ACTIONS.filter((a) => a !== "reverse")) {
      assert.equal(
        canTransition(stage, "approved", action),
        false,
        `${stage} should not ${action} an approved item`,
      );
    }
  }
});

test("every (stage, state, action) triple outside TRANSITIONS is refused", () => {
  const legal = new Set();
  for (const rule of TRANSITIONS) {
    for (const from of rule.from) legal.add(`${rule.stage}|${from}|${rule.action}`);
  }

  for (const stage of STAGES) {
    for (const state of STATES) {
      for (const action of ACTIONS) {
        const expected = legal.has(`${stage}|${state}|${action}`);
        assert.equal(
          canTransition(stage, state, action),
          expected,
          `${stage} / ${state} / ${action} should be ${expected}`,
        );
      }
    }
  }
});

test("a null stage role can do nothing", () => {
  for (const state of STATES) {
    assert.deepEqual(availableActions(null, state), []);
    for (const action of ACTIONS) {
      assert.equal(canTransition(null, state, action), false);
    }
  }
});

test("availableActions drives the per-row queue buttons", () => {
  assert.deepEqual(availableActions("member", "draft"), ["submit"]);
  assert.deepEqual(availableActions("member", "returned"), ["submit"]);
  assert.deepEqual(availableActions("lead", "submitted"), ["return", "forward"]);
  assert.deepEqual(availableActions("counselor", "forwarded"), ["approve", "reject"]);
  assert.deepEqual(availableActions("admin", "approved"), ["reverse"]);

  // A stage role looking at someone else's queue state sees no buttons.
  assert.deepEqual(availableActions("member", "submitted"), []);
  assert.deepEqual(availableActions("lead", "forwarded"), []);
  assert.deepEqual(availableActions("counselor", "submitted"), []);
});

test("resolveStageRole maps each committee position to its stage", () => {
  assert.equal(resolveStageRole("Counselor", "committee"), "counselor");
  assert.equal(resolveStageRole("Committee Lead", "committee"), "lead");
  assert.equal(resolveStageRole("Committee", "committee"), "member");
  assert.equal(resolveStageRole("Committee and Secretary", "committee"), "member");
});

test("resolveStageRole collapses admin over position", () => {
  assert.equal(resolveStageRole(null, "admin"), "admin");
  assert.equal(resolveStageRole("Committee Lead", "admin"), "admin");
});

test("stageForPosition ignores admin entirely", () => {
  assert.equal(stageForPosition("Committee Lead"), "lead");
  assert.equal(stageForPosition("Counselor"), "counselor");
  assert.equal(stageForPosition("Committee"), "member");
  assert.equal(stageForPosition(null), null);
});

// Real data has faculty who are both a Committee Lead and an administrator
// (faculty.system_role='admin'). Collapsing the two would strip them of their
// lead transitions, which is why admin is additive.
test("resolveStageRoles makes admin additive, not a replacement", () => {
  assert.deepEqual(resolveStageRoles("Committee Lead", false), ["lead"]);
  assert.deepEqual(resolveStageRoles("Committee Lead", true), ["lead", "admin"]);
  assert.deepEqual(resolveStageRoles(null, true), ["admin"]);
  assert.deepEqual(resolveStageRoles(null, false), []);
});

test("a lead who is also an admin keeps every lead transition and gains reverse", () => {
  const stages = resolveStageRoles("Committee Lead", true);

  assert.ok(canTransition(stages, "submitted", "forward"));
  assert.ok(canTransition(stages, "submitted", "return"));
  assert.ok(canTransition(stages, "approved", "reverse"));

  // Still not a superset: submitting and approving remain out of reach.
  assert.equal(canTransition(stages, "draft", "submit"), false);
  assert.equal(canTransition(stages, "forwarded", "approve"), false);

  assert.deepEqual(availableActions(stages, "submitted"), ["return", "forward"]);
  assert.deepEqual(availableActions(stages, "approved"), ["reverse"]);
});

test("availableActions merges the stages in TRANSITIONS order without duplicates", () => {
  assert.deepEqual(availableActions(["member", "admin"], "draft"), ["submit"]);
  assert.deepEqual(availableActions(["counselor", "admin"], "forwarded"), [
    "approve",
    "reject",
  ]);
  assert.deepEqual(availableActions([], "submitted"), []);
});

test("authorizingStage names the stage that actually permits the move", () => {
  // A lead+admin forwards *as the lead* — that is what the audit trail records.
  assert.equal(authorizingStage(["lead", "admin"], "submitted", "forward"), "lead");
  assert.equal(authorizingStage(["lead", "admin"], "approved", "reverse"), "admin");
  assert.equal(authorizingStage(["lead"], "approved", "reverse"), null);
  assert.equal(authorizingStage(null, "draft", "submit"), null);
  // Right stage, wrong state.
  assert.equal(authorizingStage(["member"], "submitted", "submit"), null);
});

test("resolveStageRole returns null without a position", () => {
  // Reviewer and viewer personas carry no committee membership, so the
  // approvals queue is read-only for them.
  assert.equal(resolveStageRole(null, "reviewer"), null);
  assert.equal(resolveStageRole(null, "viewer"), null);
  assert.equal(resolveStageRole(null, "committee"), null);
  assert.equal(resolveStageRole(undefined, undefined), null);
});

const memberships = [
  { facultyId: "fac-002", committeeId: "cmt-curriculum", position: "Committee" },
  { facultyId: "fac-005", committeeId: "cmt-curriculum", position: "Committee Lead" },
  { facultyId: "fac-001", committeeId: "cmt-curriculum", position: "Counselor" },
];

test("resolvePositionFromMemberships prefers the exact committee membership", () => {
  assert.equal(
    resolvePositionFromMemberships(memberships, "fac-005", "cmt-curriculum"),
    "Committee Lead",
  );
});

test("resolvePositionFromMemberships yields nothing for a stranger to a staffed committee", () => {
  // The committee has rows, just not for this person — no fallback applies.
  assert.equal(
    resolvePositionFromMemberships(memberships, "fac-999", "cmt-curriculum"),
    null,
  );
});

test("resolvePositionFromMemberships falls back only on a single actor row", () => {
  // Unstaffed committee + exactly one membership for the actor ⇒ borrow it.
  assert.equal(
    resolvePositionFromMemberships(memberships, "fac-002", "cmt-graduate"),
    "Committee",
  );

  // Two memberships ⇒ ambiguous, so no fallback.
  const multi = [
    ...memberships,
    { facultyId: "fac-002", committeeId: "cmt-edpex", position: "Counselor" },
  ];
  assert.equal(resolvePositionFromMemberships(multi, "fac-002", "cmt-graduate"), null);
});

test("resolvePositionFromMemberships handles missing inputs", () => {
  assert.equal(resolvePositionFromMemberships([], "fac-002", "cmt-curriculum"), null);
  assert.equal(resolvePositionFromMemberships(null, "fac-002", "cmt-curriculum"), null);
  assert.equal(resolvePositionFromMemberships(memberships, null, "cmt-curriculum"), null);
  assert.equal(resolvePositionFromMemberships(memberships, "fac-002", null), null);
});

test("only the send-back actions require a reviewer note", () => {
  assert.deepEqual([...ACTIONS_REQUIRING_COMMENT].sort(), ["reject", "return"]);
  for (const action of ACTIONS) {
    assert.equal(
      actionRequiresComment(action),
      action === "return" || action === "reject",
      `${action} comment requirement`,
    );
  }
});

test("nextState is null for an unknown action", () => {
  assert.equal(nextState("publish"), null);
});
