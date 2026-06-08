"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { PlanUsageStrip } from "@/components/enterprise/subscription/PlanUsageStrip";
import { PlanChangeHistory } from "@/components/enterprise/subscription/PlanChangeHistory";
import { useTenantSubscription } from "@/lib/hooks/use-tenant-subscription";
import { useEnterprisePlanHistory } from "@/lib/hooks/use-subscription-plan-history";
import {
  formatPlanPrice,
  PLAN_CATALOG,
  PLAN_ORDER,
} from "@/lib/subscription/plans";
import { cn } from "@/lib/utils/cn";

export function PlanWorkspace() {
  const { data: sub, isLoading, isError } = useTenantSubscription();
  const { data: history, isLoading: historyLoading } = useEnterprisePlanHistory();

  if (isLoading) {
    return (
      <div className="space-y-5 pb-12 animate-pulse">
        <div className="h-8 w-48 bg-bg-subtle rounded" />
        <div className="h-32 bg-bg-subtle rounded-xl" />
        <div className="h-64 bg-bg-subtle rounded-xl" />
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
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em]">
          Plan &amp; billing
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Your Glimmora platform subscription — separate from workforce invoices and contributor
          payouts under Finance.
        </p>
      </header>

      <PlanUsageStrip subscription={sub} />

      <DashboardSection
        title="Current plan"
        description={`${sub.tenantName} · ${sub.tenantSlug}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-body text-[20px] font-semibold text-foreground">
                {sub.plan.label}
              </h3>
              <StatusChip
                status={sub.trialExpired ? "error" : sub.tenantStatus === "active" ? "success" : "warning"}
                size="sm"
              >
                {sub.trialExpired ? "Trial expired" : sub.tenantStatus}
              </StatusChip>
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
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs shrink-0",
              "bg-brand text-on-brand font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
            )}
          >
            Request upgrade
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </a>
        </div>
      </DashboardSection>

      <DashboardSection title="Plan comparison" description="Phase 1 — sales-led upgrades via MSA">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {PLAN_ORDER.map((code) => {
            const plan = PLAN_CATALOG[code];
            const current = sub.plan.code === code;
            return (
              <div
                key={code}
                className={cn(
                  "rounded-xl border p-4 flex flex-col",
                  current
                    ? "border-brand/40 bg-brand-subtle/20 ring-1 ring-brand/20"
                    : "border-stroke-subtle bg-bg-subtle/10",
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
                  <p className="mt-3 font-body text-[11px] font-bold uppercase tracking-wide text-brand">
                    Current plan
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </DashboardSection>

      <PlanChangeHistory items={history} isLoading={historyLoading} />

      <DashboardSection title="Workforce billing" description="Task invoices and contributor payouts">
        <p className="font-body text-[13px] text-text-secondary leading-relaxed">
          Platform subscription covers Glimmora software access. Task acceptance, milestone payments,
          and contributor payouts are managed separately.
        </p>
        <Link
          href="/enterprise/billing"
          className="inline-flex items-center gap-1 mt-3 font-body text-[12.5px] font-semibold text-brand-emphasis hover:text-brand"
        >
          Go to Finance · Billing
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </DashboardSection>
    </div>
  );
}
