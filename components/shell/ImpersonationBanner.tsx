"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Icon } from "@/components/ui/Icon";
import { BASE_PATH } from "@/lib/basePath";

/** Deliberately not dismissible: while this is showing, every write is
 *  attributed to someone else, so it must stay visible the whole time. */
export function ImpersonationBanner() {
  const { impersonating, user, realName } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!impersonating) return null;

  async function stop() {
    setBusy(true);
    try {
      await fetch(`${BASE_PATH}/api/auth/impersonate`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-md border-b border-warning/40 bg-warning/15 px-lg lg:px-xl py-sm"
    >
      <p className="flex items-center gap-sm text-caption-sm text-on-surface">
        <Icon name="visibility" size={18} className="text-warning" />
        <span>
          Viewing as <strong className="font-medium">{user.name}</strong> — you
          are signed in as {realName}.
        </span>
      </p>
      <button
        onClick={stop}
        disabled={busy}
        className="shrink-0 rounded-DEFAULT border border-hairline px-sm py-tiny text-caption-sm text-on-surface hover:bg-surface-soft transition-colors disabled:opacity-50"
      >
        {busy ? "Stopping…" : "Stop"}
      </button>
    </div>
  );
}
