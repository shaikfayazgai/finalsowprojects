"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, ShieldCheck, Star, Clock, Download, Share2,
  GraduationCap, ExternalLink, Fingerprint, BookOpen,
  CheckCircle2, FileText, Layers, Hash, LinkIcon,
  X, AlertTriangle, AlertCircle, RefreshCw, Search,
  Calendar, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { toast } from "@/lib/stores/toast-store";
import {
  fetchCredentialDetail,
  fetchCredentialVerification,
  fetchCredentialCertificate,
  shareCredential,
  createAcademicPortfolio,
  type Credential,
  type CredentialVerificationData,
  type ShareCredentialResponse,
  type AcademicPortfolioResponse,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";

/* ═══ Badge ═══ */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-500"   },
  gold:   { bg: "bg-gold-50",   text: "text-gold-700",   dot: "bg-gold-500"   },
  brown:  { bg: "bg-brown-50",  text: "text-brown-700",  dot: "bg-brown-500"  },
  beige:  { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400"   },
  danger: { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500"    },
};

function Badge({ variant = "beige", dot, children }: { variant?: string; dot?: boolean; children: React.ReactNode }) {
  const s = badgeStyles[variant] ?? badgeStyles.beige;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

/* ═══ Helpers ═══ */

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const levelVariant: Record<string, string> = {
  beginner: "beige", intermediate: "teal", advanced: "brown", expert: "gold",
};
const levelColor: Record<string, string> = {
  beginner: "text-gray-500", intermediate: "text-teal-600", advanced: "text-brown-600", expert: "text-gold-600",
};
const seniorityVariant: Record<string, string> = {
  junior: "beige", mid: "teal", senior: "brown", lead: "gold", principal: "gold", staff: "gold",
};

/* ═══ Skeleton ═══ */

function DetailSkeleton() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="h-5 bg-gray-200 rounded-full w-20" />
              <div className="h-5 bg-gray-200 rounded-full w-24" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="h-3 bg-gray-200 rounded w-48" />
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="h-9 bg-gray-200 rounded-xl w-20" />
            <div className="h-9 bg-gray-200 rounded-xl w-36" />
          </div>
        </div>
      </motion.div>
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="card-parchment lg:col-span-2 animate-pulse px-5 py-5 space-y-4">
          <div className="h-3 bg-gray-200 rounded w-32" />
          <div className="h-16 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-200 rounded" />)}
          </div>
        </div>
        <div className="card-parchment animate-pulse px-5 py-5 space-y-4">
          <div className="h-10 bg-gray-200 rounded-xl" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══ PAGE ═══ */

export default function CredentialDetailPage() {
  const params = useParams();
  const credentialId = params.credentialId as string;
  const credential = mockCredentials.find((c) => c.id === credentialId);
  const isStudent = mockContributorProfile.track === "student";

  /* H3 Step 3 — Share with University state (must be declared before any early return) */
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareConsent, setShareConsent] = React.useState(false);
  const [shareSubmitted, setShareSubmitted] = React.useState(false);

  if (!credential) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="card-parchment px-6 py-16 text-center">
          <Award className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-[14px] font-medium text-gray-600 mb-1">Credential not found</p>
          <p className="text-[12px] text-gray-400 mb-4">This credential may have been revoked or doesn&apos;t exist.</p>
          <Link href="/contributor/credentials" className="text-[12px] font-medium text-brown-600 hover:text-brown-700">
            ← Back to credentials
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  const level = levelConfig[credential.level] || levelConfig.beginner;
  const acad = credential.academicMapping;
  const acadStatus = acad ? (academicStatusMap[acad.status] || academicStatusMap.pending_approval) : null;

  /* ── Not found ── */
  if (notFound || (!loading && !credential && !error)) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="card-parchment px-6 py-16 text-center">
          <Award className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-[14px] font-medium text-gray-600 mb-1">Credential not found</p>
          <p className="text-[12px] text-gray-400 mb-4">This credential may have been revoked or doesn&apos;t exist.</p>
          <Link href="/contributor/credentials" className="text-[12px] font-medium text-brown-600 hover:text-brown-700">
            ← Back to credentials
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* Revoked banner */}
      {isRevoked && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 p-4 rounded-xl bg-red-50 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-red-700">This credential has been revoked</p>
            <p className="text-[11px] text-red-600 mt-0.5">The associated task acceptance was reversed. This credential is no longer valid.</p>
          </div>
        </motion.div>
      )}

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {credential.level && <Badge variant={lvlVariant} dot>{credential.level}</Badge>}
              {credential.seniority && <Badge variant={senVariant}>{credential.seniority}</Badge>}
              {credential.platform_verified && <Badge variant="teal">PoDL Verified</Badge>}
            </div>
            <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
              {credential.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[12px] text-gray-400">
              {credential.project_title && <span className="text-gray-600 font-medium">{credential.project_title}</span>}
              {credential.issued_at && (
                <><span className="w-1 h-1 rounded-full bg-gray-300" /><span>Earned {formatDate(credential.issued_at)}</span></>
              )}
              {credential.designation && (
                <><span className="w-1 h-1 rounded-full bg-gray-300" /><span>{credential.designation}</span></>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <button
              onClick={() => { setShareResult(null); setShareError(null); setShareOpen(true); }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
            >
              <Share2 className="w-3 h-3" /> Share
            </button>
            <button
              onClick={() => { setPortfolioResult(null); setPortfolioError(null); setPortfolioOpen(true); }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
            >
              <GraduationCap className="w-3 h-3" /> Portfolio
            </button>
            {credential.verification_url && (
              <a href={credential.verification_url} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  <ExternalLink className="w-3 h-3" /> Verify
                </button>
              </a>
            )}
            <button
              onClick={handleDownloadCertificate}
              disabled={certLoading}
              className={cn(
                "flex items-center gap-1.5 text-[12px] font-semibold text-white px-5 py-2 rounded-xl transition-all",
                certLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
              )}
            >
              {certLoading
                ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Downloading…</>
                : <><Download className="w-3.5 h-3.5" /> Download Certificate</>
              }
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ DETAIL GRID ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Main card */}
        <div className="card-parchment lg:col-span-2">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Credential Details</span>
          </div>
          <div className="px-5 py-5">

            {/* Issuing context */}
            <div className="mb-5">
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Issuing Context</div>
              <p className="text-[13px] text-gray-700 leading-relaxed">
                Earned by completing &ldquo;{credential.task_title}&rdquo; in the {credential.project_title} project
                {credential.review_score > 0 && ` with a review score of ${credential.review_score}/5.0`}.
                {credential.hours_validated > 0 && ` ${credential.hours_validated} hours of validated delivery work.`}
                {credential.quality_indicator && ` Quality: ${credential.quality_indicator}.`}
              </p>
            </div>

            {/* Skill + level bar */}
            <div className="mb-5">
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Skill Validated</div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                  <ShieldCheck className={cn("w-4 h-4", lvlColor)} />
                  <span className="text-[13px] font-semibold text-gray-700">{credential.skill}</span>
                </div>
                {credential.level && (
                  <div className="flex items-center gap-1">
                    {LEVELS.map((lvl, idx) => (
                      <div key={lvl} className={cn("w-8 h-2 rounded-full transition-colors",
                        idx <= levelIdx ? "bg-gradient-to-r from-brown-400 to-brown-500" : "bg-gray-100"
                      )} />
                    ))}
                    <span className="text-[11px] font-medium text-gray-500 ml-2 capitalize">{credential.level}</span>
                  </div>
                )}
              </div>
              <Link href="/contributor/profile" className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors">
                <ExternalLink className="w-3 h-3" /> View in Skills Profile
              </Link>
            </div>

            {/* Skill tags */}
            {credential.skill_tags?.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Skill Tags</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-gray-400" />
                  {credential.skill_tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: "Date Earned",      value: formatDate(credential.issued_at) },
                { icon: Clock,    label: "Hours Validated",  value: credential.hours_validated > 0 ? `${credential.hours_validated}h` : "—" },
                { icon: Star,     label: "Review Score",     value: credential.review_score > 0 ? `${credential.review_score} / 5.0` : "—" },
                { icon: Hash,     label: "Credential ID",    value: credentialId },
                ...(credential.acceptance_date ? [{ icon: Calendar, label: "Accepted", value: formatDate(credential.acceptance_date) }] : []),
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <ItemIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">{item.label}</div>
                      <div className="text-[12px] font-medium text-gray-700 truncate max-w-[160px]">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PoDL + Certificate card */}
        <div className="card-parchment">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">PoDL Verification</span>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-forest-50 mb-4">
              <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
              <span className="text-[11px] font-medium text-forest-700">
                {credential.platform_verified ? "Platform Verified Credential" : "Verified on Proof-of-Delivery Ledger"}
              </span>
            </div>
            <div className="space-y-4">
              {/* Ledger hash */}
              {credential.pod_hash && (
                <div>
                  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Ledger Hash</div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                    <Fingerprint className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-[11px] font-mono text-gray-600 truncate">{credential.pod_hash}</span>
                  </div>
                </div>
              )}

              {/* Verification URL */}
              {credential.verification_url && (
                <div>
                  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Verification URL</div>
                  <a href={credential.verification_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[11px] text-brown-500 hover:text-brown-600 font-medium transition-colors">
                    <LinkIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{credential.verification_url}</span>
                  </a>
                </div>
              )}

              {/* Certificate download — calls real API */}
              <div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Certificate</div>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={certLoading}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
                >
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-[12px] font-medium text-gray-700 flex-1">
                    {certLoading ? "Downloading…" : "credential-certificate.pdf"}
                  </span>
                  {certLoading
                    ? <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    : <Download className="w-3 h-3 text-gray-400" />
                  }
                </button>
              </div>

              {/* Direct certificate URL if present */}
              {credential.certificate_file_url && (
                <div>
                  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Certificate File</div>
                  <a href={credential.certificate_file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[11px] text-brown-500 hover:text-brown-600 font-medium transition-colors">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">Open certificate file</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ LINKED DELIVERY ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Linked Delivery</span>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-gray-700">{credential.task_title}</div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 flex-wrap">
                <span>{credential.project_title}</span>
                {credential.task_id && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span>Task ID: {credential.task_id}</span></>}
              </div>
            </div>
            {credential.review_score > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Star className="w-3.5 h-3.5 text-gold-500" />
                <span className="text-[12px] font-semibold text-gray-700">{credential.review_score}</span>
              </div>
            )}
            <Badge variant="forest" dot>Accepted</Badge>
          </div>
        </div>
      </motion.div>

      {/* ═══ VERIFICATION RECORD ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-brown-500" />
            <span className="text-sm font-semibold text-gray-800">Verification Record</span>
          </div>
          {loadingVerification && <div className="w-4 h-4 border-2 border-brown-300 border-t-brown-600 rounded-full animate-spin" />}
        </div>
        <div className="px-5 py-5">
          {loadingVerification && (
            <div className="space-y-3 animate-pulse">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-2.5 bg-gray-200 rounded w-28" />
                  <div className="h-2.5 bg-gray-200 rounded w-40" />
                </div>
              ))}
            </div>
          )}
          {verificationError && !loadingVerification && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-[12px] font-medium text-red-700">Failed to load verification data</p>
                <p className="text-[11px] text-red-500 mt-0.5">{verificationError}</p>
              </div>
              <button onClick={() => setRetryKey(k => k + 1)}
                className="text-[11px] font-medium text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all">
                Retry
              </button>
            </div>
          )}
          {!loadingVerification && !verificationError && verification && Object.keys(verification).length > 0 && (
            <div className="space-y-0">
              {Object.entries(verification).map(([key, value]) => {
                const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                const displayValue =
                  value === null || value === undefined ? "—"
                  : typeof value === "boolean" ? (value ? "Yes" : "No")
                  : typeof value === "object" ? JSON.stringify(value)
                  : String(value);
                return (
                  <div key={key} className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider shrink-0">{displayKey}</span>
                    <span className="text-[12px] text-gray-700 font-medium text-right break-all">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          )}
          {!loadingVerification && !verificationError && (!verification || Object.keys(verification).length === 0) && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              <p className="text-[12px] font-medium text-gray-500 mb-0.5">No verification data</p>
              <p className="text-[11px] text-gray-400">Verification details will appear once the credential is processed.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ ACADEMIC RECOGNITION ═══ */}
      {isStudent && acad && (
        <motion.div variants={fadeUp} className="card-parchment mb-6">
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <GraduationCap className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-semibold text-gray-800">Academic Recognition</span>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-teal-50 mb-5">
              <GraduationCap className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <p className="text-[11px] text-teal-700">This credential maps to academic course credit under the university partnership program.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {[
                { icon: BookOpen, label: "Course",   value: acad.label || "—" },
                { icon: Hash,     label: "Code",     value: acad.course_code || "—" },
                { icon: Star,     label: "Credits",  value: acad.credits > 0 ? `${acad.credits} credit${acad.credits !== 1 ? "s" : ""}` : "—" },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <ItemIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</div>
                      <div className="text-[13px] font-medium text-gray-700 mt-0.5">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Share Credential Modal ═══ */}
      <AnimatePresence>
        {shareOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/25 z-40" onClick={() => !shareLoading && setShareOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-heading font-semibold text-gray-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-brown-500" /> Share Credential
                </h3>
                <button onClick={() => setShareOpen(false)} disabled={shareLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Credential preview */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-800 truncate">{credential.title}</div>
                  <div className="text-[10px] text-gray-400">{credential.skill} · {credential.level}</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
              </div>

              {/* Success state */}
              {shareResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-forest-50">
                    <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                    <span className="text-[12px] font-medium text-forest-700">Shared successfully!</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Share ID",    value: shareResult.share_id },
                      { label: "Status",      value: shareResult.status },
                      { label: "Target Type", value: shareResult.target_type },
                      { label: "Target ID",   value: shareResult.target_id },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                        <span className="text-[11px] font-medium text-gray-700">{value}</span>
                      </div>
                    ))}
                    {shareResult.public_url && (
                      <a href={shareResult.public_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-brown-500 hover:text-brown-600 font-medium mt-2 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Open public share link
                      </a>
                    )}
                  </div>
                  <button onClick={() => setShareOpen(false)}
                    className="w-full mt-2 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Error */}
                  {shareError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 mb-4">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-[11px] text-red-700">{shareError}</span>
                    </div>
                  )}

                  {/* Target type */}
                  <div className="mb-4">
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Share With</label>
                    <select value={shareTargetType} onChange={(e) => setShareTargetType(e.target.value)}
                      className="w-full text-[13px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-300 bg-white">
                      <option value="university">University / Institution</option>
                      <option value="employer">Employer</option>
                      <option value="platform">External Platform</option>
                    </select>
                  </div>

                  {/* Target ID */}
                  <div className="mb-4">
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                      {shareTargetType === "university" ? "Institution ID" : shareTargetType === "employer" ? "Employer ID" : "Platform ID"}
                    </label>
                    <input
                      type="text"
                      value={shareTargetId}
                      onChange={(e) => setShareTargetId(e.target.value)}
                      placeholder={shareTargetType === "university" ? "e.g. univ_abc123" : "e.g. emp_xyz456"}
                      className="w-full text-[13px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-300 placeholder:text-gray-300"
                    />
                  </div>

                  {/* Share fields */}
                  <div className="mb-4">
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Include Fields</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "skill",       label: "Skill" },
                        { key: "level",       label: "Level" },
                        { key: "score",       label: "Review Score" },
                        { key: "task",        label: "Task Details" },
                        { key: "certificate", label: "Certificate" },
                        { key: "academic",    label: "Academic Mapping" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={shareFields.includes(key)}
                            onChange={(e) => setShareFields(prev =>
                              e.target.checked ? [...prev, key] : prev.filter(f => f !== key)
                            )}
                            className="w-4 h-4 rounded border-gray-300 text-brown-500 focus:ring-brown-500"
                          />
                          <span className="text-[11px] text-gray-600">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Consent */}
                  <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
                    <input type="checkbox" checked={shareConsent} onChange={(e) => setShareConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brown-500 focus:ring-brown-500" />
                    <span className="text-[11px] text-gray-500 leading-relaxed">
                      I consent to sharing this credential and the selected fields with the specified recipient for verification or academic recognition purposes.
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button onClick={() => setShareOpen(false)} disabled={shareLoading}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-40">
                      Cancel
                    </button>
                    <button onClick={handleShareCredential} disabled={shareLoading || !shareConsent || !shareTargetId.trim()}
                      className={cn("flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2",
                        shareLoading || !shareConsent || !shareTargetId.trim()
                          ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                          : "text-white bg-gradient-to-r from-brown-500 to-brown-600 shadow-sm hover:shadow-md"
                      )}>
                      {shareLoading
                        ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sharing…</>
                        : "Share Credential"
                      }
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Academic Portfolio Modal ═══ */}
      <AnimatePresence>
        {portfolioOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/25 z-40" onClick={() => !portfolioLoading && setPortfolioOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-heading font-semibold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-teal-500" /> Academic Portfolio
                </h3>
                <button onClick={() => setPortfolioOpen(false)} disabled={portfolioLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
                Generate an academic portfolio document for this credential. Select what to include and the output format.
              </p>

              {/* Success state */}
              {portfolioResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-forest-50">
                    <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                    <span className="text-[12px] font-medium text-forest-700">
                      {portfolioResult.download_url ? "Portfolio ready!" : "Portfolio queued — you will be notified when it is ready."}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Job ID",  value: portfolioResult.job_id },
                      { label: "Format",  value: portfolioResult.format.toUpperCase() },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                        <span className="text-[11px] font-medium text-gray-700">{value}</span>
                      </div>
                    ))}
                    {portfolioResult.download_url && (
                      <a href={portfolioResult.download_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-teal-600 hover:text-teal-700 font-medium mt-2 transition-colors">
                        <Download className="w-3 h-3" /> Download portfolio
                      </a>
                    )}
                  </div>
                  <button onClick={() => setPortfolioOpen(false)}
                    className="w-full mt-2 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Error */}
                  {portfolioError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 mb-4">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-[11px] text-red-700">{portfolioError}</span>
                    </div>
                  )}

                  {/* Format */}
                  <div className="mb-4">
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Output Format</label>
                    <select value={portfolioFormat} onChange={(e) => setPortfolioFormat(e.target.value)}
                      className="w-full text-[13px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white">
                      <option value="pdf">PDF</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  {/* Include options */}
                  <div className="mb-5">
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Include in Portfolio</label>
                    <div className="space-y-2">
                      {([
                        { key: "include_tasks",        label: "Task Deliverables" },
                        { key: "include_credentials",  label: "Credentials" },
                        { key: "include_hours",        label: "Validated Hours" },
                        { key: "include_feedback",     label: "Feedback & Reviews" },
                      ] as const).map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={portfolioOptions[key]}
                            onChange={(e) => setPortfolioOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
                          />
                          <span className="text-[12px] text-gray-600">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setPortfolioOpen(false)} disabled={portfolioLoading}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-40">
                      Cancel
                    </button>
                    <button onClick={handleCreatePortfolio} disabled={portfolioLoading}
                      className={cn("flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2",
                        portfolioLoading
                          ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                          : "text-white bg-gradient-to-r from-teal-500 to-teal-600 shadow-sm hover:shadow-md"
                      )}>
                      {portfolioLoading
                        ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating…</>
                        : <><Download className="w-3.5 h-3.5" /> Generate Portfolio</>
                      }
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
