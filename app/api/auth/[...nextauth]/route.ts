import { handlers } from "@/lib/auth/auth";
import { NextRequest } from "next/server";

// Explicit: the signIn and jwt callbacks query MySQL, so this cannot run on
// the edge runtime.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith("/SHSKPIs")) {
    url.pathname = `/SHSKPIs${url.pathname}`;
    const newReq = new NextRequest(url.toString(), req);
    return handlers.GET(newReq);
  }
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith("/SHSKPIs")) {
    url.pathname = `/SHSKPIs${url.pathname}`;
    const newReq = new NextRequest(url.toString(), req);
    return handlers.POST(newReq);
  }
  return handlers.POST(req);
}
