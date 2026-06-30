"use client";

import { useRef, useState } from "react";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToastProvider, useToast } from "@/components/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
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
          onError: (_err, _variables, _ctx, mutation) => {
            toastRef.current(
              mutation.meta?.errorToast ??
                "Something went wrong. Please try again.",
              "error",
            );
          },
        }),
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
