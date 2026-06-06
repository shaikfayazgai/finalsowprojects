"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Download,
  Shield,
  Clock,
  DollarSign,
  AlertTriangle,
  Send,
  Sparkles,
  Eye,
  FileSignature,
  Building2,
  Calendar,
  Scale,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button } from "@/components/ui";
import { mockSOWs } from "@/mocks/data/enterprise-sow";

/* ═══════════════════════════════════════════════════════════════
   Mock contract data
   ═══════════════════════════════════════════════════════════════ */

interface ContractData {
  contractId: string;
  sowId: string;
  sowTitle: string;
  client: string;
  status: "pending_generation" | "issued" | "acknowledged";
  issuedAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  contractedValue: number;
  currency: string;
  m1Amount: number;
  m2Amount: number;
  m3Amount: number;
  m1Status: "pending" | "paid";
  effectiveDate: string;
  sections: {
    label: string;
    source: string;
    adminEditable: boolean;
  }[];
}

function getContractForSOW(sowId: string): ContractData {
  const sow = mockSOWs.find((s) => s.id === sowId) || mockSOWs[0];
  const contracted = sow.estimatedBudget;
  const m1 = Math.round(contracted * 0.3);
  const m2 = Math.round(contracted * 0.35);
  const m3 = contracted - m1 - m2;

  return {
    contractId: `CON-${sowId.replace("sow-", "")}`,
    sowId: sow.id,
    sowTitle: sow.title,
    client: sow.client,
    status: sow.status === "approved" ? "issued" : "pending_generation",
    issuedAt: sow.status === "approved" ? "2026-03-15T10:00:00Z" : undefined,
    contractedValue: contracted,
    currency: "USD",
    m1Amount: m1,
    m2Amount: m2,
    m3Amount: m3,
    m1Status: "pending",
    effectiveDate: sow.approvedAt || sow.updatedAt,
    sections: [
      { label: "Parties — Client Entity", source: "Organization Settings", adminEditable: true },
      { label: "Parties — GlimmoraTeam Entity", source: "Platform Configuration", adminEditable: false },
      { label: "Project Description", source: "Step 0 / Section 1", adminEditable: true },
      { label: "Contracted Value & Payment Schedule", source: "Stage 2 Commercial Review", adminEditable: true },
      { label: "Delivery Scope Boundary", source: "Step 2 / Section 2", adminEditable: true },
      { label: "IP Ownership", source: "Step 8 / Section 7", adminEditable: false },
      { label: "Warranty Terms", source: "Step 8 / Section 7", adminEditable: false },
      { label: "Change Request Process", source: "Step 8 / Section 7", adminEditable: true },
      { label: "Governing Law & Dispute Resolution", source: "Platform Standard Terms", adminEditable: true },
      { label: "Effective Date & SOW Reference", source: "Stage 5 Sign-off", adminEditable: false },
    ],
  };
}

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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export default function ContractAcknowledgementPage() {
  const params = useParams();
  const sowId = params.sowId as string;
  const sow = mockSOWs.find((s) => s.id === sowId) || mockSOWs[0];
  const contract = getContractForSOW(sowId);

  const [showAckModal, setShowAckModal] = React.useState(false);
  const [ackChecked, setAckChecked] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState(contract.status === "acknowledged");
  const [m1Paid] = React.useState(contract.m1Status === "paid");

  const handleAcknowledge = () => {
    setAcknowledged(true);
    setShowAckModal(false);
  };

  const bothConditionsMet = acknowledged && m1Paid;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1100px] mx-auto space-y-6"
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
            Legal Project Contract
          </h1>
          <Badge
            variant={acknowledged ? "forest" : "gold"}
            size="md"
            className="gap-1.5"
          >
            {acknowledged ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                ACKNOWLEDGED
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                AWAITING ACKNOWLEDGEMENT
              </>
            )}
          </Badge>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
          Contract for <strong>{sow.title}</strong> — {sow.client}
        </p>
      </motion.div>

      {/* Main Grid */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Contract Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Contract Info Banner */}
            {!acknowledged ? (
              <div
                className="rounded-xl p-4"
                style={{
                  background: "linear-gradient(135deg, rgba(208,176,96,0.08), rgba(208,176,96,0.03))",
                  border: "1px solid rgba(208,176,96,0.2)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shrink-0">
                    <FileSignature className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                      GlimmoraTeam has issued your Legal Project Contract
                    </p>
                    <p className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>
                      Please download and review the contract, then acknowledge receipt to enable project kick-off.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
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
                      Contract acknowledged successfully
                    </p>
                    <p className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>
                      Your acknowledgement has been recorded in the audit trail.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Sections */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                  <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                    Contract Content — Auto-Populated from Approved SOW
                  </h3>
                </div>
                <p className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>
                  Contract sections assembled from your approved SOW fields.
                </p>
              </div>

              <div className="divide-y" style={{ borderColor: "var(--border-soft)" }}>
                {contract.sections.map((section, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                        {section.label}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                        Source: {section.source}
                      </p>
                    </div>
                    <Badge
                      variant={section.adminEditable ? "beige" : "forest"}
                      size="sm"
                    >
                      {section.adminEditable ? "Admin Editable" : "Locked"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Schedule */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  Payment Schedule
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "M1 — On Approval", amount: contract.m1Amount, pct: "30%", status: m1Paid ? "PAID" : "RAISED" },
                  { label: "M2 — Midpoint Delivery", amount: contract.m2Amount, pct: "35%", status: "PENDING" },
                  { label: "M3 — UAT Sign-off", amount: contract.m3Amount, pct: "35%", status: "PENDING" },
                ].map((milestone) => (
                  <div
                    key={milestone.label}
                    className="rounded-xl p-4 text-center"
                    style={{
                      background: "var(--page-bg)",
                      border: "1px solid var(--border-soft)",
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
                      {milestone.pct}
                    </p>
                    <p className="text-xl font-bold font-heading text-brown-700 my-1">
                      {formatCurrency(milestone.amount)}
                    </p>
                    <p className="text-[11px] mb-2" style={{ color: "var(--ink-muted)" }}>
                      {milestone.label}
                    </p>
                    <Badge
                      variant={milestone.status === "PAID" ? "forest" : milestone.status === "RAISED" ? "gold" : "beige"}
                      size="sm"
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between px-1">
                <span className="text-[12px] font-semibold" style={{ color: "var(--ink-muted)" }}>
                  Total Contracted Value
                </span>
                <span className="text-[16px] font-bold font-heading" style={{ color: "var(--ink)" }}>
                  {formatCurrency(contract.contractedValue)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="lg" className="gap-2">
                <Download className="w-4 h-4" />
                Download Contract PDF
              </Button>
              {!acknowledged && (
                <Button
                  variant="gradient-primary"
                  size="lg"
                  className="gap-2"
                  onClick={() => setShowAckModal(true)}
                >
                  <FileSignature className="w-4 h-4" />
                  Acknowledge Receipt
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT: Kick-off Readiness */}
          <motion.div variants={slideInRight} className="lg:col-span-1">
            <div
              className="rounded-xl p-5 sticky top-6 space-y-5"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
                borderRadius: 12,
              }}
            >
              {/* Contract Info */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
                  Contract Details
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    { label: "Contract ID", value: contract.contractId },
                    { label: "SOW Reference", value: `${sow.id} v${sow.version}` },
                    { label: "Effective Date", value: formatDate(contract.effectiveDate) },
                    { label: "Issued", value: contract.issuedAt ? formatDate(contract.issuedAt) : "Pending" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                        {item.label}
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color: "var(--ink-muted)" }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "var(--border-soft)" }} />

              {/* Kick-off Readiness */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ink-faint)" }}>
                  Kick-off Readiness
                </p>
                <div className="space-y-3">
                  {/* Condition 1: Contract Acknowledged */}
                  <div
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{
                      background: acknowledged
                        ? "rgba(45,106,79,0.06)"
                        : "rgba(185,28,28,0.04)",
                      border: `1px solid ${acknowledged ? "rgba(45,106,79,0.15)" : "rgba(185,28,28,0.1)"}`,
                    }}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                        acknowledged
                          ? "bg-forest-500 text-white"
                          : "bg-red-100 text-red-500"
                      )}
                    >
                      {acknowledged ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
                        Contract
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                        {acknowledged ? "ACKNOWLEDGED" : "Pending acknowledgement"}
                      </p>
                    </div>
                  </div>

                  {/* Condition 2: M1 Payment */}
                  <div
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{
                      background: m1Paid
                        ? "rgba(45,106,79,0.06)"
                        : "rgba(185,28,28,0.04)",
                      border: `1px solid ${m1Paid ? "rgba(45,106,79,0.15)" : "rgba(185,28,28,0.1)"}`,
                    }}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                        m1Paid
                          ? "bg-forest-500 text-white"
                          : "bg-red-100 text-red-500"
                      )}
                    >
                      {m1Paid ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <DollarSign className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
                        M1 Payment
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                        {m1Paid ? "PAID" : "Pending confirmation"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "var(--border-soft)" }} />

              {/* Kick-off Button */}
              <Link href={`/enterprise/sow/${sowId}/kickoff`}>
                <Button
                  variant={bothConditionsMet ? "gradient-forest" : "outline"}
                  size="lg"
                  className="w-full gap-2"
                  disabled={!bothConditionsMet}
                >
                  <Sparkles className="w-4 h-4" />
                  Kick-off Project
                </Button>
              </Link>
              {!bothConditionsMet && (
                <p className="text-[11px] text-center" style={{ color: "var(--ink-faint)" }}>
                  {!acknowledged && !m1Paid
                    ? "Acknowledge contract and confirm M1 payment to enable kick-off."
                    : !acknowledged
                    ? "Acknowledge your project contract to enable kick-off."
                    : "M1 payment must be confirmed to enable kick-off."}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Acknowledgement Modal ── */}
      <AnimatePresence>
        {showAckModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAckModal(false)}
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-500 flex items-center justify-center">
                    <FileSignature className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[16px] font-bold" style={{ color: "var(--ink)" }}>
                    Acknowledge Contract Receipt
                  </h3>
                </div>
                <button
                  onClick={() => setShowAckModal(false)}
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
                  By acknowledging this contract, you confirm that{" "}
                  <strong style={{ color: "var(--ink)" }}>{sow.client}</strong> has received and reviewed the Legal
                  Project Contract for{" "}
                  <strong style={{ color: "var(--ink)" }}>{sow.title}</strong> issued by GlimmoraTeam
                  {contract.issuedAt && ` on ${formatDate(contract.issuedAt)}`}.
                </p>
                <p className="text-[12px] mt-3" style={{ color: "var(--ink-faint)" }}>
                  Your acknowledgement is logged in the audit trail with timestamp and user identity.
                  This is not a countersignature — it is a receipt acknowledgement.
                </p>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={ackChecked}
                  onChange={(e) => setAckChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-2 accent-brown-600"
                />
                <span className="text-[13px]" style={{ color: "var(--ink)" }}>
                  I confirm I have read and received this contract.
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center gap-3 justify-end">
                <Button variant="outline" size="md" onClick={() => setShowAckModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="gradient-primary"
                  size="md"
                  disabled={!ackChecked}
                  onClick={handleAcknowledge}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Acknowledgement
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
