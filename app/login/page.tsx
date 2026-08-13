import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth/auth";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

// Sits outside the (app) route group on purpose, so it inherits only fonts and
// the base providers — none of the Sidebar/Topbar chrome, which assumes a
// signed-in user.

const ERROR_COPY: Record<string, { title: string; message: string }> = {
  AccessDenied: {
    title: "That account isn’t on the faculty roster",
    message:
      "Sign-in is limited to active School of Health Sciences faculty. If you " +
      "should have access, ask the SHS Office to add your mfu.ac.th address to " +
      "the faculty roster.",
  },
  Configuration: {
    title: "Sign-in isn’t configured",
    message:
      "The server is missing its Google OAuth settings. Check AUTH_SECRET, " +
      "AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env.local.",
  },
  Verification: {
    title: "Your Google email isn’t verified",
    message: "Verify your address with Google, then try again.",
  },
  default: {
    title: "Sign-in failed",
    message: "Something went wrong on the way back from Google. Please try again.",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) {
  const callbackUrl = searchParams.callbackUrl ?? "/";
  if (await auth()) redirect(callbackUrl);

  const error = searchParams.error
    ? (ERROR_COPY[searchParams.error] ?? ERROR_COPY.default)
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-lg">
      <div className="w-full max-w-[420px] flex flex-col gap-lg">
        <div className="flex flex-col gap-xs">
          <p className="text-utility-xs uppercase tracking-wider text-[#8a8a8a]">
            MFU · School of Health Sciences
          </p>
          <h1 className="text-title-lg text-white">KPI System</h1>
          <p className="text-body-sm text-[#8a8a8a]">
            Sign in with your university account to continue.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex gap-sm rounded-DEFAULT border border-error/40 bg-error/10 p-md"
          >
            <Icon name="error" size={20} className="mt-tiny shrink-0 text-error" />
            <div className="flex flex-col gap-tiny">
              <p className="text-label-md text-white">{error.title}</p>
              <p className="text-caption-sm text-[#b0b0b0]">{error.message}</p>
            </div>
          </div>
        )}

        <form
          action={async () => {
            "use server";
            // signIn throws NEXT_REDIRECT to navigate — never wrap this in a
            // try/catch that swallows it.
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="flex h-[44px] w-full items-center justify-center gap-sm rounded-DEFAULT border border-[#272727] bg-[#111] px-md text-label-md text-white transition-colors hover:border-[#3a3a3a] hover:bg-[#161616]"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-caption-sm text-[#6a6a6a]">
          Use your @mfu.ac.th account. Access follows the faculty roster — your
          role and committee positions come from it.
        </p>
      </div>
    </main>
  );
}
