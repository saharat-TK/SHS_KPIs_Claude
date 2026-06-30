"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import type { Action } from "@/lib/auth/can";
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
        message={`Your current role (${role}) does not have permission to view this page. Switch to an authorized role from the top-right menu.`}
      />
    );
  }
  return <>{children}</>;
}
