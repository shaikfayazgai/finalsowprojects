"use client";

/**
 * Admin dashboard overview — operator home.
 *
 * Same UX pattern as KYC reviews and Commercial gate:
 *   header → single queue card (table) → shortcuts → recent activity.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { MOCK_ADMIN_DASHBOARD } from "@/mocks/admin/dashboard";
import type { AdminAttentionKind, MockAdminAttentionItem } from "@/mocks/admin/dashboard";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT, AURORA_ACCENT } from "../../_shell/aurora";
import { StatCard } from "../../_shell/aurora-ui";
import {
  ATTENTION_KIND_LABEL,
  filterAttentionForRole,
  filterRecentForPhase,
  filterSignalsForPhase,
  pulseBandForRole,
  roleBrief,
  timeAgo,
} from "./dashboard-data";

type Tone = "error" | "warning" | "success" | "info" | "ai" | "neutral";

function envTone(env: "PROD" | "STAGING" | "DEV"): Tone {
  if (env === "PROD") return "success";
  if (env === "STAGING") return "warning";
  return "neutral";
}

function attentionTone(kind: AdminAttentionKind): Tone {
  switch (kind) {
    case "sow":
      return "ai";
    case "governance":
      return "warning";
    case "kyc":
      return "info";
    case "rail":
      return "error";
    case "system":
      return "info";
  }
}

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

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-[20px] items-center px-2 rounded-md font-body text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap"
      style={{ color: TONE_TEXT[tone], background: TONE_SOFT[tone] }}
    >
      {children}
    </span>
  );
}

function sortAttention(items: MockAdminAttentionItem[]): MockAdminAttentionItem[] {
  return [...items].sort((a, b) => {
    const sa = a.slaHours ?? 999;
    const sb = b.slaHours ?? 999;
    return sa - sb;
  });
}

function slaLabel(hours: number | undefined): { label: string; tone: Tone } {
  if (hours == null) return { label: "—", tone: "neutral" };
  if (hours <= 8) return { label: `${hours}h left`, tone: "warning" };
  return { label: `${hours}h left`, tone: "neutral" };
}

export function AdminDashboardWorkspace() {
  const router = useRouter();
  const { role, profile } = useActiveAdmin();
  const d = MOCK_ADMIN_DASHBOARD;

  const attention = React.useMemo(
    () => sortAttention(filterAttentionForRole(d.attention, role)),
    [d.attention, role],
  );
  const pulse = React.useMemo(() => pulseBandForRole(role, d), [role, d]);
  const recent = React.useMemo(() => filterRecentForPhase(d.recent).slice(0, 6), [d.recent]);
  const aiSignals = React.useMemo(() => filterSignalsForPhase(d.aiSignals), [d.aiSignals]);
  const brief = roleBrief(role);

  const urgentCount = attention.filter((a) => a.slaHours != null && a.slaHours <= 8).length;
  const warningSignal = aiSignals.find((s) => s.tone === "warning");

  return (
    <div className="space-y-6 pb-4 animate-fade-in">
      <header className="min-w-0 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[28px] sm:text-[32px] font-bold tracking-[-0.03em] text-foreground leading-none">
              Operations
            </h1>
            <Pill tone={envTone(d.env)}>{d.env}</Pill>
          </div>
          <p className="mt-2 font-body text-[13.5px] text-text-secondary max-w-2xl">
            {profile.title} · {profile.displayName}.{" "}
            {attention.length === 0
              ? "Your queue is clear."
              : urgentCount > 0
                ? `${urgentCount} item${urgentCount === 1 ? "" : "s"} within SLA — open the first row to continue.`
                : `${attention.length} open item${attention.length === 1 ? "" : "s"} in your queue.`}
          </p>
        </div>
        <p className="hidden sm:block font-body text-[11px] font-medium uppercase tracking-[0.1em] text-text-tertiary shrink-0" suppressHydrationWarning>
          {todayLabel()}
        </p>
      </header>

      {pulse.length > 0 ? (
        <section aria-label="Overview metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {pulse.map((m) => (
            <StatCard
              key={m.id}
              label={m.label}
              value={m.value}
              icon={m.icon as LucideIcon | undefined}
              href={m.href}
              hint={m.hint}
              hintTone={(m.tone ?? "neutral") as Tone}
            />
          ))}
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        {/* ── Primary work queue ── */}
        <div className={cn(DASH_CARD, "overflow-hidden lg:col-span-2")}>
          <div className="flex flex-col gap-1 px-5 py-4 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-1 rounded-full shrink-0" style={{ backgroundImage: AURORA_ACCENT }} aria-hidden />
                <p className="font-display text-[16px] font-bold tracking-[-0.01em] text-foreground">Operator queue</p>
              </div>
              <p className="mt-1 pl-3.5 font-body text-[12px] text-text-tertiary">
                {attention.length === 0
                  ? "Nothing assigned to you right now"
                  : `${attention.length} open · sorted by SLA urgency`}
              </p>
            </div>
            {attention.length > 0 && urgentCount > 0 ? (
              <Pill tone="warning">{urgentCount} within SLA</Pill>
            ) : null}
          </div>

          {attention.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Type</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Item</th>
                    <th className="hidden md:table-cell px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Detail</th>
                    <th className="px-4 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">SLA</th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {attention.map((item) => (
                    <QueueRow key={item.id} item={item} onOpen={() => router.push(item.href)} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <TenantEmptyState
              icon={CheckCircle2}
              title="Queue clear"
              description="Commercial gate, KYC, and governance items appear here when they need you."
            />
          )}
        </div>

        {/* ── Right rail: briefs + activity ── */}
        <aside className="space-y-4">
          {brief && role !== "plat.admin" ? (
            <Link
              href={brief.href}
              className={cn(DASH_CARD, "block px-4 py-3.5 transition-transform duration-fast hover:scale-[1.01] group")}
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={GLASS_GRADIENT} aria-hidden />
                <span className="font-body text-[12.5px] font-semibold text-foreground group-hover:text-text-link">{brief.title}</span>
              </span>
              <span className="block mt-1.5 font-body text-[12px] text-text-secondary leading-relaxed">{brief.body}</span>
            </Link>
          ) : null}

          {warningSignal ? (
            <Link
              href={warningSignal.href}
              className="block rounded-lg border border-warning-border bg-warning-subtle/40 px-4 py-3.5 hover:bg-warning-subtle/60 transition-colors group"
              style={{ borderLeftWidth: 3, borderLeftColor: "var(--color-warning-solid)" }}
            >
              <span className="font-body text-[12.5px] font-semibold text-foreground">{warningSignal.title}</span>
              <span className="block mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{warningSignal.description}</span>
            </Link>
          ) : null}

          {recent.length > 0 ? (
            <div className={cn(DASH_CARD, "overflow-hidden")}>
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-stroke-subtle">
                <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-foreground">Recent activity</p>
                <Link
                  href="/admin/audit"
                  className="inline-flex items-center gap-1 font-body text-[11.5px] font-semibold text-text-link hover:underline underline-offset-2 shrink-0"
                >
                  Audit log
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
                </Link>
              </div>
              <ul className="divide-y divide-stroke-subtle">
                {recent.map((ev, i) => (
                  <li key={i} className="px-4 py-3">
                    <p className="font-body text-[12.5px] text-foreground leading-snug">{ev.text}</p>
                    <span className="mt-1 block font-mono text-[10px] text-text-tertiary tabular-nums" suppressHydrationWarning>
                      {timeAgo(ev.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function todayLabel(): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(new Date());
}

function QueueRow({ item, onOpen }: { item: MockAdminAttentionItem; onOpen: () => void }) {
  const sla = slaLabel(item.slaHours);

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
        <Pill tone={attentionTone(item.kind)}>{ATTENTION_KIND_LABEL[item.kind]}</Pill>
      </td>
      <td className="px-3 py-3.5 align-middle">
        <span className="block font-body text-[13.5px] font-semibold text-foreground">{item.title}</span>
      </td>
      <td className="px-3 py-3.5 align-middle">
        <span className="block font-body text-[12.5px] text-text-secondary">{item.entity}</span>
      </td>
      <td className="px-4 sm:px-5 py-3.5 align-middle">
        <span
          className="inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium"
          style={{ color: TONE_TEXT[sla.tone], background: TONE_SOFT[sla.tone] }}
        >
          {sla.label}
        </span>
      </td>
      <td className="px-2 py-3.5 align-middle">
        <ChevronRight className="h-4 w-4 text-text-disabled" strokeWidth={2} aria-hidden />
      </td>
    </tr>
  );
}

// Stat tiles now use the shared <GlassStat /> from aurora-ui (single source of truth).
