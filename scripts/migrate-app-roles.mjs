// Widens faculty.system_role from ('admin','user') to the four app roles, and
// makes faculty.email the unique key that Google sign-in resolves against.
//
//   node --env-file=.env.local scripts/migrate-app-roles.mjs
//
// Until now the app role (admin / reviewer / committee / viewer, see
// lib/auth/can.ts) existed only on the hardcoded personas in
// lib/auth/AuthContext.tsx, while the database carried a two-value
// system_role that meant "may perform the admin-only `reverse` transition".
// With real sign-in there is no persona to read a role off, so system_role
// becomes the single source of truth for both — the values are the same set.
//
// Sign-in matches the Google account's email against faculty.email, so that
// column stops being decorative: it gets normalised and uniquely indexed.
//
// Idempotent: every phase probes before it acts, so re-running is a no-op.
// Note that MySQL commits DDL implicitly — wrapping this in a transaction
// would give false comfort, so each phase stands alone instead.
import mysql from "mysql2/promise";

const OLD_ENUM = "ENUM('admin','user','reviewer','committee','viewer')";
const NEW_ENUM = "ENUM('admin','reviewer','committee','viewer')";
const EMAIL_INDEX = "uq_faculty_email";

async function columnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows[0]?.t ?? null;
}

async function indexExists(conn, table, index) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, index],
  );
  return rows.length > 0;
}

// ── Phase 0: preflight ──────────────────────────────────────────────────────
// Both checks guard the UNIQUE index added in phase 4. Failing here changes
// nothing, so the database is always left in a usable state.
async function preflight(conn) {
  const [missing] = await conn.query(
    `SELECT id, name FROM faculty
      WHERE email IS NULL OR TRIM(email) = '' ORDER BY id`,
  );
  const [dupes] = await conn.query(
    `SELECT LOWER(TRIM(email)) AS email, COUNT(*) AS n,
            GROUP_CONCAT(id ORDER BY id) AS ids
       FROM faculty WHERE email IS NOT NULL AND TRIM(email) <> ''
      GROUP BY LOWER(TRIM(email)) HAVING n > 1`,
  );

  // A row without an email simply can never sign in — that is a warning, not a
  // failure, because MySQL allows unlimited NULLs in a UNIQUE index (the
  // synthetic fac-000 service row is the expected case).
  if (missing.length > 0) {
    console.warn(
      `  ! ${missing.length} row(s) have no email and will not be able to ` +
        `sign in: ${missing.map((r) => `${r.id} (${r.name})`).join(", ")}`,
    );
  }

  // Duplicates would make the email→faculty lookup ambiguous, which is exactly
  // the ambiguity an authentication check must never have.
  if (dupes.length > 0) {
    for (const d of dupes) {
      console.error(`  ✗ ${d.email} is shared by ${d.ids}`);
    }
    throw new Error(
      `${dupes.length} duplicate email(s) — resolve these before migrating; ` +
        `nothing has been changed.`,
    );
  }
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
    console.log("Phase 0 — preflight");
    await preflight(conn);
    console.log("  ok");

    const startType = await columnType(conn, "faculty", "system_role");
    if (startType === null) {
      throw new Error("faculty.system_role does not exist");
    }

    // The ENUM must be widened to the *union* first. Altering straight to a
    // set that omits 'user' while rows still hold it errors under strict mode
    // and, far worse, silently coerces those rows to '' under non-strict.
    // COLUMN_TYPE comes back lowercased and unspaced, e.g. enum('admin','user').
    const normalise = (s) => s.toLowerCase().replace(/\s/g, "");
    if (normalise(startType) === normalise(NEW_ENUM)) {
      console.log("Phases 1-3 — system_role already widened, skipping");
    } else {
      console.log("Phase 1 — widen system_role to the union of both role sets");
      await conn.query(
        `ALTER TABLE faculty
         MODIFY system_role ${OLD_ENUM} NOT NULL DEFAULT 'viewer'`,
      );

      console.log("Phase 2 — backfill 'user' rows from committee membership");
      const [toCommittee] = await conn.query(
        `UPDATE faculty f SET f.system_role = 'committee'
          WHERE f.system_role = 'user'
            AND EXISTS (SELECT 1 FROM committee_memberships cm
                         WHERE cm.faculty_id = f.id)`,
      );
      const [toViewer] = await conn.query(
        `UPDATE faculty SET system_role = 'viewer' WHERE system_role = 'user'`,
      );
      console.log(
        `  ${toCommittee.affectedRows} → committee, ` +
          `${toViewer.affectedRows} → viewer`,
      );

      console.log("Phase 3 — narrow system_role, dropping 'user'");
      await conn.query(
        `ALTER TABLE faculty
         MODIFY system_role ${NEW_ENUM} NOT NULL DEFAULT 'viewer'`,
      );
    }

    // Normalise before indexing: sign-in looks up LOWER(TRIM(email)), so the
    // stored form has to match or the index is useless to that query.
    console.log("Phase 4 — normalise emails and add the unique index");
    const [normalised] = await conn.query(
      `UPDATE faculty SET email = LOWER(TRIM(email))
        WHERE email IS NOT NULL AND email <> LOWER(TRIM(email))`,
    );
    console.log(`  ${normalised.affectedRows} email(s) normalised`);

    if (await indexExists(conn, "faculty", EMAIL_INDEX)) {
      console.log(`  ${EMAIL_INDEX} already exists`);
    } else {
      await conn.query(
        `ALTER TABLE faculty ADD UNIQUE INDEX ${EMAIL_INDEX} (email)`,
      );
      console.log(`  ${EMAIL_INDEX} created`);
    }

    console.log("Phase 5 — result");
    const [dist] = await conn.query(
      `SELECT system_role AS role, COUNT(*) AS n FROM faculty
        GROUP BY system_role ORDER BY n DESC`,
    );
    for (const r of dist) console.log(`  ${String(r.role).padEnd(10)} ${r.n}`);

    const [admins] = await conn.query(
      `SELECT id, name, email FROM faculty
        WHERE system_role = 'admin' ORDER BY id`,
    );
    console.log(`\n  ${admins.length} administrator(s):`);
    for (const a of admins) {
      console.log(`    ${a.id}  ${a.email ?? "(no email)"}  ${a.name}`);
    }
    console.log(
      "\n  Check that at least one of those is a real Google mailbox you can " +
        "sign in as —\n  otherwise nobody can reach the admin-only UI once " +
        "login is enforced.",
    );
    console.log(
      "  Nobody is assigned 'reviewer' automatically; grant it by hand in " +
        "Faculty Management.",
    );
  } catch (err) {
    console.error("Migration failed:", err.message ?? err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
