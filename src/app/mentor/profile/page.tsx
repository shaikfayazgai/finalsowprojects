"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Star, TrendingUp, Award, Shield,
  Calendar, GraduationCap, Settings, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";

/* ══════════════════════════════════════════ Pill ══════════════════════════════════════════ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>{children}</span>
  );
}

/* ══════════════════════════════════════════ Section ══════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-parchment">
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════ Mock Data ══════════════════════════════════════════ */

const profile = {
  name: "Dr. Ravi Krishnan",
  role: "Senior Reviewer & Mentor",
  memberId: "MNT-0042",
  joinedAt: "2025-11-01",
  email: "ravi.k@glimmora.com",
  timezone: "Asia/Kolkata (IST)",
  expertiseAreas: ["React", "TypeScript", "Node.js", "System Design", "Accessibility", "PostgreSQL"],
  reviewTypes: ["Initial Review", "Rework Review", "Final Review"],
  maxConcurrent: 5,
  currentLoad: 2,
  availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false },
};

const stats = {
  totalReviews: 142,
  acceptanceRate: 74,
  avgReviewTime: 1.9,
  avgScore: 4.1,
  slaCompliance: 96,
  reworkRate: 19,
  rejectionRate: 7,
  mentorshipSessions: 28,
};

/* ══════════════════════════════════════════ PAGE ══════════════════════════════════════════ */

export default function MentorProfilePage() {
  const router = useRouter();

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HERO ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Profile
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Your reviewer identity, expertise, and performance summary
        </p>
      </motion.div>

      {/* ═══ IDENTITY CARD ═══ */}
      <motion.div variants={fadeUp} className="card-parchment px-6 py-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center text-white text-[22px] font-heading font-semibold shrink-0">
              RK
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-gray-900">{profile.name}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{profile.role}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Pill bg="var(--color-brown-50)" color="var(--color-brown-600)">ID: {profile.memberId}</Pill>
                <Pill bg="var(--color-forest-50)" color="var(--color-forest-700)">
                  <Shield className="w-3 h-3" /> Verified Reviewer
                </Pill>
              </div>
            </div>
          </div>
          <button onClick={() => router.push("/mentor/profile/edit")} className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            <Settings className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5" style={{ borderTop: "1px solid var(--border-hair)" }}>
          {[
            { label: "Email", value: profile.email },
            { label: "Timezone", value: profile.timezone },
            { label: "Member Since", value: new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{item.label}</div>
              <div className="text-[13px] text-gray-700 mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Reviews", value: stats.totalReviews, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Acceptance Rate", value: `${stats.acceptanceRate}%`, icon: TrendingUp, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "Avg Review Time", value: `${stats.avgReviewTime}h`, icon: Clock, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "SLA Compliance", value: `${stats.slaCompliance}%`, icon: Award, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
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
      </motion.div>

      {/* ═══ TWO COLUMNS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT — Expertise & Capacity */}
        <div className="space-y-5">
          <motion.div variants={fadeUp}>
            <Section title="Expertise Areas">
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {profile.expertiseAreas.map((skill) => (
                    <span key={skill} className="text-[12px] font-medium text-gray-700 bg-gray-50 px-3.5 py-2 rounded-lg" style={{ border: "1px solid var(--border-soft)" }}>{skill}</span>
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Section title="Review Types">
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {profile.reviewTypes.map((type) => (
                    <Pill key={type} bg="var(--color-teal-50)" color="var(--color-teal-700)">{type}</Pill>
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Section title="Capacity">
              <div className="px-5 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">Current Load</span>
                  <span className="font-mono text-[13px] font-semibold text-gray-800">{profile.currentLoad} / {profile.maxConcurrent}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(profile.currentLoad / profile.maxConcurrent) * 100}%`, background: profile.currentLoad >= profile.maxConcurrent ? "var(--danger)" : "var(--color-forest-500)" }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>{profile.maxConcurrent - profile.currentLoad} slots available</span>
                  <span>Max {profile.maxConcurrent} concurrent</span>
                </div>
              </div>
            </Section>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Section title="Weekly Availability">
              <div className="px-5 py-4">
                <div className="flex items-center gap-2">
                  {Object.entries(profile.availability).map(([day, available]) => (
                    <div key={day} className={cn("flex-1 text-center py-2.5 rounded-lg text-[11px] font-semibold transition-all", available ? "bg-forest-50 text-forest-700" : "bg-gray-50 text-gray-400")}>
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>
        </div>

        {/* RIGHT — Performance */}
        <div className="space-y-5">
          <motion.div variants={fadeUp}>
            <Section title="Review Performance">
              <div className="py-1">
                {[
                  { label: "Avg Quality Score", value: `${stats.avgScore} / 5`, bar: (stats.avgScore / 5) * 100, barColor: stats.avgScore >= 4 ? "var(--color-forest-500)" : "var(--color-gold-500)" },
                  { label: "Acceptance Rate", value: `${stats.acceptanceRate}%`, bar: stats.acceptanceRate, barColor: "var(--color-forest-500)" },
                  { label: "Rework Rate", value: `${stats.reworkRate}%`, bar: stats.reworkRate, barColor: "var(--color-gold-500)" },
                  { label: "Rejection Rate", value: `${stats.rejectionRate}%`, bar: stats.rejectionRate, barColor: "var(--danger)" },
                  { label: "SLA Compliance", value: `${stats.slaCompliance}%`, bar: stats.slaCompliance, barColor: "var(--color-forest-500)" },
                  { label: "Avg Review Time", value: `${stats.avgReviewTime}h`, bar: Math.min((stats.avgReviewTime / 4) * 100, 100), barColor: "var(--color-teal-500)" },
                ].map((metric, i) => (
                  <div key={metric.label} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: i < 5 ? "1px solid var(--border-hair)" : undefined }}>
                    <span className="text-[12px] text-gray-500 w-32 shrink-0">{metric.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${metric.bar}%`, background: metric.barColor }} />
                    </div>
                    <span className="font-mono text-[12px] font-semibold text-gray-700 w-14 text-right">{metric.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Section title="Mentorship Activity">
              <div className="px-5 py-4">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="num-display text-[28px] text-gray-900 leading-none">{stats.mentorshipSessions}</div>
                    <div className="text-[11px] font-medium text-gray-400 mt-1">Sessions completed</div>
                  </div>
                </div>
              </div>
            </Section>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
