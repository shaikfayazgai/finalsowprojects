/**
 * Enterprise rate-cards client — REAL.
 * CRUD against /api/enterprise/rate-cards/cards → /api/v1/enterprise/rate-cards/cards
 * (real per-tenant rate cards stored in enterprise_rate_card_list). No mock.
 */

import { fetchInternal } from "@/lib/api/client";
import type {
  CreateRateCardInput,
  RateCardDetail,
  RateCardSummary,
  UpdateRateCardInput,
} from "@/lib/enterprise/mocks/rate-cards";

export async function listRateCards(): Promise<RateCardSummary[]> {
  const res = await fetchInternal("/api/enterprise/rate-cards/cards", { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load rate cards (${res.status})`);
  const body = (await res.json()) as { items?: RateCardSummary[] };
  return Array.isArray(body.items) ? body.items : [];
}

export async function getRateCard(id: string): Promise<RateCardDetail> {
  const res = await fetchInternal(`/api/enterprise/rate-cards/cards/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load rate card (${res.status})`);
  return res.json();
}

export async function createRateCard(input: CreateRateCardInput): Promise<RateCardDetail> {
  const res = await fetchInternal("/api/enterprise/rate-cards/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create rate card (${res.status})`);
  return res.json();
}

export async function updateRateCard(
  id: string,
  input: UpdateRateCardInput,
): Promise<RateCardDetail> {
  const res = await fetchInternal(`/api/enterprise/rate-cards/cards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update rate card (${res.status})`);
  return res.json();
}

export type { RateCardSummary, RateCardDetail, CreateRateCardInput, UpdateRateCardInput };
