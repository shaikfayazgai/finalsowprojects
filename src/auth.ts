import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { authApi, isMfaPending } from "@/lib/api/auth";

export type UserRole = "contributor" | "enterprise" | "admin" | "reviewer";

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

          const response = await authApi.login(email, password);

          // MFA pending (code required) — block login until verified
          if (isMfaPending(response) && (response as any).mfa_flow !== "setup") {
            return null;
          }

          // MFA setup required or fully authenticated — allow login
          // If MFA setup is required, tokens may not be present yet but user can still access the app
          if (isMfaPending(response)) {
            const u = (response as any).user ?? {};
            return {
              id: u.id ?? "",
              name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
              email: u.email ?? email,
              role: (u.role ?? "enterprise") as UserRole,
            };
          }

          const role = (response.user.role ?? "contributor") as UserRole;

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
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.provider = token.provider;
        session.user.accessToken = token.glimmoraAccessToken;
      }
      return session;
    },
    async signIn({ account }) {
      // Allow all authentication methods - session creation is handled by jwt callback
      // For Google/Microsoft OAuth, NextAuth will use the callbackUrl from signIn()
      if (account?.provider === "google" || account?.provider === "microsoft-entra-id") {
        return true;
      }
      // Credentials (email/password) and Glimmora OAuth callback
      if (account?.provider === "credentials" || account?.provider === "glimmora-oauth") {
        return true;
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
