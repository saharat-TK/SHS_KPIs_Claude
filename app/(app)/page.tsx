"use client";

import { RequirePermission } from "@/components/shell/Guard";
import { Dashboard } from "./_dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <RequirePermission action="view_dashboards">
      <Dashboard />
    </RequirePermission>
  );
}
