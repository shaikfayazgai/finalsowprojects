import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_STUDENT_CURRENCY = "INR";
const DEFAULT_STUDENT_HOURLY_RATE = "1000";
const DEFAULT_WOMEN_CURRENCY = "INR";
const DEFAULT_GENERAL_CURRENCY = "INR";
// Defaults mirror the backend example payload
const DEFAULT_RATE_0_TO_1 = "1000";
const DEFAULT_RATE_1_TO_3 = "1500";
const DEFAULT_RATE_3_TO_5 = "2000";
const DEFAULT_RATE_5_TO_10 = "2500";
const DEFAULT_RATE_10_PLUS = "3000";

export type ExperienceRateKey =
  | "exp0to1"
  | "exp1to3"
  | "exp3to5"
  | "exp5to10"
  | "exp10plus";

export interface ExperienceRateTable {
  exp0to1: string;
  exp1to3: string;
  exp3to5: string;
  exp5to10: string;
  exp10plus: string;
}

interface PlatformSettingsState {
  studentCurrency: string;
  studentHourlyRate: string;
  womenWorkforceCurrency: string;
  womenWorkforceRates: ExperienceRateTable;
  generalWorkforceCurrency: string;
  generalWorkforceRates: ExperienceRateTable;
  setStudentCurrency: (currency: string) => void;
  setStudentHourlyRate: (hourlyRate: string) => void;
  setStudentRateConfig: (currency: string, hourlyRate: string) => void;
  setWomenWorkforceRateConfig: (
    currency: string,
    rates: ExperienceRateTable
  ) => void;
  setGeneralWorkforceRateConfig: (
    currency: string,
    rates: ExperienceRateTable
  ) => void;
}

function sanitizeRateTable(rates: ExperienceRateTable): ExperienceRateTable {
  return {
    exp0to1:  rates.exp0to1.trim()  || DEFAULT_RATE_0_TO_1,
    exp1to3:  rates.exp1to3.trim()  || DEFAULT_RATE_1_TO_3,
    exp3to5:  rates.exp3to5.trim()  || DEFAULT_RATE_3_TO_5,
    exp5to10: rates.exp5to10.trim() || DEFAULT_RATE_5_TO_10,
    exp10plus: rates.exp10plus.trim() || DEFAULT_RATE_10_PLUS,
  };
}

export const usePlatformSettingsStore = create<PlatformSettingsState>()(
  persist(
    (set) => ({
      studentCurrency: DEFAULT_STUDENT_CURRENCY,
      studentHourlyRate: DEFAULT_STUDENT_HOURLY_RATE,
      womenWorkforceCurrency: DEFAULT_WOMEN_CURRENCY,
      womenWorkforceRates: {
        exp0to1:  DEFAULT_RATE_0_TO_1,
        exp1to3:  DEFAULT_RATE_1_TO_3,
        exp3to5:  DEFAULT_RATE_3_TO_5,
        exp5to10: DEFAULT_RATE_5_TO_10,
        exp10plus: DEFAULT_RATE_10_PLUS,
      },
      generalWorkforceCurrency: DEFAULT_GENERAL_CURRENCY,
      generalWorkforceRates: {
        exp0to1:  DEFAULT_RATE_0_TO_1,
        exp1to3:  DEFAULT_RATE_1_TO_3,
        exp3to5:  DEFAULT_RATE_3_TO_5,
        exp5to10: DEFAULT_RATE_5_TO_10,
        exp10plus: DEFAULT_RATE_10_PLUS,
      },
      setStudentCurrency: (currency) =>
        set({
          studentCurrency:
            currency.trim().toUpperCase() || DEFAULT_STUDENT_CURRENCY,
        }),
      setStudentHourlyRate: (hourlyRate) =>
        set({
          studentHourlyRate: hourlyRate.trim() || DEFAULT_STUDENT_HOURLY_RATE,
        }),
      setStudentRateConfig: (currency, hourlyRate) =>
        set({
          studentCurrency:
            currency.trim().toUpperCase() || DEFAULT_STUDENT_CURRENCY,
          studentHourlyRate: hourlyRate.trim() || DEFAULT_STUDENT_HOURLY_RATE,
        }),
      setWomenWorkforceRateConfig: (currency, rates) =>
        set({
          womenWorkforceCurrency:
            currency.trim().toUpperCase() || DEFAULT_WOMEN_CURRENCY,
          womenWorkforceRates: sanitizeRateTable(rates),
        }),
      setGeneralWorkforceRateConfig: (currency, rates) =>
        set({
          generalWorkforceCurrency:
            currency.trim().toUpperCase() || DEFAULT_GENERAL_CURRENCY,
          generalWorkforceRates: sanitizeRateTable(rates),
        }),
    }),
    {
      name: "gt-platform-settings",
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          // Migrate old rate keys (exp5to7, exp8to10) → new backend-aligned keys
          const migrateTable = (old: Record<string, string> | undefined | null): ExperienceRateTable => {
            const t = old ?? {};
            return {
              exp0to1:   t.exp0to1   ?? DEFAULT_RATE_0_TO_1,
              exp1to3:   t.exp1to3   ?? DEFAULT_RATE_1_TO_3,
              exp3to5:   t.exp3to5   ?? DEFAULT_RATE_3_TO_5,
              exp5to10:  t.exp5to10  ?? t.exp5to7  ?? DEFAULT_RATE_5_TO_10,
              exp10plus: t.exp10plus ?? t.exp8to10 ?? DEFAULT_RATE_10_PLUS,
            };
          };
          return {
            ...state,
            womenWorkforceRates:   migrateTable(state.womenWorkforceRates   as Record<string, string>),
            generalWorkforceRates: migrateTable(state.generalWorkforceRates as Record<string, string>),
          };
        }
        return state;
      },
    }
  )
);
