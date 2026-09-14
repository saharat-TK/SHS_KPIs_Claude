"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useT } from "@/lib/i18n/useT";
import { Dashboard } from "./_dashboard/Dashboard";

export default function DashboardPage() {
  const t = useT();
  return (
    <RequirePermission action="view_dashboards">
      {/* Dashboard holds its filters in the URL via useSearchParams, which opts
          this route out of static prerendering. Next 14 requires the bailout to
          sit behind a Suspense boundary or `next build` fails on this page. */}
      <Suspense fallback={<Spinner label={t("dashboard.loading")} />}>
        <Dashboard />
      </Suspense>
    </RequirePermission>
  );
}
