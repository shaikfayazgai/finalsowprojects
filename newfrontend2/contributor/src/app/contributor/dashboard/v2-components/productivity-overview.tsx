"use client";

import * as React from "react";
import {
  ListChecks,
  Clock,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
} from "@/app/contributor/_shared/primitives";
import { productivityKpis, type ProductivityKpi } from "@/mocks/data/contributor-workspace";

const iconMap: Record<string, LucideIcon> = {
  active: ListChecks,
  due_soon: Clock,
  revisions: RotateCcw,
  completed: CheckCircle2,
  progress: TrendingUp,
  earnings: Wallet,
};

/**
 * Productivity Overview Row — 6 contributor-focused KPIs.
 * Tile treatment is deliberately calmer than mentor KPIs: no severity rails,
 * no pulsing badges, no "ACT NOW" copy. Tone is informational and motivating.
 */
export function ProductivityOverviewRow() {
  return (
    <ContributorCard padded={false} className="p-4 md:p-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {productivityKpis.map((kpi) => (
          <KpiTile key={kpi.key} kpi={kpi} Icon={iconMap[kpi.key] ?? ListChecks} />
        ))}
      </div>
    </ContributorCard>
  );
}

function KpiTile({ kpi, Icon }: { kpi: ProductivityKpi; Icon: LucideIcon }) {
  const accent =
    kpi.tone === "positive"
      ? "border-teal-200 bg-gradient-to-br from-teal-50/50 to-white"
      : kpi.tone === "warning"
      ? "border-gold-200 bg-gradient-to-br from-gold-50/50 to-white"
      : "border-beige-200 bg-white";
  const iconWrap =
    kpi.tone === "positive"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : kpi.tone === "warning"
      ? "border-gold-200 bg-gold-50 text-gold-700"
      : "border-beige-200 bg-beige-50 text-beige-700";
  const deltaTone =
    kpi.tone === "positive"
      ? "text-teal-700"
      : kpi.tone === "warning"
      ? "text-gold-700"
      : "text-beige-700";

  return (
    <div className={cn("rounded-xl border p-4", accent)}>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
            iconWrap
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-beige-700">
        {kpi.label}
      </p>
      <p className="mt-1 font-heading text-[26px] leading-none font-bold tracking-tight text-brown-950 tabular-nums">
        {kpi.value}
      </p>
      {kpi.delta && (
        <p className={cn("mt-1.5 text-[10.5px] font-semibold", deltaTone)}>{kpi.delta}</p>
      )}
      {kpi.caption && (
        <p className="mt-1 text-[10.5px] text-beige-600 leading-snug">{kpi.caption}</p>
      )}
    </div>
  );
}
