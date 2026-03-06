"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  Settings,
  ArrowRight,
  UserCheck,
  Target,
  Cpu,
  Shield,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge } from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { mockTeams } from "@/mocks/data/enterprise-projects";
import type { TeamStatus, TeamMember } from "@/types/enterprise";

/* -- Status config -- */
const teamStatusConfig: Record<
  TeamStatus,
  { variant: "gold" | "teal" | "forest" | "brown" | "beige"; label: string }
> = {
  forming: { variant: "gold", label: "Forming" },
  ready: { variant: "teal", label: "Ready" },
  approved: { variant: "forest", label: "Approved" },
  active: { variant: "brown", label: "Active" },
  disbanded: { variant: "beige", label: "Disbanded" },
};

/* -- Track labels -- */
function trackLabel(track: string) {
  switch (track) {
    case "women":
      return { label: "Women's Track", color: "bg-brown-100 text-brown-700" };
    case "student":
      return { label: "University", color: "bg-teal-100 text-teal-700" };
    default:
      return { label: "General", color: "bg-beige-200 text-beige-600" };
  }
}

/* -- Generate "why matched" explanation -- */
function whyMatched(member: TeamMember, requiredSkills: string[]): string {
  const matched = member.skills.filter((s) =>
    requiredSkills.some(
      (rs) => rs.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(s.toLowerCase())
    )
  );
  const parts: string[] = [];

  if (matched.length > 0) {
    parts.push(
      `Matched on ${matched.slice(0, 2).join(", ")}${matched.length > 2 ? ` +${matched.length - 2} more` : ""}`
    );
  }

  if (member.matchScore >= 90) {
    parts.push("top-tier skill alignment");
  } else if (member.matchScore >= 85) {
    parts.push("strong skill coverage");
  }

  if (member.tasksCompleted >= 30) {
    parts.push(`${member.tasksCompleted} tasks delivered`);
  } else if (member.tasksCompleted >= 15) {
    parts.push("proven delivery track record");
  }

  if (member.rating >= 4.7) {
    parts.push(`${member.rating} rating`);
  }

  if (member.availability === "full_time") {
    parts.push("full-time availability");
  }

  return parts.slice(0, 3).join(" | ");
}

/* -- Summary stat card -- */
function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  subtext?: string;
}) {
  return (
    <motion.div
      variants={scaleIn}
      className="relative overflow-hidden rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg transition-all group"
    >
      <div
        className={cn(
          "absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity",
          accent.includes("brown")
            ? "bg-brown-500"
            : accent.includes("teal")
            ? "bg-teal-500"
            : accent.includes("forest")
            ? "bg-forest-500"
            : "bg-gold-500"
        )}
      />
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
          accent
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[24px] font-bold text-brown-900 tracking-tight leading-none">
        {value}
      </p>
      <p className="text-[11px] text-beige-500 font-medium mt-1.5">{label}</p>
      {subtext && (
        <p className="text-[10px] text-beige-400 mt-0.5">{subtext}</p>
      )}
    </motion.div>
  );
}

/* -- Expanded Team Card with members -- */
function TeamCard({ team }: { team: (typeof mockTeams)[0] }) {
  const [expanded, setExpanded] = React.useState(false);
  const status = teamStatusConfig[team.status];
  const matchColor =
    team.matchScore >= 90
      ? "forest"
      : team.matchScore >= 80
      ? "teal"
      : "gold";

  return (
    <motion.div variants={fadeUp}>
      <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden hover:shadow-xl hover:shadow-brown-100/20 transition-all duration-300">
        {/* Header */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-brown-900 truncate">
                {team.name}
              </h3>
              <p className="text-[11px] text-beige-500 mt-0.5">
                Plan: {team.planId}
              </p>
            </div>
            <Badge variant={status.variant} size="sm" dot>
              {status.label}
            </Badge>
          </div>

          {/* Match score ring + stats */}
          <div className="flex items-center gap-5">
            <MetricRing
              value={team.matchScore}
              size={64}
              strokeWidth={5}
              color={matchColor}
              label="Match"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-beige-500">Members</span>
                <span className="text-[13px] font-bold text-brown-800">
                  {team.totalMembers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-beige-500">Skills</span>
                <span className="text-[13px] font-bold text-brown-800">
                  {team.requiredSkills.length}
                </span>
              </div>
            </div>
          </div>

          {/* Skills tags */}
          <div className="flex items-center gap-1.5 mt-4 flex-wrap">
            {team.requiredSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-beige-100 text-beige-600"
              >
                {skill}
              </span>
            ))}
            {team.requiredSkills.length > 4 && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-beige-200 text-beige-500">
                +{team.requiredSkills.length - 4}
              </span>
            )}
          </div>

          {/* Toggle members */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 w-full flex items-center justify-between pt-3 border-t border-beige-100 group"
          >
            <div className="flex -space-x-1.5">
              {team.members.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-brown-300 to-brown-400 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                >
                  {m.avatar}
                </div>
              ))}
              {team.totalMembers > 4 && (
                <div className="w-6 h-6 rounded-full bg-beige-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-beige-600">
                  +{team.totalMembers - 4}
                </div>
              )}
            </div>
            <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
              {expanded ? "Hide" : "Show"} Members
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </span>
          </button>
        </div>

        {/* Expanded members list */}
        {expanded && (
          <div className="border-t border-beige-100/80 bg-beige-50/30">
            <div className="px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-brown-50/50 to-teal-50/50">
              <Brain className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-[10px] font-semibold text-brown-700">
                AI Matching Explanations
              </span>
              <ShieldCheck className="w-3 h-3 text-forest-400 ml-auto" />
              <span className="text-[9px] text-beige-500">
                Anonymized view
              </span>
            </div>
            <div className="divide-y divide-beige-100/50">
              {team.members.map((member) => {
                const tl = trackLabel(member.track);
                return (
                  <div
                    key={member.id}
                    className="px-5 py-3 hover:bg-white/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {member.avatar}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-semibold text-brown-900">
                            {member.displayName}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                              tl.color
                            )}
                          >
                            {tl.label}
                          </span>
                          <Badge
                            variant={
                              member.availability === "full_time"
                                ? "forest"
                                : member.availability === "part_time"
                                ? "gold"
                                : "beige"
                            }
                            size="sm"
                          >
                            {member.availability === "full_time"
                              ? "Full-time"
                              : member.availability === "part_time"
                              ? "Part-time"
                              : "Limited"}
                          </Badge>
                        </div>

                        {/* Skills */}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {member.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100/50"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Why matched */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Sparkles className="w-3 h-3 text-gold-500 shrink-0" />
                          <span className="text-[10px] text-beige-500 italic">
                            {whyMatched(member, team.requiredSkills)}
                          </span>
                        </div>
                      </div>

                      {/* Match score */}
                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            "text-[14px] font-bold",
                            member.matchScore >= 90
                              ? "text-forest-700"
                              : member.matchScore >= 85
                              ? "text-teal-700"
                              : "text-gold-700"
                          )}
                        >
                          {member.matchScore}%
                        </span>
                        <p className="text-[9px] text-beige-400">match</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ================================================================
   TEAM FORMATION OVERVIEW PAGE
   ================================================================ */
export default function TeamFormationPage() {
  const totalTeams = mockTeams.length;
  const avgMatch = Math.round(
    mockTeams.reduce((s, t) => s + t.matchScore, 0) / totalTeams
  );
  const activeContributors = mockTeams.reduce(
    (s, t) => s + t.totalMembers,
    0
  );
  const pending = mockTeams.filter(
    (t) => t.status === "forming" || t.status === "ready"
  ).length;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-forest-500 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              Team Formation
            </h1>
          </div>
          <p className="text-[13px] text-beige-500 mt-1 max-w-lg">
            AI-powered contributor matching and team composition. Per-task
            ranked lists with matching explanations.
          </p>
        </div>
        <Link
          href="/enterprise/team/configure"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-beige-200 text-beige-600 text-[12px] font-semibold hover:border-brown-300 hover:text-brown-600 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Configure Constraints
        </Link>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Teams"
          value={totalTeams}
          icon={Users}
          accent="bg-brown-100 text-brown-600"
        />
        <SummaryCard
          label="Average Match Score"
          value={`${avgMatch}%`}
          icon={Target}
          accent="bg-teal-100 text-teal-600"
          subtext="Above 85% threshold"
        />
        <SummaryCard
          label="Active Contributors"
          value={activeContributors}
          icon={UserCheck}
          accent="bg-forest-100 text-forest-600"
        />
        <SummaryCard
          label="Pending Approvals"
          value={pending}
          icon={Clock}
          accent="bg-gold-100 text-gold-700"
        />
      </div>

      {/* AI matching callout */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-brown-50/80 via-beige-50/80 to-teal-50/80 border border-beige-200/40 p-4"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shrink-0">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] text-brown-800 font-semibold">
            Instant Team Formation Engine
          </p>
          <p className="text-[11px] text-beige-500 mt-0.5">
            Teams are formed anonymously using Skill Genome matching. Each
            member includes an AI-generated explanation of why they were
            selected. No resumes, no bidding, no public profiles.
          </p>
        </div>
        <Shield className="w-5 h-5 text-forest-400 shrink-0" />
      </motion.div>

      {/* Team cards */}
      <motion.div variants={stagger} className="space-y-4">
        {mockTeams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </motion.div>
    </motion.div>
  );
}
