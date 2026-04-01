"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Clock, Globe, MapPin, Shield, CheckCircle2,
  Calendar, Pencil, Award, ExternalLink, FileText, Github,
  Link2, Briefcase, TrendingUp, Target, RotateCcw, Zap,
  BarChart3, ShieldCheck, ArrowRight, Activity, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockContributorProfile, mockDigitalTwin } from "@/mocks/data/contributor";

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

/* ═══ Helpers ═══ */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const proficiencyPercent: Record<string, number> = {
  beginner: 25, intermediate: 50, advanced: 75, expert: 100,
};

const proficiencyColors: Record<string, string> = {
  beginner: "bg-gray-300",
  intermediate: "bg-gold-400",
  advanced: "bg-teal-500",
  expert: "bg-forest-500",
};

const availabilityConfig: Record<string, { label: string; variant: string }> = {
  available: { label: "Available", variant: "forest" },
  busy: { label: "Busy", variant: "gold" },
  away: { label: "Away", variant: "beige" },
  offline: { label: "Offline", variant: "beige" },
  active: { label: "Active", variant: "forest" },
};

const trackConfig: Record<string, { label: string; variant: string }> = {
  general: { label: "General", variant: "beige" },
  student: { label: "Student", variant: "teal" },
  women: { label: "Women", variant: "brown" },
};

const evidenceIcons: Record<string, React.ElementType> = {
  portfolio: ExternalLink,
  certificate: Award,
  github: Github,
  project_link: Link2,
  document: FileText,
};

/* ═══ PAGE ═══ */

export default function ProfilePage() {
  const profile = mockContributorProfile;
  const twin = mockDigitalTwin;
  const track = trackConfig[profile.track] || trackConfig.general;
  const avail = availabilityConfig[profile.availability] || availabilityConfig.available;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant={track.variant} dot>{track.label} Track</Badge>
              <Badge variant={avail.variant} dot>{avail.label}</Badge>
              {profile.skills?.some((s) => s.source === "delivery_validated") && (
                <Badge variant="forest" dot>Verified</Badge>
              )}
            </div>
            <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
              {profile.displayName}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[12px] text-gray-400">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {profile.avatar || "N/A"}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>Joined {formatDate(profile.joinedAt)}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{profile.timezone}</span>
            </div>
          </div>
          <Link href="/contributor/profile/edit">
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
              <Pencil className="w-3 h-3" /> Edit Profile
            </button>
          </Link>
        </div>
      </motion.div>

      {/* ═══ PROFILE CARD ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Profile Details</span>
          <span className="text-[11px] text-gray-400">Completeness</span>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-start gap-5 mb-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-semibold shrink-0">
              {profile.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-semibold text-gray-900">{profile.displayName}</h2>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[12px] text-gray-400">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{profile.timezone}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[12px] text-gray-400">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{profile.track.charAt(0).toUpperCase() + profile.track.slice(1)} track</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(profile.joinedAt)}</span>
                {profile.weeklyHours && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{profile.weeklyHours}h/week</span>
                )}
              </div>
            </div>
          </div>

          {/* Completeness bar */}
          <div className="mb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium text-gray-600">Profile Completeness</span>
              <span className="text-[12px] font-mono font-semibold text-gray-700">{profile.profileCompleteness}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  profile.profileCompleteness === 100 ? "bg-forest-500" : "bg-gradient-to-r from-teal-400 to-teal-500"
                )}
                style={{ width: `${profile.profileCompleteness}%` }}
              />
            </div>
            {profile.profileCompleteness < 100 && (
              <p className="text-[11px] text-gray-400 mt-2">
                Complete your profile to unlock more task matches
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ SKILLS SECTION ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Skills</span>
          <Link href="/contributor/profile/evidence" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
            Manage Evidence <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="py-2">
          {profile.skills.map((skill, i) => {
            const pct = proficiencyPercent[skill.proficiency] || 50;
            const color = proficiencyColors[skill.proficiency] || "bg-gray-300";
            return (
              <div
                key={skill.name}
                className="flex items-center gap-4 px-5 py-3"
                style={{ borderBottom: i < profile.skills.length - 1 ? "1px solid var(--border-hair)" : undefined }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-medium text-gray-800">{skill.name}</span>
                    {skill.source === "delivery_validated" ? (
                      <Badge variant="forest" dot>Validated</Badge>
                    ) : (
                      <Badge variant="beige">Self-declared</Badge>
                    )}
                    <Badge variant="beige">{skill.proficiency}</Badge>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-xs">
                    <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-gray-400">{skill.validatedCount} endorsement{skill.validatedCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ AVAILABILITY & CAPACITY ═══ */}
      <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-semibold text-gray-800">Availability &amp; Capacity</span>
          <Link href="/contributor/profile/edit" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
            Update <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-teal-500 shrink-0" />
            <div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Weekly Hours</div>
              <div className="text-[14px] font-semibold text-gray-800">{profile.weeklyHours} hrs/week</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-teal-500 shrink-0" />
            <div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Timezone</div>
              <div className="text-[14px] font-semibold text-gray-800">{profile.timezone}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-teal-500 shrink-0" />
            <div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Status</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant={avail.variant} dot>{avail.label}</Badge>
              </div>
            </div>
          </div>
        </div>
        {(() => {
          const lastReviewed = profile.lastAvailabilityReviewedAt;
          if (!lastReviewed) {
            return (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gold-50 border border-gold-200">
                <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-gold-800">
                  Your availability hasn&apos;t been reviewed yet. Keeping this current helps AGI match you accurately.{" "}
                  <Link href="/contributor/profile/edit" className="font-semibold text-gold-700 hover:text-gold-900 transition-colors">Update Now →</Link>
                </p>
              </div>
            );
          }
          const daysSince = Math.floor((Date.now() - new Date(lastReviewed).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince > 14) {
            return (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gold-50 border border-gold-200">
                <AlertTriangle className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-gold-800">
                  Your availability hasn&apos;t been reviewed in {daysSince} days. Keeping this current helps AGI match you accurately.{" "}
                  <Link href="/contributor/profile/edit" className="font-semibold text-gold-700 hover:text-gold-900 transition-colors">Update Now →</Link>
                </p>
              </div>
            );
          }
          return (
            <p className="text-[11px] text-gray-400">Last reviewed {daysSince} days ago</p>
          );
        })()}
      </motion.div>

      {/* ═══ DIGITAL TWIN METRICS ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-800">Digital Twin</h2>
            <Link href="/contributor/profile/digital-twin" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
              View Full Profile <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <span className="text-[11px] text-gray-400">Last updated {formatDate(twin.updatedAt)}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "Tasks Completed", value: twin.tasksCompleted, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
            { label: "Acceptance Rate", value: `${twin.acceptanceRate}%`, icon: Target, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
            { label: "On-time Delivery", value: `${twin.onTimeDelivery}%`, icon: Clock, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
            { label: "SLA Compliance", value: `${twin.slaCompliance}%`, icon: ShieldCheck, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
            { label: "Rework Rate", value: `${twin.reworkRate}%`, icon: RotateCcw, iconBg: "bg-gradient-to-br from-brown-300 to-brown-500" },
            { label: "Skill Growth", value: `${twin.streakDays}/qtr`, icon: Zap, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          ].map((kpi) => {
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
        </div>
      </motion.div>

      {/* ═══ AI INSIGHTS ═══ */}
      {twin.aiInsights && twin.aiInsights.length > 0 && (
        <motion.div variants={fadeUp} className="card-parchment mb-6">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">AI Insights</span>
              <Badge variant="teal">{twin.aiInsights.length}</Badge>
            </div>
          </div>
          <div className="py-2">
            {twin.aiInsights.map((insight: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 px-5 py-3"
                style={{ borderBottom: i < twin.aiInsights.length - 1 ? "1px solid var(--border-hair)" : undefined }}
              >
                <TrendingUp className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-gray-600 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ VERIFIED SKILLS & GROWTH AREAS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Verified Skills */}
        <div className="card-parchment">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Verified Skills</span>
          </div>
          <div className="py-2">
            {twin.topSkills.map((s, i) => (
              <div key={s.skill} className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: i < twin.topSkills.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                  <div>
                    <span className="text-[13px] font-medium text-gray-800">{s.skill}</span>
                    <span className="text-[10px] text-gray-400 block">{s.tasksCompleted} validated deliveries</span>
                  </div>
                </div>
                <Badge variant="forest">{s.avgScore}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Growth */}
        <div className="card-parchment">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Strengths & Growth Areas</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Strengths</div>
              <div className="flex flex-wrap gap-1.5">
                {twin.aiInsights.map((area) => (
                  <span key={area} className="text-[10px] font-medium text-forest-700 bg-forest-50 px-2.5 py-1 rounded-lg">{area}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Growth Areas</div>
              <div className="flex flex-wrap gap-1.5">
                {twin.topSkills.map((s: any) => s.skill).map((area) => (
                  <span key={area} className="text-[10px] font-medium text-gold-700 bg-gold-50 px-2.5 py-1 rounded-lg">{area}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <span className="text-[11px] text-gray-400">Trend:</span>
              <Badge variant={"forest"} dot>
                {"improving"}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
