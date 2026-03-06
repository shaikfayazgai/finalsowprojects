"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Star,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Undo2,
  Briefcase,
  Eye,
  EyeOff,
  Fingerprint,
  Award,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button, Avatar, AvatarFallback, Progress } from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { mockTeams } from "@/mocks/data/enterprise-projects";
import type { TeamMember, TeamStatus } from "@/types/enterprise";

/* ── Status config ── */
const teamStatusConfig: Record<TeamStatus, { variant: "gold" | "teal" | "forest" | "brown" | "beige"; label: string }> = {
  forming: { variant: "gold", label: "Forming" },
  ready: { variant: "teal", label: "Ready" },
  approved: { variant: "forest", label: "Approved" },
  active: { variant: "brown", label: "Active" },
  disbanded: { variant: "beige", label: "Disbanded" },
};

/* ── Track badge config ── */
const trackConfig: Record<string, { label: string; gradient: string; bg: string; text: string }> = {
  women: {
    label: "Women's Program",
    gradient: "from-brown-400 to-brown-500",
    bg: "bg-brown-100",
    text: "text-brown-700",
  },
  student: {
    label: "University Track",
    gradient: "from-teal-400 to-teal-500",
    bg: "bg-teal-100",
    text: "text-teal-700",
  },
  general: {
    label: "General",
    gradient: "from-beige-400 to-beige-500",
    bg: "bg-beige-200",
    text: "text-beige-700",
  },
};

/* ── Availability config ── */
const availConfig: Record<string, { label: string; variant: "forest" | "gold" | "beige" }> = {
  full_time: { label: "Full-time", variant: "forest" },
  part_time: { label: "Part-time", variant: "gold" },
  limited: { label: "Limited", variant: "beige" },
};

/* ── Star rating ── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-3 h-3",
            star <= Math.round(rating)
              ? "text-gold-500 fill-gold-500"
              : "text-beige-300"
          )}
        />
      ))}
      <span className="ml-1 text-[10px] font-semibold text-brown-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

/* ── Anonymized member card ── */
function MemberCard({ member }: { member: TeamMember }) {
  const track = trackConfig[member.track];
  const avail = availConfig[member.availability];
  const matchColor =
    member.matchScore >= 90
      ? "forest"
      : member.matchScore >= 80
      ? "teal"
      : "gold";

  return (
    <motion.div
      variants={scaleIn}
      className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-xl hover:shadow-brown-100/15 hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Header: avatar + name + track */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar size="lg">
          <AvatarFallback
            className={cn(
              "bg-gradient-to-br text-white font-bold",
              track.gradient
            )}
          >
            {member.avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-bold text-brown-900 truncate">
              {member.displayName}
            </p>
            <Fingerprint className="w-3 h-3 text-beige-400 shrink-0" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={avail.variant} size="sm">
              {avail.label}
            </Badge>
            <span
              className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-md",
                track.bg,
                track.text
              )}
            >
              {track.label}
            </span>
          </div>
        </div>
      </div>

      {/* Match score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-beige-500 font-medium">
            Match Score
          </span>
          <span
            className={cn(
              "text-[12px] font-bold",
              member.matchScore >= 90
                ? "text-forest-600"
                : member.matchScore >= 80
                ? "text-teal-600"
                : "text-gold-600"
            )}
          >
            {member.matchScore}%
          </span>
        </div>
        <Progress
          value={member.matchScore}
          size="sm"
          variant={
            member.matchScore >= 90
              ? "forest"
              : member.matchScore >= 80
              ? "teal"
              : "gold"
          }
        />
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {member.skills.map((skill) => (
          <span
            key={skill}
            className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-beige-100 text-beige-600"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-3 border-t border-beige-100">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-forest-500" />
          <span className="text-[11px] text-brown-700 font-medium">
            {member.tasksCompleted} tasks
          </span>
        </div>
        <StarRating rating={member.rating} />
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   TEAM DETAIL PAGE
   ══════════════════════════════════════════ */
export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const team = mockTeams.find((t) => t.id === teamId) ?? mockTeams[0];
  const status = teamStatusConfig[team.status];

  const matchColor =
    team.matchScore >= 90
      ? "forest"
      : team.matchScore >= 80
      ? "teal"
      : "gold";

  /* Skill coverage analysis */
  const memberSkills = new Set(team.members.flatMap((m) => m.skills));
  const coveredSkills = team.requiredSkills.filter((s) =>
    memberSkills.has(s)
  );
  const coveragePct = Math.round(
    (coveredSkills.length / team.requiredSkills.length) * 100
  );

  /* Track distribution */
  const trackCounts = team.members.reduce(
    (acc, m) => {
      acc[m.track] = (acc[m.track] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Back + header */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/team"
          className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Team Formation
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <MetricRing
              value={team.matchScore}
              size={56}
              strokeWidth={5}
              color={matchColor}
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[20px] font-bold text-brown-900 tracking-[-0.02em]">
                  {team.name}
                </h1>
                <Badge variant={status.variant} size="sm" dot>
                  {status.label}
                </Badge>
              </div>
              <p className="text-[12px] text-beige-500 mt-0.5">
                {team.totalMembers} members &middot; Plan: {team.planId}{" "}
                &middot; Created{" "}
                {new Date(team.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/enterprise/team/${team.id}/approve`}>
              <Button variant="outline" size="sm">
                <Undo2 className="w-3.5 h-3.5" />
                Request Changes
              </Button>
            </Link>
            <Link href={`/enterprise/team/${team.id}/approve`}>
              <Button variant="gradient-primary" size="sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Approve Team
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Privacy notice */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-3 rounded-xl bg-brown-50/60 border border-brown-200/40 p-3"
      >
        <EyeOff className="w-4 h-4 text-brown-500 shrink-0" />
        <p className="text-[11px] text-brown-700">
          <span className="font-semibold">Privacy-first view.</span> All
          contributor identities are anonymized. No real names, photos, or
          personal details are displayed to enterprise clients.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2/3: Member cards */}
        <div className="lg:col-span-2">
          <motion.div
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {team.members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </motion.div>
        </div>

        {/* Right 1/3: Skill coverage + analysis */}
        <motion.div variants={slideInRight} className="space-y-5">
          {/* Skill coverage */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[13px] font-bold text-brown-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-500" />
              Skill Coverage
            </h3>

            <div className="text-center mb-4">
              <MetricRing
                value={coveragePct}
                size={80}
                strokeWidth={7}
                color={coveragePct === 100 ? "forest" : "teal"}
                label="Covered"
                className="mx-auto"
              />
            </div>

            <div className="space-y-2">
              {team.requiredSkills.map((skill) => {
                const covered = memberSkills.has(skill);
                const memberCount = team.members.filter((m) =>
                  m.skills.includes(skill)
                ).length;
                return (
                  <div
                    key={skill}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      {covered ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-beige-300" />
                      )}
                      <span
                        className={cn(
                          "text-[12px] font-medium",
                          covered ? "text-brown-800" : "text-beige-500"
                        )}
                      >
                        {skill}
                      </span>
                    </div>
                    {covered && (
                      <span className="text-[10px] text-beige-500 font-mono">
                        {memberCount}x
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track distribution */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[13px] font-bold text-brown-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-beige-400" />
              Track Distribution
            </h3>
            <div className="space-y-3">
              {(
                [
                  ["women", "Women's Program"],
                  ["student", "University Track"],
                  ["general", "General"],
                ] as const
              ).map(([key, label]) => {
                const count = trackCounts[key] || 0;
                const pct = Math.round(
                  (count / team.totalMembers) * 100
                );
                const cfg = trackConfig[key];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-[11px] font-semibold", cfg.text)}>
                        {label}
                      </span>
                      <span className="text-[11px] text-beige-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-beige-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                          cfg.gradient
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team stats */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[13px] font-bold text-brown-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest-500" />
              Team Stats
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "Total Deliveries",
                  value: team.members
                    .reduce((s, m) => s + m.tasksCompleted, 0)
                    .toString(),
                },
                {
                  label: "Avg Rating",
                  value:
                    (
                      team.members.reduce((s, m) => s + m.rating, 0) /
                      team.members.length
                    ).toFixed(1) + "/5.0",
                },
                {
                  label: "Full-time Members",
                  value: team.members
                    .filter((m) => m.availability === "full_time")
                    .length.toString(),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-[12px] text-beige-600">
                    {item.label}
                  </span>
                  <span className="text-[13px] font-bold text-brown-800">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
