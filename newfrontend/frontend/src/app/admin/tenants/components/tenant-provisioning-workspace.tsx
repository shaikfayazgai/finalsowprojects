"use client";

/**
 * Tenant provisioning — setup timeline (Platform Admin §5.C.4).
 *
 * Workflow:
 *   1. Orient — progress card
 *   2. Act — admin invite card (when waiting on sign-in)
 *   3. Track — setup timeline card
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  ListTodo,
  Mail,
  RotateCcw,
  SearchX,
  Send,
  Trash2,
} from "lucide-react";
import type { ProvisioningStep, TenantStatus } from "@/mocks/admin/tenants";
import {
  mockAdminInviteEmail,
  resolveDynamicTenant,
  resolveProvisioningSteps,
  resolveTenantMeta,
} from "@/lib/admin/tenant-registry";
import { useAdminProvisioningStore } from "@/lib/stores/admin-provisioning-store";
import { useAdminProvisioningHydrated } from "@/lib/hooks/use-admin-provisioning-hydrated";
import { useAdminTenant } from "@/lib/hooks/use-admin-tenant";
import { clearClientSession } from "@/lib/auth/clear-session";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "../../_shell/aurora";
import { Chip, ProgressBar, primaryBtnClass, primaryStyle, type Tone } from "../../_shell/aurora-ui";
import { TenantEmptyState } from "./tenant-empty-state";
import { TenantProvisioningSkeleton } from "./tenant-provisioning-skeleton";

const STATUS_LABEL: Record<TenantStatus, string> = {
  active: "Active",
  provisioning: "Provisioning",
  paused: "Suspended",
  suspended: "Suspended",
  draft: "Draft",
  closed: "Closed",
};

const STATUS_TONE: Record<TenantStatus, Tone> = {
  active: "success",
  provisioning: "info",
  paused: "error",
  suspended: "error",
  draft: "neutral",
  closed: "neutral",
};

/** Solid secondary button — neutral surface, no glass. */
const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg shrink-0",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors disabled:opacity-50",
);

function provisioningPct(steps: ProvisioningStep[]): number | null {
  if (steps.length === 0) return null;
  const done = steps.filter((s) => s.state === "done").length;
  return Math.round((done / steps.length) * 100);
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function TenantProvisioningWorkspace() {
  const hydrated = useAdminProvisioningHydrated();
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const dynamicTenants = useAdminProvisioningStore((s) => s.tenants);
  const tenantOverrides = useAdminProvisioningStore((s) => s.tenantOverrides);
  const mockStepUpdates = useAdminProvisioningStore((s) => s.mockStepUpdates);

  const dynamic = resolveDynamicTenant(tenantId, dynamicTenants);
  // Resolve the tenant from the BACKEND (the list links use the backend id
  // `tnt-<slug>`, which the local store doesn't have) — fall back to local.
  const { tenant: liveTenant, status: tenantStatus } = useAdminTenant(tenantId);
  const localTenant = resolveTenantMeta(tenantId, dynamicTenants, tenantOverrides);
  const tenant = liveTenant ?? localTenant;
  const localSteps = resolveProvisioningSteps(tenantId, dynamicTenants, mockStepUpdates);

  const router = useRouter();
  const [toast, setToast] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  // Live provisioning steps from the backend (first sign-in flips to "done" once
  // the admin logs in + resets) — overrides the local store steps when loaded.
  const [backendSteps, setBackendSteps] = React.useState<ProvisioningStep[] | null>(null);
  // Admin email from the backend (for tenants opened via the backend id, where
  // the local store has no record).
  const [backendAdminEmail, setBackendAdminEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function onDeleteTenant(id: string, name: string) {
    if (deleting) return;
    if (typeof window !== "undefined" &&
        !window.confirm(`Delete tenant "${name}"? It will be closed and removed from the list (data is retained and recoverable).`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/admin/tenants");
    } catch {
      setToast("Couldn't delete the tenant. Please try again.");
      setDeleting(false);
    }
  }

  const mockEmail = mockAdminInviteEmail(tenantId);
  const inviteEmail = dynamic?.adminEmail ?? backendAdminEmail ?? mockEmail;
  const inviteName = dynamic?.adminName ?? inviteEmail?.split("@")[0] ?? "Admin";

  // Poll the backend for real provisioning status (so "First admin sign-in"
  // flips to done after the admin's first login + reset, which happens on the
  // separate enterprise app). admin_email is passed as the id-mismatch fallback.
  React.useEffect(() => {
    if (!tenantId) return;
    let alive = true;
    const load = () => {
      const qs = inviteEmail ? `?admin_email=${encodeURIComponent(inviteEmail)}` : "";
      fetch(`/api/superadmin/tenants/${encodeURIComponent(tenantId)}/provisioning-status${qs}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!alive || !d) return;
          if (d.steps?.length) setBackendSteps(d.steps as ProvisioningStep[]);
          if (d.adminEmail) setBackendAdminEmail(d.adminEmail as string);
        })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 15_000); // refresh so a just-completed sign-in shows up
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [tenantId, inviteEmail]);

  // Backend steps win once loaded; fall back to the local store while loading.
  const steps = backendSteps ?? localSteps;

  if (!hydrated) return <TenantProvisioningSkeleton />;

  // Session expired (backend 401) → clear + go to admin login (not "not found").
  if (tenantStatus === "unauthorized") {
    if (typeof window !== "undefined") {
      clearClientSession();
      window.location.href = `/admin/login?returnTo=/admin/tenants/${tenantId}/provisioning`;
    }
    return <TenantProvisioningSkeleton />;
  }
  // Still loading the live tenant + no local fallback → skeleton, not "not found".
  if (tenantStatus === "loading" && !tenant) return <TenantProvisioningSkeleton />;

  if (!tenant) {
    return (
      <div className="space-y-5 pb-4 animate-fade-in">
        <BackLink tenantName="Tenants" href="/admin/tenants" />
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

  const pct = provisioningPct(steps);
  const doneCount = steps.filter((s) => s.state === "done").length;
  const pendingCount = steps.filter((s) => s.state === "pending").length;
  const failedCount = steps.filter((s) => s.state === "failed").length;
  const currentStep = steps.find((s) => s.state === "pending" || s.state === "failed") ?? null;
  const allComplete = steps.length > 0 && pendingCount === 0 && failedCount === 0;
  const setupFinished = tenant.status === "active" || tenant.status === "paused" || tenant.status === "closed";
  const noTimeline = steps.length === 0;

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {toast ? (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[13px] font-semibold text-success-text"
        >
          {toast}
        </div>
      ) : null}

      <BackLink tenantName={tenant.name} href={`/admin/tenants/${tenant.id}`} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <h1 className="font-display text-[26px] sm:text-[30px] font-bold tracking-[-0.03em] text-foreground leading-none">
              Provisioning
            </h1>
            <Chip tone={STATUS_TONE[tenant.status]}>{STATUS_LABEL[tenant.status]}</Chip>
          </div>
          <p className="font-body text-[13px] text-text-secondary">
            {tenant.name}
            <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
            {tenant.tier}
            <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
            {tenant.domain}
            <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
            {tenant.msaRef}
            <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
            Started {fmtDate(tenant.provisionedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/tenants/${tenant.id}`} className={cn(BTN_SECONDARY, "h-10 px-4")}>
            <ExternalLink className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
            Tenant detail
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDeleteTenant(tenant.id, tenant.name)}
            className={cn(BTN_SECONDARY, "h-10 px-4")}
          >
            <Trash2 className="h-4 w-4 text-error-text" strokeWidth={2} aria-hidden />
            {deleting ? "Deleting…" : "Delete tenant"}
          </button>
        </div>
      </header>

      {noTimeline ? (
        <div className={DASH_CARD}>
          <TenantEmptyState
            icon={setupFinished ? CheckCircle2 : ListTodo}
            title={setupFinished ? "Setup complete" : "No setup steps recorded"}
            description={
              setupFinished
                ? "This tenant finished onboarding. Operate the account from tenant detail — users, health, and audit."
                : "Steps appear here after the new-tenant wizard provisions the enterprise and onboarding begins."
            }
            action={
              setupFinished ? (
                <Link href={`/admin/tenants/${tenant.id}`} className={primaryBtnClass} style={primaryStyle}>
                  Open tenant detail
                  <ExternalLink className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                </Link>
              ) : (
                <Link href="/admin/tenants/new" className={cn(BTN_SECONDARY, "h-10 px-4")}>
                  New tenant wizard
                </Link>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          <SectionCard
            title="Setup progress"
            description={
              allComplete
                ? "All steps complete — tenant is ready to operate."
                : currentStep
                  ? `Waiting on · ${currentStep.label}`
                  : "Automated and tenant-driven steps until go-live"
            }
            action={
              <span className="font-body text-[12px] text-text-tertiary tabular-nums">
                {doneCount}/{steps.length} done
                {pendingCount > 0 ? (
                  <>
                    <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
                    <span className="text-warning-text">{pendingCount} pending</span>
                  </>
                ) : null}
                {failedCount > 0 ? (
                  <>
                    <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
                    <span className="text-error-text">{failedCount} failed</span>
                  </>
                ) : null}
                <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
                {daysSince(tenant.provisionedAt)}d active
              </span>
            }
          >
            {pct != null ? <ProgressBar pct={pct} /> : null}
            {allComplete ? (
              <p className="mt-3 font-body text-[13px] text-success-text flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                Provisioning complete — no further setup actions required.
              </p>
            ) : null}
          </SectionCard>

          {inviteEmail && !allComplete ? (
            <SectionCard
              title="Primary admin credentials"
              description={
                <>
                  Default credentials were emailed to <span className="font-medium text-foreground">{inviteName}</span> ({inviteEmail}).
                  They sign in with a temporary password and are forced to set a new one on first login.
                </>
              }
              action={
                <span
                  className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full border font-body text-[11px] font-semibold"
                  style={{ color: "var(--color-ai-text)", background: "var(--color-ai-surface)", borderColor: "var(--color-ai-border)" }}
                >
                  <Mail className="h-3 w-3" aria-hidden />
                  Credentials emailed
                </span>
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    // Resend default credentials to the tenant's first admin —
                    // regenerates a temp password, emails it, forces a reset on
                    // next login. (Super-admin only; backend enforces the role.)
                    try {
                      const res = await fetch("/api/superadmin/users/resend-credentials", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: inviteEmail }),
                      });
                      setToast(
                        res.ok
                          ? `Credentials re-sent to ${inviteEmail}. They must reset the password on next sign-in.`
                          : "Couldn't resend credentials. Please try again.",
                      );
                    } catch {
                      setToast("Couldn't resend credentials. Please try again.");
                    }
                  }}
                  className={BTN_SECONDARY}
                >
                  <Send className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                  Resend credentials
                </button>
                <p className="w-full sm:w-auto font-body text-[12px] text-text-tertiary">
                  Sent to the admin&apos;s email · audited
                </p>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Setup timeline"
            description="Platform automation and tenant actions — newest activity at the current step"
            flushList
          >
            <ol className="px-4 sm:px-5 py-5">
              {steps.map((step, index) => (
                <TimelineStep
                  key={step.id}
                  step={step}
                  isCurrent={step.id === currentStep?.id}
                  isLast={index === steps.length - 1}
                  onResend={() => setToast(`Invite re-sent for "${step.label}"`)}
                  onRetry={() => setToast(`Retrying "${step.label}"…`)}
                />
              ))}
            </ol>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

function BackLink({ tenantName, href }: { tenantName: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      {tenantName}
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
          {description ? (
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(!flushList && "px-4 sm:px-5 py-4")}>{children}</div>
    </section>
  );
}

function stepGuidance(step: ProvisioningStep): string {
  if (step.state === "failed") return "This step failed — review tenant logs and retry or contact the enterprise admin.";
  switch (step.id) {
    case "signin":
      return "Waiting for the invited admin to accept and sign in for the first time.";
    case "sow":
      return "Waiting for the enterprise admin to upload their first SOW.";
    case "hris":
      return "Waiting for HRIS integration to be configured from the enterprise settings.";
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
  onResend,
  onRetry,
}: {
  step: ProvisioningStep;
  isCurrent: boolean;
  isLast: boolean;
  onResend: () => void;
  onRetry: () => void;
}) {
  const canResend = step.state === "pending" && (step.id === "admin" || step.id === "signin");

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast ? (
        <span
          aria-hidden
          className={cn(
            "absolute left-[13px] top-7 bottom-0 w-px",
            step.state === "done" ? "bg-[rgba(124,92,246,0.35)]" : "bg-stroke-subtle",
          )}
        />
      ) : null}
      <StepMarker state={step.state} isCurrent={isCurrent} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p
            className={cn(
              "font-body text-[13px] font-medium",
              step.state === "failed"
                ? "text-error-text"
                : step.state === "done" || isCurrent
                  ? "text-foreground"
                  : "text-text-secondary",
            )}
          >
            {step.label}
            {isCurrent && step.state === "pending" ? (
              <span
                className="ml-2 inline-flex h-[18px] items-center px-2 rounded-md text-white font-body text-[10px] font-bold align-middle"
                style={GLASS_GRADIENT}
              >
                Current
              </span>
            ) : null}
          </p>
          <span
            className={cn(
              "font-mono text-[11px] tabular-nums shrink-0",
              step.state === "pending" && !step.at ? "text-warning-text" : "text-text-tertiary",
            )}
            suppressHydrationWarning
          >
            {step.at ? fmtDateTime(step.at) : "Pending"}
          </span>
        </div>
        {isCurrent && step.state === "pending" ? (
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">{stepGuidance(step)}</p>
        ) : null}
        {canResend || step.state === "failed" ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {canResend ? (
              <button type="button" onClick={onResend} className={cn(BTN_SECONDARY, "h-8 px-3 text-[12px]")}>
                <Send className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                Resend invite
              </button>
            ) : null}
            {step.state === "failed" ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-error-border bg-error-subtle font-body text-[12px] font-semibold text-error-text hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Retry step
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function StepMarker({ state, isCurrent }: { state: ProvisioningStep["state"]; isCurrent: boolean }) {
  if (state === "done") {
    return (
      <span
        aria-hidden
        className="relative z-10 grid place-items-center h-7 w-7 rounded-full text-white ring-4 ring-white shrink-0"
        style={GLASS_GRADIENT}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span
        aria-hidden
        className="relative z-10 grid place-items-center h-7 w-7 rounded-full bg-error-subtle text-error-text ring-4 ring-white shrink-0"
      >
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 grid place-items-center h-7 w-7 rounded-full ring-4 ring-white shrink-0",
        isCurrent ? "bg-info-subtle text-info-text" : "bg-bg-subtle text-text-tertiary border border-stroke-subtle",
      )}
    >
      <Circle className="h-2 w-2 fill-current" strokeWidth={0} />
    </span>
  );
}
