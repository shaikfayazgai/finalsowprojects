import type { MockTenant, ProvisioningStep } from "@/mocks/admin/tenants";
import { MOCK_TENANTS, MOCK_PROVISIONING_STEPS } from "@/mocks/admin/tenants";
import type {
  ProvisionedTenantRecord,
  TenantOverride,
} from "@/lib/stores/admin-provisioning-store";

function applyOverride(tenant: MockTenant, override?: TenantOverride): MockTenant {
  if (!override) return tenant;
  return {
    ...tenant,
    status: override.status ?? tenant.status,
    tier: override.tier ?? tenant.tier,
  };
}

export function mergeTenantLists(
  dynamic: ProvisionedTenantRecord[],
  overrides: Record<string, TenantOverride> = {},
): MockTenant[] {
  const dynamicAsMock: MockTenant[] = dynamic.map((t) => ({
    id: t.id,
    name: t.name,
    domain: t.domain,
    tier: t.tier,
    status: t.status,
    users: t.status === "active" ? 2 : 1,
    sows: 0,
    provisionedAt: t.provisionedAt,
    msaRef: t.msaRef || "—",
    region: t.region,
    currency: t.currency,
    lastHrisSyncAt: null,
  }));

  const ids = new Set(dynamicAsMock.map((t) => t.id));
  const seeded = MOCK_TENANTS.filter((t) => !ids.has(t.id)).map((t) =>
    applyOverride(t, overrides[t.id]),
  );

  return [...dynamicAsMock, ...seeded];
}

export function resolveProvisioningSteps(
  tenantId: string,
  dynamic: ProvisionedTenantRecord[],
  mockStepUpdates: Record<string, ProvisioningStep[]> = {},
): ProvisioningStep[] {
  const fromStore = dynamic.find((t) => t.id === tenantId);
  if (fromStore) return fromStore.steps;
  if (mockStepUpdates[tenantId]) return mockStepUpdates[tenantId];
  return MOCK_PROVISIONING_STEPS[tenantId] ?? [];
}

export function resolveDynamicTenant(
  tenantId: string,
  dynamic: ProvisionedTenantRecord[],
): ProvisionedTenantRecord | undefined {
  return dynamic.find((t) => t.id === tenantId);
}

export function resolveTenantMeta(
  tenantId: string,
  dynamic: ProvisionedTenantRecord[],
  overrides: Record<string, TenantOverride> = {},
): MockTenant | undefined {
  return mergeTenantLists(dynamic, overrides).find((t) => t.id === tenantId);
}

export function resolveRolesEnabled(
  tenantId: string,
  dynamic: ProvisionedTenantRecord[],
): Record<string, boolean> | undefined {
  return dynamic.find((t) => t.id === tenantId)?.rolesEnabled;
}

export function resolveConsentVersion(
  tenantId: string,
  dynamic: ProvisionedTenantRecord[],
): string | undefined {
  return dynamic.find((t) => t.id === tenantId)?.consentVersion;
}

/** Extract admin email from mock provisioning step label. */
export function mockAdminInviteEmail(tenantId: string): string | null {
  const steps = MOCK_PROVISIONING_STEPS[tenantId] ?? [];
  const adminStep = steps.find((s) => s.id === "admin");
  if (!adminStep) return null;
  const match = adminStep.label.match(/\(([^)]+)\)/);
  return match?.[1] ?? null;
}
