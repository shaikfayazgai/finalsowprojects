"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { QueryProvider } from "./query-provider";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    // refetchOnWindowFocus defaults to true, which refreshes the session and
    // hands a new session object to every useSession() consumer on every tab
    // focus. That cascades into re-renders / re-fetches in any component
    // depending on session — visible as dashboards "refreshing" on focus.
    <NextAuthSessionProvider refetchOnWindowFocus={false}>
      <QueryProvider>{children}</QueryProvider>
    </NextAuthSessionProvider>
  );
}
