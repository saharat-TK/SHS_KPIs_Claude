// Narrow, idempotent migration for the five-program / nine-curriculum catalog.
// It only creates and seeds reference tables; it never changes data sources,
// links, entries, or faculty assignments.
//
//   node --env-file=.env.local scripts/migrate-academic-catalog.mjs
import mysql from "mysql2/promise";

const PROGRAMS = [
  ["PH", "สาขาวิชาสาธารณสุขศาสตร์", 1],
  ["SHS", "สาขาวิชาวิทยาศาสตร์การกีฬาและสุขภาพ", 2],
  ["OHS", "สาขาวิชาอาชีวอนามัยและความปลอดภัย", 3],
  ["EnvH", "สาขาวิชาอนามัยสิ่งแวดล้อม", 4],
  ["BM", "สาขาวิชาเทคโนโลยีชีวการแพทย์และสารสนเทศสุขภาพ", 5],
];

const CURRICULA = [
  ["PHB", "PH", "สาธารณสุขศาสตร์", 1],
  ["PHM", "PH", "การจัดการสุขภาพชายแดน", 2],
  ["PHD", "PH", "ระบาดและวัคซีนวิทยา", 3],
  ["SHSB", "SHS", "วิทยาศาสตร์การกีฬาและสุขภาพ", 4],
  ["SHSM", "SHS", "วิทยาศาสตร์และเทคโนโลยีการกีฬาประยุกต์", 5],
  ["OHSB", "OHS", "อาชีวอนามัยและความปลอดภัย", 6],
  ["EnvHB", "EnvH", "อนามัยสิ่งแวดล้อม", 7],
  ["EnvHM", "EnvH", "เทคโนโลยีการจัดการสิ่งแวดล้อมอย่างยั่งยืน", 8],
  ["BMM", "BM", "เทคโนโลยีชีวการแพทย์และสารสนเทศสุขภาพ", 9],
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS academic_program (
        code       VARCHAR(20)  PRIMARY KEY,
        label_th   VARCHAR(255) NOT NULL,
        sort_order INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    await conn.query(`
      CREATE TABLE IF NOT EXISTS curriculum (
        code         VARCHAR(20)  PRIMARY KEY,
        program_code VARCHAR(20)  NOT NULL,
        label_th     VARCHAR(255) NOT NULL,
        sort_order   INT NOT NULL,
        created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_curriculum_program FOREIGN KEY (program_code)
          REFERENCES academic_program(code) ON DELETE RESTRICT,
        INDEX idx_curriculum_program (program_code, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    await conn.query(
      `INSERT INTO academic_program (code, label_th, sort_order) VALUES ?
       ON DUPLICATE KEY UPDATE label_th = VALUES(label_th), sort_order = VALUES(sort_order)`,
      [PROGRAMS],
    );
    await conn.query(
      `INSERT INTO curriculum (code, program_code, label_th, sort_order) VALUES ?
       ON DUPLICATE KEY UPDATE
         program_code = VALUES(program_code), label_th = VALUES(label_th), sort_order = VALUES(sort_order)`,
      [CURRICULA],
    );
    console.log("Academic catalog migration complete.");
  } catch (err) {
    console.error("Academic catalog migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
