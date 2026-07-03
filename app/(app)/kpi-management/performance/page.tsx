"use client";

import { PageHeader, Card, EmptyState } from "@/components/ui";

export default function PerformancePage() {
  return (
    <>
      <PageHeader
        title="Performance Records"
        description="Activated snapshots of a strategic set, used for quarterly progress tracking."
      />
      <Card>
        <EmptyState
          icon="assessment"
          title="Performance records are coming soon"
          message="Activate a strategic set from the KPIs Library to begin recording quarterly performance."
        />
      </Card>
    </>
  );
}
