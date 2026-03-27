"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ExternalLink, FileText, Github, Pencil,
  Trash2, X, Upload, Link2, ShieldCheck, FolderOpen, Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";

/* ═══ Types ═══ */

interface EvidenceItem {
  id: string;
  title: string;
  type: "link" | "file" | "github";
  url?: string;
  fileName?: string;
  fileSize?: number;
  skills: string[];
  date: string;
  description: string;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

/* ═══ Available skills (for multi-select) ═══ */

const allSkills = [
  "React", "TypeScript", "Node.js", "Python", "PostgreSQL",
  "Git", "AWS", "Docker", "GraphQL", "REST API",
  "MongoDB", "Redis", "Kubernetes", "CI/CD", "Flutter",
];

/* ═══ Mock Evidence ═══ */

const initialEvidence: EvidenceItem[] = [
  {
    id: "ev-1",
    title: "Personal Portfolio Website",
    type: "link",
    url: "https://arjunmehta.dev",
    skills: ["React", "TypeScript"],
    date: "2026-01-20",
    description: "Full-stack portfolio showcasing frontend projects",
  },
  {
    id: "ev-2",
    title: "GitHub Profile",
    type: "github",
    url: "https://github.com/arjun-mehta",
    skills: ["React", "Node.js", "Git"],
    date: "2026-01-20",
    description: "Open source contributions and project repositories",
  },
  {
    id: "ev-3",
    title: "AWS Cloud Practitioner Certificate",
    type: "file",
    fileName: "aws-cert.pdf",
    fileSize: 245000,
    skills: ["AWS"],
    date: "2026-02-15",
    description: "AWS Certified Cloud Practitioner certification",
  },
  {
    id: "ev-4",
    title: "Hackathon Project - FinTrack",
    type: "link",
    url: "https://devpost.com/fintrack",
    skills: ["React", "Node.js", "PostgreSQL"],
    date: "2026-03-01",
    description: "1st place winner at IIT Bangalore Hackathon 2026",
  },
];

/* ═══ Empty form state ═══ */

const emptyForm = {
  title: "",
  type: "link" as "link" | "file" | "github",
  url: "",
  fileName: "",
  fileSize: 0,
  description: "",
  skills: [] as string[],
};

/* ═══ PAGE ═══ */

export default function EvidencePage() {
  const [evidence, setEvidence] = React.useState<EvidenceItem[]>(initialEvidence);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [searchQuery, setSearchQuery] = React.useState("");

  /* ─── Derived ─── */
  const linkCount = evidence.filter((e) => e.type === "link").length;
  const fileCount = evidence.filter((e) => e.type === "file").length;
  const filtered = searchQuery.trim()
    ? evidence.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : evidence;

  /* ─── Open Add ─── */
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  /* ─── Open Edit ─── */
  const openEdit = (item: EvidenceItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      type: item.type,
      url: item.url || "",
      fileName: item.fileName || "",
      fileSize: item.fileSize || 0,
      description: item.description,
      skills: [...item.skills],
    });
    setDialogOpen(true);
  };

  /* ─── Toggle skill ─── */
  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  /* ─── Save ─── */
  const handleSave = () => {
    if (!form.title.trim()) return;

    if (editingId) {
      setEvidence((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                title: form.title,
                type: form.type,
                url: form.type !== "file" ? form.url : undefined,
                fileName: form.type === "file" ? form.fileName : undefined,
                fileSize: form.type === "file" ? form.fileSize : undefined,
                description: form.description,
                skills: form.skills,
              }
            : e
        )
      );
    } else {
      const newItem: EvidenceItem = {
        id: `ev-${Date.now()}`,
        title: form.title,
        type: form.type,
        url: form.type !== "file" ? form.url : undefined,
        fileName: form.type === "file" ? form.fileName : undefined,
        fileSize: form.type === "file" ? form.fileSize : undefined,
        skills: form.skills,
        date: new Date().toISOString().split("T")[0],
        description: form.description,
      };
      setEvidence((prev) => [newItem, ...prev]);
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  /* ─── Delete ─── */
  const confirmDelete = () => {
    if (deleteId) {
      setEvidence((prev) => prev.filter((e) => e.id !== deleteId));
      setDeleteId(null);
    }
  };

  /* ─── Simulate file select ─── */
  const handleFileSelect = () => {
    setForm((prev) => ({
      ...prev,
      fileName: "uploaded-document.pdf",
      fileSize: 512000,
    }));
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
            Evidence & Portfolio
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">
            Manage your portfolio links, certificates, and documents
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-[13px] font-medium bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 text-white rounded-xl px-5 py-2.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Evidence
        </button>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Evidence", value: evidence.length, icon: FolderOpen, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
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
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-800">All Evidence</span>
            <Badge variant="beige">{evidence.length}</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-[12px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 pl-9 pr-3.5 py-2 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400 w-52"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-[13px] text-gray-500 font-medium mb-1">No evidence found</p>
            <p className="text-[11px] text-gray-400">
              {searchQuery ? "Try a different search term" : "Add your first evidence item to get started"}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {filtered.map((item, i) => {
              const Icon = typeIcon[item.type] || FileText;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 px-5 py-3.5 group hover:bg-black/[0.02] transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                >
                  <Icon className="w-4 h-4 text-gray-400 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-semibold text-gray-800 truncate">{item.title}</span>
                      <Badge variant={typeBadgeVariant[item.type]}>{item.type}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {item.type === "file" && item.fileName && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[10px] text-gray-400">
                            {item.fileName}
                            {item.fileSize ? ` (${formatFileSize(item.fileSize)})` : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-gray-400 shrink-0 hidden sm:block">
                    {formatDate(item.date)}
                  </span>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brown-600 hover:bg-brown-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ═══ ADD / EDIT DIALOG ═══ */}
      <AnimatePresence>
        {dialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => { setDialogOpen(false); setEditingId(null); }}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Dialog header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <h2 className="text-[16px] font-semibold text-gray-900">
                  {editingId ? "Edit Evidence" : "Add Evidence"}
                </h2>
                <button
                  onClick={() => { setDialogOpen(false); setEditingId(null); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dialog body */}
              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Portfolio Website, AWS Certificate..."
                    className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "link" | "file" | "github" }))}
                    className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all appearance-none"
                  >
                    <option value="link">Link</option>
                    <option value="file">File</option>
                    <option value="github">GitHub</option>
                  </select>
                </div>

                {/* URL (for link/github) */}
                {form.type !== "file" && (
                  <div>
                    <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">URL</label>
                    <input
                      type="url"
                      value={form.url}
                      onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                      placeholder={form.type === "github" ? "https://github.com/username" : "https://example.com"}
                      className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400"
                    />
                  </div>
                )}

                {/* File upload (for file type) */}
                {form.type === "file" && (
                  <div>
                    <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">File</label>
                    {form.fileName ? (
                      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-medium text-gray-700 block truncate">{form.fileName}</span>
                          {form.fileSize > 0 && (
                            <span className="text-[10px] text-gray-400">{formatFileSize(form.fileSize)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setForm((p) => ({ ...p, fileName: "", fileSize: 0 }))}
                          className="text-[11px] text-red-500 hover:text-red-600 font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleFileSelect}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-4 border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl transition-colors"
                      >
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-[12px] text-gray-500 font-medium">Click to upload file</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Brief description of this evidence..."
                    className="w-full text-[13px] text-gray-700 bg-white rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all placeholder:text-gray-400 resize-none"
                  />
                </div>

                {/* Skills multi-select */}
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">
                    Associated Skills
                    {form.skills.length > 0 && (
                      <span className="text-[10px] font-normal text-gray-400 ml-1.5">
                        ({form.skills.length} selected)
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-36 overflow-y-auto">
                    {allSkills.map((skill) => {
                      const selected = form.skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={cn(
                            "text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all",
                            selected
                              ? "bg-brown-100 text-brown-700 ring-1 ring-brown-200"
                              : "bg-white text-gray-500 hover:bg-gray-100 ring-1 ring-gray-200"
                          )}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dialog footer */}
              <div
                className="flex items-center justify-end gap-3 px-6 py-4"
                style={{ borderTop: "1px solid var(--border-soft)" }}
              >
                <button
                  onClick={() => { setDialogOpen(false); setEditingId(null); }}
                  className="border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim()}
                  className={cn(
                    "bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 text-white rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all",
                    !form.title.trim() && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {editingId ? "Save Changes" : "Add Evidence"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ DELETE CONFIRMATION DIALOG ═══ */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-1.5">Delete Evidence</h3>
                <p className="text-[13px] text-gray-500 mb-1">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-gray-700">
                    {evidence.find((e) => e.id === deleteId)?.title}
                  </span>
                  ?
                </p>
                <p className="text-[11px] text-gray-400">
                  This action cannot be undone.
                </p>
              </div>
              <div
                className="flex items-center gap-3 px-6 py-4 justify-end"
                style={{ borderTop: "1px solid var(--border-soft)" }}
              >
                <button
                  onClick={() => setDeleteId(null)}
                  className="border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
