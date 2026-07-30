// One-off migration: collapse data_source_link mappings onto the single "value"
// slot.
//
//   node --env-file=.env.local scripts/migrate-link-value-slots.mjs [--dry-run]
//
// Background. A link's mappings used to support three slots — "value", or the
// pair "variable1"/"variable2" for a percent/ratio KPI. The pair was redundant:
// the percent_of / ratio_of aggregations already return value + numerator +
// denominator (lib/kpi/dataSourceFilters.ts, aggregateParts), and the KPI branch
// of applyLink already stored those three into progress_value /
// variable1_value / variable2_value. It was also a trap — every link that ever
// used a variable slot was misconfigured and silently stored NULL:
//
//   link 53  slot variable1 holding a COMPLETE ratio_of (faculty denominator).
//            applyLink saw variable1, read variable2 as null, and
//            kpiValueFromVariables returned null for every quarter.
//   link 56  slots value + variable2, meaning employed ÷ graduates. applyLink
//            takes the variable pair the moment either slot is present, so the
//            "value" mapping was discarded and variable1 was null.
//
// Both are expressible as one "value" mapping, which is what this rewrites them
// to. Run it BEFORE deploying the code that drops the slot field, so nothing is
// left for the new reader to misinterpret.
//
// Refuses to guess: an unrecognised shape is reported and left alone, and the
// script exits non-zero rather than mangling it.
//
// Idempotent: a second run finds no variable slots and does nothing.
import mysql from "mysql2/promise";

const DRY_RUN = process.argv.includes("--dry-run");

const parse = (raw) => (typeof raw === "string" ? JSON.parse(raw) : (raw ?? []));
const slotOf = (m) => m?.slot ?? "value";
const sameFilters = (a, b) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

/** Strip the slot pair down to one self-contained mapping, or return a reason
 *  why this shape needs a human. `unit` is the target KPI's, which decides
 *  whether a rebuilt fraction is a percentage or a bare ratio. */
function collapse(mappings, unit) {
  const u = unit?.trim().toLowerCase();
  if (u !== "percent" && u !== "ratio") {
    return { error: `target unit "${unit}" is neither Percent nor Ratio` };
  }

  // One mapping that is already a whole fraction — it only sat in the wrong
  // slot. percent_of / ratio_of carry their own denominator (a faculty
  // headcount, or the matched rows), so the slot was the single wrong word.
  if (mappings.length === 1) {
    const [m] = mappings;
    if (m.aggregation !== "percent_of" && m.aggregation !== "ratio_of") {
      return {
        error: `lone "${slotOf(m)}" mapping aggregates with "${m.aggregation}", which has no denominator to divide by`,
      };
    }
    return { mapping: { ...m, slot: "value" } };
  }

  // Two mappings, one per side of the fraction. They must agree on which rows
  // they describe: the rebuilt percent_of totals two columns over ONE matched
  // population, so differing filters would change the arithmetic.
  const top = mappings.find((m) => slotOf(m) !== "variable2");
  const bottom = mappings.find((m) => slotOf(m) === "variable2");
  if (!top || !bottom) {
    return { error: `expected a dividend and a "variable2" divisor` };
  }
  if (top.aggregation !== "sum" || bottom.aggregation !== "sum") {
    return {
      error: `both sides must be plain sums to become one fraction (got "${top.aggregation}" over "${bottom.aggregation}")`,
    };
  }
  if (!top.columnKey || !bottom.columnKey) {
    return { error: "both sides must total a column" };
  }
  if (!sameFilters(top.filters, bottom.filters)) {
    return { error: "the two sides filter different rows, so they are not one population" };
  }

  return {
    mapping: {
      slot: "value",
      aggregation: u === "percent" ? "percent_of" : "ratio_of",
      // The denominator is the mapping's own column; the numerator totals a
      // different column over the same rows — aggregateParts' two-column mode.
      columnKey: bottom.columnKey,
      filters: top.filters ?? [],
      numeratorFilters: [],
      numeratorColumnKey: top.columnKey,
    },
  };
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
    const [rows] = await conn.query(
      `SELECT l.id, l.mappings, l.library_kpi_id AS kpiId, l.library_metric_id AS metricId,
              k.name AS kpiName, k.unit
         FROM data_source_link l
         LEFT JOIN library_kpi k ON k.id = l.library_kpi_id`,
    );

    const stale = rows
      .map((r) => ({ ...r, parsed: parse(r.mappings) }))
      .filter((r) => r.parsed.some((m) => slotOf(m) !== "value"));

    if (stale.length === 0) {
      console.log("Nothing to do — every link already feeds the single value slot.");
      return;
    }

    let converted = 0;
    const refused = [];
    for (const link of stale) {
      const label = `link ${link.id}${link.kpiName ? ` → ${link.kpiName}` : ""}`;
      // A metric never had variable definitions to map onto, so a variable slot
      // there was always dead weight rather than a fraction to rebuild.
      if (link.metricId != null) {
        refused.push(`${label}: targets a metric, which has no variables to collapse`);
        continue;
      }

      const { mapping, error } = collapse(link.parsed, link.unit);
      if (error) {
        refused.push(`${label}: ${error}`);
        continue;
      }

      console.log(`\n${label}`);
      console.log(`  before: ${JSON.stringify(link.parsed)}`);
      console.log(`  after:  ${JSON.stringify([mapping])}`);
      if (!DRY_RUN) {
        await conn.query("UPDATE data_source_link SET mappings = ? WHERE id = ?", [
          JSON.stringify([mapping]),
          link.id,
        ]);
      }
      converted += 1;
    }

    console.log(
      `\n${DRY_RUN ? "[dry run] would convert" : "Converted"} ${converted} of ${stale.length} link(s).`,
    );
    if (!DRY_RUN && converted > 0) {
      console.log(
        'Values are not recomputed here — use "recompute from sources" on each ' +
          "active performance record, or edit the link, to refill its quarters.",
      );
    }
    if (refused.length > 0) {
      console.error("\nLeft alone — these need a decision:");
      for (const r of refused) console.error(`  ${r}`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
