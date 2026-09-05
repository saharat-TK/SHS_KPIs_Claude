import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth/auth";
import { BASE_PATH } from "@/lib/basePath";
import styles from "./login.module.css";
import shsLogo from "@/public/shs-logo.png";

export const dynamic = "force-dynamic";

// Sits outside the (app) route group on purpose, so it inherits only fonts and
// the base providers — none of the Sidebar/Topbar chrome, which assumes a
// signed-in user.

const ERROR_COPY: Record<string, { title: string; message: string }> = {
  AccessDenied: {
    title: "That account isn’t on the faculty roster",
    message:
      "Sign-in is limited to active School of Health Science faculty. If you " +
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

function SignalField() {
  return (
    <svg
      aria-hidden="true"
      className={styles.signalField}
      viewBox="0 0 1000 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <path className={styles.signalPath} d="M-80 612 238 454 430 550 724 246 1080 118" />
      <path className={styles.signalPathMuted} d="M-72 228 230 356 452 202 696 360 1064 220" />
      <path className={styles.signalPathMuted} d="M118 842 326 634 554 704 808 488 1060 594" />
      <circle className={`${styles.signalNode} ${styles.signalNodeOne}`} cx="238" cy="454" r="7" />
      <circle className={`${styles.signalNode} ${styles.signalNodeTwo}`} cx="452" cy="202" r="5" />
      <circle className={`${styles.signalNode} ${styles.signalNodeThree}`} cx="808" cy="488" r="6" />
      <circle className={`${styles.signalPulse} ${styles.signalPulseOne}`} cx="430" cy="550" r="5" />
      <circle className={`${styles.signalPulse} ${styles.signalPulseTwo}`} cx="696" cy="360" r="5" />
    </svg>
  );
}

/**
 * Sanitizes the callback URL.
 * - Extracts pathname if an absolute URL is given.
 * - Strips any leading BASE_PATH (e.g. /SHSKPIs) because Next.js redirect()
 *   in the App Router automatically prepends basePath. Passing an already
 *   prefixed path results in duplicate /SHSKPIs/SHSKPIs/... 404s.
 * - Ensures authenticated users are never sent to /login or empty root.
 */
function getSafeRedirectTarget(raw?: string): string {
  if (!raw) return "/dashboard";
  let target = raw.trim();

  if (target.startsWith("http://") || target.startsWith("https://")) {
    try {
      const parsed = new URL(target);
      target = parsed.pathname + parsed.search;
    } catch {
      return "/dashboard";
    }
  }

  if (BASE_PATH) {
    while (target.startsWith(BASE_PATH)) {
      target = target.slice(BASE_PATH.length);
    }
  }

  if (!target || target === "/" || target.includes("/login")) {
    return "/dashboard";
  }

  return target.startsWith("/") ? target : `/${target}`;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) {
  const safeTarget = getSafeRedirectTarget(searchParams.callbackUrl);
  if (await auth()) redirect(safeTarget);

  const error = searchParams.error
    ? (ERROR_COPY[searchParams.error] ?? ERROR_COPY.default)
    : null;

  return (
    <main className={styles.page}>
      <SignalField />

      <div className={styles.layout}>
        <section className={styles.brandSection} aria-labelledby="login-title">
          <div className={styles.brandLockup}>
            <Image
              className={styles.logo}
              src={shsLogo}
              alt="School of Health Science"
              priority
            />
            <p className={styles.schoolName}>Mae Fah Luang University · School of Health Science</p>
          </div>

          <div className={styles.brandCopy}>
            <p className={styles.systemLabel}>Health Science Analytics</p>
            <h1 id="login-title" className={styles.title}>KPI System</h1>
            <p className={styles.description}>
              A focused workspace for KPI planning, performance, and reporting.
            </p>
          </div>

          <p className={styles.brandNote}>
            Faculty access is governed by the current SHS roster.
          </p>
        </section>

        <section className={styles.accessSection} aria-labelledby="access-title">
          <div className={styles.loginPanel}>
            <div className={styles.panelHeading}>
              <p className={styles.panelLabel}>Secure faculty access</p>
              <h2 id="access-title" className={styles.panelTitle}>Continue to your workspace</h2>
              <p className={styles.panelDescription}>
                Sign in with your university Google account to continue.
              </p>
            </div>

            {error && (
              <div id="sign-in-error" role="alert" className={styles.errorAlert}>
                <span aria-hidden="true" className={styles.errorMarker}>!</span>
                <div>
                  <p className={styles.errorTitle}>{error.title}</p>
                  <p className={styles.errorMessage}>{error.message}</p>
                </div>
              </div>
            )}

            <form
              className={styles.signInForm}
              action={async () => {
                "use server";
                // signIn throws NEXT_REDIRECT to navigate — never wrap this in
                // a try/catch that swallows it.
                await signIn("google", { redirectTo: safeTarget });
              }}
            >
              <button
                type="submit"
                className={styles.googleButton}
                aria-describedby={error ? "sign-in-error" : undefined}
              >
                <span aria-hidden="true" className={styles.googleGlyph}>G</span>
                Continue with Google
              </button>
            </form>

            <p className={styles.accessNote}>
              Use your @mfu.ac.th account. Your role and committee positions follow the faculty roster.
            </p>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <p>© 2026 School of Health Science, Mae Fah Luang University</p>
        <p>Designed by Saharat Arreeras</p>
      </footer>
    </main>
  );
}
