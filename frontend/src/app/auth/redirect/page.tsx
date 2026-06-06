import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homePathForRole } from "@/lib/auth/portal-access";

/**
 * Post-login landing. Resolves the session's role to its portal dashboard via
 * the single source of truth (lib/auth/portal-access). New SSO users who have
 * not onboarded are sent to the right onboarding wizard first.
 */
export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user as {
    role?: string;
    isNewSsoUser?: boolean;
    provider?: string;
    requiresPasswordChange?: boolean;
  };

  // Provisioned accounts (temp password) MUST set a new password before they
  // can reach any dashboard. Gate here, before role routing/onboarding.
  if (user.requiresPasswordChange) {
    redirect("/auth/change-password?forced=1");
  }

  // New SSO user (registered via SSO, not yet onboarded) → role's onboarding.
  if (user.isNewSsoUser) {
    if (user.role === "enterprise" || user.role?.startsWith("ent")) {
      redirect("/enterprise/onboarding");
    }
    redirect("/contributor/onboarding");
  }

  // Existing user → their portal dashboard (or selector if multi-portal).
  redirect(homePathForRole(user.role));
}
