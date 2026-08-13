// One-off data repair: merges a duplicated faculty person into a single row.
//
//   node --env-file=.env.local scripts/merge-duplicate-faculty.mjs
//
// The roster carried ผศ.ดร.พิษณุรักษ์ กันทวี twice — fac-032 (Assistant
// Professor) and fac-040 (Lecturer) — sharing one email. That was harmless
// while identity was a hardcoded persona, but scripts/migrate-app-roles.mjs
// makes faculty.email the unique key Google sign-in resolves against, and two
// rows for one mailbox is exactly the ambiguity an auth check must not have.
//
// fac-032 (the current rank) is kept. fac-040's only reference anywhere in the
// schema is its cmt-curriculum membership, which moves across so the person
// keeps their Committee position in the approval workflow.
//
// Idempotent: if fac-040 is already gone the script reports and exits 0.
import mysql from "mysql2/promise";

const KEEP = "fac-032";
const DROP = "fac-040";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [[keep]] = await conn.query(
      `SELECT id, name, email FROM faculty WHERE id = ?`,
      [KEEP],
    );
    const [[drop]] = await conn.query(
      `SELECT id, name, email FROM faculty WHERE id = ?`,
      [DROP],
    );

    if (!drop) {
      console.log(`${DROP} is already gone — nothing to do.`);
      return;
    }
    if (!keep) {
      throw new Error(`${KEEP} does not exist; refusing to drop ${DROP}`);
    }

    // Guard against merging two people who merely look similar.
    if (keep.email !== drop.email) {
      throw new Error(
        `${KEEP} (${keep.email}) and ${DROP} (${drop.email}) do not share an ` +
          `email — refusing to merge`,
      );
    }

    console.log(`Merging ${DROP} (${drop.name}) into ${KEEP} (${keep.name})`);

    await conn.beginTransaction();

    // Move memberships the keeper doesn't already hold, then drop the rest.
    // committee_memberships is PK (faculty_id, committee_id), so a naive
    // UPDATE would collide if both rows sat on the same committee.
    const [moved] = await conn.query(
      `UPDATE committee_memberships m SET m.faculty_id = ?
        WHERE m.faculty_id = ?
          AND NOT EXISTS (SELECT 1 FROM (SELECT * FROM committee_memberships) k
                           WHERE k.faculty_id = ? AND k.committee_id = m.committee_id)`,
      [KEEP, DROP, KEEP],
    );
    const [dropped] = await conn.query(
      `DELETE FROM committee_memberships WHERE faculty_id = ?`,
      [DROP],
    );
    console.log(
      `  memberships: ${moved.affectedRows} moved, ` +
        `${dropped.affectedRows} discarded as already held by ${KEEP}`,
    );

    // The remaining FKs (committees.head_id, data_source.created_by,
    // data_source_entry.recorded_by, library_kpi/library_metric
    // .person_in_charge_id) are repointed the same way; each was verified
    // empty for fac-040 before this script was written, so these are
    // no-ops that exist to keep the script correct if it is ever replayed
    // against a database where they aren't.
    for (const [table, column] of [
      ["committees", "head_id"],
      ["data_source", "created_by"],
      ["data_source_entry", "recorded_by"],
      ["library_kpi", "person_in_charge_id"],
      ["library_metric", "person_in_charge_id"],
    ]) {
      const [res] = await conn.query(
        `UPDATE \`${table}\` SET \`${column}\` = ? WHERE \`${column}\` = ?`,
        [KEEP, DROP],
      );
      if (res.affectedRows > 0) {
        console.log(`  ${table}.${column}: ${res.affectedRows} repointed`);
      }
    }

    await conn.query(`DELETE FROM faculty WHERE id = ?`, [DROP]);
    await conn.commit();

    const [rows] = await conn.query(
      `SELECT m.committee_id, m.position FROM committee_memberships m
        WHERE m.faculty_id = ?`,
      [KEEP],
    );
    console.log(
      `Done. ${KEEP} now holds ${rows.length} membership(s): ` +
        rows.map((r) => `${r.committee_id} (${r.position})`).join(", "),
    );
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error("Merge failed:", err.message ?? err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
