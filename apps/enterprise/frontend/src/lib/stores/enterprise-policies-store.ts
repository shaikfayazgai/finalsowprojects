"use client";

/**
 * Enterprise governance-thresholds store — persists the Policies → Governance
 * thresholds browser-locally so "Save thresholds" survives a reload even when
 * the backend can't write them (Phase-1 / no DB on the cloud demo).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GovernanceThresholds {
  minAiConfidencePct: number;
  minMentorStars: number;
  auditRetention: string;
  consentExpiry: string;
}

interface EnterprisePoliciesState {
  /** null = not yet saved; fall back to the page's mock defaults. */
  thresholds: GovernanceThresholds | null;
  setThresholds: (next: GovernanceThresholds) => void;
}

export const useEnterprisePoliciesStore = create<EnterprisePoliciesState>()(
  persist(
    (set) => ({
      thresholds: null,
      setThresholds: (next) => set({ thresholds: next }),
    }),
    { name: "glimmora.enterprise.policies" },
  ),
);
