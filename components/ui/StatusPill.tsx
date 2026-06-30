import { Badge } from "./Badge";
import type { EntityStatus, ValidationStatus } from "@/lib/types";

const ENTITY: Record<EntityStatus, { tone: "success" | "neutral" | "warning"; label: string }> = {
  active: { tone: "success", label: "Active" },
  inactive: { tone: "neutral", label: "Inactive" },
  draft: { tone: "warning", label: "Draft" },
};

const VALIDATION: Record<
  ValidationStatus,
  { tone: "success" | "warning" | "error" | "info"; label: string }
> = {
  pending: { tone: "warning", label: "Pending" },
  approved: { tone: "success", label: "Approved" },
  rejected: { tone: "error", label: "Rejected" },
  clarification: { tone: "info", label: "Clarification" },
};

export function StatusPill({
  status,
  kind = "entity",
}: {
  status: EntityStatus | ValidationStatus;
  kind?: "entity" | "validation";
}) {
  const cfg =
    kind === "validation"
      ? VALIDATION[status as ValidationStatus]
      : ENTITY[status as EntityStatus];
  if (!cfg) return <Badge>{status}</Badge>;
  return (
    <Badge tone={cfg.tone} uppercase>
      {cfg.label}
    </Badge>
  );
}
