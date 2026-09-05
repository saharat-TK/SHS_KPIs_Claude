import fs from "fs";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  console.log("Connected to database:", process.env.DB_NAME);

  const content = fs.readFileSync("schema/shs_kpis_claude_Seeds.sql", "utf8");

  // Parse all INSERT INTO statements
  const statements = [];
  let pos = 0;
  while (true) {
    const insertIdx = content.indexOf("INSERT INTO ", pos);
    if (insertIdx === -1) break;
    let semiIdx = insertIdx;
    let inString = false;
    let escape = false;
    while (semiIdx < content.length) {
      const ch = content[semiIdx];
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "'") {
        inString = !inString;
      } else if (ch === ";" && !inString) {
        break;
      }
      semiIdx++;
    }
    const stmt = content.slice(insertIdx, semiIdx + 1).trim();
    statements.push(stmt);
    pos = semiIdx + 1;
  }

  console.log(`Found ${statements.length} INSERT statements to execute.`);

  await conn.query("SET FOREIGN_KEY_CHECKS=0;");

  let successCount = 0;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const ignoreStmt = stmt.replace(/^INSERT INTO /i, "INSERT IGNORE INTO ");
    try {
      await conn.query(ignoreStmt);
      successCount++;
    } catch (err) {
      console.error(`Error on statement ${i + 1}:`, err.message);
    }
  }

  await conn.query("SET FOREIGN_KEY_CHECKS=1;");
  console.log(`Successfully executed ${successCount} / ${statements.length} statements.`);

  const [facultyRows] = await conn.query("SELECT count(*) as c FROM faculty");
  console.log("Total faculty rows:", facultyRows[0].c);

  const [saharatRows] = await conn.query(
    "SELECT id, name, email, status, system_role FROM faculty WHERE email LIKE '%saharat%'"
  );
  console.log("Saharat faculty record:", saharatRows);

  await conn.end();
}

main().catch(console.error);
