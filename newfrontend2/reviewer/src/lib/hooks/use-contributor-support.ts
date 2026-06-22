"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchGrievance,
  fetchSafetyCase,
  fetchSupportIndex,
  fetchTicket,
} from "@/lib/api/contributor-mock";

const keys = {
  index: ["contributor", "support", "index"] as const,
  ticket: (id: string) => ["contributor", "support", "ticket", id] as const,
  safetyCase: (id: string) => ["contributor", "support", "safety", id] as const,
  grievance: (id: string) => ["contributor", "support", "grievance", id] as const,
};

export function useSupportIndex() {
  return useQuery({
    queryKey: keys.index,
    queryFn: ({ signal }) => fetchSupportIndex(signal),
  });
}

export function useSupportTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: keys.ticket(ticketId ?? ""),
    queryFn: ({ signal }) => fetchTicket(ticketId!, signal),
    enabled: Boolean(ticketId),
  });
}

export function useSafetyCase(caseId: string | undefined) {
  return useQuery({
    queryKey: keys.safetyCase(caseId ?? ""),
    queryFn: ({ signal }) => fetchSafetyCase(caseId!, signal),
    enabled: Boolean(caseId),
  });
}

export function useGrievance(grievanceId: string | undefined) {
  return useQuery({
    queryKey: keys.grievance(grievanceId ?? ""),
    queryFn: ({ signal }) => fetchGrievance(grievanceId!, signal),
    enabled: Boolean(grievanceId),
  });
}
