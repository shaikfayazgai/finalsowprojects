"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, CheckCircle2, FilePen, Undo2, X, Ban,
  Check, Clock, AlertCircle, FileText, Layers, ChevronDown, ChevronUp,
  Target, Users, LayoutGrid, CalendarClock, Wallet, ShieldCheck,
  ListChecks, Code2, AlertTriangle, Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { DocumentViewer } from "@/components/enterprise/sow/DocumentViewer";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import {
  useExtractionItems,
  useReviewExtractionItem,
  useAcceptAllExtractionItems,
} from "@/lib/hooks/use-manual-sow";
import type { ExtractionCategory, ExtractionReviewState } from "@/types/enterprise";

/* ── Types ── */

type Raw = Record<string, unknown>;

interface Item {
  id: string;
  category: ExtractionCategory;
  text: string;
  sourcePageNumber: number;
  sourceHighlight: string;
  reviewState: ExtractionReviewState;
  editedText?: string;
  confidence: number;
}

/* ── API → Item mapper ── */

const VALID_CATEGORIES = new Set<ExtractionCategory>([
  "business_objectives", "user_context", "features", "timeline",
  "budget", "compliance", "assumptions", "technical", "risk",
]);

function toCategory(v: unknown): ExtractionCategory {
  const s = String(v ?? "").toLowerCase();
  if (VALID_CATEGORIES.has(s as ExtractionCategory)) return s as ExtractionCategory;
  return "assumptions";
}

function toReviewState(v: unknown): ExtractionReviewState {
  const s = String(v ?? "pending").toLowerCase();
  if (s === "accepted" || s === "edited" || s === "excluded") return s;
  return "pending";
}

function mapItem(raw: Raw): Item {
  const get = (c: string, s: string, fb: unknown) => raw[c] ?? raw[s] ?? fb;
  return {
    id: String(raw.id ?? raw._id ?? Math.random()),
    category: toCategory(get("category", "category", "assumptions")),
    text: String(get("text", "content", get("value", "extracted_text", ""))),
    sourcePageNumber: Number(get("sourcePageNumber", "source_page_number", 1)),
    sourceHighlight: String(get("sourceHighlight", "source_highlight", "")),
    reviewState: toReviewState(get("reviewState", "review_state", "pending")),
    editedText: (get("editedText", "edited_text", undefined) as string | undefined) ?? undefined,
    confidence: Number(get("confidence", "confidence_score", 0)),
  };
}

/* ── Category config ── */

const CATEGORIES: {
  key: ExtractionCategory;
  label: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  description: (count: number) => string;
}[] = [
  { key: "business_objectives", label: "Business Objectives",       Icon: Target,        color: "text-violet-600",  bg: "bg-violet-50  border-violet-200",  description: (n) => `${n} objective${n !== 1 ? "s" : ""} found` },
  { key: "features",            label: "Feature / Module List",     Icon: LayoutGrid,    color: "text-teal-600",    bg: "bg-teal-50    border-teal-200",    description: (n) => `${n} deliverable${n !== 1 ? "s" : ""} extracted` },
  { key: "technical",           label: "Technical Requirements",    Icon: Code2,         color: "text-orange-600",  bg: "bg-orange-50  border-orange-200",  description: (n) => `${n} tech requirement${n !== 1 ? "s" : ""}` },
  { key: "budget",              label: "Budget & Commercial Terms", Icon: Wallet,        color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", description: (n) => `${n} budget item${n !== 1 ? "s" : ""} found` },
  { key: "timeline",            label: "Timeline & Milestones",     Icon: CalendarClock, color: "text-indigo-600",  bg: "bg-indigo-50  border-indigo-200",  description: (n) => `${n} milestone${n !== 1 ? "s" : ""} found` },
  { key: "risk",                label: "Risk Factors",              Icon: AlertTriangle, color: "text-red-600",     bg: "bg-red-50     border-red-200",     description: (n) => `${n} risk statement${n !== 1 ? "s" : ""}` },
  { key: "compliance",          label: "Compliance Requirements",   Icon: ShieldCheck,   color: "text-blue-600",    bg: "bg-blue-50    border-blue-200",    description: (n) => `${n} compliance item${n !== 1 ? "s" : ""}` },
  { key: "user_context",        label: "User Context",              Icon: Users,         color: "text-sky-600",     bg: "bg-sky-50     border-sky-200",     description: (n) => `${n} user role${n !== 1 ? "s" : ""} found` },
  { key: "assumptions",         label: "Assumptions & Constraints", Icon: ListChecks,    color: "text-amber-600",   bg: "bg-amber-50   border-amber-200",   description: (n) => `${n} assumption${n !== 1 ? "s" : ""}` },
];

/* ═══ PAGE ═══ */

export default function ParsedSOWReviewPage() {
  const router = useRouter();
  const store  = useSOWUploadStore();
  const sowId  = store.uploadedSowId;

  /* ── Fetch extraction items ── */
  const { data: itemsRes, isLoading } = useExtractionItems(sowId);
  const reviewMutation     = useReviewExtractionItem(sowId);
  const acceptAllMutation  = useAcceptAllExtractionItems(sowId);

  /* ── Map API data → local items ── */
  const apiItems: Item[] = React.useMemo(() => {
    if (!itemsRes) return [];
    const res = itemsRes as unknown as Record<string, unknown>;
    const list = (res.data ?? res.items ?? res) as unknown;
    if (Array.isArray(list)) return list.map((r) => mapItem(r as Raw));
    return [];
  }, [itemsRes]);

  /* ── Local state (optimistic UI) ── */
  const [items, setItems] = React.useState<Item[]>([]);

  React.useEffect(() => {
    if (apiItems.length > 0) setItems(apiItems);
  }, [apiItems]);

  /* ── Build document sections from extraction items grouped by page ── */
  const parsedSections = React.useMemo(() => {
    if (items.length === 0) return [];
    const pageMap = new Map<number, Item[]>();
    for (const item of items) {
      const pg = item.sourcePageNumber || 1;
      if (!pageMap.has(pg)) pageMap.set(pg, []);
      pageMap.get(pg)!.push(item);
    }
    return Array.from(pageMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([page, pageItems]) => ({
        id: `page-${page}`,
        title: `Page ${page}`,
        content: pageItems.map((i) => i.text).join("\n\n"),
        pageNumber: page,
      }));
  }, [items]);

  const [highlightText, setHighlightText]       = React.useState<string | undefined>();
  const [highlightPage, setHighlightPage]       = React.useState<number | undefined>();
  const [expandedCat, setExpandedCat]           = React.useState<ExtractionCategory | null>(null);
  const [editingId, setEditingId]               = React.useState<string | null>(null);
  const [editDraft, setEditDraft]               = React.useState("");
  const [showAcceptAllModal, setShowAcceptAllModal] = React.useState(false);
  const [lastSaved, setLastSaved]               = React.useState<Date | null>(null);
  const [validationError, setValidationError]   = React.useState<string | null>(null);

  /* ── Auto-save tick ── */
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const savedLabel = React.useMemo(() => {
    if (!lastSaved) return null;
    const s = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (s < 10) return "just now";
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSaved, tick]);

  /* ── Derived ── */
  const pending    = items.filter((i) => i.reviewState === "pending").length;
  const catItems   = (key: ExtractionCategory) => items.filter((i) => i.category === key);
  const catPending = (key: ExtractionCategory) => catItems(key).filter((i) => i.reviewState === "pending").length;
  const catDone    = (key: ExtractionCategory) => catPending(key) === 0 && catItems(key).length > 0;

  /* ── Optimistic update helper ── */
  const updateItem = (id: string, state: ExtractionReviewState, editedText?: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, reviewState: state, ...(editedText !== undefined ? { editedText } : {}) } : i))
    );
    setLastSaved(new Date());
    reviewMutation.mutate({
      itemId: id,
      reviewState: { state: state as "accepted" | "edited" | "excluded", ...(editedText !== undefined ? { edited_value: editedText } : {}) },
    });
  };

  const acceptCategory = (key: ExtractionCategory) => {
    const ids = catItems(key).filter((i) => i.reviewState === "pending").map((i) => i.id);
    setItems((prev) =>
      prev.map((i) => (ids.includes(i.id) ? { ...i, reviewState: "accepted" } : i))
    );
    setLastSaved(new Date());
    ids.forEach((id) => reviewMutation.mutate({ itemId: id, reviewState: { state: "accepted" } }));
  };

  const startEdit = (item: Item) => { setEditingId(item.id); setEditDraft(item.editedText ?? item.text); };
  const saveEdit  = (id: string) => { updateItem(id, "edited", editDraft.trim() || undefined); setEditingId(null); };

  const acceptAllPending = () => {
    setItems((prev) => prev.map((i) => (i.reviewState === "pending" ? { ...i, reviewState: "accepted" } : i)));
    setShowAcceptAllModal(false);
    setLastSaved(new Date());
    acceptAllMutation.mutate();
  };

  const showSource = (item: Item) => {
    setHighlightText(item.sourceHighlight);
    setHighlightPage(item.sourcePageNumber);
  };

  const handleContinue = () => {
    const ok = items.some((i) => i.category === "features" && (i.reviewState === "accepted" || i.reviewState === "edited"));
    if (!ok && items.length > 0) {
      setValidationError("At least one Feature / Module deliverable must be accepted before continuing.");
      return;
    }
    setValidationError(null);
    store.setFlowStep(4);
    router.push("/enterprise/sow/upload/gaps");
  };

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col h-full min-h-0">
        <motion.div variants={fadeUp} className="mb-5"><FlowStepProgress currentStep={3} /></motion.div>
        <motion.div variants={fadeUp} className="card-parchment px-8 py-16 flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
          <p className="text-[15px] font-semibold text-gray-800">Loading extracted items…</p>
        </motion.div>
      </motion.div>
    );
  }

  /* ═══ RENDER ═══ */
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

      {/* MAIN SPLIT */}
      <motion.div variants={fadeUp} className="flex-1 min-h-0 grid grid-cols-[520px_1fr] gap-5">

        {/* LEFT: Document Viewer */}
        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden self-start" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brown-400" />
              <span className="text-[13px] font-semibold text-gray-800">Document Viewer</span>
            </div>
            {store.uploadedFile && (
              <span className="text-[10px] text-gray-400 truncate max-w-[140px]">{store.uploadedFile.name}</span>
            )}
          </div>

          <DocumentViewer
            sections={parsedSections}
            highlightText={highlightText}
            highlightPage={highlightPage}
            className="rounded-none border-0"
          />
        </div>

        {/* RIGHT: Extracted Items */}
        <div className="flex flex-col min-h-0 rounded-2xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brown-500" />
              <span className="text-[14px] font-semibold text-gray-800">Extracted Items</span>
              {items.length > 0 && (
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length} total</span>
              )}
            </div>
            {pending > 0 && (
              <button
                onClick={() => setShowAcceptAllModal(true)}
                className="text-[11px] font-semibold text-brown-700 px-3.5 py-1.5 rounded-lg border border-brown-200 bg-brown-50 hover:bg-brown-100 transition-all"
              >
                Accept All Pending ({pending})
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6 py-10">
              <div className="text-center">
                <Layers className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-[13px] font-medium text-gray-500 mb-1">No extraction items found</p>
                <p className="text-[11px] text-gray-400">SOW ID: {sowId ?? "not set"}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0">
              {CATEGORIES.map((cat) => {
                const cItems = catItems(cat.key);
                if (cItems.length === 0) return null;
                const count  = cItems.length;
                const done   = catDone(cat.key);
                const isOpen = expandedCat === cat.key;

                return (
                  <div key={cat.key} className="border-b border-gray-100 last:border-b-0">
                    {/* Category row */}
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

                    {/* Expanded items */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="bg-gray-50/50 border-t border-gray-100">
                            {cItems.map((item) => {
                              const isEditing  = editingId === item.id;
                              const stateColor = item.reviewState === "accepted" ? "text-forest-600" : item.reviewState === "edited" ? "text-amber-600" : item.reviewState === "excluded" ? "text-red-400" : "text-gray-400";
                              const stateDot   = item.reviewState === "accepted" ? "bg-forest-500" : item.reviewState === "edited" ? "bg-amber-500" : item.reviewState === "excluded" ? "bg-red-400" : "bg-gray-300";
                              return (
                                <div
                                  key={item.id}
                                  className={cn("px-5 py-3 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer", item.reviewState === "excluded" ? "bg-red-50/30" : "hover:bg-white/80")}
                                  onClick={() => showSource(item)}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", stateDot)} />
                                    <span className={cn("text-[10px] font-semibold capitalize", stateColor)}>{item.reviewState}</span>
                                    <span className="text-[9px] font-mono text-gray-400 ml-auto">
                                      p.{item.sourcePageNumber} &middot; {item.confidence}%
                                    </span>
                                  </div>
                                  {isEditing ? (
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <textarea
                                        autoFocus
                                        value={editDraft}
                                        onChange={(e) => setEditDraft(e.target.value)}
                                        rows={3}
                                        className="w-full text-[12px] text-gray-700 leading-relaxed px-3 py-2 rounded-lg border border-brown-300 bg-white outline-none focus:ring-2 focus:ring-brown-200 resize-none"
                                      />
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <button onClick={() => saveEdit(item.id)} className="flex items-center gap-1 text-[10px] font-semibold text-white bg-brown-500 hover:bg-brown-600 px-2.5 py-1 rounded-md transition-all">
                                          <Check className="w-3 h-3" /> Save
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="text-[10px] font-medium text-gray-500 px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-all">
                                          Cancel
                                        </button>
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
          )}

          {/* CTA */}
          <div className="px-5 py-3.5 border-t border-gray-100 shrink-0">
            <button
              onClick={handleContinue}
              className="flex items-center justify-center gap-2 w-full text-[13px] font-semibold text-white bg-gradient-to-r from-brown-500 to-brown-700 hover:from-brown-600 hover:to-brown-800 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Proceed to Gap Analysis <ArrowRight className="w-4 h-4" />
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
              <p className="text-[13px] text-gray-400 mb-5">{pending} unreviewed item{pending !== 1 ? "s" : ""} will be marked as accepted.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAcceptAllModal(false)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={acceptAllPending} className="text-[12px] font-semibold text-white bg-gradient-to-r from-forest-500 to-forest-700 px-5 py-2 rounded-lg shadow-sm transition-all">Accept all ({pending})</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
