"use client";

import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { getPlan, formatPlanPrice } from "@/lib/subscription/plans";
import type { FeatureCheckResult, PlanCode } from "@/lib/subscription/types";
import { cn } from "@/lib/utils/cn";

interface FeaturePaywallProps {
  title: string;
  description: string;
  featureLabel: string;
  check: FeatureCheckResult;
  currentPlan: PlanCode;
  className?: string;
}

export function FeaturePaywall({
  title,
  description,
  featureLabel,
  check,
  currentPlan,
  className,
}: FeaturePaywallProps) {
  const upgradePlan = check.upgradePlan ?? "growth";
  const target = getPlan(upgradePlan);

  return (
    <div className={cn("space-y-5 pb-12 animate-fade-in", className)}>
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Subscription
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em]">
          {title}
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">{description}</p>
      </header>

      <DashboardSection
        title={`${featureLabel} is on the ${target.label} plan`}
        description={check.message ?? "Upgrade to unlock this capability for your workspace."}
      >
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/30 px-5 py-8 text-center max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-subtle text-brand mb-3">
            <Lock className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <p className="font-body text-[14px] font-semibold text-foreground">
            Currently on {getPlan(currentPlan).label}
          </p>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">
            {target.description}
          </p>
          <p className="mt-3 font-body text-[13px] font-medium text-foreground">
            {formatPlanPrice(target)}
            {target.code !== "enterprise" && (
              <span className="text-text-tertiary font-normal"> · billed via MSA</span>
            )}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/enterprise/settings/plan"
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
                "bg-brand text-on-brand font-body text-[13px] font-semibold",
                "hover:bg-brand-hover transition-colors duration-fast",
              )}
            >
              View plan &amp; usage
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </Link>
            <a
              href="mailto:partnerships@glimmora.ai?subject=Plan%20upgrade"
              className={cn(
                "inline-flex items-center h-9 px-3.5 rounded-md",
                "bg-surface border border-stroke-subtle font-body text-[13px] font-semibold",
                "hover:bg-surface-hover transition-colors duration-fast",
              )}
            >
              Contact sales
            </a>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
