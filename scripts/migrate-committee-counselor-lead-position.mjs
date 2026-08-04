// One-off migration: allow a faculty member to hold Counselor and Committee
// Lead on the same committee at once.
//
//   node --env-file=.env.local scripts/migrate-committee-counselor-lead-position.mjs
//
// Idempotent. committee_memberships.position is a single ENUM column and the
// table's PK is (faculty_id, committee_id) — one row per person per committee,
// so a person can only ever hold one position value there. Rather than
// widening the PK (which would ripple into the membership API routes, which
// address a row by faculty+committee only), this adds a new combined value —
// the same pattern the existing 'Committee and Secretary' slot already uses —
// so "holds both roles" is still exactly one row.
//
// No backfill: no existing row uses the new value.
import mysql from "mysql2/promise";

const ENUM_DEF =
  "ENUM('Counselor','Committee Lead','Committee','Committee and Secretary','Counselor and Committee Lead') NOT NULL";

async function columnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return rows[0]?.t ?? null;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const t = await columnType(conn, "committee_memberships", "position");
    if (t == null) {
      throw new Error("committee_memberships.position not found — is this the right database?");
    }
    if (t.includes("Counselor and Committee Lead")) {
      console.log("committee_memberships.position already has the combined value — skipping.");
      return;
    }
    console.log("Extending committee_memberships.position ENUM…");
    await conn.query(`ALTER TABLE committee_memberships MODIFY COLUMN position ${ENUM_DEF}`);
    console.log("Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
