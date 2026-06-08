"use client";

/**
 * Mentor settings store — persists notification preferences browser-locally so
 * they survive reloads even when the backend can't write them (Phase-1 / no DB
 * on the cloud demo). Mirrors the contributor-settings-store pattern.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MentorNotifChannel = "inApp" | "email" | "sms";
export type MentorNotifPrefs = Record<string, Record<MentorNotifChannel, boolean>>;

interface MentorSettingsState {
  /** Per-event channel prefs, keyed by row key. Empty = use page defaults. */
  notifications: MentorNotifPrefs;
  setNotifications: (next: MentorNotifPrefs) => void;
}

export const useMentorSettingsStore = create<MentorSettingsState>()(
  persist(
    (set) => ({
      notifications: {},
      setNotifications: (next) => set({ notifications: next }),
    }),
    { name: "glimmora.mentor.settings" },
  ),
);
