"use client";

/**
 * Tenant detail — aligned with tenant registry list + admin detail section patterns.
 *
 *   · URL-synced tabs (?tab=overview|users|provisioning|audit)
 *   · DashboardSection blocks + rounded-xl panels
 *   · Scannable rows (users, audit) — no wide data grids
 *   · Inline provisioning steps + invite on Provisioning tab
 */

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiCall } from "@/lib/api/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Loader2,
  Mail,
  PauseCircle,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { PlanChangeHistory } from "@/components/enterprise/subscription/PlanChangeHistory";
import { useAdminTenantPlanHistory } from "@/lib/hooks/use-subscription-plan-history";
import { MOCK_ADMIN_AUDIT_EVENTS } from "@/mocks/admin/audit";
import {
  MOCK_TENANT_USERS,
  type MockTenant,
  type ProvisioningStep,
  type TenantStatus,
  type TenantUserRow,
} from "@/mocks/admin/tenants";
import { consentLabel } from "@/lib/admin/consent-versions";
import { getInviteRoleSpec } from "@/lib/admin/invite-routes";
import {
  mockAdminInviteEmail,
  resolveConsentVersion,
  resolveDynamicTenant,
  resolveProvisioningSteps,
  resolveRolesEnabled,
  resolveTenantMeta,
} from "@/lib/admin/tenant-registry";
import {
  mockTenantInviteToken,
  useAdminProvisioningStore,
} from "@/lib/stores/admin-provisioning-store";
import { useAdminProvisioningHydrated } from "@/lib/hooks/use-admin-provisioning-hydrated";
import { ROLE_META } from "@/app/enterprise/settings/tenant/tenant-roles";
import {
  EditSubscriptionModal,
  PauseTenantModal,
} from "@/app/admin/tenants/components/tenant-detail-modals";
import { TenantDetailSkeleton } from "@/app/admin/tenants/components/tenant-detail-skeleton";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "users" | "provisioning" | "audit";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "provisioning", label: "Provisioning" },
  { key: "audit", label: "Audit" },
];

const STATUS_LABEL: Record<TenantStatus, string> = {
  active: "Active",
  provisioning: "Provisioning",
  paused: "Paused",
  draft: "Draft",
  closed: "Closed",
};

const STATUS_CHIP: Record<TenantStatus, "success" | "pending" | "warning" | "neutral"> = {
  active: "success",
  provisioning: "pending",
  paused: "warning",
  draft: "neutral",
  closed: "neutral",
};

const DEFAULT_MOCK_ROLES: Record<string, boolean> = {
  admin: true,
  sponsor: true,
  pmo: true,
  finance: true,
  reviewer: true,
  it: true,
};

function provisioningPct(steps: ProvisioningStep[]): number | null {
  if (steps.length === 0) return null;
  const done = steps.filter((s) => s.state === "done").length;
  return Math.round((done / steps.length) * 100);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelative(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export function TenantDetailWorkspace() {
  const hydrated = useAdminProvisioningHydrated();
  const params = useParams<{ tenantId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const dynamicTenants = useAdminProvisioningStore((s) => s.tenants);
  const tenantOverrides = useAdminProvisioningStore((s) => s.tenantOverrides);
  const mockStepUpdates = useAdminProvisioningStore((s) => s.mockStepUpdates);
  const pauseTenant = useAdminProvisioningStore((s) => s.pauseTenant);
  const updateTenantTier = useAdminProvisioningStore((s) => s.updateTenantTier);

  const tenantId = params.tenantId;
  const tenant = resolveTenantMeta(tenantId, dynamicTenants, tenantOverrides);
  const { data: planHistory, isLoading: planHistoryLoading } = useAdminTenantPlanHistory(tenantId);
  const queryClient = useQueryClient();
  const dynamic = resolveDynamicTenant(tenantId, dynamicTenants);
  const mockSteps = resolveProvisioningSteps(tenantId, dynamicTenants, mockStepUpdates);
  const rolesEnabled = resolveRolesEnabled(tenantId, dynamicTenants) ?? DEFAULT_MOCK_ROLES;
  const consentVersion = resolveConsentVersion(tenantId, dynamicTenants);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

  const { data: credSession } = useSession();
  // Real provisioning status (admin sign-in / employees / SOW) from the backend;
  // falls back to the store/mock steps until the first fetch lands. No HRIS step.
  const detailToken = (credSession?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  const [liveSteps, setLiveSteps] = React.useState<ProvisioningStep[] | null>(null);
  const [liveSignals, setLiveSignals] = React.useState<{ sowCount?: number; employeeCount?: number } | null>(null);
  // The tenant's known admin email — used as a fallback so the backend can
  // resolve a legacy account whose tenant_id link predates provisioning.
  const detailAdminEmail = dynamic?.adminEmail ?? mockAdminInviteEmail(tenantId) ?? "";
  const [refreshTick, setRefreshTick] = React.useState(0);
  React.useEffect(() => {
    if (!detailToken || !tenantId) return;
    let cancelled = false;
    const qs = detailAdminEmail ? `?admin_email=${encodeURIComponent(detailAdminEmail)}` : "";
    apiCall<{ steps: ProvisioningStep[]; signals?: { sowCount?: number; employeeCount?: number } }>(`/api/superadmin/tenants/${tenantId}/provisioning-status${qs}`, { token: detailToken })
      .then((r) => { if (!cancelled) { if (r?.steps?.length) setLiveSteps(r.steps); if (r?.signals) setLiveSignals(r.signals); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [detailToken, tenantId, detailAdminEmail, refreshTick]);
  const steps = liveSteps ?? mockSteps;
  const [pauseOpen, setPauseOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  // Credentials-flow state — declared with the other hooks (above the early
  // returns below) to satisfy the rules of hooks.
  const [credState, setCredState] = React.useState<"idle" | "sending" | "sent">("idle");
  // Whether the primary admin account already exists — drives Send vs Resend.
  const [credExists, setCredExists] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    if (!detailToken || !detailAdminEmail) return;
    let cancelled = false;
    apiCall<{ exists: boolean }>(`/api/superadmin/users/check-email?email=${encodeURIComponent(detailAdminEmail)}`, { token: detailToken })
      .then((r) => { if (!cancelled) setCredExists(!!r?.exists); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [detailToken, detailAdminEmail]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "overview") params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(
        qs ? `/admin/tenants/${tenantId}?${qs}` : `/admin/tenants/${tenantId}`,
        { scroll: false },
      );
    },
    [router, searchParams, tenantId],
  );

  if (!hydrated) return <TenantDetailSkeleton />;

  if (!tenant) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Tenants
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Tenant not found.</p>
      </div>
    );
  }

  const users: TenantUserRow[] = dynamic
    ? [
        {
          id: "u-invited",
          email: dynamic.adminEmail,
          name: dynamic.adminName,
          role: "ent.admin",
          status: "invited",
          lastSeen: undefined,
        },
      ]
    : (MOCK_TENANT_USERS[tenant.id] ?? []);

  const enabledRoles = Object.entries(rolesEnabled).filter(([, on]) => on);
  const pct = provisioningPct(steps);
  const auditEvents = MOCK_ADMIN_AUDIT_EVENTS.filter((e) => e.tenantId === tenant.id).slice(0, 8);

  const mockEmail = mockAdminInviteEmail(tenantId);
  const inviteSpec = getInviteRoleSpec("enterprise_admin");
  const inviteUrl = dynamic?.inviteUrl ?? null; // legacy display only
  const inviteEmail = dynamic?.adminEmail ?? mockEmail;
  const inviteName = dynamic?.adminName ?? mockEmail?.split("@")[0] ?? "Admin";

  // Credentials flow (replaces invite links).
  const credToken = (credSession?.user as { accessToken?: string } | undefined)?.accessToken ?? "";

  async function sendCredentials() {
    if (!inviteEmail || credState !== "idle") return;
    setCredState("sending");
    try {
      await apiCall("/api/superadmin/users", {
        method: "POST",
        token: credToken,
        body: JSON.stringify({
          email: inviteEmail, firstName: inviteName, role: "enterprise",
          tenantId, sendCredentials: true, resendExisting: true,
        }),
      });
      setCredState("sent");
      setCredExists(true);
      setToast(
        credExists
          ? `Fresh credentials re-sent to ${inviteEmail}`
          : `Credentials emailed to ${inviteEmail}`,
      );
      // Re-fetch the live timeline — the account is now linked to the tenant.
      setRefreshTick((n) => n + 1);
      setTimeout(() => setCredState("idle"), 2500);
    } catch {
      setCredState("idle");
      setToast("Could not send credentials. Try again.");
    }
  }

  const canPause = tenant.status !== "paused" && tenant.status !== "closed";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-subtle px-4 py-2 font-body text-[12.5px] text-success-text"
        >
          {toast}
        </div>
      )}

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Tenants</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary truncate">{tenant.name}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Tenant
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {tenant.name}
            </h1>
            <StatusChip status={STATUS_CHIP[tenant.status]} size="sm" showDot>
              {STATUS_LABEL[tenant.status]}
            </StatusChip>
            <TierBadge tier={tenant.tier} />
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            {tenant.domain}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {tenant.msaRef}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Provisioned {fmtDate(tenant.provisionedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {tenant.status === "provisioning" && (
            <Link
              href={`/admin/tenants/${tenant.id}/provisioning`}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
                "bg-brand text-on-brand font-body text-[13px] font-semibold shadow-xs",
                "hover:bg-brand-hover transition-colors duration-fast",
              )}
            >
              Continue setup →
            </Link>
          )}
          {canPause && (
            <button
              type="button"
              onClick={() => setPauseOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-bg-subtle transition-colors duration-fast"
            >
              <PauseCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-bg-subtle transition-colors duration-fast"
          >
            <Edit3 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Edit tier
          </button>
          <Link
            href={`/admin/audit?tenant=${tenant.id}`}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-bg-subtle transition-colors duration-fast"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Audit
          </Link>
        </div>
      </header>

      {tenant.status === "provisioning" && pct != null && activeTab !== "provisioning" && (
        <ContextBanner title={`Setup ${pct}% complete`}>
          {steps.filter((s) => s.state === "pending").length} step
          {steps.filter((s) => s.state === "pending").length === 1 ? "" : "s"} remaining.
          {" "}
          <button
            type="button"
            onClick={() => setTab("provisioning")}
            className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
          >
            View provisioning
          </button>
        </ContextBanner>
      )}

      {tenant.status === "paused" && (
        <div className="rounded-xl border border-warning-border bg-warning-subtle/50 px-4 py-3">
          <p className="font-body text-[13px] font-semibold flex items-center gap-1.5 text-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-warning-text shrink-0" strokeWidth={2} aria-hidden />
            Tenant paused
          </p>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            New SOWs and non-admin logins are blocked. Existing milestones continue until close.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav aria-label="Tenant sections" className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge =
              t.key === "users"
                ? users.length
                : t.key === "audit"
                  ? auditEvents.length
                  : t.key === "provisioning" && tenant.status === "provisioning"
                    ? steps.filter((s) => s.state === "pending").length
                    : null;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                  "font-body text-[13px] font-medium whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                  active ? "text-foreground" : "text-text-secondary",
                )}
              >
                {t.label}
                {badge != null && badge > 0 && (
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                      active ? "bg-brand-subtle text-brand-subtle-text" : "text-text-tertiary",
                      t.key === "provisioning" && !active && "text-warning-text font-semibold",
                    )}
                  >
                    {badge}
                  </span>
                )}
                {active && (
                  <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className={activeTab === "overview" ? "p-5 space-y-5" : undefined}>
          {activeTab === "overview" && (
            <>
              <DashboardSection bare title="Platform health" description="Last 30 days · demo metrics">
                <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-4">
                  <SummaryStat
                    label="Active users"
                    value={`${Math.round(tenant.users * 0.93)}/${tenant.users}`}
                  />
                  <SummaryStat label="SOWs in flight" value={String(liveSignals?.sowCount ?? tenant.sows)} />
                  <SummaryStat label="Tasks completed" value="362" />
                  <SummaryStat label="Payouts (30d)" value={tenant.payouts30d ?? "—"} />
                  <SummaryStat
                    label="HRIS sync"
                    value={tenant.lastHrisSyncAt ? fmtRelative(tenant.lastHrisSyncAt) : "—"}
                  />
                </dl>
              </DashboardSection>

              <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Tenant profile
                  </h2>
                </header>
                <dl className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  <DetailRow label="Domain" value={tenant.domain} mono />
                  <DetailRow label="Region" value={tenant.region} />
                  <DetailRow label="Currency" value={tenant.currency} />
                  <DetailRow label="MSA reference" value={tenant.msaRef} mono />
                  <DetailRow label="Tenant ID" value={tenant.id} mono />
                  <DetailRow label="Provisioned" value={fmtDate(tenant.provisionedAt)} />
                </dl>
              </section>

              <PlanChangeHistory
                items={planHistory}
                isLoading={planHistoryLoading}
                emptyMessage="No subscription tier changes yet. Use Edit tier to assign a plan."
              />

              <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Licensed enterprise roles
                  </h2>
                  <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                    Role types enabled for this tenant — members are assigned from the enterprise portal.
                  </p>
                </header>
                {enabledRoles.length === 0 ? (
                  <p className="px-5 py-4 font-body text-[12.5px] text-text-tertiary">No roles enabled.</p>
                ) : (
                  <ul className="divide-y divide-stroke-subtle">
                    {enabledRoles.map(([key]) => {
                      const meta = ROLE_META[key as keyof typeof ROLE_META];
                      return (
                        <li key={key} className="px-5 py-3 flex items-baseline gap-3">
                          <code className="font-mono text-[11px] text-brand-emphasis shrink-0">
                            ent.{key}
                          </code>
                          <span className="font-body text-[13px] font-medium text-foreground">
                            {meta?.label ?? key}
                          </span>
                          {meta?.description && (
                            <span className="font-body text-[11.5px] text-text-tertiary hidden md:inline truncate">
                              — {meta.description}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {consentVersion && (
                  <footer className="px-5 py-3 border-t border-stroke-subtle font-body text-[12px] text-text-secondary">
                    Consent version:{" "}
                    <strong className="text-foreground">{consentLabel(consentVersion)}</strong>
                  </footer>
                )}
              </section>
            </>
          )}

          {activeTab === "users" && (
            <>
              <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
                <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                  Enterprise users
                </h2>
                <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                  {users.length === 0
                    ? "No users yet"
                    : `${users.length} member${users.length === 1 ? "" : "s"} · directory sync demo`}
                </p>
              </header>
              {users.length === 0 ? (
                <p className="px-5 py-10 text-center font-body text-[12.5px] text-text-tertiary">
                  Users appear after the primary admin accepts their invite.
                </p>
              ) : (
                <ul className="divide-y divide-stroke-subtle">
                  {users.map((u) => (
                    <UserRow key={u.id} user={u} />
                  ))}
                </ul>
              )}
            </>
          )}

          {activeTab === "provisioning" && (
            <div className="p-5 space-y-5">
              {inviteEmail && (
                <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                  <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                        Primary admin account
                      </h2>
                      <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                        {credExists ? "Re-provision" : "Provision"} {inviteName} ({inviteEmail}) —
                        they receive their email + a temporary password and reset it on first
                        sign-in.{credExists ? " Resending emails a fresh temporary password." : ""}{" "}
                        Post sign-in:{" "}
                        <code className="font-mono text-[11px]">
                          {dynamic?.postLoginPath ?? inviteSpec.postLoginPath}
                        </code>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle text-brand-emphasis px-2 py-0.5 font-body text-[10.5px] font-semibold">
                      <Mail className="h-3 w-3" aria-hidden />
                      Credentials by email
                    </span>
                  </header>
                  <div className="px-5 py-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={sendCredentials}
                      disabled={credState !== "idle"}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-brand text-on-brand font-body text-[12px] font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
                    >
                      {credState === "sent" ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      ) : (
                        <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                      )}
                      {credState === "sending"
                        ? "Sending…"
                        : credState === "sent"
                          ? (credExists ? "Credentials re-sent" : "Credentials sent")
                          : (credExists ? "Resend credentials" : "Send credentials")}
                    </button>
                    <Link
                      href={`/admin/tenants/${tenant.id}/employees`}
                      className="font-body text-[12px] font-semibold text-text-link"
                    >
                      Add employees →
                    </Link>
                    <Link
                      href={`/admin/tenants/${tenant.id}/provisioning`}
                      className="font-body text-[12px] font-semibold text-text-link"
                    >
                      Full provisioning view →
                    </Link>
                  </div>
                </section>
              )}

              <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                      Setup checklist
                    </h2>
                    <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                      {pct != null ? `${pct}% complete` : "No steps recorded"}
                      {steps.filter((s) => s.state === "pending").length > 0 &&
                        ` · ${steps.filter((s) => s.state === "pending").length} pending`}
                    </p>
                  </div>
                  {pct != null && (
                    <div className="w-32">
                      <ProvisioningBar pct={pct} />
                    </div>
                  )}
                </header>
                <ul className="divide-y divide-stroke-subtle">
                  {steps.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <StepIcon state={s.state} />
                      <p
                        className={cn(
                          "flex-1 font-body text-[13px]",
                          s.state === "done"
                            ? "text-foreground"
                            : s.state === "failed"
                              ? "text-error-text"
                              : "text-text-secondary",
                        )}
                      >
                        {s.label}
                      </p>
                      <span
                        className={cn(
                          "font-mono text-[11px] tabular-nums shrink-0",
                          s.state === "done"
                            ? "text-success-text"
                            : s.state === "failed"
                              ? "text-error-text"
                              : "text-text-tertiary",
                        )}
                      >
                        {s.at
                          ? fmtDateTime(s.at)
                          : s.state === "done"
                            ? "Done"
                            : s.state === "failed"
                              ? "Failed"
                              : "Pending"}
                      </span>
                    </li>
                  ))}
                  {steps.length === 0 && (
                    <li className="px-5 py-6 font-body text-[12.5px] text-text-tertiary text-center">
                      No provisioning steps recorded.
                    </li>
                  )}
                </ul>
              </section>
            </div>
          )}

          {activeTab === "audit" && (
            <>
              <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Recent audit events
                  </h2>
                  <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                    Tenant-scoped activity · newest first
                  </p>
                </div>
                <Link
                  href={`/admin/audit?tenant=${tenant.id}`}
                  className="font-body text-[12px] font-semibold text-text-link shrink-0"
                >
                  Open full audit →
                </Link>
              </header>
              {auditEvents.length === 0 ? (
                <p className="px-5 py-10 text-center font-body text-[12.5px] text-text-tertiary">
                  No audit events for this tenant yet.
                </p>
              ) : (
                <ul className="divide-y divide-stroke-subtle">
                  {auditEvents.map((e) => (
                    <AuditRow key={e.id} event={e} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>

      <PauseTenantModal
        open={pauseOpen}
        tenantName={tenant.name}
        onClose={() => setPauseOpen(false)}
        onConfirm={(reason) => {
          pauseTenant(tenant.id, reason);
          setToast(`Tenant paused — ${reason.slice(0, 60)}${reason.length > 60 ? "…" : ""}`);
        }}
      />

      <EditSubscriptionModal
        open={editOpen}
        tenantName={tenant.name}
        currentTier={tenant.tier}
        onClose={() => setEditOpen(false)}
        onConfirm={async (tier) => {
          updateTenantTier(tenant.id, tier);
          try {
            const { patchAdminTenantSubscription, planCodeFromAdminTierLabel } = await import(
              "@/lib/api/subscription"
            );
            await patchAdminTenantSubscription(tenant.id, {
              planCode: planCodeFromAdminTierLabel(tier),
              contractRef: tenant.msaRef,
              trialDays: tier === "Trial" ? 14 : undefined,
            });
            void queryClient.invalidateQueries({
              queryKey: ["admin", "tenant", tenant.id, "subscription", "history"],
            });
          } catch {
            /* mock tenant — store-only is fine */
          }
          setToast(`Subscription updated to ${tier}`);
        }}
      />
    </div>
  );
}

function UserRow({ user: u }: { user: TenantUserRow }) {
  const statusTone =
    u.status === "active" ? "success" : u.status === "invited" ? "pending" : "warning";

  return (
    <li>
      <div className="flex items-center justify-between gap-4 px-5 py-3 min-h-[52px] hover:bg-bg-subtle/40 transition-colors duration-fast">
        <span className="min-w-0 flex-1">
          <span className="font-body text-[13px] font-medium text-foreground">{u.name}</span>
          <span className="font-mono text-[11px] text-text-tertiary block mt-0.5 truncate">{u.email}</span>
          <span className="font-mono text-[10.5px] text-text-tertiary block mt-0.5">{u.role}</span>
        </span>
        <span className="shrink-0 text-right flex flex-col items-end gap-1">
          <StatusChip status={statusTone} size="sm" showDot>
            {u.status}
          </StatusChip>
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
            {u.lastSeen ? fmtRelative(u.lastSeen) : "—"}
          </span>
        </span>
      </div>
    </li>
  );
}

function AuditRow({ event: e }: { event: (typeof MOCK_ADMIN_AUDIT_EVENTS)[number] }) {
  return (
    <li>
      <Link
        href={`/admin/audit/${e.id}`}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[48px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="font-body text-[13px] font-medium text-foreground truncate block">
            {e.resourceLabel}
          </span>
          <span className="font-mono text-[10.5px] text-text-tertiary block mt-0.5">
            {e.action} · {e.actor}
          </span>
        </span>
        <span className="shrink-0 text-right flex flex-col items-end gap-0.5">
          <span
            className={cn(
              "font-body text-[10px] font-semibold uppercase tracking-[0.05em]",
              e.severity === "critical"
                ? "text-error-text"
                : e.severity === "warning"
                  ? "text-warning-text"
                  : "text-text-tertiary",
            )}
          >
            {e.severity}
          </span>
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
            {fmtRelative(e.timestamp)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </dd>
    </div>
  );
}

function TierBadge({ tier }: { tier: MockTenant["tier"] }) {
  const tone: Record<MockTenant["tier"], string> = {
    Enterprise: "bg-brand-subtle text-brand-emphasis",
    Growth: "bg-info-subtle text-info-text",
    Pilot: "bg-bg-subtle text-text-secondary",
    Trial: "bg-warning-subtle text-warning-text",
  };
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2 py-0.5 font-body text-[10px] font-semibold",
        tone[tier],
      )}
    >
      {tier}
    </span>
  );
}

function ProvisioningBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-bg-subtle overflow-hidden">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0">{pct}%</span>
    </div>
  );
}

function StepIcon({ state }: { state: ProvisioningStep["state"] }) {
  if (state === "done") {
    return (
      <span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-subtle text-success-text shrink-0"
      >
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-error-subtle text-error-text shrink-0"
      >
        <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-bg-subtle text-text-tertiary shrink-0"
    >
      <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
    </span>
  );
}

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand/25 bg-brand-subtle/20 px-4 py-3">
      <p className="font-body text-[13px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}
