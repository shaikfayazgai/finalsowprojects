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
  // Dev fallback: SSO sign-ins that hit the MFA-pending bypass land here with
  // an empty Glimmora API token. Returning a placeholder lets contributor pages
  // proceed past their `if (!token) return;` guards so the mock layer
  // (NEXT_PUBLIC_USE_CONTRIBUTOR_MOCKS, on by default in dev) can respond.
  if (process.env.NODE_ENV !== "production") return "dev-contributor-placeholder";
  return null;
}
