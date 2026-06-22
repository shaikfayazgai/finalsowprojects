"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getRoleDashboardModule } from "@/lib/enterprise/rbac";
import type { EnterprisePersona } from "@/lib/enterprise/rbac";
import { cn } from "@/lib/utils/cn";

export function RoleDashboardBand({
  persona,
  counts,
}: {
  persona: EnterprisePersona;
  counts: {
    sowApproval: number;
    sowStale: number;
    pendingReviews: number;
    planActive: number;
    planDraft: number;
    sowApproved: number;
  };
}) {
  const module = getRoleDashboardModule(persona, counts);

  return (
    <section
      className="rounded-xl border border-stroke bg-surface shadow-xs overflow-hidden"
      aria-label={`${module.personaLabel} workspace`}
    >
      <div className="px-4 py-3 border-b border-stroke-subtle bg-bg-subtle/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-link">
            Your role · {module.personaLabel}
          </p>
          <p className="mt-1 font-body text-[13px] text-text-secondary leading-relaxed max-w-xl">
            {module.briefBody}
          </p>
        </div>
        <Link
          href={module.briefHref}
          className={cn(
            "inline-flex items-center gap-1.5 shrink-0 h-8 px-3 rounded-lg",
            "border border-stroke-subtle bg-surface font-body text-[12px] font-semibold text-foreground",
            "hover:bg-bg-subtle transition-colors duration-fast",
          )}
        >
          Open workspace
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
