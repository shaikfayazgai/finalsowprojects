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

const SEED_RATE_CARDS: RateCardData[] = [];

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
