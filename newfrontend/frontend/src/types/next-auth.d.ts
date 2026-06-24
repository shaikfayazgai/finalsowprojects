import type { UserRole } from "@/auth";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    initials?: string;
    // Glimmora API tokens — passed from authorize → jwt callback via the user object
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      initials: string;
      image?: string | null;
      provider?: string;
      /** Glimmora API access token — attach as Bearer for authenticated API calls */
      accessToken?: string;
      /** True when the SSO user has no Glimmora account yet — send to onboarding */
      isNewSsoUser?: boolean;
      /**
       * Durable Session row id (from Postgres). Route handlers pass this
       * to `validateSession()` from `@/lib/session` to enforce revocation
       * + expiry beyond what the JWT alone provides. Absent when Session
       * row creation failed at sign-in (graceful degrade — see auth.ts).
       */
      sessionId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    initials?: string;
    provider?: string;
    // Glimmora tokens stored in the JWT
    glimmoraAccessToken?: string;
    glimmoraRefreshToken?: string;
    /** Unix timestamp (seconds) when the access token expires */
    glimmoraExpiresAt?: number;
    /** True when the SSO user authenticated but has no Glimmora account yet */
    isNewSsoUser?: boolean;
    /** Durable Session row id — see Session interface above. */
    sessionId?: string;
    /**
     * Set by the jwt callback when the backend access token has genuinely
     * expired and could not be refreshed. The session callback then yields an
     * unauthenticated session so proxy.ts redirects to the portal login.
     */
    invalidToken?: boolean;
  }
}
