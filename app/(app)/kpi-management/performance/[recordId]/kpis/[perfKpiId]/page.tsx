"use client";

import { useParams } from "next/navigation";
import { RequirePermission } from "@/components/shell/Guard";
import { PerfKpiDetailBody } from "./PerfKpiDetail";

export default function PerfKpiProgressPage() {
  return (
    <RequirePermission action="submit_metrics">
      <PerfKpiProgress />
    </RequirePermission>
  );
}

function PerfKpiProgress() {
  const params = useParams<{ recordId: string; perfKpiId: string }>();
  const recordId = Number(params.recordId);
  const perfKpiId = Number(params.perfKpiId);

  return <PerfKpiDetailBody recordId={recordId} perfKpiId={perfKpiId} variant="page" />;
}
