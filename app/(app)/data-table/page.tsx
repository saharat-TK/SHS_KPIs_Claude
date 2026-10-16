"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useT } from "@/lib/i18n/useT";
import { DataTable } from "./_table/DataTable";

export default function DataTablePage() {
  const t = useT();
  return (
    <RequirePermission action="view_dashboards">
      {/* Filters live in the URL (useSearchParams, shared with the dashboard),
          which needs a Suspense boundary for `next build` — see dashboard/page. */}
      <Suspense fallback={<Spinner label={t("dataTable.loading")} />}>
        <DataTable />
      </Suspense>
    </RequirePermission>
  );
}
