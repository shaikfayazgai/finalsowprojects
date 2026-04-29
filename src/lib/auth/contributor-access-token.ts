import type { Session } from "next-auth";

/**
 * Returns the Glimmora API access token attached to the contributor's
 * NextAuth session, or `null` when the session is loading/unauthenticated
 * or the token is missing.
 */
export function getContributorAccessToken(session: Session | null | undefined): string | null {
  const token = session?.user?.accessToken;
  return typeof token === "string" && token.length > 0 ? token : null;
}
