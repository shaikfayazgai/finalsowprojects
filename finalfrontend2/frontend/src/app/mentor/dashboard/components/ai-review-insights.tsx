"use client";

import * as React from "react";
import {
  Sparkles,
  Flag,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OperationalCard, SectionHeader } from "./operational-primitives";
import { AuditableBadge } from "@/app/mentor/_shared/workflow/auditable-badge";
import { ConfidenceGauge } from "@/app/mentor/_shared/workflow/confidence-gauge";
import type { AiInsight, AiInsightKind } from "@/mocks/data/mentor-workspace";

// No backend endpoint for AI insights yet — component renders empty state.
const aiInsights: AiInsight[] = [];

const kindMeta: Record<
  AiInsightKind,
  { label: string; icon: React.ElementType; tint: string; rail: string }
> = {
  flagged: {
    label: "AI Flag",
    icon: Flag,
    tint: "text-red-700 bg-red-50 border-red-200",
    rail: "bg-red-500",
  },
  low_confidence: {
    label: "Low confidence",
    icon: AlertCircle,
    tint: "text-gold-700 bg-gold-50 border-gold-200",
    rail: "bg-gold-500",
  },
  recommendation: {
    label: "Recommendation",
    icon: Lightbulb,
    tint: "text-forest-700 bg-forest-50 border-forest-200",
    rail: "bg-forest-500",
  },
};

const kindOrder: AiInsightKind[] = ["flagged", "low_confidence", "recommendation"];

export function AiReviewInsights() {
  const sorted = React.useMemo(
    () => [...aiInsights].sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind)),
    []
  );

  const flagged = aiInsights.filter((i) => i.kind === "flagged").length;
  const lowConf = aiInsights.filter((i) => i.kind === "low_confidence").length;
  const recs = aiInsights.filter((i) => i.kind === "recommendation").length;

  return (
    <OperationalCard padded={false} className="overflow-hidden flex flex-col">
      <div className="px-5 pt-4">
        <SectionHeader
          title="AI Review Insights"
          caption={`${flagged} flag · ${lowConf} low-conf · ${recs} suggestion · v3.2 model`}
          trailing={<AuditableBadge />}
        />
      </div>

      <ul className="px-5 space-y-2 overflow-y-auto">
        {sorted.map((insight) => (
          <InsightRow key={insight.id} insight={insight} />
        ))}
      </ul>

      <div className="mt-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-[11px] text-gray-600">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-forest-600" />
            Saved <span className="font-semibold text-brown-950 tabular-nums">~3h 12m</span> today
          </span>
          <span className="inline-flex items-center gap-1.5">
            Calibration <span className="font-semibold text-brown-950 tabular-nums">88%</span>
          </span>
        </div>
        <button className="font-semibold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1">
          Full AI report <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </OperationalCard>
  );
}

function InsightRow({ insight }: { insight: AiInsight }) {
  const meta = kindMeta[insight.kind];
  const Icon = meta.icon;

  return (
    <li
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border border-gray-200 bg-white/80 pl-4 pr-3 py-2.5 hover:border-gray-300 hover:bg-white transition-colors cursor-pointer"
      )}
    >
      <span
        aria-hidden
        className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full", meta.rail)}
      />
      <span
        className={cn(
          "shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg border",
          meta.tint
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center rounded border px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wider",
              meta.tint
            )}
          >
            {meta.label}
          </span>
          {insight.reviewId && (
            <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-[1px] text-[10px] font-semibold text-gray-600 tabular-nums">
              {insight.reviewId}
            </span>
          )}
        </div>

        <p className="mt-1 text-[12.5px] font-semibold text-brown-950 truncate">
          {insight.title}
        </p>
        <p className="mt-0.5 text-[11.5px] text-gray-600 leading-snug line-clamp-2">
          {insight.summary}
        </p>

        {insight.confidence !== undefined && (
          <ConfidenceGauge value={insight.confidence} className="mt-2" />
        )}

        {insight.tags && insight.tags.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
            {insight.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-[1px] text-[10px] text-gray-600"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
    </li>
  );
}
