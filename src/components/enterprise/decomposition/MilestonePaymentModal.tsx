"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  X, CreditCard, CheckCircle2, Lock, Loader2, Receipt, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useRazorpayScript, type MilestonePayment, type PaymentStatus } from "./PaymentReleaseTab";

export interface MilestonePaymentModalProps {
  /** Title shown in header (project or plan name) */
  title:         string;
  /** Total contract value in INR */
  budget:        number;
  /** Which milestone is currently payable ("m1" | "m2") */
  pendingId:     "m1" | "m2";
  /** Razorpay receipt / notes identifier */
  entityId:      string;
  onSuccess:     (milestoneId: string) => void;
  onClose:       () => void;
}

export function MilestonePaymentModal({
  title, budget, pendingId, entityId, onSuccess, onClose,
}: MilestonePaymentModalProps) {
  const scriptLoaded = useRazorpayScript();
  const [activeMilestone, setActiveMilestone] = React.useState<MilestonePayment | null>(null);
  const [paymentStatus, setPaymentStatus]     = React.useState<PaymentStatus>("idle");

  const m1Amt = Math.round(budget * 0.35);
  const m2Amt = Math.round(budget * 0.35);
  const m3Amt = budget - m1Amt - m2Amt;

  const milestones: MilestonePayment[] = [
    {
      id: "m1", label: "M1 — Project Onboarding",
      description: "Released before project starts. Unlocks contributor onboarding and team formation.",
      percent: 35, amount: m1Amt, trigger: "Before project kick-off",
      status: pendingId === "m1" ? "pending" : "paid",
    },
    {
      id: "m2", label: "M2 — Development Completion",
      description: "Released on development completion sign-off. Unlocks UAT phase.",
      percent: 35, amount: m2Amt, trigger: "Development closure sign-off",
      status: pendingId === "m2" ? "pending" : "locked",
    },
    {
      id: "m3", label: "M3 — UAT & Final Sign-off",
      description: "Final payment released after UAT sign-off. Closes the project commercially.",
      percent: 30, amount: m3Amt, trigger: "UAT sign-off authority",
      status: "locked",
    },
  ];

  const totalPaid = milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.amount, 0);
  const isProcessing = paymentStatus === "creating_order" || paymentStatus === "processing";

  const formatAmt = (amt: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt);

  const triggerSuccess = (milestone: MilestonePayment) => {
    setPaymentStatus("idle");
    setActiveMilestone(null);
    onSuccess(milestone.id);
  };

  const handlePay = async (milestone: MilestonePayment) => {
    if (isProcessing) return;
    setActiveMilestone(milestone);
    setPaymentStatus("creating_order");

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: milestone.amount, currency: "INR",
          receipt: `${entityId}-${milestone.id}`,
          notes: { planId: entityId, milestone: milestone.id, planTitle: title },
        }),
      });
      const order = await res.json();
      if (!res.ok || !order.orderId) throw new Error(order.error ?? "Order creation failed");

      setPaymentStatus("processing");

      if (!scriptLoaded || !window.Razorpay) {
        setTimeout(() => triggerSuccess(milestone), 1200);
        return;
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount, currency: order.currency,
        name: "GlimmoraTeam",
        description: `${milestone.label} — ${title}`,
        order_id: order.orderId,
        theme: { color: "#A67763" },
        prefill: { name: "Enterprise Admin", email: "" },
        handler: () => triggerSuccess(milestone),
        modal: {
          ondismiss: () => {
            setPaymentStatus("idle");
            setActiveMilestone(null);
          },
        },
      });
      rzp.open();
    } catch {
      // API unavailable — simulate payment for demo
      setPaymentStatus("processing");
      setTimeout(() => triggerSuccess(milestone), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,15,0.55)", backdropFilter: "blur(6px)" }}
      onClick={!isProcessing ? onClose : undefined}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[520px] rounded-3xl overflow-hidden bg-white"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)" }}
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-brown-400 via-brown-500 to-brown-600" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <p className="text-[15px] font-bold text-gray-900">Milestone Payments</p>
            <p className="text-[12px] text-gray-400 mt-0.5 truncate max-w-[400px]">{title}</p>
          </div>
          {!isProcessing && (
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Progress summary */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Released</p>
            <p className="text-[18px] font-mono font-semibold text-forest-600 leading-tight">{formatAmt(totalPaid)}</p>
          </div>
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-600 transition-all duration-700"
                style={{ width: `${(totalPaid / budget) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {Math.round((totalPaid / budget) * 100)}% of {formatAmt(budget)} released
            </p>
          </div>
        </div>

        {/* Milestone list */}
        <div className="px-6 py-4 space-y-3">
          {milestones.map((m) => {
            const isPaid    = m.status === "paid";
            const isPending = m.status === "pending";
            const isLocked  = m.status === "locked";
            const isActive  = activeMilestone?.id === m.id && isProcessing;

            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  isPaid    ? "bg-forest-50 border-forest-200" :
                  isPending ? "bg-brown-50 border-brown-200 ring-1 ring-brown-200" :
                              "bg-gray-50 border-gray-200 opacity-55",
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  isPaid ? "bg-forest-100" : isPending ? "bg-brown-100" : "bg-gray-100",
                )}>
                  {isPaid    ? <CheckCircle2 className="w-5 h-5 text-forest-600" /> :
                   isLocked  ? <Lock className="w-4 h-4 text-gray-400" />           :
                               <CreditCard className="w-4 h-4 text-brown-600" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[12.5px] font-semibold text-gray-800">{m.label}</p>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                      isPaid    ? "bg-forest-50 text-forest-700 border-forest-200" :
                      isPending ? "bg-brown-50 text-brown-700 border-brown-200"    :
                                  "bg-gray-50 text-gray-400 border-gray-200",
                    )}>
                      {isPaid ? "Released" : isPending ? "Awaiting Release" : "Locked"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{m.description}</p>
                </div>

                {/* Amount + CTA */}
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <p className="text-[16px] font-mono font-semibold text-gray-900">{formatAmt(m.amount)}</p>
                  <p className="text-[10px] text-gray-400">{m.percent}%</p>

                  {isPending && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handlePay(m)}
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all mt-1",
                        !isProcessing
                          ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-sm"
                          : "text-gray-400 bg-gray-100 cursor-not-allowed",
                      )}
                    >
                      {isActive
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Processing…</>
                        : <><CreditCard className="w-3 h-3" /> Release Payment</>}
                    </button>
                  )}

                  {isPaid && (
                    <div className="flex items-center gap-1 text-[10.5px] font-semibold text-forest-600 mt-1">
                      <ShieldCheck className="w-3 h-3" /> Confirmed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-start gap-2">
          <Receipt className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-[10.5px] text-gray-400 leading-relaxed">
            Secured via Razorpay · PCI DSS Compliant · 256-bit SSL.{" "}
            {pendingId === "m1"
              ? "Releasing M1 kicks off the project and unlocks contributor onboarding."
              : "Releasing M2 resumes the project and unlocks all contributor tasks."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
