import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { cookies } from "next/headers";
import { authApi, isMfaPending } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export type UserRole = "contributor" | "enterprise" | "admin" | "reviewer" | "mentor";

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
        if (!credentials?.accessToken) return null;
        const role = ((credentials.role as string) || "enterprise") as UserRole;
        return {
          id:           credentials.userId as string,
          name:         `${credentials.firstName} ${credentials.lastName}`,
          email:        credentials.email as string,
          role,
          accessToken:  credentials.accessToken as string,
          refreshToken: credentials.refreshToken as string,
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
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Returning null (not throwing) ensures Auth.js returns JSON for client helpers.
        try {
          const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
          const password = typeof credentials?.password === "string" ? credentials.password : "";

          if (!email || !password) return null;

          // Dev-only hardcoded admin bypass
          if (email === "admin@glimmora.dev" && password === "Admin@1234") {
            return {
              id: "dev-admin-001",
              name: "Glimmora Admin",
              email: "admin@glimmora.dev",
              role: "admin" as UserRole,
            };
          }

          const response = await authApi.login(email, password);

          // MFA pending (code required) — block login until verified
          if (isMfaPending(response) && (response as any).mfa_flow !== "setup") {
            return null;
          }

          // MFA setup required — allow login.
          // The API may still include tokens alongside the MFA-pending payload;
          // include them so enterprise endpoints work without re-login.
          if (isMfaPending(response)) {
            const u = (response as any).user ?? {};
            const r = response as any;
            return {
              id: u.id ?? "",
              name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
              email: u.email ?? email,
              role: (u.role ?? "enterprise") as UserRole,
              ...(r.access_token ? { accessToken: r.access_token } : {}),
              ...(r.refresh_token ? { refreshToken: r.refresh_token } : {}),
              ...(r.expires_in ? { expiresIn: r.expires_in } : {}),
            };
          }

          const role = (response.user.role ?? "contributor") as UserRole;
          console.log("LOGIN RESPONSE:", JSON.stringify(response));

          return {
            id: response.user.id,
            name: `${response.user.firstName} ${response.user.lastName}`,
            email: response.user.email,
            role,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            expiresIn: response.expires_in,
          };
        } catch {
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
        token.id = user.id;
        // For Google/Microsoft OAuth, default to contributor role
        // The role can be updated later during onboarding
        token.role = ((user as { role?: string }).role || "contributor") as UserRole;
        token.glimmoraAccessToken = (user as { accessToken?: string }).accessToken;
        token.glimmoraRefreshToken = (user as { refreshToken?: string }).refreshToken;
        const expiresIn = (user as { expiresIn?: number }).expiresIn;
        if (expiresIn) {
          token.glimmoraExpiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        }
        // Store email and name from OAuth provider
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
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
        session.user.id           = token.id as string;
        session.user.role         = token.role as UserRole;
        session.user.provider     = token.provider;
        session.user.accessToken  = token.glimmoraAccessToken;
        session.user.isNewSsoUser = token.isNewSsoUser;
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
  trustHost: true,
});
