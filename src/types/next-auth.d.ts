import type { UserRole } from "@/auth";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    initials?: string;
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
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    initials?: string;
    provider?: string;
  }
}
