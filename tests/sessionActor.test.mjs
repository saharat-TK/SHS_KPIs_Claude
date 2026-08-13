import assert from "node:assert/strict";
import test from "node:test";

import { resolveActor } from "../lib/auth/allowlist.ts";

const admin = {
  facultyId: "fac-022",
  name: "อ.ดร.สหรัตถ์ อารีราษฎร์",
  email: "saharat.arr@mfu.ac.th",
  role: "admin",
  committeeId: "cmt-curriculum",
};
const member = {
  facultyId: "fac-002",
  name: "ผศ.ดร.จงกล สายสิงห์",
  email: "jongkon.sai@mfu.ac.th",
  role: "committee",
  committeeId: "cmt-curriculum",
};
const viewer = {
  facultyId: "fac-049",
  name: "นางสาวสุวพร วงศ์ปาน",
  email: "suwaporn@mfu.ac.th",
  role: "viewer",
  committeeId: null,
};

test("nobody signed in resolves to no actor", () => {
  assert.equal(resolveActor({ real: null, impersonateTarget: null }), null);
  // A cookie without a session is still nothing — it is a pointer, not a grant.
  assert.equal(resolveActor({ real: null, impersonateTarget: admin }), null);
});

test("without a target you are simply yourself", () => {
  const actor = resolveActor({ real: member, impersonateTarget: null });
  assert.equal(actor.facultyId, "fac-002");
  assert.equal(actor.role, "committee");
  assert.equal(actor.impersonating, false);
  assert.equal(actor.realFacultyId, "fac-002");
  assert.equal(actor.realRole, "committee");
});

test("an admin may view as someone else", () => {
  const actor = resolveActor({ real: admin, impersonateTarget: member });
  assert.equal(actor.facultyId, "fac-002", "runs as the target");
  assert.equal(actor.role, "committee", "and with the target's authority");
  assert.equal(actor.committeeId, "cmt-curriculum");
  assert.equal(actor.impersonating, true);
  // The real person must survive: the audit trail records them.
  assert.equal(actor.realFacultyId, "fac-022");
  assert.equal(actor.realName, admin.name);
  assert.equal(actor.realRole, "admin");
});

test("a non-admin's impersonation cookie is ignored", () => {
  // This is what makes it safe for the cookie to be forgeable: the admin bit
  // is re-read from the database and checked here on every request.
  for (const real of [member, viewer]) {
    const actor = resolveActor({ real, impersonateTarget: admin });
    assert.equal(actor.facultyId, real.facultyId);
    assert.equal(actor.role, real.role);
    assert.equal(actor.impersonating, false);
  }
});

test("impersonating yourself raises no banner", () => {
  const actor = resolveActor({ real: admin, impersonateTarget: admin });
  assert.equal(actor.impersonating, false);
  assert.equal(actor.facultyId, "fac-022");
});

test("an unknown or deactivated target falls back to the real row", () => {
  // getSessionActor passes null when the target row is missing or inactive.
  const actor = resolveActor({ real: admin, impersonateTarget: null });
  assert.equal(actor.facultyId, "fac-022");
  assert.equal(actor.impersonating, false);
});

test("impersonation cannot be chained", () => {
  // Viewing as a second admin still records the original as the real person,
  // so there is no ladder from one identity to the next.
  const otherAdmin = { ...admin, facultyId: "fac-050", name: "นายชินโชติ ทิพยศรี" };
  const actor = resolveActor({ real: admin, impersonateTarget: otherAdmin });
  assert.equal(actor.facultyId, "fac-050");
  assert.equal(actor.realFacultyId, "fac-022");
});
