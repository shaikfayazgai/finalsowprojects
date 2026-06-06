/**
 * Enterprise settings v3 store — persisted preferences, notification
 * routing, integrations, branding, compliance windows, and API tokens.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_BRANDING,
  DEFAULT_COMPLIANCE,
  DEFAULT_NOTIFICATION_ROUTING,
  DEFAULT_PREFERENCES,
  type ApiToken,
  type BrandingState,
  type ComplianceExportJob,
  type ComplianceState,
  type IntegrationKind,
  type IntegrationRecord,
  type NotificationChannel,
  type NotificationCadence,
  type NotificationKind,
  type NotificationRoutingState,
  type PreferencesState,
} from "@/types/settings";

interface SettingsStoreState {
  preferences: PreferencesState;
  notifications: NotificationRoutingState;
  branding: BrandingState;
  compliance: ComplianceState;
  integrations: IntegrationRecord[];
  apiTokens: ApiToken[];
  /** ISO timestamp of the most recent save call (any surface). */
  lastSavedAt: string | null;

  setPreference: <K extends keyof PreferencesState>(
    key: K,
    value: PreferencesState[K],
  ) => void;

  setNotificationChannel: (
    kind: NotificationKind,
    channel: NotificationChannel,
    enabled: boolean,
  ) => void;
  setNotificationCadence: (
    kind: NotificationKind,
    cadence: NotificationCadence,
  ) => void;
  setNotificationMuted: (kind: NotificationKind, muted: boolean) => void;
  setDoNotDisturb: (
    enabled: boolean,
    startHour?: number,
    endHour?: number,
  ) => void;
  replaceNotifications: (next: NotificationRoutingState) => void;

  setBranding: <K extends keyof BrandingState>(
    key: K,
    value: BrandingState[K],
  ) => void;

  setComplianceField: <K extends keyof Omit<ComplianceState, "exports">>(
    key: K,
    value: ComplianceState[K],
  ) => void;
  enqueueExport: (
    kind: ComplianceExportJob["kind"],
    range: ComplianceExportJob["range"],
    requestedBy: string,
  ) => void;

  upsertIntegration: (record: IntegrationRecord) => void;
  removeIntegration: (id: string) => void;
  connectIntegration: (kind: IntegrationKind, label: string) => void;
  disconnectIntegration: (id: string) => void;

  createApiToken: (label: string, scopes: string[]) => ApiToken;
  revokeApiToken: (id: string) => void;

  markSaved: () => void;
  reset: () => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function tokenPreview(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return (
    "gt_" +
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") +
    "…" +
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
}

export const useSettingsStoreV3 = create<SettingsStoreState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      notifications: DEFAULT_NOTIFICATION_ROUTING,
      branding: DEFAULT_BRANDING,
      compliance: DEFAULT_COMPLIANCE,
      integrations: [],
      apiTokens: [],
      lastSavedAt: null,

      setPreference: (key, value) =>
        set((s) => ({ preferences: { ...s.preferences, [key]: value } })),

      setNotificationChannel: (kind, channel, enabled) =>
        set((s) => {
          const rule = s.notifications.rules[kind];
          return {
            notifications: {
              ...s.notifications,
              rules: {
                ...s.notifications.rules,
                [kind]: {
                  ...rule,
                  channels: { ...rule.channels, [channel]: enabled },
                },
              },
            },
          };
        }),

      setNotificationCadence: (kind, cadence) =>
        set((s) => ({
          notifications: {
            ...s.notifications,
            rules: {
              ...s.notifications.rules,
              [kind]: { ...s.notifications.rules[kind], cadence },
            },
          },
        })),

      setNotificationMuted: (kind, muted) =>
        set((s) => ({
          notifications: {
            ...s.notifications,
            rules: {
              ...s.notifications.rules,
              [kind]: { ...s.notifications.rules[kind], muted },
            },
          },
        })),

      setDoNotDisturb: (enabled, startHour, endHour) =>
        set((s) => ({
          notifications: {
            ...s.notifications,
            doNotDisturb: {
              enabled,
              startHour: startHour ?? s.notifications.doNotDisturb.startHour,
              endHour: endHour ?? s.notifications.doNotDisturb.endHour,
            },
          },
        })),

      replaceNotifications: (next) => set({ notifications: next }),

      setBranding: (key, value) =>
        set((s) => ({ branding: { ...s.branding, [key]: value } })),

      setComplianceField: (key, value) =>
        set((s) => ({ compliance: { ...s.compliance, [key]: value } })),

      enqueueExport: (kind, range, requestedBy) =>
        set((s) => {
          const next: ComplianceExportJob = {
            id: uid("exp"),
            kind,
            range,
            requestedAt: new Date().toISOString(),
            requestedBy,
            status: "queued",
          };
          return {
            compliance: {
              ...s.compliance,
              exports: [next, ...s.compliance.exports].slice(0, 25),
            },
          };
        }),

      upsertIntegration: (record) =>
        set((s) => {
          const filtered = s.integrations.filter((i) => i.id !== record.id);
          return { integrations: [record, ...filtered] };
        }),

      removeIntegration: (id) =>
        set((s) => ({ integrations: s.integrations.filter((i) => i.id !== id) })),

      connectIntegration: (kind, label) =>
        set((s) => ({
          integrations: [
            {
              id: uid("int"),
              kind,
              label,
              status: "connected",
              connectedAt: new Date().toISOString(),
              scopes:
                kind === "slack"
                  ? ["channels:read", "chat:write"]
                  : kind === "teams"
                    ? ["chat.write", "presence.read"]
                    : kind === "webhook"
                      ? ["events:write"]
                      : ["read", "write"],
            },
            ...s.integrations.filter((i) => !(i.kind === kind && i.label === label)),
          ],
        })),

      disconnectIntegration: (id) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, status: "disconnected" } : i,
          ),
        })),

      createApiToken: (label, scopes) => {
        const token: ApiToken = {
          id: uid("tok"),
          label,
          preview: tokenPreview(),
          createdAt: new Date().toISOString(),
          scopes,
        };
        set((s) => ({ apiTokens: [token, ...s.apiTokens].slice(0, 30) }));
        return token;
      },

      revokeApiToken: (id) =>
        set((s) => ({ apiTokens: s.apiTokens.filter((t) => t.id !== id) })),

      markSaved: () => set({ lastSavedAt: new Date().toISOString() }),

      reset: () =>
        set({
          preferences: DEFAULT_PREFERENCES,
          notifications: DEFAULT_NOTIFICATION_ROUTING,
          branding: DEFAULT_BRANDING,
          compliance: DEFAULT_COMPLIANCE,
          integrations: [],
          apiTokens: [],
          lastSavedAt: null,
        }),
    }),
    { name: "enterprise-settings-v3" },
  ),
);
