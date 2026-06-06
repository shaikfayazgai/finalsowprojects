import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RateCardData {
  id: string;
  skill: string;
  level: "Junior" | "Mid" | "Senior";
  region: string;
  hourlyRate: number;
  dailyRate: number;
  currency: string;
  effectiveFrom: string;
  status: "active" | "draft";
}

const SEED_RATE_CARDS: RateCardData[] = [
  { id: "rc-1",  skill: "Frontend Development", level: "Junior", region: "South Asia",     hourlyRate: 25, dailyRate: 200, currency: "USD", effectiveFrom: "2026-01-15", status: "active" },
  { id: "rc-2",  skill: "Frontend Development", level: "Mid",    region: "South Asia",     hourlyRate: 50, dailyRate: 400, currency: "USD", effectiveFrom: "2026-01-15", status: "active" },
  { id: "rc-3",  skill: "Frontend Development", level: "Senior", region: "Global",         hourlyRate: 85, dailyRate: 680, currency: "USD", effectiveFrom: "2026-01-15", status: "active" },
  { id: "rc-4",  skill: "Backend Development",  level: "Junior", region: "South Asia",     hourlyRate: 30, dailyRate: 240, currency: "USD", effectiveFrom: "2026-02-01", status: "active" },
  { id: "rc-5",  skill: "Backend Development",  level: "Mid",    region: "Middle East",    hourlyRate: 55, dailyRate: 440, currency: "USD", effectiveFrom: "2026-02-01", status: "active" },
  { id: "rc-6",  skill: "Backend Development",  level: "Senior", region: "Global",         hourlyRate: 95, dailyRate: 760, currency: "USD", effectiveFrom: "2026-02-01", status: "active" },
  { id: "rc-7",  skill: "UI/UX Design",         level: "Junior", region: "Southeast Asia", hourlyRate: 28, dailyRate: 224, currency: "USD", effectiveFrom: "2026-01-20", status: "active" },
  { id: "rc-8",  skill: "UI/UX Design",         level: "Mid",    region: "South Asia",     hourlyRate: 50, dailyRate: 400, currency: "USD", effectiveFrom: "2026-01-20", status: "active" },
  { id: "rc-9",  skill: "UI/UX Design",         level: "Senior", region: "Global",         hourlyRate: 75, dailyRate: 600, currency: "USD", effectiveFrom: "2026-01-20", status: "active" },
  { id: "rc-10", skill: "QA Engineering",       level: "Mid",    region: "Africa",         hourlyRate: 40, dailyRate: 320, currency: "USD", effectiveFrom: "2026-03-01", status: "draft" },
];

interface RateCardsStoreState {
  rateCards: RateCardData[];
  addCard: (card: RateCardData) => void;
  updateCard: (id: string, patch: Partial<RateCardData>) => void;
  deleteCard: (id: string) => void;
  setStatus: (id: string, status: "active" | "draft") => void;
  resetToSeed: () => void;
}

export const useRateCardsStore = create<RateCardsStoreState>()(
  persist(
    (set) => ({
      rateCards: SEED_RATE_CARDS,
      addCard: (card) => set((s) => ({ rateCards: [...s.rateCards, card] })),
      updateCard: (id, patch) =>
        set((s) => ({
          rateCards: s.rateCards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteCard: (id) =>
        set((s) => ({ rateCards: s.rateCards.filter((c) => c.id !== id) })),
      setStatus: (id, status) =>
        set((s) => ({
          rateCards: s.rateCards.map((c) => (c.id === id ? { ...c, status } : c)),
        })),
      resetToSeed: () => set({ rateCards: SEED_RATE_CARDS }),
    }),
    { name: "gt-rate-cards", version: 1 }
  )
);
