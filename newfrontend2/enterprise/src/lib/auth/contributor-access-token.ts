import type { Session } from "next-auth";

/**
 * Returns the Glimmora API access token attached to the contributor's
 * NextAuth session, or `null` when the session is loading/unauthenticated
 * or the token is missing.
 */
export function getContributorAccessToken(session: Session | null | undefined): string | null {
  if (!session?.user) return null;
  const token = session.user.accessToken;
  if (typeof token === "string" && token.length > 0) return token;
  // Return a placeholder when the mock layer is active so contributor pages
  // proceed past their `if (!token) return;` guards.
  const mocksEnabled =
    process.env.NEXT_PUBLIC_USE_CONTRIBUTOR_MOCKS === "true" ||
    (process.env.NEXT_PUBLIC_USE_CONTRIBUTOR_MOCKS !== "false" && process.env.NODE_ENV !== "production");
  if (mocksEnabled) return "dev-contributor-placeholder";
  return null;
}
