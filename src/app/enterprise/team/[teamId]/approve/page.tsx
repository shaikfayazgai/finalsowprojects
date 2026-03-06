"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  Users,
  Target,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Star,
  Clock,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Button, Textarea, Avatar, AvatarFallback, Progress } from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { mockTeams } from "@/mocks/data/enterprise-projects";
import type { TeamMember } from "@/types/enterprise";

/* ── Track config ── */
const trackConfig: Record<string, { label: string; gradient: string }> = {
  women: { label: "Women", gradient: "from-brown-400 to-brown-500" },
  student: { label: "Student", gradient: "from-teal-400 to-teal-500" },
  general: { label: "General", gradient: "from-beige-400 to-beige-500" },
};

/* ── Compact member card ── */
function CompactMemberCard({ member }: { member: TeamMember }) {
  const track = trackConfig[member.track];

  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center gap-3 rounded-xl border border-beige-200/50 bg-white/80 backdrop-blur-sm p-3 hover:shadow-md transition-all"
    >
      <Avatar size="sm">
        <AvatarFallback
          className={cn("bg-gradient-to-br text-white font-bold text-[10px]", track.gradient)}
        >
          {member.avatar}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-semibold text-brown-900 truncate">
            {member.displayName}
          </p>
          <Fingerprint className="w-2.5 h-2.5 text-beige-400 shrink-0" />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {member.skills.slice(0, 2).map((s) => (
            <span
              key={s}
              className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-beige-100 text-beige-600"
            >
              {s}
            </span>
          ))}
          {member.skills.length > 2 && (
            <span className="text-[8px] text-beige-500">
              +{member.skills.length - 2}
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
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
        <div className="flex items-center gap-0.5 mt-0.5 justify-end">
          <Star className="w-2.5 h-2.5 text-gold-500 fill-gold-500" />
          <span className="text-[9px] text-beige-500">
            {member.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   APPROVE TEAM PAGE
   ══════════════════════════════════════════ */
export default function ApproveTeamPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const team = mockTeams.find((t) => t.id === teamId) ?? mockTeams[0];
  const [notes, setNotes] = React.useState("");

  const matchColor =
    team.matchScore >= 90
      ? "forest"
      : team.matchScore >= 80
      ? "teal"
      : "gold";

  /* Skill coverage */
  const memberSkills = new Set(team.members.flatMap((m) => m.skills));
  const coveredSkills = team.requiredSkills.filter((s) =>
    memberSkills.has(s)
  );
  const coveragePct = Math.round(
    (coveredSkills.length / team.requiredSkills.length) * 100
  );

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[900px] mx-auto space-y-6"
    >
      {/* Back + header */}
      <motion.div variants={fadeUp}>
        <Link
          href={`/enterprise/team/${team.id}`}
          className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Team Detail
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-teal-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-brown-900 tracking-[-0.02em]">
              Approve Team Composition
            </h1>
            <p className="text-[12px] text-beige-500 mt-0.5">
              {team.name}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Team summary cards */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-3 gap-4"
      >
        {/* Member count */}
        <div className="rounded-xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 text-center">
          <div className="w-9 h-9 rounded-lg bg-brown-100 text-brown-600 mx-auto flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-[20px] font-bold text-brown-900">
            {team.totalMembers}
          </p>
          <p className="text-[10px] text-beige-500 mt-0.5">Members</p>
        </div>

        {/* Match score */}
        <div className="rounded-xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 flex flex-col items-center justify-center">
          <MetricRing
            value={team.matchScore}
            size={64}
            strokeWidth={5}
            color={matchColor}
            label="Match"
          />
        </div>

        {/* Skill coverage */}
        <div className="rounded-xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 text-center">
          <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-600 mx-auto flex items-center justify-center mb-2">
            <Target className="w-4 h-4" />
          </div>
          <p className="text-[20px] font-bold text-brown-900">
            {coveragePct}%
          </p>
          <p className="text-[10px] text-beige-500 mt-0.5">Skill Coverage</p>
        </div>
      </motion.div>

      {/* Member overview */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
      >
        <h3 className="text-[14px] font-bold text-brown-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-beige-400" />
          Team Members
          <span className="text-[11px] font-normal text-beige-500">
            (Anonymized)
          </span>
        </h3>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
        >
          {team.members.map((member) => (
            <CompactMemberCard key={member.id} member={member} />
          ))}
        </motion.div>
      </motion.div>

      {/* Skill coverage detail */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
      >
        <h3 className="text-[14px] font-bold text-brown-900 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-gold-500" />
          Skill Coverage Analysis
        </h3>
        <div className="flex flex-wrap gap-2">
          {team.requiredSkills.map((skill) => {
            const covered = memberSkills.has(skill);
            return (
              <span
                key={skill}
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border",
                  covered
                    ? "bg-forest-50 text-forest-700 border-forest-200"
                    : "bg-beige-50 text-beige-500 border-beige-200 border-dashed"
                )}
              >
                {covered ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {skill}
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* Approval notes */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
      >
        <h3 className="text-[14px] font-bold text-brown-900 mb-3">
          Approval Notes
        </h3>
        <p className="text-[12px] text-beige-500 mb-3">
          Add any notes or conditions for this team approval. These will be
          recorded in the audit trail.
        </p>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Team composition looks strong. Consider adding a dedicated security specialist for Phase 2..."
          className="min-h-[100px]"
        />
      </motion.div>

      {/* CTAs */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2"
      >
        <Button variant="outline" size="md" className="w-full sm:w-auto">
          <XCircle className="w-4 h-4" />
          Reject & Reform
        </Button>
        <Button
          variant="gradient-primary"
          size="md"
          className="w-full sm:w-auto px-8"
        >
          <ShieldCheck className="w-4 h-4" />
          Approve Team
        </Button>
      </motion.div>
    </motion.div>
  );
}
