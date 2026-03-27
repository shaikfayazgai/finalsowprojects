"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp } from "@/lib/utils/motion-variants";
import type { FinancialFigures } from "@/types/enterprise";

interface FinancialSnapshotProps {
  figures: FinancialFigures;
}

function formatCurrency(amount: number, currency: string) {
  if (amount >= 1000) return `${currency}${Math.round(amount / 1000)}k`;
  return `${currency}${amount.toLocaleString()}`;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function FinancialSnapshot({ figures }: FinancialSnapshotProps) {
  const c = figures.currency;
  const nextDueDays = figures.nextDue ? daysUntil(figures.nextDue.dueDate) : null;
  const nextDueAmber = nextDueDays !== null && nextDueDays <= 3;

  return (
    <motion.div variants={fadeUp} className="card-parchment flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Financial Snapshot</h2>
        <Link href="/enterprise/billing" className="flex items-center gap-1 text-[11px] font-medium text-brown-500 hover:text-brown-600">
          Details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 flex-1">
        {/* CONTRACTED */}
        <Link href="/enterprise/billing" className="px-5 py-4 border-b border-r border-gray-50 hover:bg-black/[0.01] transition-colors">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Contracted</div>
          <div className="text-[22px] font-semibold text-gray-900 leading-none mt-1 tabular-nums">
            {formatCurrency(figures.contracted, c)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">{figures.activeProjectCount} active project{figures.activeProjectCount !== 1 ? "s" : ""}</div>
        </Link>

        {/* PAID */}
        <Link href="/enterprise/billing" className="px-5 py-4 border-b border-gray-50 hover:bg-black/[0.01] transition-colors">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Paid</div>
          <div className="text-[22px] font-semibold text-gray-900 leading-none mt-1 tabular-nums">
            {formatCurrency(figures.paid, c)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Across {figures.activeProjectCount} project{figures.activeProjectCount !== 1 ? "s" : ""}</div>
        </Link>

        {/* NEXT DUE */}
        <Link href={figures.nextDue ? "/enterprise/billing/invoices" : "/enterprise/billing"} className="px-5 py-4 border-r border-gray-50 hover:bg-black/[0.01] transition-colors">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Next Due</div>
          <div className={`text-[22px] font-semibold leading-none mt-1 tabular-nums ${nextDueAmber ? "text-gold-600" : "text-gray-900"}`}>
            {figures.nextDue ? formatCurrency(figures.nextDue.amount, c) : "—"}
          </div>
          {figures.nextDue && (
            <div className={`text-[11px] mt-1 ${nextDueAmber ? "text-gold-600 font-medium" : "text-gray-400"}`}>
              {nextDueDays === 0 ? "Due today" : `${nextDueDays} day${nextDueDays !== 1 ? "s" : ""} remaining`}
              {" — "}{figures.nextDue.label}
            </div>
          )}
        </Link>

        {/* OVERDUE */}
        <Link href="/enterprise/billing/invoices" className="px-5 py-4 hover:bg-black/[0.01] transition-colors">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Overdue</div>
          <div className={`text-[22px] font-semibold leading-none mt-1 tabular-nums ${figures.overdue > 0 ? "text-red-600" : "text-gray-900"}`}>
            {figures.overdue > 0 ? formatCurrency(figures.overdue, c) : `${c}0`}
          </div>
          {figures.overdue > 0 && (
            <div className="text-[11px] text-red-500 font-medium mt-1">
              {figures.overdueProjectCount} project{figures.overdueProjectCount !== 1 ? "s" : ""} — see Billing
            </div>
          )}
        </Link>
      </div>
    </motion.div>
  );
}
