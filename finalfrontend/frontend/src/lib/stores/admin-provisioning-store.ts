import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getInviteRoleSpec,
  mintInviteToken,
  type InviteRoleKey,
} from "@/lib/admin/invite-routes";
import { MOCK_PROVISIONING_STEPS } from "@/mocks/admin/tenants";
import type { ProvisioningStep, TenantStatus } from "@/mocks/admin/tenants";

/** Stable invite token for seed mock tenants in provisioning. */
export function mockTenantInviteToken(tenantId: string): string {
  return `mock-${tenantId}`;
}

export type TenantTier = "Enterprise" | "Growth" | "Pilot" | "Trial";

export interface TenantDraft {
  name: string;
  slug: string;
  domain: string;
  tier: TenantTier;
  msaRef: string;
  adminEmail: string;
  adminName: string;
  rolesEnabled: Record<string, boolean>;
  region: string;
  currency: string;
  timezone: string;
  retentionAudit: string;
  retentionEvidence: string;
  residencyRegion: string;
  consentVersion: string;
}

export const DEFAULT_TENANT_DRAFT: TenantDraft = {
  name: "",
  slug: "",
  domain: "",
  tier: "Enterprise",
  msaRef: "",
  adminEmail: "",
  adminName: "",
  rolesEnabled: {
    admin: true,
    sponsor: true,
    pmo: true,
    finance: false,
    compliance: false,
    reviewer: true,
    procurement: false,
    it: false,
  },
  region: "Asia-South",
  currency: "INR",
  timezone: "Asia/Kolkata",
  retentionAudit: "indefinite",
  retentionEvidence: "7 years",
  residencyRegion: "Asia-South",
  consentVersion: "platform-tc-v2.4",
};

export interface ProvisionedTenantRecord {
  id: string;
  name: string;
  slug: string;
  domain: string;
  tier: TenantTier;
  msaRef: string;
  region: string;
  currency: string;
  adminEmail: string;
  adminName: string;
  rolesEnabled: Record<string, boolean>;
  consentVersion: string;
  status: TenantStatus;
  inviteToken: string;
  inviteUrl: string;
  postLoginPath: string;
  provisionedAt: string;
  steps: ProvisioningStep[];
  pausedReason?: string;
}

export interface PlatformInviteRecord {
  id: string;
  email: string;
  name: string;
  roleKey: InviteRoleKey;
  roleLabel: string;
  jwtRole: string;
  inviteToken: string;
  inviteUrl: string;
  postLoginPath: string;
  createdAt: string;
  tenantId?: string;
}

export interface TenantOverride {
  status?: TenantStatus;
  tier?: TenantTier;
  pausedReason?: string;
}

interface AdminProvisioningState {
  tenants: ProvisionedTenantRecord[];
  invites: PlatformInviteRecord[];
  tenantOverrides: Record<string, TenantOverride>;
  mockStepUpdates: Record<string, ProvisioningStep[]>;
  wizardDraft: TenantDraft | null;
  wizardStep: number;
  provisionTenant: (draft: TenantDraft, origin: string) => ProvisionedTenantRecord;
  createInvite: (input: {
    email: string;
    name: string;
    roleKey: InviteRoleKey;
    origin: string;
    tenantId?: string;
  }) => PlatformInviteRecord;
  getTenant: (id: string) => ProvisionedTenantRecord | undefined;
  saveWizardDraft: (draft: TenantDraft, step: number) => void;
  clearWizardDraft: () => void;
  pauseTenant: (tenantId: string, reason: string) => void;
  updateTenantTier: (tenantId: string, tier: TenantTier) => void;
  markAdminSignIn: (inviteToken: string) => void;
  getTenantOverride: (tenantId: string) => TenantOverride | undefined;
}

function buildProvisioningSteps(
  adminEmail: string,
  provisionedAt: string,
): ProvisioningStep[] {
  return [
    { id: "scope", label: "Tenant scope created", state: "done", at: provisionedAt },
    { id: "policies", label: "Default policies applied", state: "done", at: provisionedAt },
    {
      id: "admin",
      label: `Admin invite sent (${adminEmail})`,
      state: "done",
      at: provisionedAt,
    },
    { id: "signin", label: "First admin sign-in", state: "pending" },
    { id: "sow", label: "First SOW upload", state: "pending" },
    { id: "hris", label: "HRIS connection", state: "pending" },
  ];
}

function markSignInSteps(steps: ProvisioningStep[]): ProvisioningStep[] {
  const now = new Date().toISOString();
  return steps.map((s) =>
    s.id === "signin" ? { ...s, state: "done" as const, at: now } : s,
  );
}

export const useAdminProvisioningStore = create<AdminProvisioningState>()(
  persist(
    (set, get) => ({
      tenants: [],
      invites: [],
      tenantOverrides: {},
      mockStepUpdates: {},
      wizardDraft: null,
      wizardStep: 0,

      saveWizardDraft: (draft, step) => set({ wizardDraft: draft, wizardStep: step }),

      clearWizardDraft: () => set({ wizardDraft: null, wizardStep: 0 }),

      provisionTenant: (draft, origin) => {
        const spec = getInviteRoleSpec("enterprise_admin");
        const token = mintInviteToken();
        const provisionedAt = new Date().toISOString();
        const id = `t-${draft.slug}`;
        const inviteUrl = spec.buildInviteUrl(origin, token);
        const record: ProvisionedTenantRecord = {
          id,
          name: draft.name,
          slug: draft.slug,
          domain: draft.domain,
          tier: draft.tier,
          msaRef: draft.msaRef,
          region: `${draft.region} · ${draft.currency}`,
          currency: draft.currency,
          adminEmail: draft.adminEmail,
          adminName: draft.adminName,
          rolesEnabled: draft.rolesEnabled,
          consentVersion: draft.consentVersion,
          status: "provisioning",
          inviteToken: token,
          inviteUrl,
          postLoginPath: spec.postLoginPath,
          provisionedAt,
          steps: buildProvisioningSteps(draft.adminEmail, provisionedAt),
        };

        const invite: PlatformInviteRecord = {
          id: `inv-${token}`,
          email: draft.adminEmail,
          name: draft.adminName,
          roleKey: "enterprise_admin",
          roleLabel: spec.label,
          jwtRole: spec.jwtRole,
          inviteToken: token,
          inviteUrl,
          postLoginPath: spec.postLoginPath,
          createdAt: provisionedAt,
          tenantId: id,
        };

        set((s) => ({
          tenants: [record, ...s.tenants.filter((t) => t.id !== id)],
          invites: [invite, ...s.invites],
          wizardDraft: null,
          wizardStep: 0,
        }));

        return record;
      },

      createInvite: ({ email, name, roleKey, origin, tenantId }) => {
        const spec = getInviteRoleSpec(roleKey);
        const token = mintInviteToken();
        const createdAt = new Date().toISOString();
        const inviteUrl = spec.buildInviteUrl(origin, token);
        const record: PlatformInviteRecord = {
          id: `inv-${token}`,
          email,
          name,
          roleKey,
          roleLabel: spec.label,
          jwtRole: spec.jwtRole,
          inviteToken: token,
          inviteUrl,
          postLoginPath: spec.postLoginPath,
          createdAt,
          tenantId,
        };
        set((s) => ({ invites: [record, ...s.invites] }));
        return record;
      },

      getTenant: (id) => get().tenants.find((t) => t.id === id),

      getTenantOverride: (id) => get().tenantOverrides[id],

      pauseTenant: (tenantId, reason) => {
        const dynamic = get().tenants.find((t) => t.id === tenantId);
        if (dynamic) {
          set((s) => ({
            tenants: s.tenants.map((t) =>
              t.id === tenantId
                ? { ...t, status: "paused" as const, pausedReason: reason }
                : t,
            ),
          }));
          return;
        }
        set((s) => ({
          tenantOverrides: {
            ...s.tenantOverrides,
            [tenantId]: { ...s.tenantOverrides[tenantId], status: "paused", pausedReason: reason },
          },
        }));
      },

      updateTenantTier: (tenantId, tier) => {
        const dynamic = get().tenants.find((t) => t.id === tenantId);
        if (dynamic) {
          set((s) => ({
            tenants: s.tenants.map((t) => (t.id === tenantId ? { ...t, tier } : t)),
          }));
          return;
        }
        set((s) => ({
          tenantOverrides: {
            ...s.tenantOverrides,
            [tenantId]: { ...s.tenantOverrides[tenantId], tier },
          },
        }));
      },

      markAdminSignIn: (inviteToken) => {
        if (!inviteToken) return;
        const invite = get().invites.find((i) => i.inviteToken === inviteToken);
        const mockTenantId = inviteToken.startsWith("mock-") ? inviteToken.slice(5) : null;
        const tenantId = invite?.tenantId ?? mockTenantId;

        set((s) => {
          const nextTenants = s.tenants.map((t) => {
            if (t.inviteToken !== inviteToken && t.id !== tenantId) return t;
            return {
              ...t,
              status: "active" as const,
              steps: markSignInSteps(t.steps),
            };
          });

          let nextMockSteps = s.mockStepUpdates;
          let nextOverrides = s.tenantOverrides;
          if (tenantId && !s.tenants.some((t) => t.id === tenantId)) {
            const base = s.mockStepUpdates[tenantId] ?? MOCK_PROVISIONING_STEPS[tenantId];
            if (base) {
              nextMockSteps = {
                ...s.mockStepUpdates,
                [tenantId]: markSignInSteps(base),
              };
            }
            nextOverrides = {
              ...s.tenantOverrides,
              [tenantId]: { ...s.tenantOverrides[tenantId], status: "active" },
            };
          }

          return {
            tenants: nextTenants,
            mockStepUpdates: nextMockSteps,
            tenantOverrides: nextOverrides,
          };
        });
      },
    }),
    { name: "glimmora-admin-provisioning" },
  ),
);

/** Call after enterprise admin signs in via invite link. */
export function markAdminSignInFromInvite(inviteToken: string | null | undefined) {
  if (!inviteToken) return;
  useAdminProvisioningStore.getState().markAdminSignIn(inviteToken);
}
