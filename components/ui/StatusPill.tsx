import { Badge } from "./Badge";
import type { ApprovalState, EntityStatus } from "@/lib/types";

const ENTITY: Record<EntityStatus, { tone: "success" | "neutral" | "warning"; label: string }> = {
  active: { tone: "success", label: "Active" },
  inactive: { tone: "neutral", label: "Inactive" },
  draft: { tone: "warning", label: "Draft" },
};

const APPROVAL: Record<
  ApprovalState,
  { tone: "neutral" | "warning" | "error" | "info" | "success"; label: string }
> = {
  draft: { tone: "neutral", label: "Draft" },
  submitted: { tone: "warning", label: "Submitted" },
  returned: { tone: "error", label: "Returned" },
  forwarded: { tone: "info", label: "Forwarded" },
  approved: { tone: "success", label: "Approved" },
};

export function StatusPill({
  status,
  kind = "entity",
}: {
  status: EntityStatus | ApprovalState;
  kind?: "entity" | "approval";
}) {
  const cfg =
    kind === "approval"
      ? APPROVAL[status as ApprovalState]
      : ENTITY[status as EntityStatus];
  if (!cfg) return <Badge>{status}</Badge>;
  return (
    <Badge tone={cfg.tone} uppercase>
      {cfg.label}
    </Badge>
  );
}
