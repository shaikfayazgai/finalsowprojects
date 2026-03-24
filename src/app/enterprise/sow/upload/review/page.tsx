"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Edit3, Eye, RotateCcw, X, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { DocumentViewer } from "@/components/enterprise/sow/DocumentViewer";
import { SowBadge, confidenceVariant } from "@/components/enterprise/sow/SowBadge";
import { mockExtractionItems } from "@/mocks/data/sow-upload-flow";
import { mockSOWSections } from "@/mocks/data/enterprise-sow";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import type { ExtractionItem, ExtractionCategory, ExtractionReviewState } from "@/types/enterprise";

/* ── Category config ── */

const CATEGORIES: { key: ExtractionCategory; label: string }[] = [
  { key: "business_objectives", label: "Business Objectives" },
  { key: "user_context", label: "User Context" },
  { key: "features", label: "Features / Modules" },
  { key: "timeline", label: "Timeline & Milestones" },
  { key: "budget", label: "Budget & Commercial" },
  { key: "compliance", label: "Compliance" },
  { key: "assumptions", label: "Assumptions & Constraints" },
  { key: "technical", label: "Technical Requirements" },
  { key: "risk", label: "Risk Factors" },
];

const reviewStateStyles: Record<ExtractionReviewState, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-gray-100", text: "text-gray-500", label: "Pending" },
  accepted: { bg: "bg-forest-50", text: "text-forest-700", label: "Accepted" },
  edited: { bg: "bg-gold-50", text: "text-gold-700", label: "Edited" },
  excluded: { bg: "bg-red-50", text: "text-red-600", label: "Excluded" },
};

/* ═══ PAGE ═══ */

export default function ParsedSOWReviewPage() {
  const router = useRouter();
  const store = useSOWUploadStore();

  /* Initialize items from mock data if store is empty */
  const [items, setItems] = React.useState<ExtractionItem[]>(() =>
    store.extractionItems.length > 0 ? store.extractionItems : mockExtractionItems
  );
  const [highlightText, setHighlightText] = React.useState<string | undefined>();
  const [highlightPage, setHighlightPage] = React.useState<number | undefined>();
  const [expandedCategories, setExpandedCategories] = React.useState<Set<ExtractionCategory>>(
    new Set(CATEGORIES.map((c) => c.key))
  );
  const [showAcceptAllModal, setShowAcceptAllModal] = React.useState(false);

  /* Use mock sections for the document viewer */
  const sections = mockSOWSections.filter((s) => s.sowId === "sow-003");

  const reviewed = items.filter((i) => i.reviewState !== "pending").length;
  const total = items.length;
  const pending = total - reviewed;

  const updateItem = (id: string, state: ExtractionReviewState, editedText?: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, reviewState: state, ...(editedText !== undefined ? { editedText } : {}) } : item
      )
    );
  };

  const acceptAllPending = () => {
    setItems((prev) => prev.map((item) => item.reviewState === "pending" ? { ...item, reviewState: "accepted" } : item));
    setShowAcceptAllModal(false);
  };

  const handleContinue = () => {
    store.setExtractionItems(items);
    store.setFlowStep(4);
    router.push("/enterprise/sow/upload/gaps");
  };

  const toggleCategory = (key: ExtractionCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Flow step progress */}
      <motion.div variants={fadeUp} className="mb-6">
        <FlowStepProgress currentStep={3} />
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Parsed SOW Review</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Review each extraction against the source document. Accept, edit, or exclude items.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Progress */}
          <div className="text-right">
            <span className="text-[11px] font-medium text-gray-500">{reviewed} of {total} reviewed</span>
            <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden mt-1">
              <div className="h-full rounded-full bg-forest-500 transition-all duration-300" style={{ width: `${(reviewed / total) * 100}%` }} />
            </div>
          </div>
          {pending > 0 && (
            <button onClick={() => setShowAcceptAllModal(true)}
              className="text-[11px] font-medium text-brown-600 px-3 py-1.5 rounded-lg border border-brown-200 hover:bg-brown-50 transition-all">
              Accept All Pending ({pending})
            </button>
          )}
        </div>
      </motion.div>

      {/* Split panel */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-4 mb-6" style={{ minHeight: "600px" }}>
        {/* Left: Document Viewer */}
        <DocumentViewer
          sections={sections}
          highlightText={highlightText}
          highlightPage={highlightPage}
          className="h-full"
        />

        {/* Right: Extractions Panel */}
        <div className="card-parchment flex flex-col h-full overflow-hidden">
          <div className="px-5 py-3.5 shrink-0 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Extractions</span>
            <span className="text-[10px] text-gray-400">{total} items</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {CATEGORIES.map((cat) => {
              const catItems = items.filter((i) => i.category === cat.key);
              if (catItems.length === 0) return null;
              const isExpanded = expandedCategories.has(cat.key);

              return (
                <div key={cat.key}>
                  <button onClick={() => toggleCategory(cat.key)}
                    className="w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: "1px solid var(--border-hair)" }}>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", !isExpanded && "-rotate-90")} />
                    <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider flex-1">{cat.label}</span>
                    <span className="text-[10px] text-gray-400">{catItems.length}</span>
                  </button>

                  {isExpanded && catItems.map((item) => {
                    const rs = reviewStateStyles[item.reviewState];
                    return (
                      <div key={item.id} className="px-5 py-3 hover:bg-black/[0.02] transition-colors"
                        style={{ borderBottom: "1px solid var(--border-hair)" }}>
                        <div className="flex items-start gap-2 mb-1.5">
                          <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full", rs.bg, rs.text)}>
                            {rs.label}
                          </span>
                          <SowBadge variant={confidenceVariant(item.confidence)}>{item.confidence}%</SowBadge>
                          <span className="text-[9px] font-mono text-gray-400 ml-auto">p.{item.sourcePageNumber}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 leading-relaxed mb-2">
                          {item.reviewState === "edited" ? item.editedText : item.text}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setHighlightText(item.sourceHighlight); setHighlightPage(item.sourcePageNumber); }}
                            className="flex items-center gap-1 text-[10px] font-medium text-brown-500 hover:text-brown-600 px-2 py-1 rounded-md hover:bg-brown-50 transition-all">
                            <Eye className="w-3 h-3" /> Source
                          </button>
                          {item.reviewState === "pending" && (
                            <>
                              <button onClick={() => updateItem(item.id, "accepted")}
                                className="flex items-center gap-1 text-[10px] font-medium text-forest-600 px-2 py-1 rounded-md hover:bg-forest-50 transition-all">
                                <CheckCircle2 className="w-3 h-3" /> Accept
                              </button>
                              <button onClick={() => updateItem(item.id, "edited", item.text)}
                                className="flex items-center gap-1 text-[10px] font-medium text-gold-600 px-2 py-1 rounded-md hover:bg-gold-50 transition-all">
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                              <button onClick={() => updateItem(item.id, "excluded")}
                                className="flex items-center gap-1 text-[10px] font-medium text-red-500 px-2 py-1 rounded-md hover:bg-red-50 transition-all">
                                <X className="w-3 h-3" /> Exclude
                              </button>
                            </>
                          )}
                          {item.reviewState !== "pending" && (
                            <button onClick={() => updateItem(item.id, "pending")}
                              className="flex items-center gap-1 text-[10px] font-medium text-gray-400 px-2 py-1 rounded-md hover:bg-gray-50 transition-all">
                              <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={fadeUp} className="flex items-center justify-end">
        <button onClick={handleContinue}
          className="flex items-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all">
          Continue to Gap Analysis <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>

      {/* Accept All Modal */}
      {showAcceptAllModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAcceptAllModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-[400px] mx-4 rounded-2xl bg-white border border-gray-200 p-6"
            style={{ boxShadow: "0 16px 40px var(--border-hair)" }}>
            <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Accept All Pending?</h3>
            <p className="text-[13px] text-gray-400 mb-5">
              {pending} unreviewed items will be accepted as-is. You can still edit individual items after.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAcceptAllModal(false)}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={acceptAllPending}
                className="text-[12px] font-semibold text-white bg-gradient-to-r from-forest-400 to-forest-600 px-5 py-2 rounded-lg transition-all">
                Accept All ({pending})
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
