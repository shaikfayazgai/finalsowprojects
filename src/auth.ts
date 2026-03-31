import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export type UserRole = "contributor" | "enterprise" | "admin" | "reviewer";

// Build OAuth providers only when credentials are configured
const oauthProviders = [
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      })]
    : []),
  ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
    ? [MicrosoftEntraID({
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID ?? "common"}/v2.0`,
      })]
    : []),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Make the secret explicit to avoid env-resolution issues across runtimes/bundlers.
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    ...oauthProviders,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // IMPORTANT:
        // Returning `null` (instead of throwing) helps ensure Auth.js returns JSON for the
        // client helper methods (signIn/signOut/getSession/getProviders). Throwing can lead
        // to redirects/HTML responses which then fail JSON parsing on the client.
        try {
          const email = typeof credentials?.email === "string" ? credentials.email : "";
          const password = typeof credentials?.password === "string" ? credentials.password : "";

          if (!email || !password) return null;

          // Basic format validation (avoid DB work for obviously invalid input).
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) return null;
          if (password.length < 6) return null;

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user?.passwordHash) return null;

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
          if (!isPasswordValid) return null;

          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
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
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role || "user";
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id       = token.id as string;
        session.user.role     = token.role as UserRole;
        session.user.provider = token.provider;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      try {
        // Check if this SSO user already has a contributor profile
        const existing = user.email
          ? await prisma.user.findUnique({
              where: { email: user.email.toLowerCase() },
              select: { contributorProfile: { select: { id: true } } },
            })
          : null;

        // Returning users go to dashboard via the default callbackUrl
        if (existing?.contributorProfile) return true;
      } catch {
        // DB unreachable — allow sign-in to proceed, onboarding will re-check
        return true;
      }

      // First-time SSO user — redirect to onboarding with data pre-filled in URL
      const [firstName = "", ...rest] = (user.name ?? "").split(" ");
      const lastName = rest.join(" ");
      const params = new URLSearchParams({
        firstName,
        lastName,
        email:    user.email ?? "",
        provider: account?.provider ?? "",
      });
      if (user.image) params.set("image", user.image);
      return `/contributor/onboarding?${params.toString()}`;
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
