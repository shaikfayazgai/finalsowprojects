"use client";

/**
 * Meridian — ExecutivePulseBand
 *
 * Horizontal KPI strip that sits at the top of the dashboard. Composes
 * `MetricTile` primitives into a responsive auto-fit grid with consistent
 * gap and density. On narrow viewports the band wraps; on ultrawide it
 * stays single-row.
 *
 *   ┌──────┬──────┬──────┬──────┬──────┬──────┐
 *   │ SOWs │Proj  │Workf │Rev   │SLA   │Risk  │
 *   │  17  │  42  │ 87%  │₹2.4M │ 94%  │  3   │
 *   │ ▲ 4  │ ▲ 2  │ ▲ 4% │ ▲12% │ ▼ 2% │ ▼ 1  │
 *   └──────┴──────┴──────┴──────┴──────┴──────┘
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { MetricTile, type MetricTone } from "./MetricTile";
import type { LucideIcon } from "lucide-react";

export interface PulseMetric {
  id: string;
  label: string;
  value: string | number;
  delta?: number | string;
  tone?: MetricTone;
  hint?: string;
  icon?: LucideIcon;
  /** Trailing trend values for the inline sparkline. */
  spark?: number[];
}

interface ExecutivePulseBandProps {
  metrics: PulseMetric[];
  className?: string;
}

export const ExecutivePulseBand: React.FC<ExecutivePulseBandProps> = ({
  metrics,
  className,
}) => (
  <div
    role="group"
    aria-label="Executive pulse"
    className={cn(
      "grid gap-3",
      "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
      className,
    )}
  >
    {metrics.map((m) => (
      <MetricTile
        key={m.id}
        label={m.label}
        value={m.value}
        delta={m.delta}
        tone={m.tone}
        hint={m.hint}
        icon={m.icon}
        spark={m.spark}
      />
    ))}
  </div>
);
