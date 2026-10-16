import { UTF8_BOM, downloadCsv } from "@/lib/csv";
import {
  buildEntryTemplateCsv,
  type ColumnSpec,
  type TemplateChoice,
} from "@/lib/kpi/dataSources";
import type { DataSourcePeriodGrain } from "@/lib/types";

/** Download a source's CSV entry template. Shared by the data source page and
 *  the KPI page's Linked Data Sources, so both hand out the same file. */
export function downloadEntryTemplate({
  sourceName,
  grain,
  columns,
  choices,
}: {
  sourceName: string;
  grain: DataSourcePeriodGrain;
  columns: ColumnSpec[];
  /** Allowed values for derived-option columns, printed as the file's legend. */
  choices: Record<string, TemplateChoice[]>;
}) {
  const slug = sourceName.replace(/\s+/g, "-").toLowerCase() || "data-source";
  // The BOM is what makes Excel read the Thai labels in the legend as UTF-8.
  const csv = buildEntryTemplateCsv({ sourceName, grain, columns, choices });
  downloadCsv(`${slug}-template.csv`, `${UTF8_BOM}${csv}`);
}
