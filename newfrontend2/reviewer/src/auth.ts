import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { cookies } from "next/headers";
import { authApi, isMfaPending } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { prisma } from "@/lib/db";
import { hashSessionToken, revokeSession } from "@/lib/session";
import crypto from "node:crypto";

/* ─────────────── Durable Session lifecycle helpers ─────────────── */
//
// Bridge between NextAuth's stateless JWT and the durable Session row in
// Postgres (M3 migration). On initial sign-in we upsert a local User row
// + create a Session row; on signOut we revoke it. The Session row is
// what middleware + route handlers consult to enforce revocation,
// expiry, and bulk-revocation flows (password change, tenant pause,
// user suspension). The JWT alone can't be invalidated; the Session row
// can.

/**
 * Split a "Firstname Lastname" string into the User model's two columns.
 * Single-token names go to firstName + empty lastName.
 */
function splitDisplayName(name: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  if (!name) return { firstName: "", lastName: "" };
  const trimmed = name.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/**
 * Upsert the local User row from auth claims and return its primary
 * key + tenantId. We use email as the upsert key — the Glimmora
 * backend's user id is stored as the User.id on first sight, so it's
 * stable for subsequent logins.
 *
 * Returns null when there's no email to key off — caller should skip
 * Session creation in that case.
 */
async function upsertLocalUserForSession(input: {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  provider?: string | null;
}): Promise<{ id: string; tenantId: string | null } | null> {
  if (!input.email) return null;
  const email = input.email.toLowerCase();
  const { firstName, lastName } = splitDisplayName(input.name);
  const upserted = await prisma.user.upsert({
    where: { email },
    update: {
      // Refresh display fields + role/provider; never overwrite tenantId
      // (that's owned by enterprise admin invite + HRIS sync, not auth).
      ...(firstName ? { firstName } : {}),
      lastName,
      ...(input.role ? { role: input.role } : {}),
      ...(input.provider ? { provider: input.provider } : {}),
    },
    create: {
      ...(input.id ? { id: input.id } : {}),
      email,
      firstName: firstName || email.split("@")[0],
      lastName,
      role: input.role ?? "contributor",
      provider: input.provider ?? null,
    },
    select: { id: true, tenantId: true },
  });
  return upserted;
}

/**
 * Create a durable Session row + return its id. The id is what we
 * stash in the JWT so route handlers can call `validateSession(id)`
 * later.
 *
 * Lifetime: 30 days (matches session.maxAge below). Tenants with stricter
 * idle-timeout policies enforce that in middleware via Session.lastActiveAt
 * once that column lands.
 *
 * tokenHash: derived from the session id. The schema's unique constraint
 * is satisfied; serves as a future hook for raw-token validation when
 * we wire that path.
 */
async function createDurableSession(input: {
  userId: string;
  tenantId: string | null;
  expiresInSeconds: number;
}): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: input.userId,
      tenantId: input.tenantId,
      tokenHash: hashSessionToken(sessionId),
      expiresAt,
    },
  });
  return sessionId;
}

export type UserRole = "contributor" | "enterprise" | "admin" | "super_admin" | "reviewer" | "mentor";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ??
  process.env.AUTH_GOOGLE_ID ??
  "";
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ??
  process.env.AUTH_GOOGLE_SECRET ??
  "";
const microsoftClientId =
  process.env.MICROSOFT_CLIENT_ID ??
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID ??
  "";
const microsoftClientSecret =
  process.env.MICROSOFT_CLIENT_SECRET ??
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ??
  "";
const microsoftTenantId =
  process.env.MICROSOFT_TENANT_ID ??
  process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID ??
  "common";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Make the secret explicit to avoid env-resolution issues across runtimes/bundlers.
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    /**
     * "glimmora-oauth" — receives pre-validated tokens from the Glimmora OAuth
     * callback page (/auth/oauth/callback) and creates a NextAuth session.
     * The Glimmora API handles the full Google/Microsoft OAuth dance; this
     * provider only wraps the resulting tokens into a NextAuth JWT.
     */
    Credentials({
      id: "glimmora-oauth",
      name: "Glimmora OAuth",
      credentials: {
        accessToken:  {},
        refreshToken: {},
        expiresIn:    {},
        userId:       {},
        email:        {},
        firstName:    {},
        lastName:     {},
        role:         {},
        provider:     {},
      },
      async authorize(credentials) {
        const role = ((credentials.role as string) || "contributor") as UserRole;
        const userId = (credentials.userId as string) || "";
        const email = (credentials.email as string) || "";
        if (!userId || !email) return null;
        return {
          id:           userId,
          name:         `${credentials.firstName} ${credentials.lastName}`,
          email,
          role,
          ...(credentials.accessToken ? { accessToken: credentials.accessToken as string } : {}),
          ...(credentials.refreshToken ? { refreshToken: credentials.refreshToken as string } : {}),
          expiresIn:    Number(credentials.expiresIn) || 3600,
          provider:     (credentials.provider as string) || "google",
        };
      },
    }),
    /**
     * NextAuth-managed Google OAuth — uses our own Google Cloud credentials
     * (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) which are registered with our
     * app's redirect URI, not Glimmora's. This correctly redirects back to our
     * app after OAuth. Glimmora's own OAuth endpoints can't do this (their
     * callback is locked to glimmora-api.onrender.com).
     */
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: { prompt: "consent", access_type: "offline", response_type: "code" },
      },
    }),
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID ?? "common"}/v2.0`,
      authorization: {
        // response_mode=query makes the IdP redirect back via a top-level GET
        // instead of a cross-site POST. SameSite=Lax cookies (PKCE/state/nonce)
        // survive top-level GETs in all browsers; cross-site POSTs drop them in
        // Safari and Firefox, which is why SSO worked only in Chrome.
        params: { prompt: "select_account", response_mode: "query" },
      },
    }),
    /**
     * "local-credentials" — Prisma-backed email/password provider for local dev
     * and for accounts whose passwordHash lives in our own DB. Bypasses the
     * upstream Glimmora API. Used by /auth/login when GLIMMORA_API_BASE_URL is
     * not configured or returns errors.
     */
    Credentials({
      id: "local-credentials",
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        try {
          const { PrismaClient } = await import("@/generated/prisma/client");
          const { PrismaPg } = await import("@prisma/adapter-pg");
          const bcrypt = (await import("bcryptjs")).default;
          const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
          const prisma = new PrismaClient({ adapter });
          const user = await prisma.user.findUnique({ where: { email } });
          await prisma.$disconnect();
          if (!user || !user.passwordHash) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;
          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            email: user.email,
            role: (user.role ?? "contributor") as UserRole,
            provider: "local-credentials",
            isNewSsoUser: false,
          };
        } catch (err) {
          console.error("[auth.local-credentials] Prisma signin failed", err);
          return null;
        }
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Returning null (not throwing) makes Auth.js surface a generic credentials
        // error to the client without leaking backend specifics.
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        try {
          const response = await authApi.login(email, password);
          const r = response as unknown as Record<string, unknown>;
          const status = typeof r.status === "string" ? r.status : undefined;

          // Any pending state (totp / sms otp / setup) means we don't mint a session
          // here — the login page detects these via /api/auth/validate and routes the
          // user through the appropriate confirmation UI.
          if (
            status === "mfa_required" ||
            status === "mfa_setup_required" ||
            status === "mfa_pending" ||
            status === "otp_required"
          ) {
            return null;
          }

          // Success shape — must have an access_token + user.
          const accessToken = typeof r.access_token === "string" ? r.access_token : undefined;
          const refreshToken = typeof r.refresh_token === "string" ? r.refresh_token : undefined;
          const expiresIn = typeof r.expires_in === "number" ? r.expires_in : 3600;
          const user = (r.user ?? {}) as {
            id?: string;
            email?: string;
            firstName?: string;
            lastName?: string;
            role?: string;
            requiresPasswordChange?: boolean;
            isFirstLogin?: boolean;
          };
          if (!accessToken || !user.id) return null;

          return {
            id: user.id,
            name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
            email: user.email ?? email,
            role: (user.role ?? "contributor") as UserRole,
            provider: "credentials",
            isNewSsoUser: false,
            // Surface tokens for the JWT callback. Both naming conventions are
            // included so the existing JWT handler (which reads accessToken /
            // refreshToken / expiresIn for the glimmora-oauth provider) and the
            // glimmora-prefixed names from this provider both work.
            accessToken,
            refreshToken,
            expiresIn,
            glimmoraAccessToken: accessToken,
            glimmoraRefreshToken: refreshToken,
            glimmoraExpiresAt: Math.floor(Date.now() / 1000) + expiresIn,
            requiresPasswordChange: !!user.requiresPasswordChange,
            isFirstLogin: !!user.isFirstLogin,
          };
        } catch (err) {
          // ApiError covers 4xx from the backend (wrong creds, account disabled, etc.) —
          // those are expected, so don't spam logs. Anything else (network / 5xx) is worth
          // surfacing.
          if (!(err instanceof ApiError)) {
            console.error("[auth.credentials] backend login failed", err);
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Cross-browser OAuth cookie hardening.
  // In production (HTTPS), force SameSite=None on the short-lived OAuth cookies
  // so they're sent back when the IdP redirects (including cross-site POSTs).
  // Without this, Safari and Firefox drop these cookies and NextAuth rejects
  // the callback with "State cookie was missing" / "PKCE code_verifier missing".
  // Locally (http), we fall back to SameSite=Lax since Secure cookies require HTTPS.
  cookies: (() => {
    const isProd = process.env.NODE_ENV === "production";
    const crossSite = {
      httpOnly: true,
      sameSite: (isProd ? "none" : "lax") as "none" | "lax",
      secure: isProd,
      path: "/",
    };
    return {
      pkceCodeVerifier: { name: "next-auth.pkce.code_verifier", options: crossSite },
      state:            { name: "next-auth.state",              options: crossSite },
      nonce:            { name: "next-auth.nonce",              options: crossSite },
    };
  })(),
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign-in — user object only present on first call
      if (user) {
        const u = user as {
          id?: string;
          email?: string | null;
          name?: string | null;
          role?: string;
          accessToken?: string;
          refreshToken?: string;
          expiresIn?: number;
          glimmoraAccessToken?: string;
          glimmoraRefreshToken?: string;
          glimmoraExpiresAt?: number;
          requiresPasswordChange?: boolean;
          isFirstLogin?: boolean;
          isNewSsoUser?: boolean;
          provider?: string;
        };
        token.id = u.id;
        // Ensure standard JWT `sub` so getToken / route guards recognize the session after partial sign-in (e.g. MFA setup).
        if (u.id) token.sub = u.id;
        token.role = ((u.role) || "contributor") as UserRole;
        // Tokens — prefer the glimmora-prefixed names from the credentials provider,
        // fall back to the unprefixed names used by the glimmora-oauth provider.
        token.glimmoraAccessToken = u.glimmoraAccessToken ?? u.accessToken;
        token.glimmoraRefreshToken = u.glimmoraRefreshToken ?? u.refreshToken;
        if (u.glimmoraExpiresAt) {
          token.glimmoraExpiresAt = u.glimmoraExpiresAt;
        } else if (u.expiresIn) {
          token.glimmoraExpiresAt = Math.floor(Date.now() / 1000) + u.expiresIn;
        }
        if (typeof u.requiresPasswordChange === "boolean") {
          (token as { requiresPasswordChange?: boolean }).requiresPasswordChange = u.requiresPasswordChange;
        }
        if (typeof u.isFirstLogin === "boolean") {
          (token as { isFirstLogin?: boolean }).isFirstLogin = u.isFirstLogin;
        }
        if (typeof u.isNewSsoUser === "boolean") token.isNewSsoUser = u.isNewSsoUser;
        if (u.provider) token.provider = u.provider;
        // Store email and name from OAuth provider
        if (u.email) token.email = u.email;
        if (u.name) token.name = u.name;

        // Bridge to the durable Session table. Graceful-degrade if DB
        // is unreachable — JWT alone still works for navigation; only
        // the validateSession() durable-state check is degraded.
        try {
          const localUser = await upsertLocalUserForSession({
            id: u.id,
            email: u.email ?? null,
            name: u.name ?? null,
            role: u.role,
            provider: u.provider ?? null,
          });
          if (localUser) {
            // Use the same expiry as the JWT's session.maxAge below.
            const sessionId = await createDurableSession({
              userId: localUser.id,
              tenantId: localUser.tenantId,
              expiresInSeconds: 30 * 24 * 60 * 60,
            });
            token.sessionId = sessionId;
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(
            "[auth.jwt] Durable Session creation failed (continuing with JWT-only)",
            err,
          );
        }
      }
      if (account) {
        token.provider = account.provider;

        /**
         * Notion-style SSO verification:
         * Exchange the provider id_token with the Glimmora backend.
         *
         *  ✅ User found in DB  → store real tokens + real role, isNewSsoUser = false
         *  🆕 User not in DB   → isNewSsoUser = true, role = "contributor" (default)
         *                         /auth/redirect will send them to onboarding
         */
        if (
          (account.provider === "google" || account.provider === "microsoft-entra-id") &&
          account.id_token
        ) {
          const providerName = account.provider === "microsoft-entra-id" ? "microsoft" : "google";
          try {
            const response = await authApi.exchangeOAuthCode(providerName, account.id_token);
            if (!isMfaPending(response)) {
              token.role                 = (response.user.role ?? "contributor") as UserRole;
              token.glimmoraAccessToken  = response.access_token;
              token.glimmoraRefreshToken = response.refresh_token;
              token.glimmoraExpiresAt    = Math.floor(Date.now() / 1000) + response.expires_in;
              if (response.user.id) token.id = response.user.id;
              const fullName = `${response.user.firstName} ${response.user.lastName}`.trim();
              if (fullName) token.name = fullName;
              token.isNewSsoUser = false;
            }
          } catch {
            // User not found in Glimmora DB — treat as new user.
            // If this came from a registration page, use the intended role from the cookie.
            let registrationRole: UserRole = "contributor";
            try {
              const cookieStore = await cookies();
              const ssoRegisterRole = cookieStore.get("sso_register_role")?.value;
              if (ssoRegisterRole === "enterprise" || ssoRegisterRole === "contributor") {
                registrationRole = ssoRegisterRole;
              }
            } catch {
              // cookies() unavailable — default to contributor
            }
            token.isNewSsoUser = true;
            token.role = registrationRole;
          }
        }
      }

      // Proactive token refresh — refresh if within 60 seconds of expiry
      const shouldRefresh =
        token.glimmoraRefreshToken &&
        token.glimmoraExpiresAt &&
        Date.now() / 1000 > token.glimmoraExpiresAt - 60;

      if (shouldRefresh) {
        try {
          const refreshed = await authApi.refreshToken(token.glimmoraRefreshToken as string);
          token.glimmoraAccessToken = refreshed.access_token;
          token.glimmoraRefreshToken = refreshed.refresh_token;
          // Default to 1 hour if the refresh response has no expires_in
          token.glimmoraExpiresAt = Math.floor(Date.now() / 1000) + 3600;
        } catch {
          // Refresh failed — clear tokens so the user is prompted to re-login
          delete token.glimmoraAccessToken;
          delete token.glimmoraRefreshToken;
          delete token.glimmoraExpiresAt;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as typeof token & {
          requiresPasswordChange?: boolean;
          isFirstLogin?: boolean;
        };
        session.user.id           = token.id as string;
        session.user.role         = token.role as UserRole;
        session.user.provider     = token.provider;
        session.user.accessToken  = token.glimmoraAccessToken;
        session.user.isNewSsoUser = token.isNewSsoUser;
        session.user.sessionId    = token.sessionId;
        (session.user as { requiresPasswordChange?: boolean }).requiresPasswordChange =
          t.requiresPasswordChange;
        (session.user as { isFirstLogin?: boolean }).isFirstLogin = t.isFirstLogin;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For Google and Microsoft, verify the email exists in the Glimmora DB.
      // Probe with a dummy password — the backend response tells us whether the
      // account exists (401 "wrong password") or not (404 "not found").
      // FAIL-CLOSED: only allow on an explicit "wrong password" / 401 response.
      if (account?.provider === "google" || account?.provider === "microsoft-entra-id") {
        // Registration flow: if the sso_register_role cookie is set, the user
        // clicked "Continue with Microsoft/Google" on a *registration* page.
        // Allow new emails through — account creation happens after OAuth.
        try {
          const cookieStore = await cookies();
          const ssoRegisterRole = cookieStore.get("sso_register_role")?.value;
          if (ssoRegisterRole) {
            return true;
          }
        } catch {
          // cookies() unavailable — fall through to the normal login check
        }

        try {
          if (!user.email) return "/auth/login?error=SsoNotRegistered";

          const email = user.email.toLowerCase();
          await authApi.login(email, "__sso_registration_check__");
          // Unexpected success with dummy password — account exists, allow.
          return true;
        } catch (err) {
          if (err instanceof ApiError) {
            const msg = err.message.toLowerCase();

            // Explicitly "not found" → account does not exist → block
            const notFound =
              err.status === 404 ||
              msg.includes("not found") ||
              msg.includes("no account") ||
              msg.includes("no user") ||
              msg.includes("does not exist") ||
              msg.includes("not registered") ||
              msg.includes("user not exist");

            if (notFound) {
              const encodedEmail = encodeURIComponent((user.email ?? "").toLowerCase());
              return `/auth/login?error=SsoNotRegistered&email=${encodedEmail}`;
            }

            // Specifically "wrong password" → account EXISTS, just wrong dummy password → allow
            const wrongPassword =
              msg.includes("wrong password") ||
              msg.includes("incorrect password") ||
              msg.includes("password incorrect") ||
              msg.includes("password does not match") ||
              msg.includes("invalid password");

            if (wrongPassword) return true;

            // Everything else (including ambiguous 401) → block.
            // The Glimmora backend returns 401 for BOTH "wrong password" and "user not found"
            // so we cannot safely allow on 401 alone — fall through to block.
          }
          // Network error, unexpected response, or unrecognised error → block
          const encodedEmail = encodeURIComponent((user.email ?? "").toLowerCase());
          return `/auth/login?error=SsoNotRegistered&email=${encodedEmail}`;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If the url is relative, prefix with baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // If same origin, allow
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    /**
     * Revoke the durable Session row on logout. NextAuth handles cookie
     * clearing on its own; this records the revocation in Postgres so
     * any in-flight request still carrying the JWT will fail validation
     * on the next validateSession() call.
     *
     * For JWT strategy (our case), `token` is the JWT payload at signOut.
     * `session` is null for JWT strategy.
     */
    async signOut(message) {
      const token = (message as { token?: { sessionId?: string } | null })
        .token;
      const sessionId = token?.sessionId;
      if (!sessionId) return;
      try {
        await revokeSession(sessionId, "user_logout");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[auth.events.signOut] revokeSession failed", err);
      }
    },
  },
  trustHost: true,
});
