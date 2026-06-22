"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { PlanUsageStrip } from "@/components/enterprise/subscription/PlanUsageStrip";
import { PlanChangeHistory } from "@/components/enterprise/subscription/PlanChangeHistory";
import { useTenantSubscription } from "@/lib/hooks/use-tenant-subscription";
import { useEnterprisePlanHistory } from "@/lib/hooks/use-subscription-plan-history";
import {
  formatPlanPrice,
  PLAN_CATALOG,
  PLAN_ORDER,
} from "@/lib/subscription/plans";
import { AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import {
  Chip,
  SectionCard,
  primaryBtnClass,
  primaryStyle,
} from "@/app/admin/_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";

export function PlanWorkspace() {
  const { data: sub, isLoading, isError } = useTenantSubscription();
  const { data: history, isLoading: historyLoading } = useEnterprisePlanHistory();

  if (isLoading) {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        <div className="h-8 w-48 bg-white/55 rounded" />
        <div className="h-32 bg-white/55 rounded-xl" />
        <div className="h-64 bg-white/55 rounded-xl" />
      </div>
    );
  }

  if (isError || !sub) {
    return (
      <div className="space-y-5 pb-12">
        <p className="font-body text-[13px] text-text-secondary">Unable to load subscription details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Settings · Workspace
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em]">
          Plan &amp; billing
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Your Glimmora platform subscription — separate from workforce invoices and contributor
          payouts under Finance.
        </p>
      </header>

      <PlanUsageStrip subscription={sub} />

      <SectionCard
        title="Current plan"
        description={`${sub.tenantName} · ${sub.tenantSlug}`}
      >
        <div className="px-5 sm:px-6 py-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[20px] font-semibold text-foreground">
                {sub.plan.label}
              </h3>
              <Chip
                tone={sub.trialExpired ? "error" : sub.tenantStatus === "active" ? "success" : "warning"}
              >
                {sub.trialExpired ? "Trial expired" : sub.tenantStatus}
              </Chip>
            </div>
            <p className="mt-1 font-body text-[13px] text-text-secondary max-w-xl">
              {sub.plan.description}
            </p>
            <p className="mt-2 font-body text-[12px] text-text-tertiary">
              {formatPlanPrice(sub.plan)}
              {sub.subscriptionStartedAt && (
                <>
                  <span aria-hidden className="mx-1.5">·</span>
                  Since {new Date(sub.subscriptionStartedAt).toLocaleDateString()}
                </>
              )}
            </p>
          </div>
          <a
            href="mailto:partnerships@glimmora.ai?subject=Upgrade%20request%20-%20{sub.tenantName}"
            className={primaryBtnClass}
            style={primaryStyle}
          >
            Request upgrade
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </a>
        </div>
      </SectionCard>

      <SectionCard title="Plan comparison" description="Phase 1 — sales-led upgrades via MSA">
        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {PLAN_ORDER.map((code) => {
            const plan = PLAN_CATALOG[code];
            const current = sub.plan.code === code;
            return (
              <div
                key={code}
                className={cn(
                  "rounded-xl border p-4 flex flex-col transition-colors",
                  current
                    ? "border-[var(--c-violet-400)]/50 bg-white/60 ring-1 ring-[rgba(124,92,246,0.25)]"
                    : "border-white/55 bg-white/40 hover:bg-white/50",
                )}
              >
                <p className="font-body text-[13px] font-semibold text-foreground">{plan.label}</p>
                <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{formatPlanPrice(plan)}</p>
                <ul className="mt-3 space-y-1.5 flex-1">
                  {plan.features.slice(0, 6).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 font-body text-[11px] text-text-secondary">
                      <Check className="h-3 w-3 text-success-text shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden />
                      <span className="truncate">{f.replace(/\./g, " · ")}</span>
                    </li>
                  ))}
                </ul>
                {current && (
                  <p
                    className="mt-3 font-body text-[11px] font-bold uppercase tracking-wide"
                    style={{ backgroundImage: AURORA_ACCENT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                  >
                    Current plan
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <PlanChangeHistory items={history} isLoading={historyLoading} />

      <SectionCard title="Workforce billing" description="Task invoices and contributor payouts">
        <div className="px-5 sm:px-6 py-5">
          <p className="font-body text-[13px] text-text-secondary leading-relaxed">
            Platform subscription covers Glimmora software access. Task acceptance, milestone payments,
            and contributor payouts are managed separately.
          </p>
          <Link
            href="/enterprise/billing"
            className="inline-flex items-center gap-1 mt-3 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
          >
            Go to Finance · Billing
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
