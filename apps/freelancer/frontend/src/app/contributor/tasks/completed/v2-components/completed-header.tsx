"use client";

import * as React from "react";
import {
  Award,
  CheckCircle2,
  ListChecks,
  Share2,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCompletedWork } from "@/lib/contributor/use-completed-work";

export function CompletedHeader() {
  const items = useCompletedWork();
  const s = React.useMemo(() => {
    const totalCents = items.reduce((acc, c) => {
      const value = Number(c.payoutAmount.replace(/[^0-9]/g, "")) || 0;
      return acc + value;
    }, 0);
    return {
      totalAccepted: items.length,
      firstTryAccepts: items.filter((c) => c.firstTryAccept).length,
      credentialsIssued: items.filter((c) => !!c.credential).length,
      portfolioShared: items.filter((c) => c.portfolioShared).length,
      portfolioEligible: items.filter((c) => c.portfolioEligible).length,
      lifetimePayout: `$${totalCents.toLocaleString()}`,
      uniqueProjects: new Set(items.map((c) => c.project)).size,
    };
  }, [items]);

  const rhythm = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const c of items) {
      map.set(c.yearMonth, (map.get(c.yearMonth) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([yearMonth, count]) => {
        const [, m] = yearMonth.split("-");
        const monthLabel = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
          Number(m) - 1
        ];
        return { month: monthLabel, count };
      });
  }, [items]);
  const maxRhythm = Math.max(1, ...rhythm.map((r) => r.count));

  return (
    <section className="rounded-2xl border border-beige-200 bg-gradient-to-br from-beige-50 via-white to-teal-50/30 overflow-hidden">
      <div className="px-6 py-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal-700">
            Work Execution · Completed Work
          </p>
          <h1 className="font-heading text-[24px] font-semibold text-brown-950 leading-tight mt-1">
            Your delivered work
          </h1>
          <p className="text-[13px] text-beige-700 mt-1 max-w-2xl leading-relaxed">
            Every accepted submission lives here — searchable, filterable, portfolio-ready. The mentor&apos;s &ldquo;what worked&rdquo; stays attached to each item.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-200 bg-forest-50 px-2.5 py-1 text-[11px] font-semibold text-forest-700">
          <Sparkles className="h-3.5 w-3.5" />
          Lifetime archive
        </span>
      </div>

      <div className="px-6 pb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile Icon={CheckCircle2} label="Total accepted" value={String(s.totalAccepted)} helper={`Across ${s.uniqueProjects} projects`} tone="teal" />
        <Tile Icon={Sparkles} label="First-try accepts" value={String(s.firstTryAccepts)} helper="Single-round acceptance" tone="forest" />
        <Tile Icon={Award} label="Credentials issued" value={String(s.credentialsIssued)} helper="Publicly shareable" tone="gold" />
        <Tile Icon={Wallet} label="Lifetime earned" value={s.lifetimePayout} helper="Across all accepted work" tone="brown" />
      </div>

      {/* Yearly rhythm */}
      <div className="px-6 py-3 border-t border-beige-200/70 bg-white/40">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-600">
            Monthly rhythm · accepted submissions
          </p>
          <p className="text-[11px] text-beige-700 inline-flex items-center gap-1.5">
            <Share2 className="h-3 w-3" />
            <span><strong className="text-brown-900">{s.portfolioShared}</strong> of {s.portfolioEligible} portfolio items shared publicly</span>
          </p>
        </div>
        <div className="grid items-end h-12 gap-1.5" style={{ gridTemplateColumns: `repeat(${rhythm.length}, minmax(0, 1fr))` }}>
          {rhythm.map((r) => (
            <div key={r.month} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-full rounded-t-sm",
                  r.count === maxRhythm ? "bg-teal-500" : r.count >= maxRhythm * 0.5 ? "bg-teal-300" : "bg-beige-300",
                )}
                style={{ height: `${Math.max(12, (r.count / maxRhythm) * 100)}%` }}
                title={`${r.month} · ${r.count} accepted`}
              />
              <p className="text-[10px] text-beige-700 mt-1 font-semibold tabular-nums">{r.month}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tile({
  Icon,
  label,
  value,
  helper,
  tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper: string;
  tone: "teal" | "forest" | "gold" | "brown";
}) {
  const palette = {
    teal: { border: "border-teal-200", ring: "ring-teal-200 bg-teal-50", tint: "text-teal-700" },
    forest: { border: "border-forest-200", ring: "ring-forest-200 bg-forest-50", tint: "text-forest-700" },
    gold: { border: "border-gold-200", ring: "ring-gold-200 bg-gold-50", tint: "text-gold-800" },
    brown: { border: "border-brown-200", ring: "ring-brown-200 bg-brown-50", tint: "text-brown-800" },
  }[tone];
  return (
    <div className={cn("rounded-xl border bg-white px-3.5 py-3 flex items-start gap-2.5", palette.border)}>
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl ring-2 ring-white shrink-0", palette.ring)}>
        <Icon className={cn("h-4 w-4", palette.tint)} />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-beige-600">{label}</p>
        <p className="font-heading text-[22px] font-semibold text-brown-950 mt-0.5 leading-none tabular-nums">{value}</p>
        <p className="text-[10.5px] text-beige-600 mt-1 leading-snug">{helper}</p>
      </div>
    </div>
  );
}
