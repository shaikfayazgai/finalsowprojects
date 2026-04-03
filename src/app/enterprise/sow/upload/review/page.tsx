"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, CheckCircle2, FilePen, Undo2, X, Ban,
  Check, Clock, AlertCircle, FileText, Layers, ChevronDown, ChevronUp,
  Target, Users, LayoutGrid, CalendarClock, Wallet, ShieldCheck,
  ListChecks, Code2, AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { DocumentViewer } from "@/components/enterprise/sow/DocumentViewer";
import { mockExtractionItems } from "@/mocks/data/sow-upload-flow";
import { mockSOWSections } from "@/mocks/data/enterprise-sow";
import { useSOWUploadStore, getFileObjectUrl } from "@/lib/stores/sow-upload-store";
import type { ExtractionItem, ExtractionCategory, ExtractionReviewState } from "@/types/enterprise";

/* ═══════════════════════════════════════════════════
   Category definitions
   ═══════════════════════════════════════════════════ */
const CATEGORIES: {
  key: ExtractionCategory;
  label: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  description: (count: number) => string;
}[] = [
  { key: "business_objectives", label: "Business Objectives",       Icon: Target,        color: "text-violet-600",  bg: "bg-violet-50  border-violet-200", description: (n) => `${n} objective${n !== 1 ? "s" : ""} found — measurable targets ${n > 1 ? "identified" : "missing"}` },
  { key: "features",            label: "Feature / Module List",     Icon: LayoutGrid,    color: "text-teal-600",    bg: "bg-teal-50    border-teal-200",   description: (n) => `${n} deliverable${n !== 1 ? "s" : ""} extracted` },
  { key: "technical",           label: "Technical Requirements",    Icon: Code2,         color: "text-orange-600",  bg: "bg-orange-50  border-orange-200", description: (n) => `Tech stack ${n > 1 ? "partially" : "fully"} specified` },
  { key: "budget",              label: "Budget & Commercial Terms", Icon: Wallet,        color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200",description: () => `Budget figure extracted — verify accuracy` },
  { key: "timeline",            label: "Timeline & Milestones",    Icon: CalendarClock, color: "text-indigo-600",  bg: "bg-indigo-50  border-indigo-200", description: (n) => `${n} milestone date${n !== 1 ? "s" : ""} found` },
  { key: "risk",                label: "Risk Factors",              Icon: AlertTriangle, color: "text-red-600",     bg: "bg-red-50     border-red-200",    description: (n) => `${n} risk statement${n !== 1 ? "s" : ""} identified` },
  { key: "compliance",          label: "Compliance Requirements",   Icon: ShieldCheck,   color: "text-blue-600",    bg: "bg-blue-50    border-blue-200",   description: () => `GDPR, PDPB references tagged` },
  { key: "user_context",        label: "User Context",              Icon: Users,         color: "text-sky-600",     bg: "bg-sky-50     border-sky-200",    description: () => `Role names found — characteristics missing` },
  { key: "assumptions",         label: "Assumptions & Constraints", Icon: ListChecks,    color: "text-amber-600",   bg: "bg-amber-50   border-amber-200",  description: (n) => `${n} assumption${n !== 1 ? "s" : ""} identified` },
];

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */
export default function ParsedSOWReviewPage() {
  const router = useRouter();
  const store = useSOWUploadStore();

  /* ── State ── */
  const [items, setItems] = React.useState<ExtractionItem[]>(() =>
    store.extractionItems.length > 0 ? store.extractionItems : mockExtractionItems
  );
  const [highlightText, setHighlightText] = React.useState<string | undefined>();
  const [highlightPage, setHighlightPage] = React.useState<number | undefined>();
  const [expandedCat, setExpandedCat] = React.useState<ExtractionCategory | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [showAcceptAllModal, setShowAcceptAllModal] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const sections = mockSOWSections.filter((s) => s.sowId === "sow-003");

  /* Uploaded file URL (for rendering actual PDF/DOCX in viewer) */
  const fileUrl = getFileObjectUrl() ?? undefined;
  const fileType = store.uploadedFile?.type;

  /* ── Auto-save every 30 s ── */
  React.useEffect(() => {
    const id = setInterval(() => { store.setExtractionItems(items); setLastSaved(new Date()); }, 30_000);
    return () => clearInterval(id);
  }, [items, store]);

  const [, tick] = React.useState(0);
  React.useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 10_000); return () => clearInterval(id); }, []);

  const savedLabel = React.useMemo(() => {
    if (!lastSaved) return null;
    const s = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (s < 10) return "just now";
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSaved, tick]);

  /* ── Derived ── */
  const pending = items.filter((i) => i.reviewState === "pending").length;
  const catItems = (key: ExtractionCategory) => items.filter((i) => i.category === key);
  const catPending = (key: ExtractionCategory) => catItems(key).filter((i) => i.reviewState === "pending").length;
  const catDone = (key: ExtractionCategory) => catPending(key) === 0;

  /* ── Actions ── */
  const updateItem = (id: string, state: ExtractionReviewState, editedText?: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, reviewState: state, ...(editedText !== undefined ? { editedText } : {}) } : i)));

  const acceptCategory = (key: ExtractionCategory) =>
    setItems((prev) => prev.map((i) => (i.category === key && i.reviewState === "pending" ? { ...i, reviewState: "accepted" } : i)));

  const startEdit = (item: ExtractionItem) => { setEditingId(item.id); setEditDraft(item.editedText ?? item.text); };
  const saveEdit = (id: string) => { updateItem(id, "edited", editDraft.trim() || undefined); setEditingId(null); };

  const acceptAllPending = () => { setItems((prev) => prev.map((i) => (i.reviewState === "pending" ? { ...i, reviewState: "accepted" } : i))); setShowAcceptAllModal(false); };

  const showSource = (item: ExtractionItem) => { setHighlightText(item.sourceHighlight); setHighlightPage(item.sourcePageNumber); };

  const handleContinue = () => {
    const ok = items.some((i) => i.category === "features" && (i.reviewState === "accepted" || i.reviewState === "edited"));
    if (!ok) { setValidationError("At least one Feature / Module deliverable must be accepted before continuing."); return; }
    setValidationError(null);
    store.setExtractionItems(items);
    store.setFlowStep(4);
    router.push("/enterprise/sow/upload/gaps");
  };

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col h-full min-h-0">
      {/* Step indicator */}
      <motion.div variants={fadeUp} className="mb-5">
        <FlowStepProgress currentStep={3} />
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-6 mb-4">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold text-gray-900 tracking-tight">Parsed SOW Review</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[13px] text-gray-400">Verify each AI extraction against the original document.</p>
            {savedLabel && (
              <span className="flex items-center gap-1 text-[10px] text-gray-300 whitespace-nowrap">
                <Clock className="w-3 h-3" /> Saved {savedLabel}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Validation error */}
      <AnimatePresence>
        {validationError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-[12px] font-medium text-red-700 flex-1">{validationError}</span>
              <button onClick={() => setValidationError(null)} className="p-0.5 rounded hover:bg-red-100 transition-colors">
                <X className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════
         MAIN SPLIT — Extracted Items (left) | Gap + Doc Viewer (right)
         ═════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="flex-1 min-h-0 grid grid-cols-[380px_1fr] gap-5">

        {/* ─── LEFT PANEL: Document Viewer ─── */}
        <div className="flex flex-col min-h-0 rounded-2xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brown-400" />
              <span className="text-[13px] font-semibold text-gray-800">Document Viewer</span>
            </div>
            {store.uploadedFile && (
              <span className="text-[10px] text-gray-400 truncate max-w-[140px]">{store.uploadedFile.name}</span>
            )}
          </div>

          {(fileUrl || highlightText) ? (
            <div className="flex-1 min-h-0">
              <DocumentViewer
                fileUrl={fileUrl}
                fileType={fileType}
                sections={sections}
                highlightText={highlightText}
                highlightPage={highlightPage}
                className="rounded-none border-0 h-full"
              />
            </div>
          ) : (
            /* ── Placeholder content ── */
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Instruction banner */}
              <div className="flex items-start gap-2.5 rounded-xl bg-brown-50 border border-brown-100 px-4 py-3">
                <FileText className="w-3.5 h-3.5 text-brown-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-brown-700 leading-relaxed">
                  Click any extraction on the right to highlight its source location in the document.
                </p>
              </div>

              {/* Mock document pages */}
              {[
                {
                  page: 1,
                  heading: "Project Overview",
                  lines: [
                    "MedFirst Health Systems requires a HIPAA-compliant",
                    "patient portal enabling 2.4 million active patients to",
                    "manage appointments, view medical records, communicate",
                    "with providers, and process payments.",
                  ],
                  highlight: true,
                },
                {
                  page: 2,
                  heading: "Scope & Deliverables",
                  lines: [
                    "Patient registration with KYC verification, appointment",
                    "scheduling module, secure provider messaging, medical",
                    "records viewer, prescription refill requests, billing and",
                    "payment processing via Stripe integration.",
                  ],
                  highlight: false,
                },
                {
                  page: 3,
                  heading: "Technical Architecture",
                  lines: [
                    "React frontend, Node.js / NestJS backend, PostgreSQL",
                    "database with Redis caching layer. AWS infrastructure",
                    "using EKS Kubernetes. CI/CD via GitHub Actions.",
                  ],
                  highlight: false,
                },
                {
                  page: 4,
                  heading: "Timeline & Milestones",
                  lines: [
                    "24-week delivery timeline across 4 phases.",
                    "Phase 1 — Infrastructure (Weeks 1–6)",
                    "Phase 2 — Core Features (Weeks 7–14)",
                    "Phase 3 — Advanced Features (Weeks 15–20)",
                    "Phase 4 — UAT & Launch (Weeks 21–24)",
                  ],
                  highlight: false,
                },
              ].map((doc) => (
                <div key={doc.page} className={cn(
                  "rounded-xl border px-4 py-4",
                  doc.highlight ? "border-brown-200 bg-brown-50/40" : "border-gray-100 bg-gray-50/30"
                )}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-semibold text-gray-700">{doc.heading}</span>
                    <span className="text-[9px] font-mono text-gray-300">p.{doc.page}</span>
                  </div>
                  <div className="space-y-1">
                    {doc.lines.map((line, i) => (
                      <div key={i} className={cn(
                        "h-3 rounded-sm",
                        doc.highlight && i === 0 ? "bg-brown-200/60 w-full" :
                        doc.highlight && i === 1 ? "bg-brown-200/40 w-11/12" :
                        i % 3 === 0 ? "bg-gray-200/70 w-full" :
                        i % 3 === 1 ? "bg-gray-200/50 w-10/12" :
                        "bg-gray-200/40 w-9/12"
                      )} />
                    ))}
                  </div>
                  {doc.highlight && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brown-400" />
                      <span className="text-[10px] text-brown-500 font-medium">Active highlight</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Page count footer */}
              <div className="flex items-center justify-center py-2">
                <span className="text-[10px] text-gray-300">Showing 4 of 12 pages</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL: Extracted Items ─── */}
        <div className="flex flex-col min-h-0 rounded-2xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brown-500" />
              <span className="text-[14px] font-semibold text-gray-800">Extracted Items</span>
            </div>
            {pending > 0 && (
              <button
                onClick={() => setShowAcceptAllModal(true)}
                className="text-[11px] font-semibold text-brown-700 px-3.5 py-1.5 rounded-lg border border-brown-200 bg-brown-50 hover:bg-brown-100 transition-all"
              >
                Accept All Pending
              </button>
            )}
          </div>

          {/* Category list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {CATEGORIES.map((cat) => {
              const cItems = catItems(cat.key);
              if (cItems.length === 0) return null;
              const count = cItems.length;
              const done = catDone(cat.key);
              const isOpen = expandedCat === cat.key;

              return (
                <div key={cat.key} className="border-b border-gray-100 last:border-b-0">
                  {/* ── Category row ── */}
                  <div className={cn("flex items-center gap-3.5 px-5 py-4 transition-colors", isOpen ? "bg-gray-50/70" : "hover:bg-gray-50/50")}>
                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg border text-[13px] font-bold shrink-0", cat.bg, cat.color)}>
                      {count}
                    </div>
                    <button onClick={() => setExpandedCat(isOpen ? null : cat.key)} className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <cat.Icon className={cn("w-4 h-4 shrink-0", cat.color)} />
                        <span className="text-[13px] font-semibold text-gray-800">{cat.label}</span>
                        {done && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-forest-700 bg-forest-100 px-1.5 py-0.5 rounded-full">
                            <Check className="w-2.5 h-2.5" /> Done
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{cat.description(count)}</p>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!done && (
                        <button onClick={() => acceptCategory(cat.key)} className="text-[11px] font-medium text-forest-700 px-3 py-1.5 rounded-lg border border-forest-200 bg-forest-50 hover:bg-forest-100 transition-all">
                          Accept
                        </button>
                      )}
                      <button onClick={() => setExpandedCat(isOpen ? null : cat.key)} className="text-gray-500 p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded item list ── */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="bg-gray-50/50 border-t border-gray-100">
                          {cItems.map((item) => {
                            const isEditing = editingId === item.id;
                            const stateColor = item.reviewState === "accepted" ? "text-forest-600" : item.reviewState === "edited" ? "text-amber-600" : item.reviewState === "excluded" ? "text-red-400" : "text-gray-400";
                            const stateDot  = item.reviewState === "accepted" ? "bg-forest-500" : item.reviewState === "edited" ? "bg-amber-500" : item.reviewState === "excluded" ? "bg-red-400" : "bg-gray-300";
                            return (
                              <div key={item.id} className={cn("px-5 py-3 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer", item.reviewState === "excluded" ? "bg-red-50/30" : "hover:bg-white/80")} onClick={() => showSource(item)}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", stateDot)} />
                                  <span className={cn("text-[10px] font-semibold capitalize", stateColor)}>{item.reviewState}</span>
                                  <span className="text-[9px] font-mono text-gray-400 ml-auto">p.{item.sourcePageNumber} &middot; {item.confidence}%</span>
                                </div>
                                {isEditing ? (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <textarea autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)} rows={3} className="w-full text-[12px] text-gray-700 leading-relaxed px-3 py-2 rounded-lg border border-brown-300 bg-white outline-none focus:ring-2 focus:ring-brown-200 resize-none" />
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <button onClick={() => saveEdit(item.id)} className="flex items-center gap-1 text-[10px] font-semibold text-white bg-brown-500 hover:bg-brown-600 px-2.5 py-1 rounded-md transition-all"><Check className="w-3 h-3" /> Save</button>
                                      <button onClick={() => setEditingId(null)} className="text-[10px] font-medium text-gray-500 px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className={cn("text-[12px] leading-relaxed", item.reviewState === "excluded" ? "line-through text-gray-300" : "text-gray-600")}>
                                    {item.reviewState === "edited" ? item.editedText : item.text}
                                  </p>
                                )}
                                {!isEditing && (
                                  <div className="flex items-center gap-1 mt-1.5 -ml-1" onClick={(e) => e.stopPropagation()}>
                                    {item.reviewState === "pending" && (<>
                                      <button onClick={() => updateItem(item.id, "accepted")} className="flex items-center gap-1 text-[10px] font-medium text-forest-600 hover:bg-forest-50 px-2 py-0.5 rounded-md transition-all"><CheckCircle2 className="w-3 h-3" /> Accept</button>
                                      <button onClick={() => startEdit(item)} className="flex items-center gap-1 text-[10px] font-medium text-amber-600 hover:bg-amber-50 px-2 py-0.5 rounded-md transition-all"><FilePen className="w-3 h-3" /> Edit</button>
                                      <button onClick={() => updateItem(item.id, "excluded")} className="flex items-center gap-1 text-[10px] font-medium text-red-400 hover:bg-red-50 px-2 py-0.5 rounded-md transition-all"><Ban className="w-3 h-3" /> Exclude</button>
                                    </>)}
                                    {(item.reviewState === "accepted" || item.reviewState === "edited") && (<>
                                      <button onClick={() => startEdit(item)} className="flex items-center gap-1 text-[10px] font-medium text-amber-600 hover:bg-amber-50 px-2 py-0.5 rounded-md transition-all"><FilePen className="w-3 h-3" /> Edit</button>
                                      <button onClick={() => updateItem(item.id, "pending")} className="flex items-center gap-1 text-[10px] font-medium text-gray-500 hover:bg-gray-100 px-2 py-0.5 rounded-md transition-all"><Undo2 className="w-3 h-3" /> Reset</button>
                                    </>)}
                                    {item.reviewState === "excluded" && (
                                      <button onClick={() => updateItem(item.id, "pending")} className="flex items-center gap-1 text-[10px] font-medium text-gray-500 hover:bg-gray-100 px-2 py-0.5 rounded-md transition-all"><Undo2 className="w-3 h-3" /> Restore</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="px-5 py-3.5 border-t border-gray-100 shrink-0">
            <button onClick={handleContinue} className="flex items-center justify-center gap-2 w-full text-[13px] font-semibold text-white bg-linear-to-r from-brown-500 to-brown-700 hover:from-brown-600 hover:to-brown-800 py-2.5 rounded-xl shadow-sm transition-all">
              Proceed to Commercial Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer nav */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mt-5">
        <button
          onClick={() => router.push("/enterprise/sow/upload/report")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Report
        </button>
      </motion.div>

      {/* Accept All Modal */}
      <AnimatePresence>
        {showAcceptAllModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAcceptAllModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white border border-gray-200 p-6 shadow-xl">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Accept all pending?</h3>
              <p className="text-[13px] text-gray-400 mb-5">{pending} unreviewed item{pending !== 1 ? "s" : ""} will be marked as accepted. You can still edit them individually.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAcceptAllModal(false)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={acceptAllPending} className="text-[12px] font-semibold text-white bg-linear-to-r from-forest-500 to-forest-700 px-5 py-2 rounded-lg shadow-sm transition-all">Accept all ({pending})</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
