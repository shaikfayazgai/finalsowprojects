"use client";

/**
 * Tenant detail — operate an enterprise (Platform Admin §5.C.3).
 *
 * Layout:
 *   1. Identity header — monogram + name + status + the action cluster
 *      (pause / change tier / open audit) right where the operator looks.
 *   2. Persistent health strip — orientation that survives tab switches.
 *   3. Tabs — Overview (profile · plan history · configuration) / Users /
 *      Provisioning / Audit.
 *
 * Solid card system: stroke + soft shadow, solid dark figures, gradient as a
 * single accent (monogram, metric chips, active tab).
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  PauseCircle,
  Pencil,
  RefreshCw,
  ScrollText,
  SearchX,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import { PlanChangeHistoryRows } from "@/components/enterprise/subscription/PlanChangeHistory";
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
import {
  resolveConsentVersion,
  resolveDynamicTenant,
  resolveProvisioningSteps,
  resolveRolesEnabled,
} from "@/lib/admin/tenant-registry";
import { useAdminProvisioningStore } from "@/lib/stores/admin-provisioning-store";
import { useAdminProvisioningHydrated } from "@/lib/hooks/use-admin-provisioning-hydrated";
import { fetchAdminTenant, type AdminTenantDetail } from "@/lib/api/superadmin";
import {
  DEFAULT_LICENSED_ROLES,
  RELEASE_ENTERPRISE_ROLES,
  ROLE_META,
} from "@/app/enterprise/settings/tenant/tenant-roles";
import {
  EditSubscriptionModal,
  PauseTenantModal,
} from "@/app/admin/tenants/components/tenant-detail-modals";
import { TenantDetailSkeleton } from "@/app/admin/tenants/components/tenant-detail-skeleton";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";
import { DASH_CARD, GLASS_GRADIENT } from "../../_shell/aurora";
import { Chip, ProgressBar, primaryBtnClass, primaryStyle } from "../../_shell/aurora-ui";

type Tab = "overview" | "users" | "provisioning" | "audit";
type Tone = "error" | "warning" | "success" | "info" | "neutral";

const TABS: Tab[] = ["overview", "users", "provisioning", "audit"];
const TAB_LABEL: Record<Tab, string> = {
  overview: "Overview",
  users: "Users",
  provisioning: "Provisioning",
  audit: "Audit",
};

const STATUS_LABEL: Record<TenantStatus, string> = {
  active: "Active",
  provisioning: "Provisioning",
  paused: "Paused",
  draft: "Draft",
  closed: "Closed",
};

const STATUS_TONE: Record<TenantStatus, Tone> = {
  active: "success",
  provisioning: "info",
  paused: "warning",
  draft: "neutral",
  closed: "neutral",
};

const TONE_TEXT: Record<Tone, string> = {
  error: "var(--color-error-text)",
  warning: "var(--color-warning-text)",
  success: "var(--color-success-text)",
  info: "var(--color-info-text)",
  neutral: "var(--color-text-secondary)",
};

const DEFAULT_MOCK_ROLES: Record<string, boolean> = { ...DEFAULT_LICENSED_ROLES };
const RELEASE_ROLE_SET = new Set(RELEASE_ENTERPRISE_ROLES);

/** Solid secondary button — neutral surface, no glass. */
const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg shrink-0",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors",
);

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function provisioningPct(steps: ProvisioningStep[]): number | null {
  if (steps.length === 0) return null;
  const done = steps.filter((s) => s.state === "done").length;
  return Math.round((done / steps.length) * 100);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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

  // Real-data fetch for this tenant — undefined = in-flight, null = not found / error
  const [apiDetail, setApiDetail] = React.useState<AdminTenantDetail | null | undefined>(undefined);
  React.useEffect(() => {
    let cancelled = false;
    fetchAdminTenant(tenantId)
      .then((d) => { if (!cancelled) setApiDetail(d); })
      .catch((err: unknown) => {
        console.error("[TenantDetailWorkspace] fetch failed:", err);
        if (!cancelled) setApiDetail(null);
      });
    return () => { cancelled = true; };
  }, [tenantId]);

  /**
   * Resolve final tenant meta:
   *   1. If a locally-provisioned record exists in the store, use it (it has
   *      the most up-to-date state including step progress).
   *   2. Otherwise fall back to the API-fetched tenant, with any store
   *      overrides (pause / tier change) applied on top.
   */
  const tenant = React.useMemo<MockTenant | undefined>(() => {
    // Store-provisioned record takes priority (has full step data)
    const storeRecord = dynamicTenants.find((t) => t.id === tenantId);
    if (storeRecord) {
      return {
        id: storeRecord.id,
        name: storeRecord.name,
        domain: storeRecord.domain,
        tier: storeRecord.tier,
        status: storeRecord.status,
        users: storeRecord.status === "active" ? 2 : 1,
        sows: 0,
        provisionedAt: storeRecord.provisionedAt,
        msaRef: storeRecord.msaRef || "—",
        region: storeRecord.region,
        currency: storeRecord.currency,
        lastHrisSyncAt: null,
      };
    }
    if (!apiDetail?.tenant) return undefined;
    const ov = tenantOverrides[tenantId];
    if (!ov) return apiDetail.tenant;
    return {
      ...apiDetail.tenant,
      ...(ov.status ? { status: ov.status } : {}),
      ...(ov.tier ? { tier: ov.tier } : {}),
    };
  }, [apiDetail, dynamicTenants, tenantOverrides, tenantId]);

  const { data: planHistory, isLoading: planHistoryLoading } = useAdminTenantPlanHistory(tenantId);
  const queryClient = useQueryClient();
  const dynamic = resolveDynamicTenant(tenantId, dynamicTenants);
  const steps = resolveProvisioningSteps(tenantId, dynamicTenants, mockStepUpdates);
  const rolesEnabled = resolveRolesEnabled(tenantId, dynamicTenants) ?? DEFAULT_MOCK_ROLES;
  const consentVersion = resolveConsentVersion(tenantId, dynamicTenants);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "overview";

  const [pauseOpen, setPauseOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next === "overview") p.delete("tab");
      else p.set("tab", next);
      const qs = p.toString();
      router.replace(qs ? `/admin/tenants/${tenantId}?${qs}` : `/admin/tenants/${tenantId}`, { scroll: false });
    },
    [router, searchParams, tenantId],
  );

  // Show skeleton while store hydrates OR API fetch is in flight
  if (!hydrated || apiDetail === undefined) return <TenantDetailSkeleton />;

  if (!tenant) {
    return (
      <div className="space-y-5 pb-4 animate-fade-in">
        <BackLink />
        <div className={DASH_CARD}>
          <TenantEmptyState
            icon={SearchX}
            title="Tenant not found"
            description="This tenant may have been removed or the link is incorrect. Return to the registry to browse active enterprises."
            action={
              <Link href="/admin/tenants" className={primaryBtnClass} style={primaryStyle}>
                Back to tenants
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // Users: prefer API response, fall back to locally-provisioned admin invite row
  const users: TenantUserRow[] =
    apiDetail?.users && apiDetail.users.length > 0
      ? apiDetail.users
      : dynamic
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

  const enabledRoles = Object.entries(rolesEnabled).filter(
    ([key, on]) => on && RELEASE_ROLE_SET.has(key as (typeof RELEASE_ENTERPRISE_ROLES)[number]),
  );
  const pct = provisioningPct(steps);
  const pendingCount = steps.filter((s) => s.state === "pending").length;
  const currentStepLabel = steps.find((s) => s.state === "pending" || s.state === "failed")?.label ?? null;
  const auditEvents = MOCK_ADMIN_AUDIT_EVENTS.filter((e) => e.tenantId === tenant.id).slice(0, 8);
  const tasksCompleted = tenant.sows * 26 + tenant.users;
  const canPause = tenant.status !== "paused" && tenant.status !== "closed";
  const isProvisioning = tenant.status === "provisioning";

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[13px] font-semibold text-success-text"
        >
          {toast}
        </div>
      )}

      <BackLink />

      {/* ── Identity + actions ── */}
      <header className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between")}>
        <div className="flex items-center gap-4 min-w-0">
          <span
            className="grid place-items-center h-12 w-12 rounded-lg text-white font-display text-[17px] font-bold shrink-0"
            style={GLASS_GRADIENT}
            aria-hidden
          >
            {initials(tenant.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[24px] sm:text-[27px] font-bold tracking-[-0.03em] text-foreground leading-none">
                {tenant.name}
              </h1>
              <Chip tone={STATUS_TONE[tenant.status]}>{STATUS_LABEL[tenant.status]}</Chip>
            </div>
            <p className="mt-2 font-body text-[12.5px] text-text-secondary">
              {tenant.tier}
              <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
              {tenant.domain}
              <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
              {tenant.msaRef}
              <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
              Provisioned {fmtDate(tenant.provisionedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isProvisioning && (
            <Link href={`/admin/tenants/${tenant.id}/provisioning`} className={primaryBtnClass} style={primaryStyle}>
              Continue setup
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            </Link>
          )}
          {canPause && (
            <button type="button" onClick={() => setPauseOpen(true)} className={BTN_SECONDARY}>
              <PauseCircle className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
              Pause
            </button>
          )}
          <button type="button" onClick={() => setEditOpen(true)} className={BTN_SECONDARY}>
            <Pencil className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
            Change tier
          </button>
          <Link href={`/admin/audit?tenant=${tenant.id}`} className={BTN_SECONDARY}>
            <ExternalLink className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
            Open audit
          </Link>
        </div>
      </header>

      {tenant.status === "paused" && (
        <div
          className="flex items-start gap-3 rounded-lg border border-warning-border bg-warning-subtle px-4 py-3"
          style={{ borderLeftWidth: 3, borderLeftColor: "var(--color-warning-solid)" }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning-text" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] text-text-secondary">
            Tenant paused — new SOWs and non-admin logins are blocked.
          </p>
        </div>
      )}

      {/* ── Persistent health strip ── */}
      <section aria-label="Platform health" className={cn(DASH_CARD, "p-4 sm:p-5")}>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-5">
          <Metric icon={Users} label="Active users (30d)" value={`${Math.round(tenant.users * 0.93)}/${tenant.users}`} />
          <Metric icon={FileText} label="SOWs in flight" value={String(tenant.sows)} />
          <Metric icon={CheckCircle2} label="Tasks completed" value={String(tasksCompleted)} />
          <Metric icon={CreditCard} label="Payouts (30d)" value={tenant.payouts30d ?? "—"} />
          <Metric icon={RefreshCw} label="HRIS sync" value={tenant.lastHrisSyncAt ? fmtRelative(tenant.lastHrisSyncAt) : "—"} suppressHydrationWarning />
        </dl>
      </section>

      <SectionTabs
        active={activeTab}
        onChange={setTab}
        badges={{
          users: users.length,
          provisioning: isProvisioning ? pendingCount : null,
          audit: auditEvents.length,
        }}
      />

      {activeTab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-5">
            <SectionCard title="Tenant profile">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailRow label="Domain" value={tenant.domain} mono />
                <DetailRow label="Region" value={tenant.region} />
                <DetailRow label="Currency" value={tenant.currency} />
                <DetailRow label="MSA reference" value={tenant.msaRef} mono />
                <DetailRow label="Tenant ID" value={tenant.id} mono />
                <DetailRow label="Provisioned" value={fmtDate(tenant.provisionedAt)} />
              </dl>
            </SectionCard>

            <SectionCard title="Plan change history" flushList={Boolean(planHistory?.length) || planHistoryLoading}>
              {planHistoryLoading ? (
                <PlanChangeHistoryRows items={planHistory} isLoading variant="flush" />
              ) : !planHistory?.length ? (
                <TenantEmptyState
                  compact
                  icon={CreditCard}
                  title="No tier changes yet"
                  description="Subscription updates appear here after you assign or change a plan."
                  action={
                    <button type="button" onClick={() => setEditOpen(true)} className={BTN_SECONDARY}>
                      <Pencil className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                      Change tier
                    </button>
                  }
                  className="py-8"
                />
              ) : (
                <PlanChangeHistoryRows items={planHistory} variant="flush" />
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Configuration"
            description={
              <>
                {enabledRoles.length} licensed role{enabledRoles.length === 1 ? "" : "s"}
                {consentVersion ? ` · ${consentLabel(consentVersion)}` : ""}
              </>
            }
            flushList={enabledRoles.length > 0}
          >
            {enabledRoles.length === 0 ? (
              <TenantEmptyState
                compact
                icon={Shield}
                title="No roles enabled"
                description="Licensed enterprise roles will appear here once configured for this tenant."
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-stroke-subtle">
                {enabledRoles.map(([key]) => {
                  const meta = ROLE_META[key as keyof typeof ROLE_META];
                  return (
                    <li key={key} className="flex flex-wrap items-baseline gap-x-2 px-4 sm:px-5 py-2.5">
                      <code className="font-mono text-[11px] text-text-tertiary">ent.{key}</code>
                      <span className="font-body text-[13px] font-medium text-foreground">{meta?.label ?? key}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {activeTab === "users" && (
        <SectionCard
          title="Users"
          description="Enterprise accounts provisioned for this tenant"
          action={
            users.length > 0 ? (
              <span className="font-mono text-[12px] text-text-tertiary tabular-nums">{users.length}</span>
            ) : null
          }
          flushList={users.length > 0}
        >
          {users.length === 0 ? (
            <TenantEmptyState
              icon={Users}
              title="No users yet"
              description="Users appear after the primary admin accepts their invite and signs in for the first time."
              action={
                isProvisioning ? (
                  <Link href={`/admin/tenants/${tenant.id}/provisioning`} className={primaryBtnClass} style={primaryStyle}>
                    View provisioning
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                  </Link>
                ) : undefined
              }
              className="py-10"
            />
          ) : (
            <ul className="divide-y divide-stroke-subtle">
              {users.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {activeTab === "provisioning" && (
        <SectionCard
          title="Provisioning"
          description="Onboarding progress until the tenant is fully live"
          action={
            <Link href={`/admin/tenants/${tenant.id}/provisioning`} className={BTN_SECONDARY}>
              <Settings2 className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
              Full timeline
            </Link>
          }
        >
          <div className="space-y-4">
            {pct != null ? (
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-body text-[13px] font-semibold text-foreground">Setup progress</span>
                </div>
                <ProgressBar pct={pct} />
              </div>
            ) : (
              <TenantEmptyState
                compact
                icon={Settings2}
                title="No setup steps tracked"
                description="Open the provisioning timeline for step-by-step status, admin invite, and retry actions."
                action={
                  <Link href={`/admin/tenants/${tenant.id}/provisioning`} className={primaryBtnClass} style={primaryStyle}>
                    Open provisioning timeline
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                  </Link>
                }
                className="py-6"
              />
            )}
            {pct != null ? (
              <>
                <p className="font-body text-[13px] text-text-secondary">
                  {currentStepLabel ? (
                    <>
                      Current step: <span className="font-semibold text-foreground">{currentStepLabel}</span>
                      {pendingCount > 0 && <span className="text-text-tertiary"> · {pendingCount} pending</span>}
                    </>
                  ) : (
                    "All setup steps complete."
                  )}
                </p>
                <Link href={`/admin/tenants/${tenant.id}/provisioning`} className={primaryBtnClass} style={primaryStyle}>
                  Open provisioning timeline
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                </Link>
              </>
            ) : null}
          </div>
        </SectionCard>
      )}

      {activeTab === "audit" && (
        <SectionCard
          title="Recent audit"
          description="Newest platform actions for this tenant"
          action={
            <Link
              href={`/admin/audit?tenant=${tenant.id}`}
              className="font-body text-[12px] font-semibold text-text-link hover:underline underline-offset-2"
            >
              Full audit log
            </Link>
          }
          flushList={auditEvents.length > 0}
        >
          {auditEvents.length === 0 ? (
            <TenantEmptyState
              icon={ScrollText}
              title="No audit events yet"
              description="Platform actions for this tenant — tier changes, pauses, provisioning — will show up here."
              action={
                <Link href={`/admin/audit?tenant=${tenant.id}`} className={BTN_SECONDARY}>
                  <ExternalLink className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                  Open full audit log
                </Link>
              }
              className="py-10"
            />
          ) : (
            <ul className="divide-y divide-stroke-subtle">
              {auditEvents.map((e) => (
                <AuditRow key={e.id} event={e} />
              ))}
            </ul>
          )}
        </SectionCard>
      )}

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
            const { patchAdminTenantSubscription, planCodeFromAdminTierLabel } = await import("@/lib/api/subscription");
            await patchAdminTenantSubscription(tenant.id, {
              planCode: planCodeFromAdminTierLabel(tier),
              contractRef: tenant.msaRef,
              trialDays: tier === "Trial" ? 14 : undefined,
            });
            void queryClient.invalidateQueries({ queryKey: ["admin", "tenant", tenant.id, "subscription", "history"] });
          } catch {
            /* mock tenant — store-only is fine */
          }
          setToast(`Subscription updated to ${tier}`);
        }}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/tenants"
      className="inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      Tenants
    </Link>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
  flushList,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  flushList?: boolean;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
        <div className="min-w-0">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(!flushList && "px-4 sm:px-5 py-4")}>{children}</div>
    </section>
  );
}

function SectionTabs({
  active,
  onChange,
  badges,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  badges: { users: number; provisioning: number | null; audit: number };
}) {
  return (
    <div role="tablist" aria-label="Tenant sections" className="flex flex-wrap gap-1.5">
      {TABS.map((key) => {
        const isActive = active === key;
        const badge =
          key === "users" ? badges.users : key === "provisioning" ? badges.provisioning : key === "audit" ? badges.audit : null;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            style={isActive ? GLASS_GRADIENT : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold transition-colors",
              isActive ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
            )}
          >
            {TAB_LABEL[key]}
            {badge != null && badge > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                  isActive ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  suppressHydrationWarning,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  suppressHydrationWarning?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      {Icon ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white shrink-0" style={GLASS_GRADIENT}>
          <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0">
        <dt className="font-body text-[11px] font-medium text-text-tertiary truncate">{label}</dt>
        <dd
          suppressHydrationWarning={suppressHydrationWarning}
          className="mt-1 font-display text-[20px] font-bold tabular-nums leading-none text-foreground"
        >
          {value}
        </dd>
      </div>
    </div>
  );
}

function UserRow({ user: u }: { user: TenantUserRow }) {
  const tone: Tone = u.status === "active" ? "success" : u.status === "invited" ? "info" : "warning";
  return (
    <li className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5">
      <span className="min-w-0 flex-1">
        <span className="font-body text-[13.5px] font-semibold text-foreground">{u.name}</span>
        <span className="font-mono text-[11px] text-text-tertiary block mt-0.5 truncate">{u.email}</span>
        <span className="font-mono text-[10.5px] text-text-tertiary block mt-0.5">{u.role}</span>
      </span>
      <span className="shrink-0 text-right flex flex-col items-end gap-1">
        <Chip tone={tone}>{u.status}</Chip>
        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums" suppressHydrationWarning>
          {u.lastSeen ? fmtRelative(u.lastSeen) : "—"}
        </span>
      </span>
    </li>
  );
}

function AuditRow({ event: e }: { event: (typeof MOCK_ADMIN_AUDIT_EVENTS)[number] }) {
  const sevTone: Tone = e.severity === "critical" ? "error" : e.severity === "warning" ? "warning" : "neutral";
  return (
    <li>
      <Link
        href={`/admin/audit?event=${encodeURIComponent(e.id)}`}
        className="group flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5 hover:bg-bg-subtle transition-colors"
      >
        <span className="min-w-0 flex-1">
          <span className="font-body text-[13px] font-semibold text-foreground truncate block">{e.resourceLabel}</span>
          <span className="font-mono text-[10.5px] text-text-tertiary block mt-0.5">
            {e.action} · {e.actor}
          </span>
        </span>
        <span className="shrink-0 flex items-center gap-2">
          <span className="text-right flex flex-col items-end gap-0.5">
            <span className="font-body text-[10px] font-semibold uppercase tracking-[0.04em]" style={{ color: TONE_TEXT[sevTone] }}>
              {e.severity}
            </span>
            <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap" suppressHydrationWarning>
              {fmtRelative(e.timestamp)}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary" strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </li>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[12px] font-medium text-text-tertiary">{label}</dt>
      <dd className={cn("mt-0.5 font-body text-[13.5px] text-foreground", mono && "font-mono text-[12.5px]")}>{value}</dd>
    </div>
  );
}
