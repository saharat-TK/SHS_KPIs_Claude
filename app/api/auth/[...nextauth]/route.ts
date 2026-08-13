import { handlers } from "@/lib/auth/auth";

// Explicit: the signIn and jwt callbacks query MySQL, so this cannot run on
// the edge runtime.
export const runtime = "nodejs";

export const { GET, POST } = handlers;
