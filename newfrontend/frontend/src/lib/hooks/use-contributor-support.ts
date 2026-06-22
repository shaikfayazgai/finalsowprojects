"use client";

/**
 * Contributor support — REAL backend (contributor_support_tickets), mapped into
 * the view shapes. tickets / grievances / safety reports are all stored in one
 * table keyed by `kind`; FAQs come from the backend FAQ endpoint.
 */

import { useQuery } from "@tanstack/react-query";
import type {
  FaqGroup,
  MockGrievance,
  MockGrievanceType,
  MockSafetyCase,
  MockTicket,
  MockTicketMessage,
} from "@/mocks/contributor/support";

const keys = {
  index: ["contributor", "support", "index"] as const,
  ticket: (id: string) => ["contributor", "support", "ticket", id] as const,
  safetyCase: (id: string) => ["contributor", "support", "safety", id] as const,
  grievance: (id: string) => ["contributor", "support", "grievance", id] as const,
};

type Row = Record<string, unknown>;
const str = (v: unknown, f = ""): string => (v == null ? f : String(v));
const data = (r: Row): Row => (r.data && typeof r.data === "object" ? (r.data as Row) : {});

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}

function mapTicket(r: Row): MockTicket {
  const d = data(r);
  const cat = str(d.category, "other") as MockTicket["category"];
  const st = str(r.status, "open") as MockTicket["status"];
  const messages: MockTicketMessage[] = Array.isArray(r.messages)
    ? (r.messages as Row[]).map((m) => ({
        id: str(m.id),
        from: m.author === "contributor" ? "you" : "support",
        body: str(m.body),
        at: str(m.created_at),
      }))
    : [];
  return {
    id: str(r.id),
    category: ["task", "payout", "credential", "account", "other"].includes(cat) ? cat : "other",
    subject: str(r.subject),
    body: str(d.description ?? d.body),
    status: ["open", "in_progress", "waiting", "resolved"].includes(st) ? st : "open",
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at ?? r.created_at),
    messages,
  };
}

function mapGrievance(r: Row): MockGrievance {
  const d = data(r);
  const type = str(d.type, "other") as MockGrievanceType;
  const st = str(r.status, "submitted") as MockGrievance["status"];
  return {
    id: str(r.id),
    type: ["unfair_rejection", "payment_dispute", "process_issue", "other"].includes(type)
      ? type
      : "other",
    status: ["submitted", "in_progress", "resolved"].includes(st) ? st : "submitted",
    submittedAt: str(r.created_at),
    updatedAt: str(r.updated_at ?? r.created_at),
    caseRef: `GR-${str(r.id)}`,
    summary: str(r.subject),
    story: str(d.story),
    incidentDate: d.when ? str(d.when) : null,
    relatedReference: d.reference ? str(d.reference) : null,
    desiredOutcome: str(d.outcome),
    attachments: Array.isArray(d.attachments) ? d.attachments.map((a) => str(a)) : [],
    updates: [],
  };
}

function mapSafety(r: Row): MockSafetyCase {
  const d = data(r);
  const type = str(d.type, "other") as MockSafetyCase["type"];
  const st = str(r.status, "submitted") as MockSafetyCase["status"];
  return {
    id: str(r.id),
    type: ["harassment", "unsafe_task_content", "discrimination", "other"].includes(type)
      ? type
      : "other",
    status: ["submitted", "in_progress", "resolved"].includes(st) ? st : "submitted",
    submittedAt: str(r.created_at),
    updatedAt: str(r.updated_at ?? r.created_at),
    anonymous: Boolean(d.anonymous),
    summary: str(r.subject),
    caseRef: `SR-${str(r.id)}`,
    story: str(d.story),
    incidentDate: d.when ? str(d.when) : null,
    involved: d.involved ? str(d.involved) : null,
    attachments: Array.isArray(d.attachments) ? d.attachments.map((a) => str(a)) : [],
    updates: [],
  };
}

function mapFaqs(items: Row[]): FaqGroup[] {
  if (!items.length) return [];
  return [
    {
      id: "faqs",
      title: "Frequently asked",
      entries: items.map((f) => ({ q: str(f.question), a: str(f.answer) })),
    },
  ];
}

export function useSupportIndex() {
  return useQuery({
    queryKey: keys.index,
    queryFn: async (): Promise<{
      faqs: FaqGroup[];
      tickets: MockTicket[];
      safetyCases: MockSafetyCase[];
      grievances: MockGrievance[];
    }> => {
      const [tickets, grievances, safety, faqs] = await Promise.all([
        getJSON<{ items?: Row[] }>("/api/contributor/support/tickets").catch(() => ({ items: [] })),
        getJSON<{ items?: Row[] }>("/api/contributor/support/grievances").catch(() => ({ items: [] })),
        getJSON<{ items?: Row[] }>("/api/contributor/support/safety-reports").catch(() => ({ items: [] })),
        getJSON<{ items?: Row[] }>("/api/contributor/support/faqs").catch(() => ({ items: [] })),
      ]);
      return {
        faqs: mapFaqs(faqs.items ?? []),
        tickets: (tickets.items ?? []).map(mapTicket),
        grievances: (grievances.items ?? []).map(mapGrievance),
        safetyCases: (safety.items ?? []).map(mapSafety),
      };
    },
  });
}

export function useSupportTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: keys.ticket(ticketId ?? ""),
    queryFn: async (): Promise<{ ticket: MockTicket }> => {
      const row = await getJSON<Row>(`/api/contributor/support/tickets/${ticketId}`);
      return { ticket: mapTicket(row) };
    },
    enabled: Boolean(ticketId),
  });
}

export function useSafetyCase(caseId: string | undefined) {
  return useQuery({
    queryKey: keys.safetyCase(caseId ?? ""),
    queryFn: async (): Promise<{ safetyCase: MockSafetyCase }> => {
      const row = await getJSON<Row>(`/api/contributor/support/safety-reports/${caseId}`);
      return { safetyCase: mapSafety(row) };
    },
    enabled: Boolean(caseId),
  });
}

export function useGrievance(grievanceId: string | undefined) {
  return useQuery({
    queryKey: keys.grievance(grievanceId ?? ""),
    queryFn: async (): Promise<{ grievance: MockGrievance }> => {
      const row = await getJSON<Row>(`/api/contributor/support/grievances/${grievanceId}`);
      return { grievance: mapGrievance(row) };
    },
    enabled: Boolean(grievanceId),
  });
}
