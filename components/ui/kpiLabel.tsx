import { Fragment, type ReactNode } from "react";

/**
 * Renders a label so that "KPIs" keeps its lowercase plural "s" even inside an
 * `uppercase` label: CSS uppercasing would otherwise print "KPIS". The rest of
 * the text is left to the surrounding style.
 */
export function kpiLabel(text: string): ReactNode {
  const parts = text.split(/(KPIs)/);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part === "KPIs" ? (
      <Fragment key={i}>
        KPI<span className="normal-case">s</span>
      </Fragment>
    ) : (
      part
    ),
  );
}
