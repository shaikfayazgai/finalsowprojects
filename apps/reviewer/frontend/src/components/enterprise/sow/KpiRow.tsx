"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { scaleIn } from "@/lib/utils/motion-variants";
import type { LucideIcon } from "lucide-react";

interface KpiItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg: string;
}

interface KpiRowProps {
  items: KpiItem[];
  cols?: 2 | 3 | 4;
  className?: string;
}

export function KpiRow({ items, cols = 4, className }: KpiRowProps) {
  const gridCols = cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn("grid gap-3", gridCols, className)}>
      {items.map((kpi) => {
        const KpiIcon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            variants={scaleIn}
            className="card-parchment flex items-center gap-5 px-5 py-5"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
              <KpiIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
              <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
