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
  useEffect,
  useState,
} from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Input } from "./Input";
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
  /**
   * Opt-in type-to-confirm. When set, the confirm button stays disabled until
   * this exact phrase is typed (trimmed, case-insensitive) — for deletes bad
   * enough that a reflex click on a familiar dialog is a real risk.
   *
   * Keep it short and ASCII. The obvious choice, "make them type the record's
   * name", does not survive contact with this data: most KPIs here are named in
   * Thai, so it would force an IME switch or a copy-paste, and a phrase people
   * paste guards nothing.
   */
  confirmPhrase?: string;
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
  const [typed, setTyped] = useState("");

  // The provider is mounted once for the whole app, so the input has to be
  // cleared per invocation — otherwise the second delete opens already unlocked
  // with the first one's text still in the box.
  useEffect(() => {
    if (active) setTyped("");
  }, [active]);

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
  const phrase = active?.confirmPhrase;
  const unlocked = !phrase || typed.trim().toLowerCase() === phrase.trim().toLowerCase();

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
                // With a phrase to type, focus belongs in the input, not here.
                autoFocus={!phrase}
                disabled={!unlocked}
                className={cn(!unlocked && "opacity-40")}
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
            <div className="flex min-w-0 flex-1 flex-col gap-md pt-tiny">
              <div className="text-body-sm text-on-surface">{active.message}</div>
              {phrase && (
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="confirm-phrase"
                    className="text-caption-sm text-mute"
                  >
                    Type <span className="font-mono text-on-surface">{phrase}</span> to
                    confirm
                  </label>
                  <Input
                    id="confirm-phrase"
                    autoFocus
                    autoComplete="off"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    // Enter is the natural way to finish typing; only honour it
                    // once the phrase matches, or it becomes the reflex click
                    // this guard exists to prevent.
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && unlocked) {
                        e.preventDefault();
                        close(true);
                      }
                    }}
                    placeholder={phrase}
                  />
                </div>
              )}
            </div>
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
