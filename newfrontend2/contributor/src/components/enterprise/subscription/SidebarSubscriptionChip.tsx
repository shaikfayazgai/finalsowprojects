"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { Tooltip } from "@/components/meridian/primitives/Tooltip";
import { useEnterpriseTenantRoles } from "@/lib/hooks/use-enterprise-tenant-roles";
import { useTenantSubscription } from "@/lib/hooks/use-tenant-subscription";
import { getSubscriptionUsageWarning } from "@/lib/subscription/usage-warnings";
import type { TenantSubscriptionSnapshot } from "@/lib/subscription/types";
import { cn } from "@/lib/utils/cn";

interface SidebarSubscriptionChipProps {
  collapsed: boolean;
}

export function SidebarSubscriptionChip({ collapsed }: SidebarSubscriptionChipProps) {
  const { sectionAccess } = useEnterpriseTenantRoles();
  const canViewPlan = sectionAccess("plan") !== "none";
  const { data: subscription, isLoading, isError } = useTenantSubscription();

  if (!canViewPlan) return null;
  if (isLoading) {
    return (
      <div
        className={cn(
          "shrink-0 border-t border-stroke/70",
          collapsed ? "px-2 py-2 flex justify-center" : "px-3 py-2.5",
        )}
        aria-hidden
      >
        <div
          className={cn(
            "rounded-lg bg-surface/45 animate-pulse",
            collapsed ? "h-9 w-9" : "h-[72px] w-full",
          )}
        />
      </div>
    );
  }
  if (isError || !subscription) return null;

  if (collapsed) {
    return <CollapsedChip subscription={subscription} />;
  }

  return <ExpandedChip subscription={subscription} />;
}

function ExpandedChip({ subscription }: { subscription: TenantSubscriptionSnapshot }) {
  const status = subscriptionStatus(subscription);
  const usageWarning = getSubscriptionUsageWarning(subscription);

  return (
    <div className="shrink-0 border-t border-stroke/70 px-3 py-2.5">
      <Link
        href="/enterprise/settings/plan"
        prefetch={false}
        className={cn(
          "block rounded-lg px-3 py-2.5",
          "bg-surface/55 ring-1 ring-stroke-subtle shadow-[var(--shadow-xs)]",
          "transition-colors duration-fast hover:bg-surface/75",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-body text-[12.5px] font-semibold text-foreground leading-tight">
            {subscription.plan.label} plan
          </p>
          <StatusChip status={status.tone} size="sm" showDot>
            {status.label}
          </StatusChip>
        </div>

        {usageWarning ? (
          <p className="mt-1.5 font-body text-[11px] text-warning-text tabular-nums">
            {usageWarning.used}/{usageWarning.limit} {usageWarning.label.toLowerCase()}
          </p>
        ) : subscription.trialEndsAt && !subscription.trialExpired ? (
          <p className="mt-1.5 font-body text-[11px] text-text-tertiary">
            Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}
          </p>
        ) : null}

        <p className="mt-1.5 font-body text-[11px] font-semibold text-brand-emphasis">
          View plan →
        </p>
      </Link>
    </div>
  );
}

function CollapsedChip({ subscription }: { subscription: TenantSubscriptionSnapshot }) {
  const status = subscriptionStatus(subscription);
  const usageWarning = getSubscriptionUsageWarning(subscription);
  const tooltip = usageWarning
    ? `${subscription.plan.label} · ${status.label} · ${usageWarning.used}/${usageWarning.limit} ${usageWarning.label.toLowerCase()}`
    : `${subscription.plan.label} · ${status.label}`;

  return (
    <div className="shrink-0 border-t border-stroke/70 px-2 py-2 flex justify-center">
      <Tooltip content={tooltip} side="right">
        <Link
          href="/enterprise/settings/plan"
          prefetch={false}
          aria-label={`${subscription.plan.label} plan — ${status.label}. View plan.`}
          className={cn(
            "relative inline-flex items-center justify-center h-9 w-9 rounded-md",
            "bg-surface/55 ring-1 ring-stroke-subtle shadow-[var(--shadow-xs)]",
            "text-text-secondary hover:bg-surface/75 hover:text-foreground",
            "transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          )}
        >
          <CreditCard className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {usageWarning && (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-warning ring-2 ring-surface"
            />
          )}
        </Link>
      </Tooltip>
    </div>
  );
}

function subscriptionStatus(subscription: TenantSubscriptionSnapshot): {
  label: string;
  tone: "success" | "warning" | "error" | "info" | "neutral";
} {
  if (subscription.trialExpired) {
    return { label: "Trial expired", tone: "error" };
  }
  if (subscription.trialEndsAt) {
    return { label: "Trial", tone: "info" };
  }
  if (subscription.tenantStatus === "active") {
    return { label: "Active", tone: "success" };
  }
  if (subscription.tenantStatus === "paused") {
    return { label: "Paused", tone: "warning" };
  }
  return {
    label: subscription.tenantStatus.charAt(0).toUpperCase() + subscription.tenantStatus.slice(1),
    tone: "neutral",
  };
}
