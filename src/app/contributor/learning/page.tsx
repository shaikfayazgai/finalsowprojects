"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Clock, TrendingUp, Zap, BookOpen, Target,
  ChevronRight, ArrowRight, Sparkles, ExternalLink, X,
  RefreshCw, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  fetchLearningRecommendations,
  dismissLearningRecommendation,
  markLearningRecommendationOpened,
  type LearningRecommendation,
  type LearningRecommendationsParams,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/stores/toast-store";

/* ═══ Badge ═══ */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-500" },
  gold:   { bg: "bg-gold-50",   text: "text-gold-700",   dot: "bg-gold-500" },
  brown:  { bg: "bg-brown-50",  text: "text-brown-700",  dot: "bg-brown-500" },
  beige:  { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400" },
  danger: { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500" },
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

/* ═══ Skeleton ═══ */

function CardSkeleton() {
  return (
    <div className="card-parchment px-5 py-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-8 w-full bg-gray-100 rounded-xl" />
          <div className="flex gap-2">
            <div className="h-7 w-28 bg-gray-200 rounded-lg" />
            <div className="h-7 w-24 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="card-parchment flex items-center gap-5 px-5 py-5 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
      <div className="space-y-2">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-7 w-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

/* ═══ Config helpers ═══ */

const priorityConfig: Record<string, { variant: string; label: string }> = {
  high:   { variant: "brown", label: "High Priority" },
  medium: { variant: "gold",  label: "Medium" },
  low:    { variant: "beige", label: "Low" },
};

const typeConfig: Record<string, { icon: React.ElementType; iconBg: string; label: string }> = {
  task_based:  { icon: Target,   iconBg: "bg-gradient-to-br from-teal-400 to-teal-600",   label: "Task-based" },
  skill_based: { icon: Sparkles, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600",   label: "Skill-based" },
  pathway:     { icon: BookOpen, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600", label: "Pathway" },
};

/* ═══ Filter bar ═══ */

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "task_based",  label: "Task-based" },
  { value: "skill_based", label: "Skill-based" },
];
const PRIORITY_OPTIONS = [
  { value: "",       label: "All Priorities" },
  { value: "high",   label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low",    label: "Low" },
];

/* ═══ PAGE ═══ */

export default function LearningPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [recommendations, setRecommendations] = React.useState<LearningRecommendation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]   = React.useState<string | null>(null);
  const [dismissing, setDismissing] = React.useState<Set<string>>(new Set());
  const [opening, setOpening]       = React.useState<Set<string>>(new Set());

  /* Keep a ref so callbacks always have the latest token without re-creating them */
  const tokenRef = React.useRef<string>("");
  if (session?.user?.accessToken) tokenRef.current = session.user.accessToken as string;

  /* filters */
  const [filterType,     setFilterType]     = React.useState("");
  const [filterPriority, setFilterPriority] = React.useState("");
  const [filterSkill,    setFilterSkill]    = React.useState("");

  /* ── Fetch ── */
  const load = React.useCallback(async (token: string, params: LearningRecommendationsParams = {}) => {
    setLoading(true);
    setError(null);
    const sk = sessionKeyFragment(token);
    const pk = JSON.stringify(params);
    try {
      const data = await dedupeAsync(`contrib:learning:${sk}:${pk}`, () =>
        fetchLearningRecommendations(token, params),
      );
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load recommendations";
      setError(msg);
      toast.error("Error", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.accessToken) {
      load(session.user.accessToken as string);
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
      setError("Not authenticated. Please log in.");
    }
    // while sessionStatus === "loading", keep the skeleton showing
  }, [sessionStatus, session, load]);

  /* ── Apply filters ── */
  const applyFilters = () => {
    const token = tokenRef.current;
    if (!token) return;
    const params: LearningRecommendationsParams = {};
    if (filterType)         params.type     = filterType as LearningRecommendationsParams["type"];
    if (filterPriority)     params.priority = filterPriority;
    if (filterSkill.trim()) params.skill    = filterSkill.trim();
    load(token, params);
  };

  const clearFilters = () => {
    const token = tokenRef.current;
    setFilterType("");
    setFilterPriority("");
    setFilterSkill("");
    if (token) load(token);
  };

  /* ── Dismiss ── */
  const handleDismiss = async (id: string) => {
    const token = tokenRef.current;
    if (!token || dismissing.has(id)) return;
    setDismissing((prev) => new Set(prev).add(id));
    try {
      await dismissLearningRecommendation(token, id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      toast.success("Dismissed", "Recommendation removed from your list.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not dismiss recommendation";
      toast.error("Error", msg);
    } finally {
      setDismissing((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  /* ── Mark opened & open link ── */
  const handleOpen = async (rec: LearningRecommendation) => {
    const token = tokenRef.current;
    if (!token || opening.has(rec.id)) return;
    setOpening((prev) => new Set(prev).add(rec.id));
    try {
      await markLearningRecommendationOpened(token, rec.id);
    } catch {
      /* non-critical — still open the link */
    } finally {
      setOpening((prev) => { const s = new Set(prev); s.delete(rec.id); return s; });
    }
    if (rec.resource_url) window.open(rec.resource_url, "_blank", "noopener,noreferrer");
  };

  /* ── Derived ── */
  const taskBased  = recommendations.filter((r) => r.type === "task_based");
  const skillBased = recommendations.filter((r) => r.type === "skill_based");
  const totalHours = recommendations.reduce((s, r) => s + (r.estimated_hours ?? 0), 0);

  const hasActiveFilter = !!(filterType || filterPriority || filterSkill.trim());

  /* ─────────────────────────────────── RENDER ───────────────────────────────── */
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Learning</h1>
        <p className="text-[13px] text-gray-400 mt-1">AI-powered recommendations to grow your skills and unlock higher-value tasks</p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          [
            { label: "Recommendations", value: recommendations.length,  icon: Sparkles, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
            { label: "Task-based",      value: taskBased.length,         icon: Target,   iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
            { label: "Skill-based",     value: skillBased.length,        icon: Zap,      iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
            { label: "Total Hours",     value: `${totalHours}h`,         icon: Clock,    iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
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
          })
        )}
      </motion.div>

      {/* ═══ EMPTY STATE ═══ */}
      {recommendations.length === 0 && (
        <motion.div variants={fadeUp} className="card-parchment px-6 py-16 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[14px] font-medium text-gray-500 mb-1">No recommendations yet</p>
          <p className="text-[12px] text-gray-400 max-w-[360px] mx-auto">Complete tasks and add skills to your profile to receive personalised AI learning suggestions.</p>
        </motion.div>
      )}

      {/* ═══ TASK-BASED RECOMMENDATIONS ═══ */}
      {taskBased.length > 0 && (
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Recommended for Your Tasks</h2>
            <span className="text-[11px] text-gray-400">{taskBased.length} recommendations</span>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Priority</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Skill search */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Skill</span>
            <input
              type="text"
              placeholder="e.g. React"
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>

          <button
            onClick={applyFilters}
            disabled={loading}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Apply
          </button>

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ ERROR STATE ═══ */}
      {error && !loading && (
        <motion.div variants={fadeUp} className="card-parchment px-6 py-6 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-red-600 mb-1">Failed to load recommendations</p>
            <p className="text-[11px] text-gray-400 mb-3">{error}</p>
            <button
              onClick={() => { if (tokenRef.current) load(tokenRef.current); }}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-4 py-2 rounded-lg transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ LOADING SKELETONS ═══ */}
      {loading && (
        <motion.div variants={fadeUp} className="space-y-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </motion.div>
      )}

      {/* ═══ EMPTY STATE ═══ */}
      {!loading && !error && recommendations.length === 0 && (
        <motion.div variants={fadeUp} className="card-parchment px-6 py-16 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[14px] font-medium text-gray-500 mb-1">No recommendations yet</p>
          <p className="text-[12px] text-gray-400 max-w-[360px] mx-auto">
            Complete tasks and add skills to your profile to receive personalised AI learning suggestions.
          </p>
        </motion.div>
      )}

      {/* ═══ TASK-BASED RECOMMENDATIONS ═══ */}
      <AnimatePresence>
        {!loading && taskBased.length > 0 && (
          <motion.div variants={fadeUp} className="mb-6" initial="hidden" animate="show" exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Recommended for Your Tasks</h2>
              <span className="text-[11px] text-gray-400">{taskBased.length} recommendation{taskBased.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-3">
              {taskBased.map((rec) => {
                const typeInfo   = typeConfig[rec.type] || typeConfig.task_based;
                const priorityInfo = priorityConfig[rec.priority] || priorityConfig.medium;
                const TypeIcon   = typeInfo.icon;
                const isDismissing = dismissing.has(rec.id);
                const isOpening    = opening.has(rec.id);

                return (
                  <motion.div
                    key={rec.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                    className="card-parchment overflow-hidden"
                  >
                    <div className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeInfo.iconBg)}>
                          <TypeIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[14px] font-semibold text-gray-800">{rec.title}</span>
                              <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
                              <Badge variant="teal">{typeInfo.label}</Badge>
                            </div>
                            <button
                              onClick={() => handleDismiss(rec.id)}
                              disabled={isDismissing}
                              title="Dismiss recommendation"
                              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-40"
                            >
                              {isDismissing
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <X className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
                            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{rec.skill}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rec.estimated_hours}h</span>
                            {rec.recommended_at && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>{new Date(rec.recommended_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-teal-50 mb-3">
                            <Sparkles className="w-3 h-3 text-teal-500 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-teal-700 leading-relaxed">{rec.reason}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {rec.related_task_id && (
                              <Link href={`/contributor/tasks/${rec.related_task_id}`}>
                                <button className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-4 py-2 rounded-lg transition-all">
                                  View Related Task <ArrowRight className="w-3 h-3" />
                                </button>
                              </Link>
                            )}
                            {rec.resource_url && (
                              <button
                                onClick={() => handleOpen(rec)}
                                disabled={isOpening}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-60"
                              >
                                {isOpening
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <ExternalLink className="w-3 h-3" />}
                                Open Module
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SKILL-BASED RECOMMENDATIONS ═══ */}
      <AnimatePresence>
        {!loading && skillBased.length > 0 && (
          <motion.div variants={fadeUp} className="mb-8" initial="hidden" animate="show" exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Recommended Skills</h2>
              <span className="text-[11px] text-gray-400">{skillBased.length} suggestion{skillBased.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-3">
              {skillBased.map((rec) => {
                const priorityInfo = priorityConfig[rec.priority] || priorityConfig.medium;
                const isDismissing = dismissing.has(rec.id);
                const isOpening    = opening.has(rec.id);

                return (
                  <motion.div
                    key={rec.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                    className="card-parchment overflow-hidden"
                  >
                    <div className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[14px] font-semibold text-gray-800">{rec.title}</span>
                              <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
                              <Badge variant="gold">Skill-based</Badge>
                            </div>
                            <button
                              onClick={() => handleDismiss(rec.id)}
                              disabled={isDismissing}
                              title="Dismiss recommendation"
                              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-40"
                            >
                              {isDismissing
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <X className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
                            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{rec.skill}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rec.estimated_hours}h</span>
                            {rec.recommended_at && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>{new Date(rec.recommended_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-gold-50 mb-3">
                            <TrendingUp className="w-3 h-3 text-gold-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-gold-700 leading-relaxed">{rec.reason}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href="/contributor/profile">
                              <button className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
                                View Skills <ChevronRight className="w-3 h-3" />
                              </button>
                            </Link>
                            {rec.resource_url && (
                              <button
                                onClick={() => handleOpen(rec)}
                                disabled={isOpening}
                                className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-4 py-2 rounded-lg transition-all disabled:opacity-60"
                              >
                                {isOpening
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <ExternalLink className="w-3 h-3" />}
                                Start Module
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
