import { handlers } from "@/lib/auth/auth";
import { NextRequest } from "next/server";
import { BASE_PATH } from "@/lib/basePath";

// Explicit: the signIn and jwt callbacks query MySQL, so this cannot run on
// the edge runtime.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (BASE_PATH && !url.pathname.startsWith(BASE_PATH)) {
    url.pathname = `${BASE_PATH}${url.pathname}`;
    const newReq = new NextRequest(url.toString(), req);
    return handlers.GET(newReq);
  }
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  if (BASE_PATH && !url.pathname.startsWith(BASE_PATH)) {
    url.pathname = `${BASE_PATH}${url.pathname}`;
    const newReq = new NextRequest(url.toString(), req);
    return handlers.POST(newReq);
  }
  return handlers.POST(req);
}
