"use client";

/**
 * Enterprise dashboard overview — sponsor / admin home.
 *
 * Same UX as Commercial gate and KYC: header → queue table → shortcuts → activity.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { usePlanList } from "@/lib/hooks/use-decomposition-v2";
import { useReviewQueue } from "@/lib/hooks/use-enterprise-review";
import { useAuditEvents } from "@/lib/hooks/use-audit-view";
import { useMe } from "@/lib/hooks/use-me";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { canAccessEnterpriseNavHref, getRoleDashboardModule } from "@/lib/enterprise/rbac";
import { useTenantSubscription } from "@/lib/hooks/use-tenant-subscription";
import { PlanUsageStrip } from "@/components/enterprise/subscription/PlanUsageStrip";
import type { SowSummary } from "@/lib/sow/types";
import { STAGE_LABEL } from "@/lib/sow/approval-pipeline";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT, DASH_CARD } from "@/app/admin/_shell/aurora";
import { StatCard } from "@/app/admin/_shell/aurora-ui";
import { RoleDashboardBand } from "./role-dashboard-band";

type Tone = "error" | "warning" | "success" | "info" | "ai" | "neutral";

interface AttentionItem {
  id: string;
  kind: "sla" | "sign_off";
  category: "sow_approval" | "acceptance";
  title: string;
  entity: string;
  slaLabel: string;
  slaTone: Tone;
  href: string;
}

const CATEGORY_LABEL: Record<AttentionItem["category"], string> = {
  sow_approval: "SOW approval",
  acceptance: "Acceptance",
};

const TONE_TEXT: Record<Tone, string> = {
  error: "var(--color-error-text)",
  warning: "var(--color-warning-text)",
  success: "var(--color-success-text)",
  info: "var(--color-info-text)",
  ai: "var(--color-ai-text)",
  neutral: "var(--color-text-secondary)",
};

const TONE_SOFT: Record<Tone, string> = {
  error: "var(--color-error-subtle)",
  warning: "var(--color-warning-subtle)",
  success: "var(--color-success-subtle)",
  info: "var(--color-info-subtle)",
  ai: "var(--color-ai-surface)",
  neutral: "var(--color-bg-subtle)",
};

const METRIC_ICONS = [FileCheck2, ShieldCheck, Briefcase, Workflow] as const;

function tenantFromEmail(email: string | null | undefined): string | undefined {
  if (!email || !email.includes("@")) return undefined;
  const domain = email.split("@")[1]?.split(".")[0];
  if (!domain) return undefined;
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function sortAttentionSows(sows: SowSummary[]): SowSummary[] {
  return [...sows].sort((a, b) => {
    const aStale = hoursAgo(a.updatedAt) > 48;
    const bStale = hoursAgo(b.updatedAt) > 48;
    if (aStale !== bStale) return aStale ? -1 : 1;
    if (aStale && bStale) {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function sortAttention(items: AttentionItem[]): AttentionItem[] {
  return [...items].sort((a, b) => {
    const rank = (i: AttentionItem) => (i.kind === "sla" ? 0 : i.slaTone === "warning" ? 1 : 2);
    return rank(a) - rank(b);
  });
}

function mapMetricTone(tone: string | undefined): Tone {
  if (tone === "amber") return "warning";
  if (tone === "violet") return "ai";
  if (tone === "green") return "success";
  if (tone === "blue") return "info";
  return "neutral";
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium whitespace-nowrap"
      style={{ color: TONE_TEXT[tone], background: TONE_SOFT[tone] }}
    >
      {children}
    </span>
  );
}

export function EnterpriseDashboardWorkspace() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: session } = useSession();
  const { persona, roleLabels, roles } = useEnterpriseAccess();
  const { data: sowData } = useSowList({ limit: 100 });
  const { data: planData } = usePlanList({ limit: 100 });
  const { data: reviewData } = useReviewQueue({ limit: 100 });
  const { data: auditData } = useAuditEvents({ limit: 8 });
  const { data: subscription } = useTenantSubscription();

  const sessionEmail = session?.user?.email ?? undefined;
  const tenantName =
    me?.tenant?.name ?? tenantFromEmail(me?.user?.email ?? sessionEmail) ?? "Your organisation";

  const sows = sowData?.items ?? [];
  const plans = planData?.items ?? [];
  const pendingReviews = reviewData?.items ?? [];

  const sowCounts = React.useMemo(() => {
    const c = { draft: 0, approval: 0, approved: 0, rejected: 0, withdrawn: 0, archived: 0 };
    for (const s of sows) c[s.status]++;
    return c;
  }, [sows]);

  const planCounts = React.useMemo(() => {
    const c = { draft: 0, approved: 0, active: 0, archived: 0 };
    for (const p of plans) c[p.status]++;
    return c;
  }, [plans]);

  const pendingApprovalAttention = sortAttentionSows(sows.filter((s) => s.status === "approval"));
  const staleCount = pendingApprovalAttention.filter((s) => hoursAgo(s.updatedAt) > 48).length;
  const needsAction = pendingApprovalAttention.length + pendingReviews.length;

  const roleModule = getRoleDashboardModule(persona, {
    sowApproval: sowCounts.approval,
    sowStale: staleCount,
    pendingReviews: pendingReviews.length,
    planActive: planCounts.active,
    planDraft: planCounts.draft,
    sowApproved: sowCounts.approved,
  });

  const metricValues = [
    sowCounts.approval,
    pendingReviews.length,
    planCounts.active,
    planCounts.draft,
  ];

  const shortcuts = roleModule.metrics.map((m, i) => ({
    label: m.label,
    value: metricValues[i] ?? 0,
    hint: i === 0 && staleCount > 0 ? `${staleCount} overdue` : (m.hint as string | undefined),
    href: m.href,
    tone: mapMetricTone(m.tone as string | undefined),
    icon: METRIC_ICONS[i],
  }));

  const attentionItems = React.useMemo(() => {
    const sowItems: AttentionItem[] = pendingApprovalAttention.map((s) => {
      const hrs = hoursAgo(s.updatedAt);
      const overdue = hrs > 48;
      return {
        id: s.id,
        kind: overdue ? "sla" : "sign_off",
        category: "sow_approval" as const,
        title: s.title,
        entity: `${s.stage ? STAGE_LABEL[s.stage] : "Approval"} · ${timeAgo(s.updatedAt)}`,
        slaLabel: overdue ? "Overdue" : "In progress",
        slaTone: overdue ? "error" : "neutral",
        href: `/enterprise/sow/${s.id}`,
      };
    });
    const reviewItems: AttentionItem[] = pendingReviews.map((r) => {
      const hrs = hoursAgo(r.acceptedAt);
      const overdue = hrs >= 48;
      const watch = hrs >= 24;
      return {
        id: r.submissionId,
        kind: overdue ? "sla" : "sign_off",
        category: "acceptance" as const,
        title: r.taskTitle,
        entity: `${r.contributorName} · v${r.version}`,
        slaLabel: overdue ? "Overdue" : watch ? `${Math.max(1, Math.round(48 - hrs))}h left` : "On track",
        slaTone: overdue ? "error" : watch ? "warning" : "success",
        href: `/enterprise/review/${r.submissionId}`,
      };
    });
    return sortAttention([...sowItems, ...reviewItems]);
  }, [pendingApprovalAttention, pendingReviews]);

  const activityRows = React.useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ id: string; text: string; at: string }> = [];
    for (const ev of auditData?.events ?? []) {
      if (ev.action === "audit.export") {
        if (seen.has("audit.export")) continue;
        seen.add("audit.export");
      }
      const label =
        ev.action === "audit.export"
          ? "Audit log exported"
          : ev.action
              .split(".")
              .map((part) => part.replace(/_/g, " "))
              .join(" · ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
      const detail = ev.action === "audit.export" ? "Compliance export" : (ev.resource.label ?? ev.resource.type);
      out.push({ id: ev.id, text: `${label} — ${detail}`, at: ev.timestamp });
      if (out.length >= 6) break;
    }
    return out;
  }, [auditData?.events]);

  const sowById = React.useMemo(() => new Map(sows.map((s) => [s.id, s])), [sows]);
  const activeProjects = plans
    .filter((p) => p.status === "active")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const pipelineSteps = [
    { label: "Draft", value: sowCounts.draft, href: "/enterprise/sow?status=draft" },
    { label: "Approval", value: sowCounts.approval, href: "/enterprise/sow?status=approval", urgent: sowCounts.approval > 0 },
    { label: "Approved", value: sowCounts.approved, href: "/enterprise/sow?status=approved" },
    { label: "Delivery", value: planCounts.active, href: "/enterprise/projects" },
  ];

  const urgentCount = attentionItems.filter((i) => i.slaTone === "error" || i.slaTone === "warning").length;

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <header className="min-w-0">
        <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
          Dashboard overview
        </h1>
        <p className="mt-1.5 font-body text-[14px] text-text-secondary max-w-2xl">
          {tenantName}
          {roleLabels.length > 0 ? ` · ${roleLabels.join(", ")}` : ""}.{" "}
          {needsAction === 0
            ? "All queues clear — delivery is unblocked."
            : urgentCount > 0
              ? `${urgentCount} item${urgentCount === 1 ? "" : "s"} need attention — start with the first row in your queue.`
              : `${needsAction} open item${needsAction === 1 ? "" : "s"} across SOW approval and acceptance.`}
        </p>
      </header>

      {subscription ? <PlanUsageStrip subscription={subscription} /> : null}

      <RoleDashboardBand
        persona={persona}
        counts={{
          sowApproval: sowCounts.approval,
          sowStale: staleCount,
          pendingReviews: pendingReviews.length,
          planActive: planCounts.active,
          planDraft: planCounts.draft,
          sowApproved: sowCounts.approved,
        }}
      />

      {staleCount > 0 ? (
        <Link
          href="/enterprise/sow?status=approval"
          className="flex items-start gap-3 rounded-xl border border-warning-border bg-warning-subtle/40 px-4 py-3 hover:bg-warning-subtle/60 transition-colors group"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13px] font-semibold text-foreground">
              {staleCount} SOW{staleCount === 1 ? "" : "s"} overdue in approval
            </span>
            <span className="block mt-0.5 font-body text-[12.5px] text-text-secondary">
              Waiting 48+ hours — open the approval queue to unblock delivery.
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-foreground shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        </Link>
      ) : null}

      {shortcuts.length > 0 ? (
        <section aria-label="Key metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {shortcuts.map((m) => (
            <StatCard key={m.label} label={m.label} value={m.value} icon={m.icon} href={m.href} hint={m.hint} hintTone={m.tone} />
          ))}
        </section>
      ) : null}

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-1 px-4 sm:px-5 py-4 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-1 rounded-full shrink-0" style={{ backgroundImage: AURORA_ACCENT }} aria-hidden />
              <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-foreground">Your queue</p>
            </div>
            <p className="mt-1 pl-3.5 font-body text-[12px] text-text-tertiary">
              {attentionItems.length === 0
                ? "Nothing waiting on you right now"
                : `${attentionItems.length} open · SOW approval and acceptance`}
            </p>
          </div>
          {attentionItems.length > 0 ? (
            <Link
              href={pendingApprovalAttention.length > 0 ? "/enterprise/sow?status=approval" : "/enterprise/review"}
              className="font-body text-[12px] font-semibold text-text-link hover:underline underline-offset-2 shrink-0"
            >
              View all
            </Link>
          ) : null}
        </div>

        {attentionItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                  <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Type</th>
                  <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Item</th>
                  <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Detail</th>
                  <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Status</th>
                  <th className="w-10 px-2 py-2.5" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {attentionItems.map((item) => (
                  <QueueRow key={item.id} item={item} onOpen={() => router.push(item.href)} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <TenantEmptyState
            icon={CheckCircle2}
            title="Queue clear"
            description="SOW approvals and acceptance reviews appear here when they need you."
            action={
              canAccessEnterpriseNavHref("/enterprise/sow/intake", roles) ? (
                <Link
                  href="/enterprise/sow/intake"
                  className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2"
                >
                  Create a SOW
                </Link>
              ) : undefined
            }
          />
        )}
      </div>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <p className="font-body text-[13px] font-semibold text-foreground">Origination pipeline</p>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Draft through delivery for your tenant</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-stroke-subtle">
          {pipelineSteps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className={cn(
                "px-4 py-4 text-center hover:bg-bg-subtle/60 transition-colors",
                step.urgent && "bg-warning-subtle/20",
              )}
            >
              <p className={cn("font-display text-[22px] font-semibold tabular-nums leading-none", step.urgent ? "text-warning-text" : "text-foreground")}>
                {step.value}
              </p>
              <p className="mt-1.5 font-body text-[12px] font-medium text-text-secondary">{step.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {activeProjects.length > 0 ? (
        <div className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
            <div>
              <p className="font-body text-[13px] font-semibold text-foreground">Active delivery</p>
              <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Projects in progress</p>
            </div>
            <Link href="/enterprise/projects" className="font-body text-[12px] font-semibold text-text-link hover:underline underline-offset-2 shrink-0">
              All projects
            </Link>
          </div>
          <ul className="divide-y divide-stroke-subtle">
            {activeProjects.map((p) => {
              const sow = sowById.get(p.sowId);
              return (
                <li key={p.id}>
                  <Link
                    href={`/enterprise/projects/${p.id}`}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-bg-subtle/60 transition-colors group"
                  >
                    <Briefcase className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-body text-[13.5px] font-semibold text-foreground truncate group-hover:text-text-link">
                        {sow?.title ?? `Plan ${p.id.slice(0, 8)}`}
                      </span>
                      <span className="block font-body text-[12px] text-text-secondary mt-0.5">On track · {timeAgo(p.updatedAt)}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-text-disabled shrink-0" strokeWidth={2} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {activityRows.length > 0 ? (
        <div className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
            <div>
              <p className="font-body text-[13px] font-semibold text-foreground">Recent activity</p>
              <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Latest workspace events</p>
            </div>
            <Link href="/enterprise/audit" className="inline-flex items-center gap-1 font-body text-[12px] font-semibold text-text-link hover:underline underline-offset-2 shrink-0">
              Audit log
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <ul className="divide-y divide-stroke-subtle">
            {activityRows.map((ev) => (
              <li key={ev.id} className="flex items-start justify-between gap-4 px-4 sm:px-5 py-3.5">
                <p className="font-body text-[13px] text-foreground leading-relaxed min-w-0">{ev.text}</p>
                <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0 pt-0.5" suppressHydrationWarning>
                  {timeAgo(ev.at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function QueueRow({ item, onOpen }: { item: AttentionItem; onOpen: () => void }) {
  return (
    <tr
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      role="button"
      className="border-b border-stroke-subtle last:border-b-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus"
    >
      <td className="px-4 sm:px-5 py-3.5 align-middle">
        <Pill tone={item.category === "sow_approval" ? "ai" : "info"}>{CATEGORY_LABEL[item.category]}</Pill>
      </td>
      <td className="px-3 py-3.5 align-middle">
        <span className="block font-body text-[13.5px] font-semibold text-foreground">{item.title}</span>
      </td>
      <td className="px-3 py-3.5 align-middle">
        <span className="block font-body text-[12.5px] text-text-secondary">{item.entity}</span>
      </td>
      <td className="px-4 sm:px-5 py-3.5 align-middle">
        <Pill tone={item.slaTone}>{item.slaLabel}</Pill>
      </td>
      <td className="px-2 py-3.5 align-middle">
        <ChevronRight className="h-4 w-4 text-text-disabled" strokeWidth={2} aria-hidden />
      </td>
    </tr>
  );
}

