"use client";

/**
 * Open opportunities — marketplace tasks published to the skilled pool.
 * Contributors see the PRICE first, then express interest. Enterprise
 * selects one of the interested contributors.
 */

import * as React from "react";
import { useSession } from "next-auth/react";
import { Sparkles, Check, Clock } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  contributorInterest,
  expressInterest,
  listOpenForContributor,
  marketplaceOverlay,
  withdrawInterest,
  type MarketplaceTask,
} from "@/lib/enterprise/mocks/task-marketplace";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { contributorViewFromTaskLike, formatINR } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";

function fmtPrice(t: MarketplaceTask): string {
  const view = contributorViewFromTaskLike({
    pricing: t.pricing,
    agreedRatePerHour: t.agreedRatePerHour,
    agreedCurrency: t.agreedCurrency,
    estimatedHours: t.estimatedHours,
  });
  return view ? formatINR(view.contributorPayout) : "—";
}

function priceMeta(t: MarketplaceTask): string {
  const view = contributorViewFromTaskLike({
    pricing: t.pricing,
    agreedRatePerHour: t.agreedRatePerHour,
    agreedCurrency: t.agreedCurrency,
    estimatedHours: t.estimatedHours,
  });
  if (view?.payoutMode === "fixed") return "Fixed-price task";
  if (view?.hourlyRate && view.estimatedHours) {
    return `${formatINR(view.hourlyRate)}/hr × ${view.estimatedHours}h`;
  }
  return `${t.estimatedHours}h estimated`;
}

export function OpportunitiesSection() {
  const { data: session } = useSession();
  useOverlayVersion(marketplaceOverlay);
  const email = session?.user?.email ?? null;
  const name = session?.user?.name ?? "Contributor";

  const open = React.useMemo(() => listOpenForContributor(email), [email]);
  if (!email || open.length === 0) return null;

  return (
    <DashboardSection
      title="Open opportunities"
      description="Published to skilled contributors — review the price, then show interest. Enterprise selects one."
    >
      <ul className="divide-y divide-stroke-subtle -mx-5">
        {open.map((t) => {
          const mine = contributorInterest(t.id, email);
          const interested = mine?.status === "interested";
          const price = fmtPrice(t);
          return (
            <li key={t.id} className="px-5 py-3 flex items-center justify-between gap-4 min-h-[52px]">
              <div className="min-w-0 flex-1">
                <p className="font-body text-[13px] font-medium text-foreground truncate">
                  {t.title}
                </p>
                <p className="mt-0.5 font-body text-[11px] text-text-tertiary truncate">
                  {t.projectName} · {t.requiredSkills.join(" · ")} · {priceMeta(t)}
                </p>
                <p className="mt-1 font-body text-[12px] font-semibold text-foreground">
                  Estimated payout: {price}
                </p>
              </div>
              <div className="shrink-0">
                {interested ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-body text-[11.5px] font-medium text-brand">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      Interested · awaiting selection
                    </span>
                    <button
                      type="button"
                      onClick={() => withdrawInterest(t.id, email)}
                      className="h-7 px-2.5 rounded-md border border-stroke font-body text-[11px] font-semibold text-text-secondary hover:text-error-text"
                    >
                      Withdraw
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      expressInterest(t.id, { id: email, name, email })
                    }
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md",
                      "bg-brand text-on-brand font-body text-[11.5px] font-semibold hover:bg-brand-hover transition-colors duration-fast",
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                    I&apos;m interested
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 px-5 font-body text-[11px] text-text-tertiary inline-flex items-center gap-1">
        <Check className="h-3 w-3" strokeWidth={2} aria-hidden />
        Price is always shown before you express interest.
      </p>
    </DashboardSection>
  );
}
