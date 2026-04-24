"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, ShieldCheck, Star, Clock, Download, Share2,
  GraduationCap, ExternalLink, Fingerprint, BookOpen,
  CheckCircle2, FileText, Layers, User, Calendar,
  Building, Hash, LinkIcon, X, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockCredentials, mockContributorProfile } from "@/mocks/data/contributor";
import { toast } from "@/lib/stores/toast-store";

/* ═══ Badge ═══ */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500" },
  brown: { bg: "bg-brown-50", text: "text-brown-700", dot: "bg-brown-500" },
  beige: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  danger: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

function Badge({ variant, dot, children }: { variant: string; dot?: boolean; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.beige;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

/* ═══ Configs ═══ */

const levelConfig: Record<string, { variant: string; label: string; color: string }> = {
  beginner: { variant: "beige", label: "Beginner", color: "text-gray-500" },
  intermediate: { variant: "teal", label: "Intermediate", color: "text-teal-600" },
  advanced: { variant: "brown", label: "Advanced", color: "text-brown-600" },
  expert: { variant: "gold", label: "Expert", color: "text-gold-600" },
};

const academicStatusMap: Record<string, { variant: string; label: string }> = {
  approved: { variant: "forest", label: "Approved" },
  pending_approval: { variant: "gold", label: "Pending Approval" },
  rejected: { variant: "danger", label: "Rejected" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

  /* Mock: credential is not revoked. In real app, check credential.revoked */
  const isRevoked = false;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* Revoked warning — H2 edge case */}
      {isRevoked && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 p-4 rounded-xl bg-red-50 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-red-700">This credential has been revoked</p>
            <p className="text-[11px] text-red-600 mt-0.5">The associated task acceptance was reversed. This credential is no longer valid.</p>
          </div>
        </motion.div>
      )}

      {/* ═══ HEADER — H2 Step 1 ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant={level.variant} dot>{level.label}</Badge>
              <Badge variant="teal">PoDL Verified</Badge>
            </div>
            <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
              {credential.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[12px] text-gray-400">
              <span className="text-gray-600 font-medium">{credential.projectTitle}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>Earned {formatDate(credential.issuedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Share — H2 Step 1: "share (if supported)" */}
            {credential.verificationUrl && (
              <button
                onClick={() => navigator.clipboard?.writeText(credential.verificationUrl)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
              >
                <Share2 className="w-3 h-3" /> Share
              </button>
            )}
            {/* Verify link */}
            {credential.verificationUrl && (
              <a href={credential.verificationUrl} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  <ExternalLink className="w-3 h-3" /> Verify
                </button>
              </a>
            )}
            {/* Download certificate — H2 Step 3 */}
            <button onClick={() => toast.success("Certificate downloaded", "credential-certificate.pdf saved to your downloads")} className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
              <Download className="w-3.5 h-3.5" /> Download Certificate
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ DETAIL GRID — H2 Steps 1+2 ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Main Credential Detail */}
        <div className="card-parchment lg:col-span-2">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Credential Details</span>
          </div>
          <div className="px-5 py-5">
            {/* Description — H2 Step 1: description of work completed */}
            <div className="mb-5">
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Issuing Context</div>
              <p className="text-[13px] text-gray-700 leading-relaxed">
                Earned by completing &ldquo;{credential.taskTitle}&rdquo; in the {credential.projectTitle} project with a review score of {credential.reviewScore}/5.0. {credential.hoursValidated} hours of validated delivery work.
              </p>
            </div>

            {/* H2 Step 2 — Skills Validated + proficiency */}
            <div className="mb-5">
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Skill Validated</div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                  <ShieldCheck className={cn("w-4 h-4", level.color)} />
                  <span className="text-[13px] font-semibold text-gray-700">{credential.skill}</span>
                </div>
                <div className="flex items-center gap-1">
                  {["beginner", "intermediate", "advanced", "expert"].map((lvl, idx) => (
                    <div key={lvl} className={cn("w-8 h-2 rounded-full transition-colors",
                      idx <= ["beginner", "intermediate", "advanced", "expert"].indexOf(credential.level)
                        ? "bg-gradient-to-r from-brown-400 to-brown-500" : "bg-gray-100"
                    )} />
                  ))}
                  <span className="text-[11px] font-medium text-gray-500 ml-2 capitalize">{credential.level}</span>
                </div>
              </div>
              {/* Link to digital twin — H2 Step 2: "linked to digital twin" */}
              <Link href="/contributor/profile" className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors">
                <ExternalLink className="w-3 h-3" /> View in Skills Profile
              </Link>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: "Date Earned", value: formatDate(credential.issuedAt) },
                { icon: Clock, label: "Hours Validated", value: `${credential.hoursValidated}h` },
                { icon: Star, label: "Review Score", value: `${credential.reviewScore} / 5.0` },
                { icon: Hash, label: "Credential ID", value: credential.id },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <ItemIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400">{item.label}</div>
                      <div className="text-[12px] font-medium text-gray-700">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PoDL Verification Card */}
        <div className="card-parchment">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">PoDL Verification</span>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-forest-50 mb-4">
              <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
              <span className="text-[11px] font-medium text-forest-700">Verified on Proof-of-Delivery Ledger</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Ledger Hash</div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                  <Fingerprint className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-[11px] font-mono text-gray-600">{credential.podlHash}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Verification URL</div>
                <a href={credential.verificationUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[11px] text-brown-500 hover:text-brown-600 font-medium transition-colors">
                  <LinkIcon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{credential.verificationUrl}</span>
                </a>
              </div>
              <div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Certificate</div>
                <button onClick={() => toast.success("Certificate downloaded", "credential-certificate.pdf saved to your downloads")} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-[12px] font-medium text-gray-700 flex-1">credential-certificate.pdf</span>
                  <Download className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ LINKED TASK / PROJECT ═══ */}
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
              <div className="text-[13px] font-medium text-gray-700">{credential.taskTitle}</div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                <span>{credential.projectTitle}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>Task ID: {credential.taskId}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Star className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-[12px] font-semibold text-gray-700">{credential.reviewScore}</span>
            </div>
            <Badge variant="forest" dot>Accepted</Badge>
          </div>
        </div>
      </motion.div>

      {/* ═══ H3: ACADEMIC MAPPING (Student Track) ═══ */}
      {isStudent && acad && (
        <motion.div variants={fadeUp} className="card-parchment mb-6">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-semibold text-gray-800">Academic Recognition</span>
            </div>
            {acadStatus && <Badge variant={acadStatus.variant} dot>{acadStatus.label}</Badge>}
          </div>
          <div className="px-5 py-5">
            {/* H3 Step 1 — Academic Mapping info */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-teal-50 mb-5">
              <GraduationCap className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <p className="text-[11px] text-teal-700">
                This credential maps to academic course credit under the university partnership program.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <div className="space-y-4">
                {[
                  { icon: BookOpen, label: "Course Equivalent", value: acad.courseEquivalent },
                  { icon: Hash, label: "Credits", value: `${acad.credits} credit${acad.credits !== 1 ? "s" : ""}` },
                  { icon: Calendar, label: "Semester", value: acad.semester || "Not specified" },
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
              <div className="space-y-4">
                {[
                  { icon: Building, label: "University", value: acad.university },
                  { icon: User, label: "Faculty Status", value: acad.status === "approved" ? "Faculty has verified and approved this mapping" : "Awaiting faculty review and approval" },
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

            {/* H3 Step 2 — Academic Portfolio Export */}
            <div style={{ borderTop: "1px solid var(--border-hair)" }} className="pt-5 mb-5">
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Academic Portfolio</div>
              <p className="text-[11px] text-gray-500 mb-3">Generate an academic portfolio document with your completed tasks, credentials, skills validated, hours contributed, and mentor feedback — formatted for university submission.</p>
              <button onClick={() => toast.success("Portfolio generated", "academic-portfolio.pdf saved to your downloads")} className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 px-4 py-2 rounded-xl transition-all">
                <Download className="w-3.5 h-3.5" /> Generate & Download Portfolio (PDF)
              </button>
            </div>

            {/* H3 Step 3 — Share with University */}
            <div style={{ borderTop: "1px solid var(--border-hair)" }} className="pt-5">
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Share with University</div>
              {!shareSubmitted ? (
                <>
                  <p className="text-[11px] text-gray-500 mb-3">Share this credential with {acad.university} for academic recognition. Your consent is required.</p>
                  <button onClick={() => setShareOpen(true)}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-brown-600 bg-brown-50 hover:bg-brown-100 px-4 py-2 rounded-xl transition-all">
                    <Share2 className="w-3.5 h-3.5" /> Share with {acad.university.split(",")[0]}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-forest-50">
                  <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                  <span className="text-[11px] font-medium text-forest-700">Credential shared with {acad.university}. Faculty will review for academic recognition.</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Student but no academic mapping */}
      {isStudent && !acad && (
        <motion.div variants={fadeUp} className="card-parchment mb-6">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">Academic Recognition</span>
            </div>
          </div>
          <div className="px-5 py-5 text-center">
            <GraduationCap className="w-6 h-6 mx-auto mb-2 text-gray-300" />
            <p className="text-[12px] text-gray-500 mb-1">Academic recognition is not yet configured for your university.</p>
            <p className="text-[11px] text-gray-400">Contact your program coordinator for more information.</p>
          </div>
        </motion.div>
      )}

      {/* ═══ H3 Step 3 — Share Consent Dialog ═══ */}
      <AnimatePresence>
        {shareOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 z-40" onClick={() => setShareOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-heading font-semibold text-gray-900">Share Credential</h3>
                <button onClick={() => setShareOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[13px] text-gray-600 mb-4">
                Do you want to share this credential with your university for academic recognition?
              </p>

              {/* Credential being shared */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-800 truncate">{credential.title}</div>
                  <div className="text-[10px] text-gray-400">{credential.skill} · {level.label}</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
              </div>

              {/* Sharing to */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-teal-50 mb-5">
                <Building className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-[11px] text-teal-700 font-medium">{acad?.university}</span>
              </div>

              {/* Consent checkbox */}
              <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
                <input type="checkbox" checked={shareConsent} onChange={(e) => setShareConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brown-500 focus:ring-brown-500" />
                <span className="text-[11px] text-gray-500 leading-relaxed">
                  I consent to sharing this credential and associated delivery data (skills, hours, review score) with my university for academic recognition purposes.
                </span>
              </label>

              <div className="flex gap-3">
                <button onClick={() => setShareOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button disabled={!shareConsent}
                  onClick={() => { setShareSubmitted(true); setShareOpen(false); }}
                  className={cn("flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                    shareConsent
                      ? "text-white bg-gradient-to-r from-brown-500 to-brown-600 shadow-sm hover:shadow-md"
                      : "text-gray-400 bg-gray-100 cursor-not-allowed"
                  )}>
                  Share Credential
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
