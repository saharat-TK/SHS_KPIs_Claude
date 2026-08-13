import { redirect } from "next/navigation";
import { getSessionActor } from "@/lib/auth/session";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { AppShellClient } from "@/components/shell/AppShellClient";

// Reads cookies via the session, so it can never be statically rendered.
export const dynamic = "force-dynamic";

/**
 * The one place a session enters the client tree. Every page under (app) is a
 * client component and so cannot call auth() itself — they read the same
 * identity through useAuth(), fed by the AuthProvider below.
 *
 * The redirect here is not redundant with middleware: middleware only verifies
 * the token's signature, and cannot see that the signed-in person's faculty
 * row has since been deactivated or deleted. getSessionActor() can.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getSessionActor();
  if (!actor) redirect("/login");

  return (
    <AuthProvider
      initialUser={{
        id: actor.facultyId,
        facultyId: actor.facultyId,
        name: actor.name,
        email: actor.email,
        role: actor.role,
        committeeId: actor.committeeId ?? undefined,
      }}
      impersonating={actor.impersonating}
      realName={actor.realName}
      // The *real* role, not the effective one: while viewing as a viewer,
      // `role` is "viewer" and the user menu would otherwise lose the control
      // that stops the impersonation.
      isRealAdmin={actor.realRole === "admin"}
    >
      <AppShellClient>{children}</AppShellClient>
    </AuthProvider>
  );
}
