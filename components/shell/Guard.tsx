"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_LABELS, type Action } from "@/lib/auth/can";
import { EmptyState } from "@/components/ui/EmptyState";

export function RequirePermission({
  action,
  children,
}: {
  action: Action;
  children: React.ReactNode;
}) {
  const { can, role } = useAuth();
  if (!can(action)) {
    return (
      <EmptyState
        icon="lock"
        title="Access restricted"
        message={`Your role (${ROLE_LABELS[role]}) does not have permission to view this page. If you need access, ask the SHS Office to update your system role on the faculty roster.`}
      />
    );
  }
  return <>{children}</>;
}
