/**
 * Next.js instrumentation hook — runs once on server startup (both
 * dev and prod). Use for boot-time safety assertions.
 *
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register(): Promise<void> {
  // Only run on the Node.js server runtime, not edge.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Production-safety: refuse to boot if the demo bypass flags would
  // disable authentication on a production deployment.
  const { assertNoDemoBypassInProduction } = await import(
    "@/lib/auth/demo-bypass-guard"
  );
  assertNoDemoBypassInProduction();
}
