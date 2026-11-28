"use client";

import { useParams } from "next/navigation";
import { RequirePermission } from "@/components/shell/Guard";
import { KpiDetailBody } from "./KpiDetail";

// The set page opens KPIs in a drawer (KpiDetailDrawer); this route is the
// full-page editor for deep links and the drawer's "open full page" link.
export default function KpiDetailPage() {
  return (
    <RequirePermission action="configure_kpis">
      <KpiDetailRoute />
    </RequirePermission>
  );
}

function KpiDetailRoute() {
  const params = useParams<{ setId: string; kpiId: string }>();
  return (
    <KpiDetailBody
      setId={Number(params.setId)}
      kpiId={Number(params.kpiId)}
      variant="page"
    />
  );
}
