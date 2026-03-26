import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";

// ── Demo users (replace with DB lookup in production) ──
const DEMO_USERS = [
  {
    id: "1",
    name: "John Doe",
    email: "john@gmail.com",
    password: bcrypt.hashSync("Test@1234", 10),
    role: "enterprise" as const,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@outlook.com",
    password: bcrypt.hashSync("Test@1234", 10),
    role: "contributor" as const,
  },
  {
    id: "3",
    name: "Admin User",
    email: "admin@glimmora.com",
    password: bcrypt.hashSync("Admin@1234", 10),
    role: "admin" as const,
  },
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error("Please enter a valid email address");
        }

        // Password minimum check
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        // Find user (replace with DB query in production)
        const user = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (!user) {
          throw new Error("No account found with this email");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign in, persist user data in token
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "user";
      }
      // Store the provider used for sign in
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { provider?: string }).provider = token.provider as string;
      }
      return session;
    },
    async signIn({ account }) {
      // Allow all OAuth and credentials sign-ins
      if (account?.provider === "credentials") return true;
      if (account?.provider === "google") return true;
      if (account?.provider === "microsoft-entra-id") return true;
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
