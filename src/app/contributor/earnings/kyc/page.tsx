"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, FileText, Upload, CheckCircle2, XCircle,
  Clock, AlertTriangle, ArrowLeft, ChevronRight, Info,
  CreditCard, Building2, Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockKycVerification } from "@/mocks/data/contributor";

/* ═══ Types ═══ */

type KycStatus = "not_started" | "pending" | "verified" | "rejected" | "expired";
type DocStatus = "not_uploaded" | "uploaded" | "approved" | "rejected";

interface DocSlot {
  type: "government_id" | "proof_of_address" | "tax_id" | "bank_statement";
  label: string;
  required: boolean;
  icon: React.ElementType;
  fileName: string | null;
  status: DocStatus;
  rejectionReason: string | null;
  uploadedAt: string | null;
}

/* ═══ Helpers ═══ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>{children}</span>
  );
}

const statusCfg: Record<KycStatus, { label: string; color: string; bg: string; icon: React.ElementType; bannerBg: string; bannerBorder: string; bannerText: string }> = {
  not_started:  { label: "Not Started",  color: "var(--color-gray-600)",    bg: "var(--color-gray-100)",    icon: Info,           bannerBg: "bg-gray-50",    bannerBorder: "border-gray-200",  bannerText: "text-gray-700" },
  pending:      { label: "Under Review", color: "var(--color-gold-700)",    bg: "var(--color-gold-50)",     icon: Clock,          bannerBg: "bg-gold-50",    bannerBorder: "border-gold-200",  bannerText: "text-gold-800" },
  verified:     { label: "Verified",     color: "var(--color-forest-700)",  bg: "var(--color-forest-50)",   icon: CheckCircle2,   bannerBg: "bg-forest-50",  bannerBorder: "border-forest-200", bannerText: "text-forest-800" },
  rejected:     { label: "Rejected",     color: "var(--danger)",            bg: "var(--danger-light)",      icon: XCircle,        bannerBg: "bg-red-50",     bannerBorder: "border-red-200",   bannerText: "text-red-800" },
  expired:      { label: "Expired",      color: "var(--color-brown-700)",   bg: "var(--color-brown-50)",    icon: AlertTriangle,  bannerBg: "bg-brown-50",   bannerBorder: "border-brown-200", bannerText: "text-brown-800" },
};

const docStatusCfg: Record<DocStatus, { label: string; color: string; bg: string }> = {
  not_uploaded: { label: "Not Uploaded", color: "var(--color-gray-600)",   bg: "var(--color-gray-100)" },
  uploaded:     { label: "Uploaded",     color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  approved:     { label: "Approved",     color: "var(--color-forest-700)", bg: "var(--color-forest-50)" },
  rejected:     { label: "Rejected",     color: "var(--danger)",           bg: "var(--danger-light)" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const statusMessages: Record<KycStatus, string> = {
  not_started:  "You must complete KYC verification before you can receive payouts. Please upload the required documents below.",
  pending:      "Your documents are under review. This typically takes 1-3 business days. You will be notified once the review is complete.",
  verified:     "Your identity has been verified. You are eligible for payouts.",
  rejected:     "Your KYC submission was rejected. Please review the feedback below and re-upload the required documents.",
  expired:      "Your KYC verification has expired. Please re-upload your documents to continue receiving payouts.",
};

/* ═══ Timeline ═══ */

function VerificationTimeline({ status }: { status: KycStatus }) {
  const steps = [
    { label: "Documents Submitted", key: "submitted" },
    { label: "Under Review", key: "review" },
    { label: "Approved", key: "approved" },
  ];

  const activeIndex = status === "not_started" ? -1
    : status === "pending" ? 1
    : status === "verified" ? 2
    : status === "rejected" ? 1
    : -1;

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => {
        const done = i <= activeIndex && status !== "rejected";
        const active = i === activeIndex;
        const rejected = status === "rejected" && i === activeIndex;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors",
                rejected ? "bg-red-100 text-red-600"
                  : done ? "bg-forest-100 text-forest-700"
                  : active ? "bg-gold-100 text-gold-700"
                  : "bg-gray-100 text-gray-400"
              )}>
                {rejected ? <XCircle className="w-4 h-4" />
                  : done ? <CheckCircle2 className="w-4 h-4" />
                  : i + 1}
              </div>
              <span className={cn("text-[10px] font-medium whitespace-nowrap",
                rejected ? "text-red-600" : done ? "text-forest-700" : active ? "text-gold-700" : "text-gray-400"
              )}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-2 rounded-full", done && !rejected ? "bg-forest-300" : "bg-gray-200")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═══ KYC PAGE ═══ */

export default function KycVerificationPage() {
  /* Build document slots from mock data */
  const kyc = mockKycVerification;
  const kycStatus = kyc.status as KycStatus;
  const cfg = statusCfg[kycStatus];
  const StatusIcon = cfg.icon;

  const docMap = new Map<string, (typeof kyc.documents)[number]>(kyc.documents.map((d) => [d.type, d]));

  const baseSlots: DocSlot[] = [
    { type: "government_id",    label: "Government ID",    required: true,  icon: CreditCard, fileName: null, status: "not_uploaded", rejectionReason: null, uploadedAt: null },
    { type: "proof_of_address", label: "Proof of Address", required: true,  icon: Building2,  fileName: null, status: "not_uploaded", rejectionReason: null, uploadedAt: null },
    { type: "tax_id",           label: "Tax ID",           required: false, icon: FileText,   fileName: null, status: "not_uploaded", rejectionReason: null, uploadedAt: null },
    { type: "bank_statement",   label: "Bank Statement",   required: false, icon: Landmark,   fileName: null, status: "not_uploaded", rejectionReason: null, uploadedAt: null },
  ];
  const initialSlots: DocSlot[] = baseSlots.map((slot) => {
    const doc = docMap.get(slot.type);
    if (doc) {
      return { ...slot, fileName: doc.fileName, status: doc.status as DocStatus, uploadedAt: doc.uploadedAt };
    }
    return slot;
  });

  const [docSlots, setDocSlots] = React.useState<DocSlot[]>(initialSlots);
  const [submitting, setSubmitting] = React.useState(false);

  const docsSubmitted = docSlots.filter((d) => d.status !== "not_uploaded").length;
  const requiredUploaded = docSlots.filter((d) => d.required && d.status !== "not_uploaded").length;
  const allRequiredReady = docSlots.filter((d) => d.required).every((d) => d.status !== "not_uploaded");
  const canSubmit = allRequiredReady && kycStatus !== "pending" && kycStatus !== "verified";

  /* Simulated upload handler */
  function handleUpload(type: DocSlot["type"]) {
    setDocSlots((prev) =>
      prev.map((s) =>
        s.type === type
          ? { ...s, fileName: `${type}_document.pdf`, status: "uploaded" as DocStatus, uploadedAt: new Date().toISOString(), rejectionReason: null }
          : s
      )
    );
  }

  function handleSubmit() {
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 1500);
  }

  /* KPIs */
  const kpis = [
    { label: "Verification Status", value: cfg.label, icon: ShieldCheck, iconBg: kycStatus === "verified" ? "bg-gradient-to-br from-forest-400 to-forest-600" : kycStatus === "rejected" ? "bg-gradient-to-br from-red-400 to-red-600" : "bg-gradient-to-br from-gold-400 to-gold-600" },
    { label: "Documents Submitted", value: `${docsSubmitted} / 4`, icon: FileText, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
    { label: "Blocked Earnings", value: `$${kyc.blockedAmount.toLocaleString()}`, icon: AlertTriangle, iconBg: kyc.blockedAmount > 0 ? "bg-gradient-to-br from-red-400 to-red-600" : "bg-gradient-to-br from-forest-400 to-forest-600" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ BACK LINK ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <Link href="/contributor/earnings" className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Earnings
        </Link>
      </motion.div>

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
          KYC Verification
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Identity verification for contributor payouts
        </p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {kpis.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
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
      </motion.div>

      {/* ═══ STATUS BANNER ═══ */}
      <motion.div variants={fadeUp} className={cn("card-parchment mb-6 px-5 py-4 border", cfg.bannerBorder, cfg.bannerBg)}>
        <div className="flex items-start gap-3">
          <StatusIcon className={cn("w-5 h-5 mt-0.5 shrink-0", cfg.bannerText)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[14px] font-semibold", cfg.bannerText)}>{cfg.label}</span>
              <Pill bg={cfg.bg} color={cfg.color}>{cfg.label}</Pill>
            </div>
            <p className={cn("text-[12px]", cfg.bannerText, "opacity-80")}>{statusMessages[kycStatus]}</p>
            {kyc.verifiedAt && kycStatus === "verified" && (
              <p className="text-[11px] text-gray-400 mt-1">Verified on {fmtDate(kyc.verifiedAt)} &middot; Expires {fmtDate(kyc.expiresAt)}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ VERIFICATION TIMELINE ═══ */}
      <motion.div variants={fadeUp} className="card-parchment px-5 py-5 mb-6">
        <div className="text-sm font-semibold text-gray-800 mb-4">Verification Progress</div>
        <VerificationTimeline status={kycStatus} />
      </motion.div>

      {/* ═══ DOCUMENT UPLOAD SECTION ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Required Documents</span>
          <p className="text-[11px] text-gray-400 mt-0.5">{requiredUploaded} of {docSlots.filter(d => d.required).length} required documents uploaded</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-5">
          {docSlots.map((slot) => {
            const SlotIcon = slot.icon;
            const ds = docStatusCfg[slot.status];
            return (
              <motion.div
                key={slot.type}
                variants={scaleIn}
                aria-label={`Upload ${slot.label} document`}
                className={cn(
                  "rounded-xl border-2 border-dashed p-5 transition-colors focus-within:ring-2 focus-within:ring-teal-500",
                  slot.status === "not_uploaded" ? "border-gray-200 hover:border-teal-300 hover:bg-teal-50/20"
                    : slot.status === "rejected" ? "border-red-200 bg-red-50/30"
                    : slot.status === "approved" ? "border-forest-200 bg-forest-50/20"
                    : "border-teal-200 bg-teal-50/20"
                )}
              >
                <h3 className="text-[14px] font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <SlotIcon className="w-4 h-4 text-gray-500" />
                  {slot.label}
                  {slot.required && <span className="text-red-500 text-[12px]" aria-label="Required">*</span>}
                </h3>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className={cn("text-[9px] font-medium uppercase", slot.required ? "text-red-500" : "text-gray-400")}>
                        {slot.required ? "(Required)" : "Optional"}
                      </span>
                    </div>
                  </div>
                  <Pill bg={ds.bg} color={ds.color}>{ds.label}</Pill>
                </div>

                {slot.status === "not_uploaded" ? (
                  <button
                    onClick={() => handleUpload(slot.type)}
                    className="w-full flex flex-col items-center justify-center py-6 rounded-lg bg-gray-50 hover:bg-teal-50 transition-colors cursor-pointer group"
                  >
                    <Upload className="w-6 h-6 text-gray-300 group-hover:text-teal-500 transition-colors mb-2" />
                    <span className="text-[12px] font-medium text-gray-500 group-hover:text-teal-600">
                      Click or drag file to upload
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">Accepted formats: PDF, JPG, PNG (max 10MB)</span>
                  </button>
                ) : (
                  <div className="py-3">
                    <div className="flex items-center gap-2 text-[12px] text-gray-700">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{slot.fileName}</span>
                    </div>
                    {slot.uploadedAt && (
                      <div className="text-[10px] text-gray-400 mt-1 ml-5.5">
                        Uploaded {fmtDate(slot.uploadedAt)}
                      </div>
                    )}
                    {slot.status === "rejected" && slot.rejectionReason && (
                      <div className="mt-2 flex items-start gap-1.5 text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{slot.rejectionReason}</span>
                      </div>
                    )}
                    {(slot.status === "rejected" || slot.status === "uploaded") && kycStatus !== "pending" && (
                      <button
                        onClick={() => handleUpload(slot.type)}
                        className="mt-2 text-[11px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Re-upload
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ SUBMIT BUTTON ═══ */}
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-8">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={cn(
            "px-6 py-3 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-2",
            canSubmit && !submitting
              ? "bg-gradient-to-br from-teal-500 to-teal-700 text-white hover:from-teal-600 hover:to-teal-800 shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {submitting ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Submitting...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Submit for Verification
            </>
          )}
        </button>
        {!allRequiredReady && kycStatus !== "verified" && (
          <span className="text-[11px] text-gray-400">Upload all required documents to enable submission</span>
        )}
      </motion.div>

    </motion.div>
  );
}
