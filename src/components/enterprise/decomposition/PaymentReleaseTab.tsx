"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, CheckCircle2, Lock, Clock, AlertTriangle,
  Loader2, ShieldCheck, Receipt, X, Sparkles, ArrowRight,
  BadgeCheck, Banknote, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useProjectHoldStore } from "@/lib/stores/project-hold-store";

declare global {
  interface Window { Razorpay: any; }
}

/* ── Types ── */
export type MilestonePayment = {
  id:          "m1" | "m2" | "m3";
  label:       string;
  description: string;
  percent:     number;
  amount:      number;
  trigger:     string;
  status:      "pending" | "locked" | "paid";
};

export type PaymentStatus = "idle" | "creating_order" | "processing" | "success" | "failed";

/* ── Load Razorpay script ── */
export function useRazorpayScript() {
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    if (window.Razorpay) { setLoaded(true); return; }
    const script  = document.createElement("script");
    script.src    = "https://checkout.razorpay.com/v1/checkout.js";
    script.async  = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);
  return loaded;
}

/* ── Confirmation Modal ── */
export interface ConfirmModalProps {
  milestone:    MilestonePayment;
  planTitle:    string;
  currency:     string;
  formatAmount: (n: number) => string;
  status:       PaymentStatus;
  onConfirm:    () => void;
  onClose:      () => void;
}

export function PaymentConfirmModal({ milestone, planTitle, currency, formatAmount, status, onConfirm, onClose }: ConfirmModalProps) {
  const isLoading = status === "creating_order" || status === "processing";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(15,15,15,0.55)", backdropFilter: "blur(6px)" }}
        onClick={!isLoading ? onClose : undefined}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[440px] rounded-3xl overflow-hidden"
          style={{ background: "#ffffff", boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)" }}
        >

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-brown-400 via-brown-500 to-brown-600" />

          {/* Header */}
          <div className="px-6 pt-4 pb-4 flex items-start justify-between"
            style={{ borderBottom: "1px solid #f3f4f6" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0 shadow-sm">
                <Banknote className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900 leading-tight">Release Payment</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Milestone {milestone.id.toUpperCase()}</p>
              </div>
            </div>
            {!isLoading && (
              <button onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Amount hero */}
          <div className="px-6 py-4 text-center"
            style={{ background: "linear-gradient(135deg, #fdf8f5 0%, #faf5f0 100%)", borderBottom: "1px solid #f3f4f6" }}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Amount Due</p>
            <p className="text-[38px] font-mono font-bold text-gray-900 leading-none tracking-tight">
              {formatAmount(milestone.amount)}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full bg-brown-50 border border-brown-200">
              <span className="text-[10px] font-semibold text-brown-700">{milestone.percent}% of total contract value</span>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-4 space-y-2.5" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Project" value={planTitle} />
            <DetailRow icon={<BadgeCheck className="w-3.5 h-3.5" />} label="Milestone" value={milestone.label} />
            <DetailRow icon={<Clock className="w-3.5 h-3.5" />} label="Trigger" value={milestone.trigger} />
            <DetailRow icon={<Receipt className="w-3.5 h-3.5" />} label="Currency" value={currency} />
          </div>

          {/* What unlocks */}
          <div className="px-6 py-3 flex items-start gap-3"
            style={{ background: "#f0fdf4", borderBottom: "1px solid #dcfce7" }}>
            <Sparkles className="w-3.5 h-3.5 text-forest-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-forest-700 leading-relaxed">
              {milestone.id === "m1"
                ? "Releasing M1 unlocks contributor onboarding, team formation, and project kick-off."
                : milestone.id === "m2"
                ? "Releasing M2 confirms development completion and unlocks the UAT phase."
                : "Releasing M3 closes the project commercially and confirms final delivery acceptance."}
            </p>
          </div>

          {/* Action */}
          <div className="px-6 py-4 flex flex-col gap-2.5">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold transition-all",
                isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "text-white bg-gradient-to-r from-brown-500 to-brown-700 hover:from-brown-600 hover:to-brown-800 shadow-lg shadow-brown-200 active:scale-[0.98]"
              )}
            >
              {status === "creating_order" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating Secure Order…</>
              ) : status === "processing" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Opening Payment Gateway…</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Confirm &amp; Pay {formatAmount(milestone.amount)} <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>

            {/* Trust strip */}
            <div className="flex items-center justify-center gap-4">
              <TrustPill icon={<ShieldCheck className="w-3 h-3" />} label="256-bit SSL" />
              <TrustPill icon={<Lock className="w-3 h-3" />} label="PCI DSS Compliant" />
              <TrustPill icon={<BadgeCheck className="w-3 h-3" />} label="RBI Approved" />
            </div>

            <p className="text-center text-[10px] text-gray-400">
              Secured by <span className="font-semibold text-gray-500">Razorpay</span>. Your payment info is never stored on our servers.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-[11.5px] font-medium text-gray-500">{label}</span>
      </div>
      <span className="text-[12px] font-semibold text-gray-800 text-right max-w-[220px] truncate">{value}</span>
    </div>
  );
}

function TrustPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 text-gray-400">
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}

/* ── Props ── */
interface Props {
  planId:          string;
  planTitle:       string;
  estimatedCost:   number;
  currency?:       string;
  projectId?:      string;
  onProjectHold?:  (projectId: string) => void;
}

const M2_DEADLINE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PaymentReleaseTab({ planId, planTitle, estimatedCost, currency = "INR", projectId, onProjectHold }: Props) {
  const scriptLoaded = useRazorpayScript();
  const effectiveProjectId = projectId ?? planId;
  const { setM1Paid, holdProject, m1PaidTimestamps } = useProjectHoldStore();

  /* M2 deadline countdown after M1 is paid */
  const m1PaidAt = m1PaidTimestamps[effectiveProjectId];
  const [m2DaysLeft, setM2DaysLeft] = React.useState<number | null>(null);

  const m1Amount = Math.round(estimatedCost * 0.35);
  const m2Amount = Math.round(estimatedCost * 0.35);
  const m3Amount = estimatedCost - m1Amount - m2Amount;

  const [milestones, setMilestones] = React.useState<MilestonePayment[]>([
    { id: "m1", label: "M1 — Project Onboarding",     description: "Released before project starts. Unlocks contributor onboarding and team formation.", percent: 35, amount: m1Amount, trigger: "Before project kick-off",      status: "pending" },
    { id: "m2", label: "M2 — Development Completion", description: "Released on development completion sign-off. Unlocks UAT phase.",                  percent: 35, amount: m2Amount, trigger: "Development closure sign-off", status: "locked"  },
    { id: "m3", label: "M3 — UAT & Final Sign-off",   description: "Final payment released after UAT sign-off. Closes the project commercially.",      percent: 30, amount: m3Amount, trigger: "UAT sign-off authority",      status: "locked"  },
  ]);

  const [confirmingMilestone, setConfirmingMilestone] = React.useState<MilestonePayment | null>(null);
  const [paymentStatus, setPaymentStatus]             = React.useState<PaymentStatus>("idle");
  const [paidMilestone, setPaidMilestone]             = React.useState<string | null>(null);

  /* Track M2 deadline: after M1 is paid, check every minute if 7 days elapsed */
  React.useEffect(() => {
    const m2 = milestones.find((m) => m.id === "m2");
    if (!m1PaidAt || m2?.status === "paid") { setM2DaysLeft(null); return; }

    const compute = () => {
      const elapsed = Date.now() - m1PaidAt;
      const remaining = M2_DEADLINE_MS - elapsed;
      const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
      setM2DaysLeft(days);

      if (remaining <= 0) {
        holdProject(effectiveProjectId, "payment_overdue");
        onProjectHold?.(effectiveProjectId);
      }
    };

    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m1PaidAt, effectiveProjectId]);

  const formatAmount = (amt: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amt);

  const handlePay = async () => {
    const milestone = confirmingMilestone;
    if (!milestone || !scriptLoaded) return;
    setPaymentStatus("creating_order");

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:  milestone.amount,
          currency,
          receipt: `${planId}-${milestone.id}`,
          notes:   { planId, milestone: milestone.id, planTitle },
        }),
      });

      const order = await res.json();
      if (!res.ok || !order.orderId) throw new Error(order.error ?? "Order creation failed");

      setPaymentStatus("processing");

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency,
        name:        "GlimmoraTeam",
        description: `${milestone.label} — ${planTitle}`,
        order_id:    order.orderId,
        theme:       { color: "#A67763" },
        prefill:     { name: "Enterprise Admin", email: "" },
        handler: () => {
          setPaymentStatus("success");
          setPaidMilestone(milestone.id);
          setConfirmingMilestone(null);
          if (milestone.id === "m1") setM1Paid(effectiveProjectId);
          setMilestones((prev) =>
            prev.map((m, i, arr) => {
              if (m.id === milestone.id) return { ...m, status: "paid" };
              const idx = arr.findIndex((x) => x.id === milestone.id);
              if (i === idx + 1)         return { ...m, status: "pending" };
              return m;
            })
          );
          setTimeout(() => {
            setPaymentStatus("idle");
            setPaidMilestone(null);
          }, 4000);
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus("idle");
            setConfirmingMilestone(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentStatus("failed");
      setTimeout(() => {
        setPaymentStatus("idle");
        setConfirmingMilestone(null);
      }, 3000);
    }
  };

  const totalPaid    = milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.amount, 0);
  const totalPending = milestones.filter((m) => m.status === "pending").reduce((s, m) => s + m.amount, 0);
  const allPaid      = milestones.every((m) => m.status === "paid");

  return (
    <>
      {/* Confirm modal */}
      {confirmingMilestone && (
        <PaymentConfirmModal
          milestone={confirmingMilestone}
          planTitle={planTitle}
          currency={currency}
          formatAmount={formatAmount}
          status={paymentStatus}
          onConfirm={handlePay}
          onClose={() => { setConfirmingMilestone(null); setPaymentStatus("idle"); }}
        />
      )}

      <div className="space-y-6">

        {/* ── Summary strip ── */}
        <div className="card-parchment overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Value</p>
              <p className="text-[22px] font-mono font-semibold text-gray-900">{formatAmount(estimatedCost)}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Released</p>
              <p className="text-[22px] font-mono font-semibold text-forest-600">{formatAmount(totalPaid)}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
              <p className="text-[22px] font-mono font-semibold text-brown-500">{formatAmount(totalPending)}</p>
            </div>
          </div>
          <div className="px-6 pb-4">
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-600 transition-all duration-700"
                style={{ width: `${(totalPaid / estimatedCost) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {Math.round((totalPaid / estimatedCost) * 100)}% of project value released
            </p>
          </div>
        </div>

        {/* ── M2 deadline countdown banner (shown after M1 is paid) ── */}
        {m1PaidAt && milestones.find((m) => m.id === "m2")?.status !== "paid" && m2DaysLeft !== null && (
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border text-[12px]",
            m2DaysLeft <= 0
              ? "bg-red-50 border-red-200 text-red-700"
              : m2DaysLeft <= 2
              ? "bg-gold-50 border-gold-200 text-gold-700"
              : "bg-teal-50 border-teal-200 text-teal-700",
          )}>
            <Clock className="w-4 h-4 shrink-0" />
            {m2DaysLeft <= 0 ? (
              <span><span className="font-semibold">M2 payment overdue.</span> This project has been automatically placed on hold. Release M2 to resume project activities.</span>
            ) : (
              <span><span className="font-semibold">{m2DaysLeft} day{m2DaysLeft !== 1 ? "s" : ""} remaining</span> to release M2 payment. Project will be put on hold if M2 is not released by the deadline.</span>
            )}
          </div>
        )}

        {/* ── Milestone cards ── */}
        <div className="space-y-3">
          {milestones.map((m, idx) => {
            const isPaid    = m.status === "paid";
            const isLocked  = m.status === "locked";
            const isPending = m.status === "pending";
            const justPaid  = paidMilestone === m.id;

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className={cn(
                  "card-parchment overflow-hidden transition-all duration-200",
                  isPending && "ring-1 ring-brown-200",
                  isPaid    && "ring-1 ring-forest-200",
                  isLocked  && "opacity-60",
                )}
              >
                <div className="px-6 py-5 flex items-center gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    isPaid    ? "bg-forest-100 text-forest-700" :
                    isPending ? "bg-brown-100 text-brown-700"   :
                                "bg-gray-100 text-gray-400",
                  )}>
                    {isPaid ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-[13px] font-semibold text-gray-800">{m.label}</p>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                        isPaid    ? "bg-forest-50 text-forest-700 border-forest-200" :
                        isPending ? "bg-brown-50 text-brown-700 border-brown-200"    :
                                    "bg-gray-50 text-gray-500 border-gray-200",
                      )}>
                        {isPaid ? "Released" : isPending ? "Awaiting Release" : "Locked"}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-gray-500 leading-relaxed">{m.description}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-[10.5px] text-gray-400">{m.trigger}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <p className="text-[20px] font-mono font-semibold text-gray-900">{formatAmount(m.amount)}</p>
                    <p className="text-[10px] text-gray-400">{m.percent}% of total</p>

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => { setConfirmingMilestone(m); setPaymentStatus("idle"); }}
                        disabled={!scriptLoaded}
                        className={cn(
                          "flex items-center gap-1.5 text-[11.5px] font-semibold px-4 py-2 rounded-xl transition-all",
                          scriptLoaded
                            ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-sm"
                            : "text-gray-400 bg-gray-100 cursor-not-allowed",
                        )}
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Release Payment
                      </button>
                    )}

                    {isPaid && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-forest-600">
                        <ShieldCheck className="w-3.5 h-3.5" /> Payment Confirmed
                      </div>
                    )}

                    {isLocked && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Lock className="w-3 h-3" /> Locked
                      </div>
                    )}
                  </div>
                </div>

                {/* Success bar */}
                {justPaid && paymentStatus === "success" && (
                  <div className="px-6 py-3 bg-forest-50 border-t border-forest-100 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                    <span className="text-[11.5px] font-medium text-forest-700">
                      Payment successful —{" "}
                      {m.id === "m1" ? "project kick-off is now unlocked" : m.id === "m2" ? "UAT phase is now unlocked" : "project closed commercially"}
                    </span>
                  </div>
                )}

                {/* Failed bar */}
                {confirmingMilestone?.id === m.id && paymentStatus === "failed" && (
                  <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-[11.5px] font-medium text-red-600">Payment failed. Please try again.</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ── All paid ── */}
        {allPaid && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="card-parchment px-6 py-5 flex items-center gap-4 ring-1 ring-forest-200">
            <div className="w-10 h-10 rounded-2xl bg-forest-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-forest-800">All payments released</p>
              <p className="text-[11.5px] text-forest-600 mt-0.5">The project is commercially closed. Total released: {formatAmount(estimatedCost)}</p>
            </div>
          </motion.div>
        )}

        {/* ── Info note ── */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
          <Receipt className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Payments are processed securely via Razorpay. Each milestone must be released in sequence.
            M2 unlocks after M1 is confirmed. M3 unlocks after M2 is confirmed.
          </p>
        </div>

      </div>
    </>
  );
}
