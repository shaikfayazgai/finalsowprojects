"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Sparkles,
  Rocket,
  FileSignature,
  AlertTriangle,
  Loader2,
  ArrowRight,
  FolderKanban,
  X,
  Brain,
  Users,
  Calendar,
  Shield,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button } from "@/components/ui";
import { mockSOWs } from "@/mocks/data/enterprise-sow";

/* ═══════════════════════════════════════════════════════════════
   Mock data
   ═══════════════════════════════════════════════════════════════ */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export default function KickoffProjectPage() {
  const params = useParams();
  const sowId = params.sowId as string;
  const sow = mockSOWs.find((s) => s.id === sowId) || mockSOWs[0];

  const [contractAcknowledged] = React.useState(true);
  const [m1Paid] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [showM1Snackbar, setShowM1Snackbar] = React.useState(false);
  const [kickoffState, setKickoffState] = React.useState<
    "ready" | "processing" | "kicked_off" | "plan_ready"
  >("ready");

  const bothConditionsMet = contractAcknowledged && m1Paid;

  const handleKickoff = () => {
    setKickoffState("processing");
    setShowConfirmModal(false);

    // Simulate kick-off processing
    setTimeout(() => setKickoffState("kicked_off"), 2000);
    setTimeout(() => setKickoffState("plan_ready"), 5000);
  };

  const m1Amount = Math.round(sow.estimatedBudget * 0.3);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[900px] mx-auto space-y-6"
    >
      {/* Back Link */}
      <motion.div variants={fadeUp}>
        <Link
          href={`/enterprise/sow/${sowId}`}
          className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-colors group"
          style={{ color: "var(--ink-muted)" }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to SOW Detail
        </Link>
      </motion.div>

      {/* Page Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <h1
            className="font-heading"
            style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--ink)" }}
          >
            Kick-off Project
          </h1>
          <Badge
            variant={kickoffState === "ready" ? "gold" : kickoffState === "plan_ready" ? "forest" : "teal"}
            size="md"
            className="gap-1.5"
          >
            {kickoffState === "ready" && (
              <>
                <Rocket className="w-3 h-3" />
                READY TO KICK-OFF
              </>
            )}
            {kickoffState === "processing" && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                PROCESSING
              </>
            )}
            {kickoffState === "kicked_off" && (
              <>
                <Brain className="w-3 h-3" />
                PLAN GENERATION
              </>
            )}
            {kickoffState === "plan_ready" && (
              <>
                <CheckCircle2 className="w-3 h-3" />
                PLAN READY
              </>
            )}
          </Badge>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
          {sow.title} — {sow.client}
        </p>
      </motion.div>

      {/* Status Banners */}
      <motion.div variants={fadeUp}>
        {kickoffState === "ready" && (
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(45,106,79,0.08), rgba(45,106,79,0.03))",
              border: "1px solid rgba(45,106,79,0.2)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-forest-500 to-teal-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                  Your project is ready to kick off
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>
                  Both M1 payment and contract acknowledgement are confirmed. Click Kick-off Project to begin.
                </p>
              </div>
            </div>
          </div>
        )}

        {kickoffState === "processing" && (
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(91,155,162,0.08), rgba(91,155,162,0.03))",
              border: "1px solid rgba(91,155,162,0.2)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shrink-0">
                <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                  Initiating project kick-off...
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>
                  Creating project record and starting AGI task decomposition.
                </p>
              </div>
            </div>
          </div>
        )}

        {kickoffState === "kicked_off" && (
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(91,155,162,0.08), rgba(91,155,162,0.03))",
              border: "1px solid rgba(91,155,162,0.2)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shrink-0">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                  Project kicked off — AGI is generating your project plan
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>
                  You will be notified when the plan is ready for review.
                </p>
              </div>
            </div>
          </div>
        )}

        {kickoffState === "plan_ready" && (
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(45,106,79,0.08), rgba(45,106,79,0.03))",
              border: "1px solid rgba(45,106,79,0.2)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-forest-500 to-teal-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                  Project plan is ready for your review
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>
                  Please review and confirm the task breakdown to begin contributor matching.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Project Summary */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-soft)",
          }}
        >
          <h3 className="text-[15px] font-semibold mb-4" style={{ color: "var(--ink)" }}>
            Project Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Contracted Value", value: formatCurrency(sow.estimatedBudget), icon: DollarSign, color: "brown" },
              { label: "Duration", value: sow.estimatedDuration, icon: Calendar, color: "teal" },
              { label: "SOW Confidence", value: `${sow.aiConfidence}%`, icon: Sparkles, color: "forest" },
              { label: "Risk Score", value: `${sow.riskScore.overall}/100`, icon: Shield, color: "gold" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: "var(--page-bg)",
                    border: "1px solid var(--border-soft)",
                  }}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 mx-auto mb-1.5",
                      item.color === "brown" && "text-brown-500",
                      item.color === "teal" && "text-teal-500",
                      item.color === "forest" && "text-forest-500",
                      item.color === "gold" && "text-gold-500"
                    )}
                  />
                  <p className="text-lg font-bold font-heading" style={{ color: "var(--ink)" }}>
                    {item.value}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Kick-off Readiness Panel */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-soft)",
          }}
        >
          <h3 className="text-[15px] font-semibold mb-4" style={{ color: "var(--ink)" }}>
            Kick-off Readiness
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Condition 1 */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: contractAcknowledged
                  ? "rgba(45,106,79,0.06)"
                  : "rgba(185,28,28,0.04)",
                border: `1px solid ${contractAcknowledged ? "rgba(45,106,79,0.15)" : "rgba(185,28,28,0.1)"}`,
              }}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  contractAcknowledged ? "bg-forest-500 text-white" : "bg-red-100 text-red-500"
                )}
              >
                {contractAcknowledged ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <FileSignature className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  Contract Acknowledged
                </p>
                <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  {contractAcknowledged ? "Confirmed" : "Pending acknowledgement"}
                </p>
              </div>
            </div>

            {/* Condition 2 */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: m1Paid
                  ? "rgba(45,106,79,0.06)"
                  : "rgba(185,28,28,0.04)",
                border: `1px solid ${m1Paid ? "rgba(45,106,79,0.15)" : "rgba(185,28,28,0.1)"}`,
              }}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  m1Paid ? "bg-forest-500 text-white" : "bg-red-100 text-red-500"
                )}
              >
                {m1Paid ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  M1 Payment ({formatCurrency(m1Amount)})
                </p>
                <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  {m1Paid ? "Payment confirmed" : "Pending confirmation"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* What Happens Next */}
      {kickoffState === "ready" && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <h3 className="text-[15px] font-semibold mb-3" style={{ color: "var(--ink)" }}>
              What happens when you kick off?
            </h3>
            <div className="space-y-3">
              {[
                { icon: Brain, label: "AGI generates your project task plan", detail: "Task graph, timeline, and resource plan created automatically" },
                { icon: Users, label: "Contributor matching begins", detail: "After you review and confirm the plan, contributors are matched to tasks" },
                { icon: FolderKanban, label: "Project goes live in Portfolio", detail: "Track progress, milestones, and deliverables from the Project Portfolio" },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                        {step.label}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                        {step.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        {kickoffState === "ready" && (
          <Button
            variant={bothConditionsMet ? "gradient-forest" : "outline"}
            size="lg"
            className="gap-2"
            onClick={() => {
              if (!m1Paid) { setShowM1Snackbar(true); return; }
              setShowConfirmModal(true);
            }}
          >
            <Rocket className="w-4 h-4" />
            Kick-off Project
          </Button>
        )}

        {(kickoffState === "kicked_off" || kickoffState === "plan_ready") && (
          <Link href="/enterprise/projects">
            <Button variant="gradient-primary" size="lg" className="gap-2">
              <FolderKanban className="w-4 h-4" />
              View Project
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}

        {kickoffState === "processing" && (
          <Button variant="outline" size="lg" disabled className="gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </Button>
        )}
      </motion.div>

      {/* ── Confirmation Modal ── */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl w-full max-w-lg mx-4 p-6"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-teal-500 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[16px] font-bold" style={{ color: "var(--ink)" }}>
                    Confirm Project Kick-off
                  </h3>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-beige-100 transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                </button>
              </div>

              <div
                className="rounded-lg p-4 mb-4"
                style={{
                  background: "var(--page-bg)",
                  border: "1px solid var(--border-soft)",
                }}
              >
                <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
                  Kicking off <strong style={{ color: "var(--ink)" }}>{sow.title}</strong> will begin
                  task decomposition and contributor matching. Once kicked off, changes to the project
                  plan require a formal change request.
                </p>
                <div
                  className="flex items-center gap-2 mt-3 rounded-md px-3 py-2"
                  style={{
                    background: "rgba(185,28,28,0.04)",
                    border: "1px solid rgba(185,28,28,0.1)",
                  }}
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[12px] font-semibold text-red-700">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <Button variant="outline" size="md" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="gradient-forest"
                  size="md"
                  onClick={handleKickoff}
                  className="gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Confirm Kick-off
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* M1 Payment Snackbar */}
      <AnimatePresence>
        {showM1Snackbar && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3.5 rounded-2xl shadow-xl border border-amber-200 bg-white"
            style={{ minWidth: 380, maxWidth: 520 }}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 leading-snug">
                M1 Payment Required to Kick-Off
              </p>
              <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                Please release the M1 payment ({formatCurrency(m1Amount)}) to kick-off this project.
              </p>
            </div>
            <Link
              href={`/enterprise/decomposition/${sow.id}/payment`}
              onClick={() => setShowM1Snackbar(false)}
              className="flex items-center gap-1.5 shrink-0 text-[11.5px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-3.5 py-2 rounded-xl transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Progress M1 Payment
            </Link>
            <button
              type="button"
              onClick={() => setShowM1Snackbar(false)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
