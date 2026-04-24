"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  ExternalLink, FileText, Github, FolderOpen, Search,
  Link2, ShieldCheck, RefreshCw, AlertCircle,
  Plus, X, Pencil, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { toast } from "@/lib/stores/toast-store";
import {
  createContributorProfileEvidence,
  updateContributorProfileEvidence,
  deleteContributorProfileEvidence,
  fetchContributorProfileEvidence,
  type ProfileEvidenceItemApi,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";

/* ═══ Display row (mapped from API) ═══ */

interface EvidenceRow {
  id: string;
  title: string;
  type: "link" | "file" | "github";
  url?: string;
  fileId?: string;
  description: string;
  /** Tags: skill name, optionally with proficiency (display) */
  skillTags: string[];
  /** Raw skills for edit form */
  skills: Array<{ name: string; proficiency: string }>;
}

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

const proficiencyLevels = ["beginner", "intermediate", "advanced", "expert"];

function normalizeProf(p: string) {
  const v = p.toLowerCase();
  if (proficiencyLevels.includes(v)) return v;
  return "intermediate";
}

function mapApiItemToRow(item: ProfileEvidenceItemApi): EvidenceRow {
  const t = (item.type || "link").toLowerCase();
  let type: EvidenceRow["type"] = "link";
  if (t === "github") type = "github";
  else if (t === "file" || t === "document" || t === "upload") type = "file";
  const skills = (item.skills ?? []).map((s) => ({
    name: s.name,
    proficiency: normalizeProf(s.proficiency ?? "intermediate"),
  }));
  const skillTags = skills.map((s) => {
    const p = s.proficiency?.trim();
    return p ? `${s.name} · ${p}` : s.name;
  });
  return {
    id: item.id,
    title: item.title,
    type,
    url: item.url,
    fileId: item.file_id,
    description: item.description ?? "",
    skillTags,
    skills,
  };
}

const typeIcon: Record<string, React.ElementType> = {
  link: ExternalLink,
  file: FileText,
  github: Github,
};

const typeBadgeVariant: Record<string, string> = {
  link: "teal",
  file: "brown",
  github: "beige",
};

const allSkills = [
  "React", "TypeScript", "Node.js", "Python", "PostgreSQL",
  "Git", "AWS", "Docker", "GraphQL", "REST API",
  "MongoDB", "Redis", "Kubernetes", "CI/CD", "Flutter",
];

const initialEvidence: EvidenceItem[] = [];

/* ═══ Empty form state ═══ */

const emptyForm = {
  title: "",
  type: "link" as "link" | "file" | "github",
  url: "",
  fileId: "",
  description: "",
  skillNames: [] as string[],
  skillProfs: {} as Record<string, string>,
};

function rowToForm(row: EvidenceRow) {
  return {
    title: row.title,
    type: row.type,
    url: row.url ?? "",
    fileId: row.fileId ?? "",
    description: row.description,
    skillNames: row.skills.map((s) => s.name),
    skillProfs: Object.fromEntries(row.skills.map((s) => [s.name, s.proficiency])) as Record<string, string>,
  };
}

/* ═══ PAGE ═══ */

export default function EvidencePage() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.user?.accessToken;
  const contributorId = session?.user?.id ?? "";

  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [skillFilter, setSkillFilter] = React.useState("");

  const [rows, setRows] = React.useState<EvidenceRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retryKey, setRetryKey] = React.useState(0);

  const [evidenceFormOpen, setEvidenceFormOpen] = React.useState(false);
  const [editingEvidenceId, setEditingEvidenceId] = React.useState<string | null>(null);
  const [evidenceForm, setEvidenceForm] = React.useState(emptyEvidenceForm);
  const [formSubmitting, setFormSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const pickableSkills = React.useMemo(() => {
    const extra = evidenceForm.skillNames.filter((n) => !allSkills.includes(n));
    return [...allSkills, ...extra];
  }, [evidenceForm.skillNames]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token || !contributorId) {
      setLoading(false);
      setError("Please sign in to view evidence.");
      setRows([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    const sk = sessionKeyFragment(token);
    const qKey = [debouncedQ, typeFilter, skillFilter, retryKey].join("|");
    let live = true;
    void dedupeAsync(`contrib:profile-evidence:${contributorId}:${sk}:${qKey}`, () =>
      fetchContributorProfileEvidence(token, contributorId, {
        q: debouncedQ || undefined,
        type: typeFilter || undefined,
        skill: skillFilter || undefined,
      }),
    )
      .then((res) => {
        if (!live) return;
        setTotal(res.total ?? 0);
        setRows((res.items ?? []).map(mapApiItemToRow));
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!live) return;
        setError(err.message ?? "Failed to load evidence");
        setRows([]);
        setTotal(0);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, contributorId, sessionStatus, debouncedQ, typeFilter, skillFilter, retryKey]);

  const linkCount = rows.filter((e) => e.type === "link").length;
  const fileCount = rows.filter((e) => e.type === "file").length;

  function openAdd() {
    setEditingEvidenceId(null);
    setEvidenceForm(emptyEvidenceForm);
    setFormError(null);
    setEvidenceFormOpen(true);
  }

  function openEdit(row: EvidenceRow) {
    setEditingEvidenceId(row.id);
    setEvidenceForm(rowToForm(row));
    setFormError(null);
    setEvidenceFormOpen(true);
  }

  function toggleFormSkill(name: string) {
    setEvidenceForm((prev) => {
      const has = prev.skillNames.includes(name);
      const skillNames = has
        ? prev.skillNames.filter((n) => n !== name)
        : [...prev.skillNames, name];
      const skillProfs = { ...prev.skillProfs };
      if (!has) skillProfs[name] = "intermediate";
      else delete skillProfs[name];
      return { ...prev, skillNames, skillProfs };
    });
  }

  function setSkillProf(name: string, prof: string) {
    setEvidenceForm((p) => ({
      ...p,
      skillProfs: { ...p.skillProfs, [name]: prof },
    }));
  }

  const formScrollRef = React.useRef<HTMLDivElement | null>(null);
  const titleInputRef = React.useRef<HTMLInputElement | null>(null);

  function validateEvidenceForm(): string | null {
    const t = evidenceForm.title.trim();
    if (!t) return "Title is required.";
    if (evidenceForm.type === "file" && !evidenceForm.fileId.trim()) {
      return "File ID is required for file evidence (from your upload flow).";
    }
    if (evidenceForm.type !== "file" && !evidenceForm.url.trim()) {
      return "URL is required for this evidence type.";
    }
    return null;
  }

  function focusErrorArea(message: string) {
    requestAnimationFrame(() => {
      if (message.includes("Title")) {
        formScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        titleInputRef.current?.focus();
        return;
      }
      if (message.includes("URL")) {
        document.getElementById("evidence-url-input")?.scrollIntoView({ block: "center", behavior: "smooth" });
        (document.getElementById("evidence-url-input") as HTMLInputElement | null)?.focus();
        return;
      }
      if (message.includes("File ID")) {
        document.getElementById("evidence-file-id-input")?.scrollIntoView({ block: "center", behavior: "smooth" });
        (document.getElementById("evidence-file-id-input") as HTMLInputElement | null)?.focus();
        return;
      }
      formScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function handleSubmitEvidenceForm() {
    if (formSubmitting) return;
    if (!token || !contributorId) {
      const msg = "Not signed in or missing contributor ID. Please sign in again.";
      setFormError(msg);
      toast.error("Cannot save", msg);
      return;
    }
    const err = validateEvidenceForm();
    if (err) {
      setFormError(err);
      toast.warning("Check the form", err);
      focusErrorArea(err);
      return;
    }
    setFormError(null);
    setFormSubmitting(true);
    const t = evidenceForm.title.trim();
    const skills = evidenceForm.skillNames.map((name) => ({
      name,
      proficiency: normalizeProf(evidenceForm.skillProfs[name] ?? "intermediate"),
    }));
    const payload = {
      title: t,
      type: evidenceForm.type,
      url: evidenceForm.url.trim(),
      file_id: evidenceForm.type === "file" ? evidenceForm.fileId.trim() : "",
      description: evidenceForm.description.trim(),
      skills,
    };
    try {
      if (editingEvidenceId) {
        await updateContributorProfileEvidence(token, contributorId, editingEvidenceId, payload);
        toast.success("Evidence updated", "Your changes were saved.");
      } else {
        await createContributorProfileEvidence(token, contributorId, payload);
        toast.success("Evidence added", "Your portfolio evidence was created.");
      }
      setEvidenceFormOpen(false);
      setEditingEvidenceId(null);
      setEvidenceForm(emptyEvidenceForm);
      setRetryKey((k) => k + 1);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Request failed";
      setFormError(message);
      toast.error(editingEvidenceId ? "Could not update evidence" : "Could not add evidence", message);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!token || !contributorId || !deleteConfirmId || deleting) return;
    setDeleting(true);
    try {
      await deleteContributorProfileEvidence(token, contributorId, deleteConfirmId);
      toast.success("Evidence removed", "The item was deleted.");
      setDeleteConfirmId(null);
      setRetryKey((k) => k + 1);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Delete failed";
      toast.error("Could not delete evidence", message);
    } finally {
      setDeleting(false);
    }
  }

  if (sessionStatus === "loading" || (Boolean(token) && Boolean(contributorId) && loading)) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <div className="h-7 w-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-parchment h-24 bg-[#faf8f5] animate-pulse" />
          ))}
        </div>
        <div className="card-parchment h-48 bg-[#faf8f5] animate-pulse" />
      </motion.div>
    );
  }

  if (!token || !contributorId) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="card-parchment px-6 py-10">
        <p className="text-[13px] text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error || "Sign in to manage evidence."}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {error && (
        <motion.div variants={fadeUp} className="mb-4 card-parchment px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-[13px] text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <Link href="/contributor/profile" className="text-[12px] text-brown-600 hover:underline">Back to profile</Link>
          </div>
        </motion.div>
      )}

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
            Evidence & Portfolio
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">
            Portfolio links, certificates, and files linked to your profile
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 text-[13px] font-medium bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 text-white rounded-xl px-5 py-2.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Evidence
          </button>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            href="/contributor/profile"
            className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Profile
          </Link>
        </div>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Evidence", value: total, icon: FolderOpen, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Links", value: linkCount, icon: Link2, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "Documents", value: fileCount, icon: FileText, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
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

      {/* ═══ PRIVACY NOTE ═══ */}
      <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-6 px-4 py-3 bg-brown-50/50 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-brown-400 shrink-0" />
        <span className="text-[12px] text-brown-600">
          Evidence is only visible to authorized platform reviewers
        </span>
      </motion.div>

      {/* ═══ EVIDENCE LIST ═══ */}
      <motion.div variants={fadeUp} className="card-parchment">
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-soft)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-800">All Evidence</span>
            <Badge variant="beige">{rows.length}{typeof total === "number" && total !== rows.length ? ` (total ${total})` : ""}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search title or description (q)…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="text-[12px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 pl-9 pr-3.5 py-2 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400 w-52"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-[12px] text-gray-600 bg-white rounded-xl border border-gray-200 px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-brown-100"
            >
              <option value="">All types</option>
              <option value="link">link</option>
              <option value="file">file</option>
              <option value="github">github</option>
            </select>
            <input
              type="text"
              placeholder="Filter by skill"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="text-[12px] text-gray-600 bg-white rounded-xl border border-gray-200 px-2.5 py-1.5 w-32 outline-none focus:ring-2 focus:ring-brown-100"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-[13px] text-gray-500 font-medium mb-1">No evidence found</p>
            <p className="text-[11px] text-gray-400">
              {error
                ? "Fix the error above, then refresh or retry"
                : debouncedQ || typeFilter || skillFilter
                  ? "Try different search or filters"
                  : "No items returned from your account yet"}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {rows.map((item, i) => {
              const Icon = typeIcon[item.type] || FileText;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3.5 px-5 py-3.5 group hover:bg-black/[0.02] transition-colors"
                  style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                >
                  <Icon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[13px] font-semibold text-gray-800">{item.title}</span>
                      <Badge variant={typeBadgeVariant[item.type]}>{item.type}</Badge>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-gray-500 line-clamp-2 mb-1.5">{item.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.skillTags.map((tag, ti) => (
                        <span
                          key={`${item.id}-t-${ti}-${tag.slice(0, 24)}`}
                          className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.type === "file" && item.fileId && (
                        <>
                          {item.skillTags.length > 0 && <span className="w-1 h-1 rounded-full bg-gray-300" />}
                          <span className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
                            {item.fileId}
                          </span>
                        </>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brown-500 hover:underline inline-flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brown-600 hover:bg-brown-50"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ═══ ADD / EDIT EVIDENCE (POST / PATCH) ═══ */}
      <AnimatePresence>
        {evidenceFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => !formSubmitting && setEvidenceFormOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <h2 className="text-[16px] font-semibold text-gray-900">
                  {editingEvidenceId ? "Edit Evidence" : "Add Evidence"}
                </h2>
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setEvidenceFormOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div ref={formScrollRef} className="px-6 py-5 space-y-4 overflow-y-auto flex-1 min-h-0">
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Title</label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={evidenceForm.title}
                    onChange={(e) => setEvidenceForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100"
                    placeholder="e.g. Portfolio site, certificate name…"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Type</label>
                  <select
                    value={evidenceForm.type}
                    onChange={(e) => setEvidenceForm((p) => ({ ...p, type: e.target.value as typeof p.type }))}
                    className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100"
                  >
                    <option value="link">link</option>
                    <option value="file">file</option>
                    <option value="github">github</option>
                  </select>
                </div>
                {evidenceForm.type !== "file" && (
                  <div>
                    <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">URL</label>
                    <input
                      id="evidence-url-input"
                      type="text"
                      inputMode="url"
                      value={evidenceForm.url}
                      onChange={(e) => setEvidenceForm((p) => ({ ...p, url: e.target.value }))}
                      className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100"
                      placeholder="https://…"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Use a full URL including https://</p>
                  </div>
                )}
                {evidenceForm.type === "file" && (
                  <div>
                    <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">File ID</label>
                    <input
                      id="evidence-file-id-input"
                      type="text"
                      value={evidenceForm.fileId}
                      onChange={(e) => setEvidenceForm((p) => ({ ...p, fileId: e.target.value }))}
                      className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 font-mono text-[12px]"
                      placeholder="ID returned after file upload (if any)"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Optional public URL for the file, if your API accepts it</p>
                    <input
                      type="text"
                      inputMode="url"
                      value={evidenceForm.url}
                      onChange={(e) => setEvidenceForm((p) => ({ ...p, url: e.target.value }))}
                      className="w-full text-[12px] text-gray-600 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 mt-2 outline-none"
                      placeholder="Optional download URL (stored in url field)"
                    />
                  </div>
                )}
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Description</label>
                  <textarea
                    value={evidenceForm.description}
                    onChange={(e) => setEvidenceForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 resize-none"
                    placeholder="What reviewers should know…"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Associated skills</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-32 overflow-y-auto">
                    {pickableSkills.map((skill) => {
                      const selected = evidenceForm.skillNames.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleFormSkill(skill)}
                          className={cn(
                            "text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all",
                            selected
                              ? "bg-brown-100 text-brown-700 ring-1 ring-brown-200"
                              : "bg-white text-gray-500 hover:bg-gray-100 ring-1 ring-gray-200",
                          )}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {evidenceForm.skillNames.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {evidenceForm.skillNames.map((name) => (
                      <div key={name} className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="text-gray-700 font-medium">{name}</span>
                        <select
                          value={evidenceForm.skillProfs[name] ?? "intermediate"}
                          onChange={(e) => setSkillProf(name, e.target.value)}
                          className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white"
                        >
                          {proficiencyLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0" style={{ borderTop: "1px solid var(--border-soft)" }}>
                {formError && (
                  <div className="px-6 pt-3 pb-0" id="evidence-form-error" role="alert">
                    <p className="text-[12px] text-red-800 bg-red-50 rounded-xl px-3 py-2.5 border border-red-200">
                      {formError}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-end gap-3 px-6 py-4">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setEvidenceFormOpen(false)}
                  className="border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-5 py-2.5 text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => void handleSubmitEvidenceForm()}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all",
                    formSubmitting
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700",
                  )}
                >
                  {formSubmitting ? "Saving…" : editingEvidenceId ? "Save changes" : "Create evidence"}
                </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => !deleting && setDeleteConfirmId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-[16px] font-semibold text-gray-900 mb-2">Delete evidence?</h3>
              <p className="text-[13px] text-gray-500 mb-6">
                This removes the item from your portfolio. You can add it again later if needed.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteConfirmId(null)}
                  className="border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2 text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 text-[13px] font-medium disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
