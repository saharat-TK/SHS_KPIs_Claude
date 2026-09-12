import assert from "node:assert/strict";
import test from "node:test";

import { can, ROLES, ROLE_LABELS } from "../lib/auth/can.ts";

const user = (role, committeeId, committeeIds) => ({
  id: "fac-001",
  name: "Test Person",
  email: "test@mfu.ac.th",
  role,
  facultyId: "fac-001",
  committeeId,
  committeeIds,
});

test("ROLES matches the faculty.system_role ENUM", () => {
  // If these drift, sign-in hands out a role the policy matrix has never heard
  // of and can() silently denies everything. Keep in step with
  // scripts/migrate-app-roles.mjs.
  assert.deepEqual([...ROLES].sort(), ["admin", "committee", "reviewer", "viewer"]);
  for (const role of ROLES) {
    assert.equal(typeof ROLE_LABELS[role], "string", `${role} needs a label`);
  }
});

test("every role can view dashboards and the faculty roster", () => {
  for (const role of ROLES) {
    assert.ok(can(user(role), "view_dashboards"), `${role} may view dashboards`);
    assert.ok(can(user(role), "view_faculty"), `${role} may view faculty`);
  }
});

test("only admin configures KPIs or manages faculty", () => {
  for (const role of ROLES) {
    const expected = role === "admin";
    assert.equal(can(user(role), "configure_kpis"), expected, `configure_kpis for ${role}`);
    assert.equal(can(user(role), "manage_faculty"), expected, `manage_faculty for ${role}`);
  }
});

test("reviewer and viewer cannot submit metrics", () => {
  assert.equal(can(user("reviewer"), "submit_metrics"), false);
  assert.equal(can(user("viewer"), "submit_metrics"), false);
  assert.ok(can(user("committee"), "submit_metrics"));
  assert.ok(can(user("admin"), "submit_metrics"));
});

test("viewer cannot record performance", () => {
  // ~48 of 65 faculty land on viewer after the migration, so this is now the
  // most common role in the system rather than a theoretical one.
  assert.equal(can(user("viewer"), "record_performance"), false);
  for (const role of ["admin", "reviewer", "committee"]) {
    assert.ok(can(user(role), "record_performance"), `${role} may record`);
  }
});

test("committee writes allow every assigned committee", () => {
  const u = user(
    "committee",
    "cmt-curriculum",
    ["cmt-curriculum", "cmt-research-ethics"],
  );
  assert.ok(can(u, "submit_metrics", { committeeId: "cmt-curriculum" }));
  assert.ok(can(u, "submit_metrics", { committeeId: "cmt-research-ethics" }));
  assert.equal(can(u, "submit_metrics", { committeeId: "cmt-finance" }), false);
  // Admin is not scoped.
  assert.ok(can(user("admin"), "submit_metrics", { committeeId: "cmt-research" }));
});

test("committee writes fall back to the legacy single committee id", () => {
  const u = user("committee", "cmt-curriculum");
  assert.ok(can(u, "submit_metrics", { committeeId: "cmt-curriculum" }));
  assert.equal(can(u, "submit_metrics", { committeeId: "cmt-research-ethics" }), false);
});

test("committee writes fail closed when the person has no memberships", () => {
  const u = user("committee", undefined, []);
  assert.equal(can(u, "submit_metrics", { committeeId: "cmt-curriculum" }), false);
});

test("an unknown role and a missing user both deny everything", () => {
  // Guards the ENUM widening: a value that reaches the app without a MATRIX
  // row must fail closed, not throw or default open.
  assert.equal(can(null, "view_dashboards"), false);
  assert.equal(can(user("user"), "view_dashboards"), false, "the retired 'user' value");
  assert.equal(can(user("superadmin"), "configure_kpis"), false);
});
