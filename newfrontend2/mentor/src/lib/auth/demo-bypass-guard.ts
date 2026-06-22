/**
 * Production-safety guard.
 *
 * The three NEXT_PUBLIC_*_DEMO env flags entirely bypass auth on
 * /contributor, /mentor, /enterprise (see src/proxy.ts and the layout
 * files). They exist to let stakeholders walk the V2 ecosystem without
 * a backend session.
 *
 * If any of them leaks to a production environment, the platform is
 * unauthenticated wholesale. This guard refuses to boot the server
 * when that combination is detected, converting a silent vulnerability
 * into a loud crash.
 *
 * Called once from src/instrumentation.ts on server startup.
 */

const DEMO_FLAGS = [
  "NEXT_PUBLIC_CONTRIBUTOR_DEMO",
  "NEXT_PUBLIC_MENTOR_DEMO",
  "NEXT_PUBLIC_ENTERPRISE_DEMO",
  "NEXT_PUBLIC_ADMIN_DEMO",
] as const;

/**
 * Returns the list of demo flags that are currently active.
 */
export function activeDemoBypassFlags(): string[] {
  return DEMO_FLAGS.filter((flag) => process.env[flag] === "1");
}

/**
 * Throws synchronously if any demo bypass flag is set while
 * NODE_ENV === "production". Safe to call multiple times.
 *
 * Override only via `ALLOW_DEMO_IN_PRODUCTION=1` — explicit opt-in for
 * the rare case where a sandboxed prod deploy needs the bypass (e.g.,
 * a sales demo environment). The variable name is intentionally loud.
 */
export function assertNoDemoBypassInProduction(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.ALLOW_DEMO_IN_PRODUCTION === "1") return;

  const active = activeDemoBypassFlags();
  if (active.length === 0) return;

  const message =
    `Refusing to start server: demo bypass flag(s) ${active.join(", ")} ` +
    `are set in production. These flags disable authentication on the ` +
    `corresponding portal route prefix. ` +
    `Unset them, or set ALLOW_DEMO_IN_PRODUCTION=1 to override explicitly.`;

  // Hard crash — make the failure unmissable.
  // eslint-disable-next-line no-console
  console.error(`\n[SECURITY] ${message}\n`);
  throw new Error(message);
}
