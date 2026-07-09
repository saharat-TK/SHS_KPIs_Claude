"use client";

// ── ConfirmDialog — design-system confirmation primitive ────────────────────
// A nicer, promise-based replacement for the native window.confirm(). Mount the
// provider once (app/providers.tsx) and call the hook anywhere:
//
//   const confirm = useConfirm();
//   if (await confirm({ title: "Delete unit", message: `Delete "${name}"?`,
//                       confirmLabel: "Delete", tone: "danger" })) {
//     del.mutate(id);
//   }
//
// The returned promise resolves true on confirm, false on cancel / Escape /
// backdrop click. Defaults are tuned for delete actions (danger tone).

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export type ConfirmTone = "danger" | "default";

export interface ConfirmOptions {
  /** Heading. Defaults to "Are you sure?". */
  title?: string;
  /** Body text or nodes explaining what will happen. */
  message: React.ReactNode;
  /** Confirm button label. Defaults to "Delete" (danger) / "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Visual emphasis. "danger" (default) for destructive actions. */
  tone?: ConfirmTone;
}

interface ConfirmValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmCtx = createContext<ConfirmValue | null>(null);

interface ActiveConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveConfirm | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setActive({ ...options, resolve });
      }),
    [],
  );

  // Resolve the pending promise and dismiss. Guarded so a double-close (e.g.
  // Escape firing alongside a click) only resolves once.
  const close = useCallback((value: boolean) => {
    setActive((cur) => {
      cur?.resolve(value);
      return null;
    });
  }, []);

  const isDanger = (active?.tone ?? "danger") === "danger";

  return (
    <ConfirmCtx.Provider value={{ confirm }}>
      {children}
      {active && (
        <Modal
          open
          onClose={() => close(false)}
          title={active.title ?? "Are you sure?"}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => close(false)}>
                {active.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                variant={isDanger ? "danger" : "primary"}
                autoFocus
                onClick={() => close(true)}
              >
                {active.confirmLabel ?? (isDanger ? "Delete" : "Confirm")}
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-md">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                isDanger ? "bg-error/10 text-error" : "bg-primary/10 text-primary",
              )}
            >
              <Icon name={isDanger ? "warning" : "help"} size={22} />
            </div>
            <div className="pt-tiny text-body-sm text-on-surface">{active.message}</div>
          </div>
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx.confirm;
}
