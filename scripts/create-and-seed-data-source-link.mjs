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

  console.log("Connected to MySQL database:", process.env.DB_NAME);

  // 1. Create table without constraints first
  console.log("Creating table data_source_link...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`data_source_link\` (
      \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
      \`data_source_id\` bigint(20) UNSIGNED NOT NULL,
      \`library_kpi_id\` bigint(20) UNSIGNED DEFAULT NULL,
      \`library_metric_id\` bigint(20) UNSIGNED DEFAULT NULL,
      \`mappings\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(\`mappings\`)),
      \`note\` varchar(1000) DEFAULT NULL,
      \`target_key\` varchar(32) GENERATED ALWAYS AS (concat(if(\`library_kpi_id\` is null,'m','k'),coalesce(\`library_kpi_id\`,\`library_metric_id\`))) STORED,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_ds_link\` (\`data_source_id\`,\`target_key\`),
      KEY \`idx_dsl_kpi\` (\`library_kpi_id\`),
      KEY \`idx_dsl_metric\` (\`library_metric_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);
  console.log("Table data_source_link created.");

  // Add foreign keys safely
  try {
    await conn.query(`
      ALTER TABLE \`data_source_link\`
        ADD CONSTRAINT \`fk_dsl_kpi\` FOREIGN KEY (\`library_kpi_id\`) REFERENCES \`library_kpi\` (\`id\`) ON DELETE CASCADE,
        ADD CONSTRAINT \`fk_dsl_metric\` FOREIGN KEY (\`library_metric_id\`) REFERENCES \`library_metric\` (\`id\`) ON DELETE CASCADE,
        ADD CONSTRAINT \`fk_dsl_source\` FOREIGN KEY (\`data_source_id\`) REFERENCES \`data_source\` (\`id\`) ON DELETE CASCADE;
    `);
    console.log("Foreign keys added to data_source_link.");
  } catch (fkErr) {
    console.log("Note on FK creation (may already exist):", fkErr.message);
  }

  // 2. Extract and run INSERT statement for data_source_link
  const seedsContent = fs.readFileSync("schema/shs_kpis_claude_Seeds.sql", "utf8");
  const needle = "INSERT INTO `data_source_link`";
  const startIdx = seedsContent.indexOf(needle);
  if (startIdx === -1) {
    throw new Error("Could not find INSERT INTO `data_source_link` in seeds file.");
  }

  let semiIdx = startIdx;
  let inString = false;
  let escape = false;
  while (semiIdx < seedsContent.length) {
    const ch = seedsContent[semiIdx];
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

  const insertStmt = seedsContent.slice(startIdx, semiIdx + 1).trim();
  const ignoreStmt = insertStmt.replace(/^INSERT INTO /i, "INSERT IGNORE INTO ");

  await conn.query("SET FOREIGN_KEY_CHECKS=0;");
  console.log("Inserting data_source_link records...");
  await conn.query(ignoreStmt);
  await conn.query("SET FOREIGN_KEY_CHECKS=1;");

  const [linkRows] = await conn.query("SELECT count(*) as c FROM data_source_link");
  console.log(`data_source_link row count: ${linkRows[0].c}`);

  // 3. Complete audit of all 30 tables
  console.log("\n--- Full Database Audit of All 30 Tables ---");
  const [dbTables] = await conn.query("SHOW TABLES");
  const summary = [];
  for (const t of dbTables) {
    const name = Object.values(t)[0];
    const [c] = await conn.query(`SELECT count(*) as c FROM \`${name}\``);
    summary.push({ Table: name, Rows: c[0].c });
  }

  console.table(summary);
  console.log(`Total tables in database: ${summary.length} / 30`);

  await conn.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exitCode = 1;
});
