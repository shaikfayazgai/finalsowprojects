import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/* ══════════════════════════════════════════════════════════════
   Demo user accounts — replace with database lookup in production
   ══════════════════════════════════════════════════════════════ */

const demoUsers = [
  {
    id: "user-enterprise",
    email: "priya@enterprise.com",
    password: "password",
    name: "Priya Nair",
    role: "enterprise" as const,
    initials: "PN",
    image: null,
  },
  {
    id: "user-contributor",
    email: "arjun@contributor.com",
    password: "password",
    name: "Arjun Mehta",
    role: "contributor" as const,
    initials: "AM",
    image: null,
  },
  {
    id: "user-mentor",
    email: "mentor@glimmora.com",
    password: "password",
    name: "Review Lead",
    role: "mentor" as const,
    initials: "RL",
    image: null,
  },
  {
    id: "user-analytics",
    email: "analyst@glimmora.com",
    password: "password",
    name: "Analytics Admin",
    role: "analytics" as const,
    initials: "AA",
    image: null,
  },
];

export type UserRole = "enterprise" | "contributor" | "mentor" | "analytics";

export { roleDashboard } from "@/lib/config/auth";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        isRegister: { label: "Register", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const name = credentials?.name as string;
        const isRegister = credentials?.isRegister as string;

        if (!email || !password) return null;

        // Registration flow — accept any email/password, create contributor session
        if (isRegister === "true") {
          if (!name) return null;
          return {
            id: `user-${Date.now()}`,
            email,
            name,
            role: "contributor" as const,
            initials: getInitials(name),
            image: null,
          };
        }

        // Login flow — check against demo accounts
        const user = demoUsers.find(
          (u) => u.email === email && u.password === password
        );

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          initials: user.initials,
          image: user.image,
        };
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.initials = user.initials;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.initials = token.initials as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },
});
