import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  PORTALS,
  portalsForRoles,
  type PortalKey,
} from "@/lib/auth/portal-access";

/**
 * Multi-portal selector (plans/02 §5.A.1 spirit, generalized to portals).
 *
 * Shown when a user belongs to more than one portal. The session currently
 * carries a single `role`; once auth.ts emits `roles[]`, this page reads them
 * directly. For now it resolves the available portals from whatever role(s) are
 * present and auto-skips when there's only one.
 */
export default async function SelectPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const u = session.user as { role?: string; roles?: string[] };
  const roles = u.roles?.length ? u.roles : u.role ? [u.role] : [];
  const portals = portalsForRoles(roles);

  if (portals.length === 0) redirect("/auth/login?error=UnknownRole");
  if (portals.length === 1) redirect(PORTALS[portals[0]].dashboardPath);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-center">
        Choose where to continue
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Your account has access to more than one workspace.
      </p>

      <div className="mt-8 space-y-3">
        {portals.map((key: PortalKey) => {
          const p = PORTALS[key];
          return (
            <Link
              key={key}
              href={p.dashboardPath}
              className="flex items-center justify-between rounded-xl border border-stroke-subtle bg-surface px-5 py-4 shadow-xs ring-1 ring-stroke-subtle/50 transition hover:shadow-sm hover:ring-stroke-subtle"
            >
              <span className="font-medium">{p.name}</span>
              <span aria-hidden className="text-muted-foreground">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
