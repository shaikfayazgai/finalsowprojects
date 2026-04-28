"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Mail, Clock, Globe, Shield,
  Calendar, Pencil, Briefcase,
  ArrowRight, AlertCircle, RefreshCw, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import {
  fetchContributorProfile,
  isAvatarImageUrl,
  mapContributorProfileToUi,
  type ProfileUiState,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";

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
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

function emptyProfileState(
  fallbacks: { displayName: string; email: string; avatar: string },
): ProfileUiState {
  return mapContributorProfileToUi({}, fallbacks);
}

/* ═══ PAGE ═══ */

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const token = getContributorAccessToken(session);
  const contributorId = session?.user?.id ?? "";

  const sessionName = session?.user?.name ?? "";
  const sessionEmail = session?.user?.email ?? "";
  const sessionInitials = sessionName
    ? sessionName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "—";

  const [profile, setProfile] = React.useState<ProfileUiState>(() =>
    emptyProfileState({
      displayName: sessionName || "Contributor",
      email: sessionEmail,
      avatar: sessionInitials,
    }),
  );
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token || !contributorId) {
      setLoading(false);
      setLoadError(!contributorId ? "Missing contributor ID in session." : "Please sign in.");
      return;
    }

    setLoading(true);
    setLoadError(null);

    const fallbacks = {
      displayName: sessionName || "Contributor",
      email: sessionEmail,
      avatar: sessionInitials,
    };

    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:profile:${contributorId}:${sk}:${retryKey}`, () =>
      fetchContributorProfile(token, contributorId),
    )
      .then((raw) => {
        if (!live) return;
        setProfile(mapContributorProfileToUi(raw, fallbacks));
        setLoadError(null);
      })
      .catch((err: { message?: string }) => {
        if (!live) return;
        setLoadError(err?.message ?? "Failed to load profile");
        setProfile(emptyProfileState(fallbacks));
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [token, contributorId, sessionStatus, sessionName, sessionEmail, sessionInitials, retryKey]);

  const displayInitials = profile.displayName
    ? profile.displayName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : sessionInitials;

  const track = trackConfig[profile.track] || trackConfig.general;
  const avail = availabilityConfig[profile.availability] || availabilityConfig.available;

  const showSkeleton = sessionStatus === "loading" || (Boolean(token) && Boolean(contributorId) && loading);
  if (showSkeleton) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <div className="h-8 w-56 max-w-full bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="card-parchment h-40 bg-[#faf8f5] animate-pulse" />
        <div className="card-parchment h-32 bg-[#faf8f5] animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card-parchment h-24 bg-[#faf8f5] animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (!token || !contributorId) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="card-parchment px-6 py-10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 text-amber-800 text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {loadError || "Sign in to view your profile."}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {loadError && (
        <motion.div variants={fadeUp} className="mb-4 card-parchment px-5 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[13px] text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {loadError}
            </div>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </motion.div>
      )}

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
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {profile.anonymousId || "—"}
              </span>
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-semibold shrink-0 overflow-hidden">
              {isAvatarImageUrl(profile.avatar) ? (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (profile.avatar || displayInitials).slice(0, 2)
              )}
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
                {!!profile.weeklyHours && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{profile.weeklyHours}h/week</span>
                )}
              </div>
            </div>
          </div>

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

      {/* ═══ PERSONAL DETAILS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Personal Details</span>
        </div>
        <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Date of Birth</p>
            <p className="text-[13px] text-gray-800">{(profile as any).dob ? formatDate((profile as any).dob) : "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Country</p>
            <p className="text-[13px] text-gray-800">{(profile as any).country || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Department</p>
            <p className="text-[13px] text-gray-800">{(profile as any).departmentCategory || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Career Stage</p>
            <p className="text-[13px] text-gray-800">{(profile as any).careerStage || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Years of Experience</p>
            <p className="text-[13px] text-gray-800">{(profile as any).yearsExperience || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Degree / Qualification</p>
            <p className="text-[13px] text-gray-800">{(profile as any).degree || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Field of Study</p>
            <p className="text-[13px] text-gray-800">{(profile as any).branch || "—"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Availability</p>
            <p className="text-[13px] text-gray-800">{(profile as any).weeklyHours ? `${(profile as any).weeklyHours} hrs/week` : "—"}</p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Primary Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile as any).primarySkills?.length > 0
                ? (profile as any).primarySkills.map((s: string) => (
                    <span key={s} className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">{s}</span>
                  ))
                : <p className="text-[13px] text-gray-800">—</p>}
            </div>
          </div>

            <div className="space-y-1 sm:col-span-2">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Secondary Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(profile as any).secondarySkills?.length > 0
                  ? (profile as any).secondarySkills.map((s: string) => (
                      <span key={s} className="text-[11px] font-medium text-brown-700 bg-brown-50 px-2.5 py-1 rounded-lg">{s}</span>
                    ))
                  : <p className="text-[13px] text-gray-800">—</p>}
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Other / Niche Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(profile as any).otherSkills?.length > 0
                  ? (profile as any).otherSkills.map((s: string) => (
                    <span key={s} className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">{s}</span>
                  ))
                : <p className="text-[13px] text-gray-800">—</p>}
              </div>
            </div>

          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">LinkedIn</p>
            {(profile as any).linkedin ? (
              <a href={(profile as any).linkedin} target="_blank" rel="noreferrer"
                className="text-[13px] text-teal-600 hover:underline flex items-center gap-1">
                View Profile <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-[13px] text-gray-800">—</p>
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
        {profile.skills.length === 0 ? (
          <div className="px-5 py-8 text-center"><p className="text-[12px] text-gray-400">No skills added yet</p></div>
        ) : (
        <div className="py-2">
          {profile.skills.map((skill, i) => {
            const pct = proficiencyPercent[skill.proficiency] || 50;
            const color = proficiencyColors[skill.proficiency] || "bg-gray-300";
            return (
              <div
                key={`${skill.name}-${i}`}
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
        )}
      </motion.div>

      {/* ═══ Settings (other profile APIs — loaded on their routes only) ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/contributor/profile/digital-twin"
          className="card-parchment px-5 py-4 flex items-start justify-between gap-3 group hover:border-gray-200 transition-colors"
        >
          <div>
            <span className="text-sm font-semibold text-gray-800">Digital Twin</span>
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
              Performance profile and history (loaded on the next page only).
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5" />
        </Link>
        <Link
          href="/contributor/profile/evidence"
          className="card-parchment px-5 py-4 flex items-start justify-between gap-3 group hover:border-gray-200 transition-colors"
        >
          <div>
            <span className="text-sm font-semibold text-gray-800">Evidence</span>
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
              Portfolio links, files, and related skills.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5" />
        </Link>
      </motion.div>

    </motion.div>
  );
}
