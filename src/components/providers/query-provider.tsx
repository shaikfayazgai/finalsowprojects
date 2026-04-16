"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,   // serve cached data for 5 min before refetching
            gcTime: 15 * 60 * 1000,      // keep unused data in memory for 15 min
            refetchOnWindowFocus: false,  // don't refetch just because user switched tabs
            refetchOnReconnect: false,    // don't blast the API on every reconnect
            retry: false,                // fail fast — slow retries make it feel worse
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
