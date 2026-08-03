// Seeds the administrator faculty row that faculty.system_role keys off.
//
//   node --env-file=.env.local scripts/migrate-admin-system-role.mjs
//
// The approval routes used to trust a `userRole` field sent in the request
// body, so any caller could claim "admin" and reverse a locked, finally
// approved record. They now resolve the actor's system role from this table
// instead — which requires at least one row to actually carry 'admin'. Every
// pre-existing row defaults to 'user', so without this migration nobody can
// perform the admin-only `reverse` transition.
//
// Idempotent: re-running it leaves an existing fac-000 untouched apart from
// re-asserting system_role.
import mysql from "mysql2/promise";

const ADMIN_ID = "fac-000";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await conn.query(
      `INSERT INTO faculty (id, name, \`rank\`, email, name_TH, program, status, system_role)
       VALUES (?, ?, 'Support Staff', ?, NULL, 'SHS Office', 'active', 'admin')
       ON DUPLICATE KEY UPDATE system_role = 'admin'`,
      [ADMIN_ID, "SHS KPI Administrator", "admin@mfu.ac.th"],
    );

    const [rows] = await conn.query(
      `SELECT id, name, system_role FROM faculty WHERE system_role = 'admin'`,
    );
    console.log(
      `Migration complete. ${rows.length} admin faculty row(s): ` +
        rows.map((r) => `${r.id} (${r.name})`).join(", "),
    );
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
