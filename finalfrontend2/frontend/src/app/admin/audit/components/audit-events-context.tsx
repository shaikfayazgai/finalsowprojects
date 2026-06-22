"use client";

/**
 * Shared context for audit events fetched from /api/audit/export?format=json.
 * Provides a lookup function so the detail modal can find an event by ID
 * without re-fetching.
 */

import * as React from "react";
import type { MockAdminAuditEvent } from "@/mocks/admin/audit";

interface AuditEventsContextValue {
  events: MockAdminAuditEvent[];
  isLoading: boolean;
  error: string | null;
  findById: (id: string) => MockAdminAuditEvent | undefined;
  refetch: () => void;
}

const AuditEventsContext = React.createContext<AuditEventsContextValue>({
  events: [],
  isLoading: false,
  error: null,
  findById: () => undefined,
  refetch: () => {},
});

export function useAuditEventsContext() {
  return React.useContext(AuditEventsContext);
}

export function AuditEventsProvider({
  events,
  isLoading,
  error,
  refetch,
  children,
}: {
  events: MockAdminAuditEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  children: React.ReactNode;
}) {
  const findById = React.useCallback(
    (id: string) => events.find((e) => e.id === id),
    [events],
  );

  const value = React.useMemo(
    () => ({ events, isLoading, error, findById, refetch }),
    [events, isLoading, error, findById, refetch],
  );

  return (
    <AuditEventsContext.Provider value={value}>
      {children}
    </AuditEventsContext.Provider>
  );
}
