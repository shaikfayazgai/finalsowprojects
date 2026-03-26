"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award, ShieldCheck, Star, Clock, ExternalLink,
  GraduationCap, ChevronRight, Fingerprint, Sparkles,
  BookOpen, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { mockCredentials } from "@/mocks/data/contributor";

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

const levelConfig: Record<string, { variant: string; label: string }> = {
  beginner: { variant: "beige", label: "Beginner" },
  intermediate: { variant: "teal", label: "Intermediate" },
  advanced: { variant: "brown", label: "Advanced" },
  expert: { variant: "gold", label: "Expert" },
};

const academicStatusMap: Record<string, { variant: string; label: string }> = {
  approved: { variant: "forest", label: "Approved" },
  pending_approval: { variant: "gold", label: "Pending" },
  rejected: { variant: "danger", label: "Rejected" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ═══ PAGE ═══ */

export default function CredentialsPage() {
  const allCredentials = mockCredentials;

  /* Filters — H1 Step 1: "filter by skill/date" */
  const [skillFilter, setSkillFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");

  const uniqueSkills = React.useMemo(() => [...new Set(allCredentials.map((c) => c.skill))].sort(), [allCredentials]);

  const filtered = React.useMemo(() => {
    let list = [...allCredentials];
    if (skillFilter !== "all") list = list.filter((c) => c.skill === skillFilter);
    if (dateFilter !== "all") {
      const now = new Date();
      const cutoff = new Date(now);
      switch (dateFilter) {
        case "30d": cutoff.setDate(now.getDate() - 30); break;
        case "90d": cutoff.setDate(now.getDate() - 90); break;
        case "6m": cutoff.setMonth(now.getMonth() - 6); break;
      }
      list = list.filter((c) => new Date(c.issuedAt) >= cutoff);
    }
    list.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
    return list;
  }, [allCredentials, skillFilter, dateFilter]);

  const activeFilterCount = [skillFilter, dateFilter].filter((v) => v !== "all").length;
  function clearFilters() { setSkillFilter("all"); setDateFilter("all"); }

  /* KPIs — H1 Step 2 */
  const totalCredentials = allCredentials.length;
  const uniqueSkillCount = new Set(allCredentials.map((c) => c.skill)).size;
  const mostRecent = allCredentials.length > 0
    ? allCredentials.reduce((a, b) => new Date(a.issuedAt) > new Date(b.issuedAt) ? a : b)
    : null;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Credentials
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Proof-of-Delivery Ledger — Verified credentials earned through accepted deliveries.
        </p>
      </motion.div>

      {/* ═══ KPI ROW — H1 Step 2 ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-7">
        {[
          { label: "Total Credentials", value: totalCredentials, icon: Award, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600", sub: "Lifetime earned" },
          { label: "Skills Validated", value: uniqueSkillCount, icon: ShieldCheck, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600", sub: "Unique skills" },
          { label: "Most Recent", value: mostRecent ? mostRecent.title : "—", icon: Sparkles, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600", sub: mostRecent ? formatDate(mostRecent.issuedAt) : "No credentials yet", isText: true },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                {(kpi as any).isText ? (
                  <div className="text-[14px] font-semibold text-gray-900 leading-snug mt-1 truncate">{kpi.value}</div>
                ) : (
                  <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
                )}
                <div className="text-[10px] text-gray-400 mt-1">{kpi.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ CREDENTIALS LIST — H1 Step 1 ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">All Credentials</span>
        </div>

        {/* Filter row — H1: "filter by skill/date" */}
        <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <div className="flex items-center gap-2">
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 120 }}>
                <SelectValue placeholder="All Skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {uniqueSkills.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 110 }}>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-[11px] font-medium text-brown-500 px-2.5 py-1 rounded-lg hover:bg-brown-50 transition-all">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <span className="font-mono text-[11px] text-gray-400">{filtered.length} credential{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Credential cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
          {filtered.map((cred) => {
            const level = levelConfig[cred.level] || levelConfig.beginner;
            const acad = cred.academicMapping;
            const acadStatus = acad ? (academicStatusMap[acad.status] || academicStatusMap.pending_approval) : null;

            return (
              <Link key={cred.id} href={`/contributor/credentials/${cred.id}`}>
                <div className="group rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
                  {/* Card Header */}
                  <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
                          <Award className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-semibold text-gray-900 truncate">{cred.title}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant={level.variant}>{level.label}</Badge>
                            <span className="text-[10px] text-gray-400">{cred.skill}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 py-3.5">
                    {/* Score + hours + date */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-gold-500" />
                        <span className="text-[12px] font-semibold text-gray-700">{cred.reviewScore}</span>
                      </div>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[11px] text-gray-400">{cred.hoursValidated}h validated</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[11px] text-gray-400">{formatDate(cred.issuedAt)}</span>
                    </div>

                    {/* Task / Project context */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <BookOpen className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-[11px] text-gray-500 truncate">{cred.taskTitle}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mb-3">{cred.projectTitle}</div>

                    {/* PoDL Verification */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                      <Fingerprint className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] font-mono text-gray-500 truncate">{cred.podlHash}</span>
                    </div>

                    {/* Academic Mapping (if present) */}
                    {acad && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-50">
                        <GraduationCap className="w-3 h-3 text-teal-500 shrink-0" />
                        <span className="text-[10px] text-teal-700 flex-1 truncate">
                          {acad.courseEquivalent} &middot; {acad.credits} credit{acad.credits !== 1 ? "s" : ""}
                        </span>
                        {acadStatus && <Badge variant={acadStatus.variant}>{acadStatus.label}</Badge>}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty state — H1 edge case */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Award className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-[14px] font-medium text-gray-500 mb-1">No credentials found</p>
            <p className="text-[12px] text-gray-400 max-w-[320px]">
              {activeFilterCount > 0
                ? "Try different filters to see your credentials."
                : "Complete tasks to earn credentials. Each accepted deliverable validates your skills."
              }
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 mt-3 text-[11px] font-medium text-brown-500 px-3.5 py-1.5 border border-brown-200 rounded-xl hover:bg-brown-50 transition-all">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
