"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  XCircle, AlertTriangle, RotateCcw, Banknote,
  ClipboardCheck, FileText, GitBranch, Clock,
  ChevronRight, CheckCircle2,
} from "lucide-react";
import { fadeUp } from "@/lib/utils/motion-variants";
import type { AttentionItem, AttentionPriority } from "@/types/enterprise";

interface AttentionPanelProps {
  items: AttentionItem[];
}

const PRIORITY_RANK: Record<AttentionPriority, number> = {
  MILESTONE_OVERDUE: 1,
  ESCALATION: 2,
  REWORK: 3,
  BUDGET_REVIEW: 4,
  REVIEW_PENDING: 5,
  MILESTONE_DUE: 6,
  SOW_APPROVAL: 7,
  PLAN_APPROVAL: 8,
};

const TYPE_CONFIG: Record<AttentionPriority, { icon: React.ElementType; dotColor: string; badgeBg: string; badgeText: string; label: string }> = {
  MILESTONE_OVERDUE: { icon: XCircle, dotColor: "var(--danger)", badgeBg: "bg-red-50", badgeText: "text-red-700", label: "Overdue" },
  MILESTONE_DUE: { icon: Clock, dotColor: "var(--color-gold-500)", badgeBg: "bg-gold-50", badgeText: "text-gold-700", label: "Due" },
  ESCALATION: { icon: AlertTriangle, dotColor: "var(--danger)", badgeBg: "bg-red-50", badgeText: "text-red-700", label: "Escalation" },
  REWORK: { icon: RotateCcw, dotColor: "var(--color-teal-500)", badgeBg: "bg-teal-50", badgeText: "text-teal-700", label: "Rework" },
  REVIEW_PENDING: { icon: ClipboardCheck, dotColor: "var(--color-gold-500)", badgeBg: "bg-gold-50", badgeText: "text-gold-700", label: "Review" },
  SOW_APPROVAL: { icon: FileText, dotColor: "var(--color-forest-500)", badgeBg: "bg-forest-50", badgeText: "text-forest-700", label: "SOW" },
  PLAN_APPROVAL: { icon: GitBranch, dotColor: "var(--color-brown-500)", badgeBg: "bg-brown-50", badgeText: "text-brown-700", label: "Plan" },
  BUDGET_REVIEW: { icon: Banknote, dotColor: "var(--color-gold-500)", badgeBg: "bg-gold-50", badgeText: "text-gold-700", label: "Budget" },
};

export function AttentionPanel({ items }: AttentionPanelProps) {
  const sorted = [...items].sort((a, b) => PRIORITY_RANK[a.type] - PRIORITY_RANK[b.type]);
  const visible = sorted.slice(0, 5);
  const overflow = sorted.length - 5;

  return (
    <motion.div variants={fadeUp} className="card-parchment flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800">Needs Your Attention</h2>
          {items.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {items.length}
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-forest-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">You&apos;re all caught up</p>
          <p className="text-[12px] text-gray-400 mt-1">No items require your attention. All projects are on track.</p>
        </div>
      ) : (
        <div className="flex-1">
          {visible.map((item, i) => {
            const cfg = TYPE_CONFIG[item.type];
            const Icon = cfg.icon;
            return (
              <Link key={item.id} href={item.href}>
                <div
                  className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-black/[0.02]"
                  style={{ borderBottom: i < visible.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                >
                  {/* Urgency dot */}
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dotColor }} />
                  {/* Icon */}
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.dotColor }} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-700 truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</div>
                  </div>
                  {/* Badge */}
                  <span className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}>
                    {cfg.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Overflow */}
      {overflow > 0 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <Link href="/enterprise/projects/exceptions" className="text-[12px] font-medium text-brown-500 hover:text-brown-600">
            View all {sorted.length} items &rarr;
          </Link>
        </div>
      )}
    </motion.div>
  );
}
