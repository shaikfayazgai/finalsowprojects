"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FolderKanban, AlertTriangle, ClipboardCheck, Wallet, ArrowRight } from "lucide-react";
import { fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import type { DashboardMetrics } from "@/types/enterprise";

interface MetricTilesProps {
  metrics: DashboardMetrics;
}

export function MetricTiles({ metrics }: MetricTilesProps) {
  const budgetBarColor =
    metrics.budgetPercent > 100 ? "bg-red-500" :
    metrics.budgetPercent > 80 ? "bg-gold-500" :
    "bg-brown-500";

  const budgetTextColor =
    metrics.budgetPercent > 100 ? "text-red-600" :
    metrics.budgetPercent > 80 ? "text-gold-600" :
    "text-gray-500";

  return (
    <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* ACTIVE */}
      <motion.div variants={scaleIn}>
        <Link href="/enterprise/projects?status=in_progress" className="card-parchment block px-5 py-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Active</div>
              <div className="text-[28px] font-semibold text-gray-900 leading-none mt-0.5 tabular-nums">{metrics.activeProjects}</div>
              <div className="text-[11px] text-gray-400 mt-1">Active projects</div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* EXCEPTIONS */}
      <motion.div variants={scaleIn}>
        <Link href="/enterprise/projects/exceptions" className="card-parchment block px-5 py-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${metrics.openExceptions > 0 ? "bg-gradient-to-br from-red-400 to-red-600" : "bg-gradient-to-br from-forest-400 to-forest-600"}`}>
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Exceptions</div>
              <div className="text-[28px] font-semibold text-gray-900 leading-none mt-0.5 tabular-nums">{metrics.openExceptions}</div>
              <div className="text-[11px] text-gray-400 mt-1">Across {metrics.exceptionsProjectCount} project{metrics.exceptionsProjectCount !== 1 ? "s" : ""}</div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* APPROVALS */}
      <motion.div variants={scaleIn}>
        <Link href="/enterprise/review" className="card-parchment block px-5 py-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${metrics.pendingApprovals > 0 ? "bg-gradient-to-br from-gold-400 to-gold-600" : "bg-gradient-to-br from-teal-400 to-teal-600"}`}>
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Approvals</div>
              <div className="text-[28px] font-semibold text-gray-900 leading-none mt-0.5 tabular-nums">{metrics.pendingApprovals}</div>
              <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-brown-500">Review now <ArrowRight className="w-3 h-3" /></div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* BUDGET USED */}
      <motion.div variants={scaleIn}>
        <Link href="/enterprise/billing" className="card-parchment block px-5 py-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Budget Used</div>
              <div className="text-[28px] font-semibold text-gray-900 leading-none mt-0.5 tabular-nums">
                {metrics.currency}{Math.round(metrics.budgetSpent / 1000)}k
              </div>
              <div className={`text-[11px] mt-1 ${budgetTextColor}`}>
                {metrics.budgetPercent}% of total committed
              </div>
              {/* Progress bar */}
              <div className="mt-1.5 w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${budgetBarColor}`}
                  style={{ width: `${Math.min(metrics.budgetPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
