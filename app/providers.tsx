"use client";

import { useRef, useState } from "react";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ToastProvider, ConfirmProvider, useToast } from "@/components/ui";

// AuthProvider is deliberately *not* here: it needs a signed-in user, and this
// wraps /login too. It lives in app/(app)/layout.tsx, which resolves the
// session server-side before rendering anything that needs it.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <QueryProvider>{children}</QueryProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

// Builds the QueryClient with a global MutationCache that turns every
// mutation's `meta.toast` into a success toast, and any failure into an error
// toast. This is the single wiring point for the toast design-system standard —
// see lib/data/hooks.ts (meta declarations) and components/ui/Toast.tsx.
function QueryProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
        mutationCache: new MutationCache({
          onSuccess: (data, variables, _ctx, mutation) => {
            const t = mutation.meta?.toast;
            const msg = typeof t === "function" ? t(data, variables) : t;
            if (msg) toastRef.current(msg, "success");
          },
          onError: (err, _variables, _ctx, mutation) => {
            // Prefer an explicit meta.errorToast, else the API's thrown message
            // (repos throw Error(body.error)) so reasons like a blocked delete
            // surface to the user; fall back to a generic message.
            toastRef.current(
              mutation.meta?.errorToast ??
                (err instanceof Error && err.message
                  ? err.message
                  : "Something went wrong. Please try again."),
              "error",
            );
          },
        }),
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
