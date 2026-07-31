import { redirect } from "next/navigation";

/** Compatibility route for existing bookmarks. The canonical queue is /validation. */
export default function PerformanceApprovalsPage() {
  redirect("/validation");
}
