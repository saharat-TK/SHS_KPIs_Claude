// Replaces legacy performance-record lifecycle values with active/inactive/completed.
//
//   node --env-file=.env.local scripts/migrate-performance-record-statuses.mjs
//
// The data update intentionally happens before the enum is narrowed so every
// existing closed/archived value remains valid throughout the migration.
import mysql from "mysql2/promise";

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
      `ALTER TABLE performance_record
       MODIFY COLUMN status ENUM('active','closed','archived','inactive','completed')
       NOT NULL DEFAULT 'active'`,
    );
    const [result] = await conn.query(
      `UPDATE performance_record
       SET status = CASE status
         WHEN 'closed' THEN 'inactive'
         WHEN 'archived' THEN 'completed'
         ELSE status
       END
       WHERE status IN ('closed', 'archived')`,
    );
    await conn.query(
      `ALTER TABLE performance_record
       MODIFY COLUMN status ENUM('active','inactive','completed') NOT NULL DEFAULT 'active'`,
    );
    console.log(`Migration complete. ${result.affectedRows} record(s) converted.`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
