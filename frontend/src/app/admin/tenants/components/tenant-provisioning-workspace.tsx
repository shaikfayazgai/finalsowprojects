"use client";

/**
 * Tenant provisioning — full-page setup view aligned with tenant detail + registry UX.
 */

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiCall, ApiError } from "@/lib/api/client";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Circle,
  Clock,
  Copy,
  ExternalLink,
  Mail,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import type { MockTenant, ProvisioningStep, TenantStatus } from "@/mocks/admin/tenants";
import { getInviteRoleSpec } from "@/lib/admin/invite-routes";
import {
  mockAdminInviteEmail,
  resolveDynamicTenant,
  resolveProvisioningSteps,
  resolveTenantMeta,
} from "@/lib/admin/tenant-registry";
import {
  mockTenantInviteToken,
  useAdminProvisioningStore,
} from "@/lib/stores/admin-provisioning-store";
import { useAdminProvisioningHydrated } from "@/lib/hooks/use-admin-provisioning-hydrated";
import { TenantProvisioningSkeleton } from "./tenant-provisioning-skeleton";
import { cn } from "@/lib/utils/cn";

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

function provisioningPct(steps: ProvisioningStep[]): number | null {
  if (steps.length === 0) return null;
  const done = steps.filter((s) => s.state === "done").length;
  return Math.round((done / steps.length) * 100);
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TenantProvisioningWorkspace() {
  const hydrated = useAdminProvisioningHydrated();
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const dynamicTenants = useAdminProvisioningStore((s) => s.tenants);
  const tenantOverrides = useAdminProvisioningStore((s) => s.tenantOverrides);
  const mockStepUpdates = useAdminProvisioningStore((s) => s.mockStepUpdates);

  const dynamic = resolveDynamicTenant(tenantId, dynamicTenants);
  const tenant = resolveTenantMeta(tenantId, dynamicTenants, tenantOverrides);
  const mockSteps = resolveProvisioningSteps(tenantId, dynamicTenants, mockStepUpdates);

  const [copied, setCopied] = React.useState(false);

  // Real provisioning status from the backend (admin sign-in / employees / SOW),
  // refreshed live. Falls back to the mock steps until the first fetch lands.
  const { data: provStatusSession } = useSession();
  const provStatusToken = (provStatusSession?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  const [liveSteps, setLiveSteps] = React.useState<ProvisioningStep[] | null>(null);
  React.useEffect(() => {
    if (!provStatusToken || !tenantId) return;
    let cancelled = false;
    apiCall<{ steps: ProvisioningStep[] }>(`/api/superadmin/tenants/${tenantId}/provisioning-status`, { token: provStatusToken })
      .then((r) => { if (!cancelled && r?.steps?.length) setLiveSteps(r.steps); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [provStatusToken, tenantId]);
  const steps = liveSteps ?? mockSteps;

  const mockEmail = mockAdminInviteEmail(tenantId);
  const inviteSpec = getInviteRoleSpec("enterprise_admin");
  const inviteEmail = dynamic?.adminEmail ?? mockEmail;
  const inviteName = dynamic?.adminName ?? mockEmail?.split("@")[0] ?? "Admin";

  // Credentials flow (replaces invite links): provision the primary admin via
  // the backend, which emails their email + temporary password + the role's
  // login URL, and forces a password reset on first login.
  const provToken = provStatusToken;
  const [sendState, setSendState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendMsg, setSendMsg] = React.useState<string>("");
  // `duplicate` flips the button to "Resend credentials" when the email already
  // exists — either detected inline on mount, or after a 409 on send.
  const [duplicate, setDuplicate] = React.useState(false);

  // Inline duplicate check on mount / when the email changes.
  React.useEffect(() => {
    if (!inviteEmail || !provToken) return;
    let cancelled = false;
    apiCall<{ exists: boolean }>(`/api/superadmin/users/check-email?email=${encodeURIComponent(inviteEmail)}`, { token: provToken })
      .then((r) => { if (!cancelled && r?.exists) { setDuplicate(true); setSendMsg(`${inviteEmail} already has an account — use Resend credentials to email a fresh temporary password.`); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [inviteEmail, provToken]);

  async function sendCredentials(resend = false) {
    if (!inviteEmail) return;
    setSendState("sending"); setSendMsg("");
    try {
      await apiCall("/api/superadmin/users", {
        method: "POST",
        token: provToken,
        body: JSON.stringify({
          email: inviteEmail,
          firstName: inviteName,
          role: "enterprise",
          tenantId,
          sendCredentials: true,
          resendExisting: resend || duplicate,
        }),
      });
      setSendState("sent");
      setSendMsg(`Credentials ${resend || duplicate ? "re-sent" : "emailed"} to ${inviteEmail}. They set a password on first sign-in, then land on onboarding.`);
    } catch (e) {
      setSendState("error");
      if (e instanceof ApiError && e.status === 409) {
        setDuplicate(true);
        setSendMsg(`${inviteEmail} is already provisioned — click "Resend credentials" to email a fresh temporary password.`);
      } else {
        setSendMsg(e instanceof ApiError ? e.message : "Could not send credentials. Try again.");
      }
    }
  }

  async function copyInvite(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (!hydrated) return <TenantProvisioningSkeleton />;

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

  const pct = provisioningPct(steps);
  const doneCount = steps.filter((s) => s.state === "done").length;
  const pendingCount = steps.filter((s) => s.state === "pending").length;
  const failedCount = steps.filter((s) => s.state === "failed").length;
  const currentStep = steps.find((s) => s.state === "pending" || s.state === "failed") ?? null;
  const allComplete = steps.length > 0 && pendingCount === 0 && failedCount === 0;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary flex-wrap"
      >
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Tenants</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <Link
          href={`/admin/tenants/${tenant.id}`}
          className="px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast truncate max-w-[200px]"
        >
          {tenant.name}
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">Provisioning</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Provisioning
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              Setup · {tenant.name}
            </h1>
            <StatusChip status={STATUS_CHIP[tenant.status]} size="sm" showDot>
              {STATUS_LABEL[tenant.status]}
            </StatusChip>
            <TierBadge tier={tenant.tier} />
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            {tenant.msaRef}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {tenant.domain}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Started {daysSince(tenant.provisionedAt)}d ago
          </p>
        </div>
        <Link
          href={`/admin/tenants/${tenant.id}`}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
            "bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground",
            "hover:bg-bg-subtle transition-colors duration-fast",
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Tenant detail
        </Link>
      </header>

      {allComplete ? (
        <div className="rounded-xl border border-success-border bg-success-subtle/40 px-4 py-3">
          <p className="font-body text-[13px] font-semibold text-success-text flex items-center gap-1.5">
            <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
            Provisioning complete
          </p>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            All setup steps are done. The tenant can operate normally on the platform.
          </p>
        </div>
      ) : currentStep ? (
        <div className="rounded-xl border border-brand/25 bg-brand-subtle/20 px-4 py-3">
          <p className="font-body text-[13px] font-semibold text-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-brand shrink-0" strokeWidth={2} aria-hidden />
            Current step · {currentStep.label}
          </p>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">
            {stepGuidance(currentStep)}
            {pct != null && (
              <>
                {" "}
                <span className="font-medium text-foreground">{pct}%</span> of setup complete.
              </>
            )}
          </p>
        </div>
      ) : null}

      <DashboardSection
        title="Setup progress"
        description={
          steps.length === 0
            ? "No steps recorded"
            : `${doneCount} of ${steps.length} steps complete`
        }
      >
        <div className="space-y-4">
          {pct != null && <ProgressBar pct={pct} />}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
            <SummaryStat label="Complete" value={pct != null ? `${pct}%` : "—"} highlight />
            <SummaryStat label="Steps done" value={`${doneCount}/${steps.length || "—"}`} />
            <SummaryStat
              label="Pending"
              value={String(pendingCount)}
              alert={pendingCount > 0}
            />
            <SummaryStat label="Days active" value={String(daysSince(tenant.provisionedAt))} />
          </dl>
        </div>
      </DashboardSection>

      {inviteEmail && (
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Primary admin account
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                Provision <span className="font-medium text-foreground">{inviteName}</span> (
                {inviteEmail}). They&apos;ll receive their email and a temporary password, set a new
                password on first sign-in, then land on{" "}
                <code className="font-mono text-[11px] text-text-tertiary">
                  {dynamic?.postLoginPath ?? inviteSpec.postLoginPath}
                </code>
                .
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle text-brand-emphasis px-2.5 py-1 font-body text-[10.5px] font-semibold shrink-0">
              <Mail className="h-3 w-3" aria-hidden />
              Credentials by email
            </span>
          </header>
          <div className="px-5 py-4 space-y-3">
            {sendMsg && (
              <div className={cn(
                "rounded-lg border px-3 py-2.5 font-body text-[12.5px]",
                sendState === "sent"
                  ? "border-success-border bg-success-subtle text-success-text"
                  : "border-danger-border bg-danger-subtle text-danger-text",
              )}>
                {sendMsg}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => sendCredentials(duplicate)}
                disabled={sendState === "sending" || sendState === "sent"}
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md font-body text-[13px] font-semibold transition-colors duration-fast disabled:opacity-60",
                  sendState === "sent"
                    ? "bg-success-subtle text-success-text border border-success-border"
                    : "bg-brand text-on-brand hover:bg-brand-hover",
                )}
              >
                {sendState === "sent" ? (
                  <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                ) : (
                  <Mail className="h-4 w-4" strokeWidth={2} aria-hidden />
                )}
                {sendState === "sending"
                  ? "Sending…"
                  : sendState === "sent"
                    ? "Credentials sent"
                    : duplicate
                      ? "Resend credentials"
                      : "Send credentials"}
              </button>
              <p className="font-body text-[11.5px] text-text-tertiary">
                Forced password reset on first login · audited
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Setup timeline
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Automated platform steps and tenant actions required to go live
          </p>
        </header>

        {steps.length === 0 ? (
          <p className="px-5 py-10 text-center font-body text-[12.5px] text-text-tertiary">
            No provisioning steps recorded for this tenant.
          </p>
        ) : (
          <ol className="px-5 py-4 space-y-0">
            {steps.map((step, index) => {
              const isCurrent = step.id === currentStep?.id;
              const isLast = index === steps.length - 1;
              return (
                <TimelineStep
                  key={step.id}
                  step={step}
                  isCurrent={isCurrent}
                  isLast={isLast}
                />
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function stepGuidance(step: ProvisioningStep): string {
  if (step.state === "failed") {
    return "This step failed — review tenant logs and retry or contact the enterprise admin.";
  }
  switch (step.id) {
    case "signin":
      return "Waiting for the invited admin to accept and sign in for the first time.";
    case "sow":
      return "Waiting for the enterprise admin to upload their first SOW.";
    case "employees":
      return "Add employees manually or via the CSV template — no HRIS connection required.";
    case "admin":
      return "Admin invite sent — resend the link above if they have not received it.";
    default:
      return "This step completes automatically once prerequisites are met.";
  }
}

function TimelineStep({
  step,
  isCurrent,
  isLast,
}: {
  step: ProvisioningStep;
  isCurrent: boolean;
  isLast: boolean;
}) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className={cn(
            "absolute left-[11px] top-6 bottom-0 w-px",
            step.state === "done" ? "bg-success-border/60" : "bg-stroke-subtle",
          )}
        />
      )}
      <StepMarker state={step.state} isCurrent={isCurrent} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p
            className={cn(
              "font-body text-[13px] font-medium",
              step.state === "done"
                ? "text-foreground"
                : step.state === "failed"
                  ? "text-error-text"
                  : isCurrent
                    ? "text-foreground"
                    : "text-text-secondary",
            )}
          >
            {step.label}
            {isCurrent && step.state === "pending" && (
              <span className="ml-2 inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold uppercase tracking-wide bg-brand-subtle text-brand-emphasis">
                Current
              </span>
            )}
          </p>
          <span
            className={cn(
              "font-mono text-[10.5px] tabular-nums shrink-0",
              step.state === "pending" && !step.at ? "text-warning-text font-medium" : "text-text-tertiary",
            )}
          >
            {step.at ? fmtDateTime(step.at) : "Pending"}
          </span>
        </div>
        {isCurrent && step.state === "pending" && (
          <p className="mt-1 font-body text-[11.5px] text-text-tertiary leading-relaxed">
            {stepGuidance(step)}
          </p>
        )}
      </div>
    </li>
  );
}

function StepMarker({
  state,
  isCurrent,
}: {
  state: ProvisioningStep["state"];
  isCurrent: boolean;
}) {
  if (state === "done") {
    return (
      <span
        aria-hidden
        className="relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-subtle text-success-text ring-4 ring-surface shrink-0"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span
        aria-hidden
        className="relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-error-subtle text-error-text ring-4 ring-surface shrink-0"
      >
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-surface shrink-0",
        isCurrent
          ? "bg-brand-subtle text-brand ring-brand/30"
          : "bg-bg-subtle text-text-tertiary",
      )}
    >
      <Circle className="h-2 w-2 fill-current" strokeWidth={0} />
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-bg-subtle overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all duration-fast"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[12px] font-semibold text-foreground tabular-nums shrink-0">
        {pct}%
      </span>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-error-text" : highlight ? "text-brand" : "text-foreground",
        )}
      >
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
