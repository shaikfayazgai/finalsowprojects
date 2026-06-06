"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Award, ShieldCheck, Star, Sparkles,
  ChevronRight, Tag, X, RefreshCw, AlertCircle,
  CheckCircle2, Download, Share2, TrendingUp, Database,
  GraduationCap, Fingerprint, BookOpen, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import {
  fetchCredentialsWalletSummary,
  fetchCredentialsList,
  fetchSkillsVerification,
  type CredentialsWalletSummary,
  type CredentialListItem,
  type SkillVerificationItem,
  type CredentialDateFilter,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";

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

const seniorityVariant: Record<string, string> = {
  junior: "beige", mid: "teal", senior: "brown", lead: "gold", principal: "gold", staff: "gold",
};

function variantForLevel(l: string)    { return levelVariant[l?.toLowerCase()]    ?? "beige"; }
function variantForSeniority(s: string){ return seniorityVariant[s?.toLowerCase()] ?? "beige"; }

/* ═══ Skeletons ═══ */

function KpiSkeleton() {
  return (
    <div className="card-parchment flex items-center gap-5 px-5 py-5 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-2.5 bg-gray-200 rounded w-24" />
        <div className="h-7 bg-gray-200 rounded w-16" />
        <div className="h-2 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 animate-pulse">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-44" />
            <div className="flex gap-1.5">
              <div className="h-4 bg-gray-200 rounded-full w-14" />
              <div className="h-4 bg-gray-200 rounded-full w-20" />
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-3.5 space-y-2">
        <div className="h-2.5 bg-gray-200 rounded w-48" />
        <div className="flex gap-1.5">
          <div className="h-4 bg-gray-100 rounded-full w-16" />
          <div className="h-4 bg-gray-100 rounded-full w-20" />
        </div>
        <div className="h-8 bg-gray-100 rounded-lg mt-1" />
      </div>
    </div>
  );
}

/* ═══ Constants ═══ */

const SUMMARY_FALLBACK: CredentialsWalletSummary = {
  total_credentials: 0,
  skills_verified: 0,
  tasks_accepted: 0,
  acceptance_rate: 0,
};

const DATE_FILTER_MAP: Record<string, CredentialDateFilter | undefined> = {
  "30d": "30d", "90d": "90d", "6m": "6m",
};

/* ═══ PAGE ═══ */

export default function CredentialsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const token = getContributorAccessToken(session);

  /* ── Filter state (drive the API call) ── */
  const [skillFilter, setSkillFilter] = React.useState("all");
  const [dateFilter, setDateFilter]   = React.useState("all");

  /* ── Data state ── */
  const [summary, setSummary]                       = React.useState<CredentialsWalletSummary>(SUMMARY_FALLBACK);
  const [credentials, setCredentials]               = React.useState<CredentialListItem[]>([]);
  const [skillVerifications, setSkillVerifications] = React.useState<SkillVerificationItem[]>([]);
  const [loadingSummary, setLoadingSummary]         = React.useState(true);
  const [loadingList, setLoadingList]               = React.useState(true);
  const [loadingSkills, setLoadingSkills]           = React.useState(true);
  const [summaryError, setSummaryError]             = React.useState<string | null>(null);
  const [listError, setListError]                   = React.useState<string | null>(null);
  const [skillsError, setSkillsError]               = React.useState<string | null>(null);
  const [retryKey, setRetryKey]                     = React.useState(0);

  /* ── Fetch wallet summary ── */
  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) { setLoadingSummary(false); return; }
    setLoadingSummary(true);
    setSummaryError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:creds-wallet-summary:${sk}:${retryKey}`, () =>
      fetchCredentialsWalletSummary(token),
    )
      .then((d) => {
        if (!live) return;
        setSummary(d);
        setLoadingSummary(false);
      })
      .catch((e: Error) => {
        if (!live) return;
        setSummaryError(e.message);
        setLoadingSummary(false);
      });
    return () => {
      live = false;
    };
  }, [token, sessionStatus, retryKey]);

  /* ── Fetch credentials list (re-fires when filters change) ── */
  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) { setLoadingList(false); return; }

    setLoadingList(true);
    setListError(null);

    const apiSkill = skillFilter !== "all" ? skillFilter : undefined;
    const apiDate  = DATE_FILTER_MAP[dateFilter];
    const sk = sessionKeyFragment(token);
    const fk = [skillFilter, dateFilter, retryKey].join("|");
    let live = true;

    void dedupeAsync(`contrib:creds-list:${sk}:${fk}`, () =>
      fetchCredentialsList(token, { skill: apiSkill, date_filter: apiDate, page: 1, page_size: 100 }),
    )
      .then((data) => {
        if (!live) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setCredentials(items);
        setLoadingList(false);
      })
      .catch((e: Error) => {
        if (!live) return;
        setListError(e.message);
        setLoadingList(false);
      });

    return () => {
      live = false;
    };
  }, [token, sessionStatus, skillFilter, dateFilter, retryKey]);

  /* ── Fetch skills verification ── */
  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) { setLoadingSkills(false); return; }
    setLoadingSkills(true);
    setSkillsError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:creds-skills-verify:${sk}:${retryKey}`, () => fetchSkillsVerification(token))
      .then((d) => {
        if (!live) return;
        const items = Array.isArray(d?.items) ? d.items : [];
        setSkillVerifications(items);
        setLoadingSkills(false);
      })
      .catch((e: Error) => {
        if (!live) return;
        setSkillsError(e.message);
        setLoadingSkills(false);
      });
    return () => {
      live = false;
    };
  }, [token, sessionStatus, retryKey]);

  /* ── Derived ── */
  const uniqueSkills = React.useMemo(
    () => [...new Set(credentials.flatMap((c) => c.skill_tags ?? [c.skill]).filter(Boolean))].sort(),
    [credentials],
  );

  const activeFilterCount = [skillFilter, dateFilter].filter((v) => v !== "all").length;
  function clearFilters() { setSkillFilter("all"); setDateFilter("all"); }

  const mostRecent = credentials.length > 0
    ? credentials.reduce((a, b) => new Date(a.issued_at) > new Date(b.issued_at) ? a : b)
    : null;

  const isKpiLoading = sessionStatus === "loading" || loadingSummary;
  const hasError = !!(summaryError || listError);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
              Credentials
            </h1>
            <p className="mt-1.5 text-[13px] text-gray-500">
              Proof-of-Delivery Ledger — Verified credentials earned through accepted deliveries.
            </p>
          </div>
          {hasError && (
            <button onClick={() => setRetryKey((k) => k + 1)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-brown-600 px-3.5 py-2 rounded-xl border border-brown-200 hover:bg-brown-50 transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-7">
        {isKpiLoading ? (
          <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
        ) : (
          <>
            {[
              { label: "Total Credentials", value: summary.total_credentials, icon: Award,     iconBg: "bg-gradient-to-br from-brown-400 to-brown-600",  sub: "Lifetime earned",  isText: false },
              { label: "Skills Validated",  value: summary.skills_verified,   icon: ShieldCheck,iconBg: "bg-gradient-to-br from-teal-400 to-teal-600",   sub: "Unique skills",    isText: false },
              { label: "Most Recent",       value: mostRecent ? mostRecent.title : "—", icon: Sparkles, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600", sub: mostRecent ? formatDate(mostRecent.issued_at) : "No credentials yet", isText: true },
            ].map((kpi) => {
              const KpiIcon = kpi.icon;
              return (
                <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                    <KpiIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                    {kpi.isText
                      ? <div className="text-[14px] font-semibold text-gray-900 leading-snug mt-1 truncate">{kpi.value}</div>
                      : <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
                    }
                    <div className="text-[10px] text-gray-400 mt-1">{kpi.sub}</div>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </motion.div>

      {/* ═══ CREDENTIALS LIST ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">All Credentials</span>
          {loadingList && (
            <div className="w-3.5 h-3.5 border-2 border-brown-300 border-t-brown-600 rounded-full animate-spin" />
          )}
        </div>

        {/* Filters — server-side: both skill + date_filter go to API */}
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
          <span className="font-mono text-[11px] text-gray-400">
            {loadingList ? "—" : `${credentials.length} credential${credentials.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Error */}
        {listError && !loadingList && (
          <div className="flex items-center gap-3 m-5 p-4 rounded-xl bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-[12px] font-medium text-red-700">Failed to load credentials</p>
              <p className="text-[11px] text-red-600 mt-0.5">{listError}</p>
            </div>
            <button onClick={() => setRetryKey((k) => k + 1)}
              className="text-[11px] font-medium text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all">
              Retry
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loadingList && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
            {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* Cards */}
        {!loadingList && !listError && credentials.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
            {credentials.map((cred) => {
              const lvlVariant = variantForLevel(cred.level);
              const senVariant = variantForSeniority(cred.seniority);
              const acad       = cred.academic_mapping;

              return (
                <Link key={cred.id} href={`/contributor/credentials/${cred.id}`}>
                  <div className="group rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">

                    {/* Card Header */}
                    <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
                            <Award className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] font-semibold text-gray-900 truncate">{cred.title}</h3>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {cred.level && <Badge variant={lvlVariant}>{cred.level}</Badge>}
                              {cred.seniority && <Badge variant={senVariant}>{cred.seniority}</Badge>}
                              {cred.designation && <span className="text-[10px] text-gray-400">{cred.designation}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          {cred.platform_verified && <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />}
                          <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-4 py-3.5">
                      {/* Meta row: score · hours · date */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {cred.review_score > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-gold-500" />
                            <span className="text-[11px] font-semibold text-gray-600">{cred.review_score}</span>
                          </div>
                        )}
                        {cred.hours_validated > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-[11px] text-gray-400">{cred.hours_validated}h</span>
                            </div>
                          </>
                        )}
                        {cred.issued_at && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="text-[11px] text-gray-400">{formatDate(cred.issued_at)}</span>
                          </>
                        )}
                        {cred.quality_indicator && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="text-[11px] text-gray-500 font-medium">{cred.quality_indicator}</span>
                          </>
                        )}
                      </div>

                      {/* Task context */}
                      {cred.task_title && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <BookOpen className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-[11px] text-gray-500 truncate">{cred.task_title}</span>
                        </div>
                      )}
                      {cred.project_title && (
                        <div className="text-[10px] text-gray-400 mb-2.5">{cred.project_title}</div>
                      )}

                      {/* Skill tags */}
                      {cred.skill_tags?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-3">
                          <Tag className="w-3 h-3 text-gray-400 shrink-0" />
                          {cred.skill_tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                          {cred.skill_tags.length > 4 && (
                            <span className="text-[10px] text-gray-400">+{cred.skill_tags.length - 4}</span>
                          )}
                        </div>
                      )}

                      {/* PoDL hash */}
                      {cred.pod_hash && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 mb-2.5">
                          <Fingerprint className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-[10px] font-mono text-gray-500 truncate">{cred.pod_hash}</span>
                        </div>
                      )}

                      {/* Academic mapping */}
                      {acad && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-50 mb-2.5">
                          <GraduationCap className="w-3 h-3 text-teal-500 shrink-0" />
                          <span className="text-[10px] text-teal-700 flex-1 truncate">
                            {acad.label || acad.course_code}
                            {acad.credits > 0 && ` · ${acad.credits} credit${acad.credits !== 1 ? "s" : ""}`}
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {cred.verification_url && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard?.writeText(cred.verification_url);
                              toast.success("Link copied", "Verification URL copied to clipboard.");
                            }}
                            className="flex items-center gap-1 text-[10px] font-medium text-gray-500 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                          >
                            <Share2 className="w-3 h-3" /> Share
                          </button>
                        )}
                        {cred.platform_verified && (
                          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-forest-600">
                            <CheckCircle2 className="w-3 h-3" /> Platform Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loadingList && !listError && credentials.length === 0 && (
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
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 mt-3 text-[11px] font-medium text-brown-500 px-3.5 py-1.5 border border-brown-200 rounded-xl hover:bg-brown-50 transition-all">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* ═══ SKILLS VERIFICATION STATUS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-semibold text-gray-800">Skills Verification Status</span>
          </div>
          {!loadingSkills && (
            <span className="font-mono text-[11px] text-gray-400">
              {skillVerifications.length} skill{skillVerifications.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Error */}
        {skillsError && !loadingSkills && (
          <div className="flex items-center gap-3 m-5 p-4 rounded-xl bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-[12px] font-medium text-red-700">Failed to load skill verifications</p>
              <p className="text-[11px] text-red-600 mt-0.5">{skillsError}</p>
            </div>
            <button onClick={() => setRetryKey((k) => k + 1)}
              className="text-[11px] font-medium text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all">
              Retry
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loadingSkills && (
          <div className="divide-y divide-gray-50">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-2.5 bg-gray-200 rounded w-48" />
                </div>
                <div className="h-5 bg-gray-200 rounded-full w-16 shrink-0" />
                <div className="h-5 bg-gray-200 rounded w-8 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Skill rows */}
        {!loadingSkills && !skillsError && skillVerifications.length > 0 && (
          <div className="divide-y divide-gray-50">
            {skillVerifications.map((item) => {
              const statusVariant =
                item.status?.toLowerCase() === "verified" ? "forest"
                : item.status?.toLowerCase() === "pending"  ? "gold"
                : item.status?.toLowerCase() === "rejected" ? "danger"
                : "beige";
              return (
                <div key={item.skill_tag} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-800">{item.skill_tag}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.seniority_level && <span className="text-[10px] text-gray-500 capitalize">{item.seniority_level}</span>}
                      {item.evidence_source && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                          <div className="flex items-center gap-1">
                            <Database className="w-2.5 h-2.5 text-gray-400" />
                            <span className="text-[10px] text-gray-400">{item.evidence_source}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-[18px] font-bold text-gray-800 leading-none">{item.credential_count}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">credentials</div>
                  </div>
                  <Badge variant={statusVariant} dot>{item.status || "Unknown"}</Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty */}
        {!loadingSkills && !skillsError && skillVerifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <ShieldCheck className="w-7 h-7 mx-auto mb-2 text-gray-300" />
            <p className="text-[13px] font-medium text-gray-500 mb-1">No skill verifications yet</p>
            <p className="text-[11px] text-gray-400 max-w-[280px]">Earn credentials to build your verified skill profile.</p>
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
