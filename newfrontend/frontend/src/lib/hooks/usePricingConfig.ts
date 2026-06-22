"use client";

import { useEffect, useRef, useState } from "react";
import {
  usePlatformSettingsStore,
  type ExperienceRateTable,
} from "@/lib/stores/platform-settings-store";

// ── Types matching the public API response ────────────────────────────────────

interface PricingSlabRaw {
  id: string;
  minYears: number;
  maxYears: number | null;
  currency: string;
  rate: number;
}

interface PricingConfigRaw {
  student: { currency: string; hourlyRate: number };
  workforceSlabs: PricingSlabRaw[];
}

export interface PricingConfig {
  studentCurrency: string;
  studentHourlyRate: string;
  womenRateCurrency: string;
  womenRateTable: ExperienceRateTable;
  generalRateCurrency: string;
  generalRateTable: ExperienceRateTable;
  /** true while the first fetch is in-flight */
  loading: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps a flat slab list to the { exp0to1, exp1to3, … } shape the store uses.
 * Matching is done by minYears so it is robust to id-prefix changes.
 */
function slabsToRateTable(slabs: PricingSlabRaw[]): ExperienceRateTable {
  const byMin: Record<number, number> = {};
  for (const s of slabs) byMin[s.minYears] = s.rate;
  return {
    exp0to1:   String(byMin[0]  ?? 1000),
    exp1to3:   String(byMin[1]  ?? 1500),
    exp3to5:   String(byMin[3]  ?? 2000),
    exp5to10:  String(byMin[5]  ?? 2500),
    exp10plus: String(byMin[10] ?? 3000),
  };
}

/** Primary currency from a slab list (first slab's currency, or fallback). */
function slabsCurrency(slabs: PricingSlabRaw[], fallback = "INR"): string {
  return slabs[0]?.currency ?? fallback;
}

/**
 * Parse the raw API payload into the shape both hooks expect.
 * Women slabs use the "ww-" id prefix; general slabs use "gw-".
 * If only one set exists (e.g. first-ever admin save), it is used for both.
 */
function parsePricingConfig(raw: PricingConfigRaw): Omit<PricingConfig, "loading"> {
  const wwSlabs = raw.workforceSlabs.filter((s) => s.id.startsWith("ww-"));
  const gwSlabs = raw.workforceSlabs.filter((s) => s.id.startsWith("gw-"));

  // Fallback: if admin has only saved one set, use it for both
  const womenSlabs   = wwSlabs.length > 0 ? wwSlabs : raw.workforceSlabs;
  const generalSlabs = gwSlabs.length > 0 ? gwSlabs : raw.workforceSlabs;

  return {
    studentCurrency:   raw.student.currency || "INR",
    studentHourlyRate: String(raw.student.hourlyRate ?? 1000),
    womenRateCurrency:   slabsCurrency(womenSlabs),
    womenRateTable:      slabsToRateTable(womenSlabs),
    generalRateCurrency: slabsCurrency(generalSlabs),
    generalRateTable:    slabsToRateTable(generalSlabs),
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Fetches the live contributor pricing config from the backend and syncs it
 * into the Zustand store.  Returns the latest values (API or store fallback)
 * along with a `loading` flag for the first fetch.
 *
 * Usage:
 *   const pricing = usePricingConfig();
 *   // pricing.studentCurrency, pricing.womenRateTable, pricing.loading …
 */
export function usePricingConfig(): PricingConfig {
  const store = usePlatformSettingsStore();
  const setStudentRateConfig       = store.setStudentRateConfig;
  const setWomenWorkforceRateConfig   = store.setWomenWorkforceRateConfig;
  const setGeneralWorkforceRateConfig = store.setGeneralWorkforceRateConfig;

  // Seed from the persisted store so there is never a blank render
  const [config, setConfig] = useState<Omit<PricingConfig, "loading">>(() => ({
    studentCurrency:     store.studentCurrency,
    studentHourlyRate:   store.studentHourlyRate,
    womenRateCurrency:   store.womenWorkforceCurrency,
    womenRateTable:      store.womenWorkforceRates,
    generalRateCurrency: store.generalWorkforceCurrency,
    generalRateTable:    store.generalWorkforceRates,
  }));
  const [loading, setLoading] = useState(true);

  // Guard: only fetch once per hook mount (not on every re-render)
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    let cancelled = false;

    async function loadPricing() {
      try {
        const res = await fetch("/api/config/contributor-pricing", {
          cache: "no-store",
        });

        if (!res.ok) {
          // Proxy itself failed (5xx / timeout) — fall back to stored values.
          return;
        }

        const json = await res.json();
        // Proxy returns { data: null } when the upstream backend returned a
        // non-2xx (e.g. 404 because the endpoint isn't deployed yet).
        if (!json || json.data === null) return;

        const raw = json as PricingConfigRaw;
        if (cancelled) return;

        const parsed = parsePricingConfig(raw);
        setConfig(parsed);

        // Persist to the Zustand store so other parts of the app are consistent
        setStudentRateConfig(parsed.studentCurrency, parsed.studentHourlyRate);
        setWomenWorkforceRateConfig(parsed.womenRateCurrency, parsed.womenRateTable);
        setGeneralWorkforceRateConfig(parsed.generalRateCurrency, parsed.generalRateTable);
      } catch {
        // Network error — silently fall back to stored values
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPricing();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...config, loading };
}
