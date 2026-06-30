"use client";

// ── Toast — design-system notification primitive ────────────────────────────
// Two supported usages:
//   1. Declarative (preferred for add/edit/delete): add `meta: { toast: "…" }`
//      to a useMutation in lib/data/hooks.ts. The global MutationCache handler
//      in app/providers.tsx fires a success toast automatically; failures fire
//      a default error toast (override with `meta.errorToast`). `toast` may be a
//      string or `(data, variables) => string` for dynamic text.
//   2. Imperative (ad-hoc, non-mutation events):
//        const { toast } = useToast();
//        toast("Saved", "success");   // tone: "success" | "error"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export type ToastTone = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastCtx = createContext<ToastValue | null>(null);

const TONE: Record<ToastTone, { icon: string; color: string }> = {
  success: { icon: "check_circle", color: "text-primary" },
  error: { icon: "error", color: "text-error" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setItems((list) => [...list, { id, message, tone }]);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-lg right-lg z-[200] flex flex-col gap-sm"
        role="region"
        aria-label="Toast notifications"
      >
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const { icon, color } = TONE[item.tone];

  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-sm rounded-lg border border-hairline bg-surface-lowest shadow-chrome",
        "px-lg py-md min-w-[280px] max-w-[380px]",
      )}
    >
      <Icon name={icon} size={20} className={color} />
      <p className="flex-1 text-body-sm text-on-surface">{item.message}</p>
      <button
        aria-label="Dismiss"
        onClick={onDismiss}
        className="text-mute hover:text-on-surface rounded p-xs hover:bg-surface-soft transition-colors"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
