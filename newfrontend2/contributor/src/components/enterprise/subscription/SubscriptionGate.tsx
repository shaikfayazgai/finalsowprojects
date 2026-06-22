"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTenantSubscription } from "@/lib/hooks/use-tenant-subscription";
import { checkFeatureAccess } from "@/lib/subscription/enforce";
import { featureForPath } from "@/lib/subscription/route-features";
import { FeaturePaywall } from "./FeaturePaywall";

export function SubscriptionRouteGate({
  children,
  skip,
}: {
  children: React.ReactNode;
  skip?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const { data: sub, isLoading } = useTenantSubscription({ enabled: !skip });

  const requirement = featureForPath(pathname);

  if (skip || isLoading || !requirement || !sub) {
    return <>{children}</>;
  }

  const check = checkFeatureAccess(sub, requirement.feature);
  if (check.allowed) {
    return <>{children}</>;
  }

  return (
    <FeaturePaywall
      title={requirement.label}
      description="This capability is included in higher Glimmora workspace plans."
      featureLabel={requirement.label}
      check={check}
      currentPlan={sub.plan.code}
    />
  );
}

export function TenantStatusBanner({ skip }: { skip?: boolean }) {
  const { data: sub } = useTenantSubscription({ enabled: !skip });
  if (skip || !sub) return null;

  if (sub.tenantStatus === "paused") {
    return (
      <div className="mx-5 mt-4 rounded-xl border border-warning-border bg-warning-subtle/40 px-4 py-3">
        <p className="font-body text-[12.5px] font-semibold text-warning-text">
          Workspace paused — contact Glimmora to restore access.
        </p>
      </div>
    );
  }

  if (sub.trialExpired) {
    return (
      <div className="mx-5 mt-4 rounded-xl border border-error-border/60 bg-error-subtle/30 px-4 py-3">
        <p className="font-body text-[12.5px] font-semibold text-error-text">
          Trial ended — upgrade your plan to continue using AI and delivery features.
        </p>
      </div>
    );
  }

  if (sub.trialEndsAt && sub.plan.code === "trial") {
    const days = Math.max(
      0,
      Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86_400_000),
    );
    if (days <= 7) {
      return (
        <div className="mx-5 mt-4 rounded-xl border border-warning-border/60 bg-warning-subtle/25 px-4 py-3">
          <p className="font-body text-[12.5px] text-foreground">
            <span className="font-semibold">{days} day{days === 1 ? "" : "s"} left</span> on your
            trial —{" "}
            <a href="/enterprise/settings/plan" className="text-brand font-semibold underline underline-offset-2">
              view plans
            </a>
          </p>
        </div>
      );
    }
  }

  return null;
}
