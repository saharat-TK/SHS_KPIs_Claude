// One-off migration: add the 'combined_percent' / 'combined_ratio' calculation
// types, and report which existing KPIs should move onto them.
//
//   node --env-file=.env.local scripts/migrate-kpi-combined-types.mjs [--apply]
//
// Idempotent. Steps:
//   1. Extend the calculation_type ENUM on library_kpi and perf_kpi (always).
//   2. Report the KPIs whose children are fractions (never stamps without
//      --apply).
//
// Background. percent_of_total / ratio_of_total pool a child's progress against
// its TARGET. That is only sound while the child's value is a count on the same
// scale as its target ("329 admitted of 315 planned = 104%"). When a child is
// itself a fraction the arithmetic is meaningless, because percentages do not
// add: K1-1 "% of graduates employed" summed four curriculum percentages
// (76.81 + 75.86 + 75.00 + 80.00 = 307.67), divided by four 70% targets (280),
// and reported 109.88%. The true rate is 109 employed / 143 graduates = 76.22%.
//
// The numbers to do it correctly are already stored: a fed metric records what
// its own aggregation divided in variable1_value / variable2_value. combined_*
// pools those instead. See rollupParts in lib/kpi/performance.ts.
//
// Candidate rule: a *_of_total KPI is a candidate when its children carry parts
// — i.e. at least one child quarter row has a variable2_value, and NO child row
// has a progress_value without one. A fed child gets variable2_value only when
// its aggregation was percent_of / ratio_of, so this distinguishes fraction
// children from count children exactly.
//
// Values are not recomputed here. After --apply, run:
//   node --env-file=.env.local scripts/recompute-parent-rollups.mjs
import mysql from "mysql2/promise";

const APPLY = process.argv.includes("--apply");

const ENUM_DEF =
  "ENUM('weighted_sum','simple_average','percent_of_total','ratio_of_total'," +
  "'combined_percent','combined_ratio','custom_formula') NOT NULL DEFAULT 'weighted_sum'";

const TARGET_TYPE = {
  percent_of_total: "combined_percent",
  ratio_of_total: "combined_ratio",
};

async function columnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return rows[0]?.t ?? null;
}

/** Candidates keyed on library_kpi.id, judged from the performance rows their
 *  snapshots produced — the library itself stores no progress.
 *
 *  Judged per CHILD, not per row. A child is a fraction when any of its
 *  quarters recorded a denominator; a child that reported values and never a
 *  denominator is a count. Counting rows instead would misjudge a fraction
 *  child that also has a few hand-entered quarters, which record no parts —
 *  exactly K1-1's shape. */
async function findCandidates(conn) {
  const [rows] = await conn.query(
    `SELECT k.id, k.name, k.unit, k.calculation_type AS calcType,
            SUM(child.isFraction)                          AS fractionChildren,
            SUM(child.hasData AND NOT child.isFraction)    AS countChildren,
            COUNT(*)                                       AS children
       FROM library_kpi k
       JOIN (
         SELECT pm.id, pk.source_kpi_id AS kpiId,
                MAX(q.variable2_value IS NOT NULL)  AS isFraction,
                MAX(q.progress_value IS NOT NULL)   AS hasData
           FROM perf_kpi pk
           JOIN performance_record r ON r.id = pk.record_id AND r.status = 'active'
           JOIN perf_metric pm ON pm.perf_kpi_id = pk.id
           LEFT JOIN perf_metric_quarter_progress q ON q.perf_metric_id = pm.id
          GROUP BY pm.id
       ) child ON child.kpiId = k.id
      WHERE k.calculation_type IN ('percent_of_total', 'ratio_of_total')
      GROUP BY k.id
      ORDER BY k.id`,
  );
  return rows.map((r) => ({
    ...r,
    fractionChildren: Number(r.fractionChildren),
    countChildren: Number(r.countChildren),
    // Some child is a fraction, and no child is a count. A KPI mixing both
    // shapes is left alone: neither pooled family is right for it, and that
    // needs a human, not a default.
    isCandidate: Number(r.fractionChildren) > 0 && Number(r.countChildren) === 0,
  }));
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
    // 1. Extend both ENUMs. DDL auto-commits in MySQL, so each table is guarded
    // separately rather than wrapped in a transaction.
    for (const table of ["library_kpi", "perf_kpi"]) {
      const t = await columnType(conn, table, "calculation_type");
      if (t == null) {
        throw new Error(`${table}.calculation_type not found — is this the right database?`);
      }
      if (t.includes("combined_percent")) {
        console.log(`${table}.calculation_type already has combined_percent — skipping.`);
        continue;
      }
      console.log(`Extending ${table}.calculation_type ENUM…`);
      await conn.query(`ALTER TABLE ${table} MODIFY COLUMN calculation_type ${ENUM_DEF}`);
    }

    // 2. Report. Stamping is opt-in: which pooled family a KPI wants is a
    // judgement about what it MEANS, and the child shape is only strong
    // evidence for it.
    const candidates = await findCandidates(conn);
    if (candidates.length === 0) {
      console.log("\nNo percent_of_total / ratio_of_total KPIs with children — nothing to review.");
      return;
    }

    console.log("\nPooled KPIs and the shape of their children:");
    for (const c of candidates) {
      const mark = c.isCandidate ? "→ MOVE" : "  keep";
      console.log(
        `  ${mark}  [${c.id}] ${c.name.slice(0, 44)}\n` +
          `          unit=${c.unit} ${c.calcType}` +
          (c.isCandidate ? ` → ${TARGET_TYPE[c.calcType]}` : "") +
          `, ${c.children} children: ${c.fractionChildren} fraction, ` +
          `${c.countChildren} count`,
      );
    }

    const moving = candidates.filter((c) => c.isCandidate);
    if (moving.length === 0) {
      console.log("\nNo KPI has fraction children — nothing to move.");
      return;
    }
    if (!APPLY) {
      console.log(
        `\n${moving.length} KPI(s) would move. Re-run with --apply to stamp them, ` +
          "then recompute:\n  node --env-file=.env.local scripts/recompute-parent-rollups.mjs",
      );
      return;
    }

    // Both layers move together: perf_kpi holds the type the roll-up actually
    // reads, library_kpi the one a future activation would copy down.
    for (const c of moving) {
      const to = TARGET_TYPE[c.calcType];
      await conn.query("UPDATE library_kpi SET calculation_type = ? WHERE id = ?", [to, c.id]);
      const [res] = await conn.query(
        "UPDATE perf_kpi SET calculation_type = ? WHERE source_kpi_id = ?",
        [to, c.id],
      );
      console.log(`Moved library_kpi ${c.id} and ${res.affectedRows} perf_kpi row(s) to ${to}.`);
    }
    console.log(
      "\nStored values are still the old ones. Recompute them with:\n" +
        "  node --env-file=.env.local scripts/recompute-parent-rollups.mjs",
    );
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
