"use client";

/**
 * Contributor settings store — persists notification preferences, locale, and
 * MFA toggle locally (Zustand + localStorage) so settings survive reloads.
 * Replaces the previous "Saved (mock)" no-op forms.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotifChannel = "inApp" | "email" | "sms";
export type NotifCategory =
  | "critical"
  | "task"
  | "reviewer"
  | "payout"
  | "marketing";

export interface LocalePrefs {
  language: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
}

interface ContributorSettingsState {
  /** category → channel → enabled */
  notifications: Record<NotifCategory, Record<NotifChannel, boolean>>;
  locale: LocalePrefs;
  mfaEnabled: boolean;

  setNotif: (category: NotifCategory, channel: NotifChannel, on: boolean) => void;
  setNotifications: (
    next: Record<NotifCategory, Record<NotifChannel, boolean>>,
  ) => void;
  setLocale: (next: Partial<LocalePrefs>) => void;
  setMfaEnabled: (on: boolean) => void;
}

const DEFAULT_NOTIFS: Record<NotifCategory, Record<NotifChannel, boolean>> = {
  critical: { inApp: true, email: true, sms: true },
  task: { inApp: true, email: true, sms: false },
  reviewer: { inApp: true, email: true, sms: false },
  payout: { inApp: true, email: true, sms: false },
  marketing: { inApp: false, email: false, sms: false },
};

const DEFAULT_LOCALE: LocalePrefs = {
  language: "en",
  dateFormat: "DD-MM-YYYY",
  timeFormat: "24h",
  currency: "INR",
};

export const useContributorSettingsStore = create<ContributorSettingsState>()(
  persist(
    (set) => ({
      notifications: DEFAULT_NOTIFS,
      locale: DEFAULT_LOCALE,
      mfaEnabled: false,

      setNotif: (category, channel, on) =>
        set((s) => ({
          notifications: {
            ...s.notifications,
            [category]: { ...s.notifications[category], [channel]: on },
          },
        })),

      setNotifications: (next) => set({ notifications: next }),

      setLocale: (next) => set((s) => ({ locale: { ...s.locale, ...next } })),

      setMfaEnabled: (on) => set({ mfaEnabled: on }),
    }),
    { name: "glm-contributor-settings-v1" },
  ),
);
