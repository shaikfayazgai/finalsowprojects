"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Save,
  Sparkles,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button, Progress, ScrollArea } from "@/components/ui";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useExtractionItems, useReviewExtractionItem, useAcceptAllExtractionItems } from "@/lib/hooks/use-manual-sow";

/* ────────────────────────────────────────────────────────────
   Types & mock data
   ──────────────────────────────────────────────────────────── */
type ReviewState = "pending" | "accepted" | "edited" | "excluded";

interface ExtractionItem {
  id: string;
  text: string;
  state: ReviewState;
  editedText?: string;
  confidence: number;
  sourceSection: string;
  sourcePage: number;
}

interface ExtractionCategory {
  id: string;
  label: string;
  items: ExtractionItem[];
}

const INITIAL_CATEGORIES: ExtractionCategory[] = [
  {
    id: "business-objectives",
    label: "Business Objectives",
    items: [
      {
        id: "bo-1",
        text: "Reduce customer onboarding time from 14 days to under 3 days through digital workflow automation.",
        state: "pending",
        confidence: 96,
        sourceSection: "Section 1.2",
        sourcePage: 3,
      },
      {
        id: "bo-2",
        text: "Achieve 40% reduction in manual data entry across all departments by Q4 2026.",
        state: "accepted",
        confidence: 91,
        sourceSection: "Section 1.2",
        sourcePage: 3,
      },
      {
        id: "bo-3",
        text: "Integrate with existing SAP ERP system and Salesforce CRM for unified data flow.",
        state: "pending",
        confidence: 88,
        sourceSection: "Section 1.3",
        sourcePage: 4,
      },
    ],
  },
  {
    id: "user-context",
    label: "User Context",
    items: [
      {
        id: "uc-1",
        text: "Primary users: Operations managers (50+ users) and field technicians (200+ users) across 12 regional offices.",
        state: "accepted",
        confidence: 93,
        sourceSection: "Section 2.1",
        sourcePage: 5,
      },
      {
        id: "uc-2",
        text: "Secondary users: Executive leadership requiring real-time dashboards and KPI tracking.",
        state: "pending",
        confidence: 85,
        sourceSection: "Section 2.1",
        sourcePage: 6,
      },
    ],
  },
  {
    id: "feature-deliverables",
    label: "Feature/Module Deliverables",
    items: [
      {
        id: "fd-1",
        text: "Self-service customer portal with document upload, e-signature, and status tracking capabilities.",
        state: "pending",
        confidence: 94,
        sourceSection: "Section 3.1",
        sourcePage: 8,
      },
      {
        id: "fd-2",
        text: "Automated workflow engine supporting configurable approval chains up to 5 levels deep.",
        state: "pending",
        confidence: 90,
        sourceSection: "Section 3.2",
        sourcePage: 9,
      },
      {
        id: "fd-3",
        text: "Real-time analytics dashboard with drill-down capabilities and exportable reports.",
        state: "edited",
        editedText: "Real-time analytics dashboard with drill-down capabilities, exportable reports, and scheduled email digests.",
        confidence: 87,
        sourceSection: "Section 3.3",
        sourcePage: 11,
      },
    ],
  },
  {
    id: "timeline-milestones",
    label: "Timeline & Milestones",
    items: [
      {
        id: "tm-1",
        text: "Phase 1 (Months 1-2): Discovery, architecture design, and environment setup.",
        state: "accepted",
        confidence: 95,
        sourceSection: "Section 4.1",
        sourcePage: 14,
      },
      {
        id: "tm-2",
        text: "Phase 2 (Months 3-5): Core module development and integration.",
        state: "pending",
        confidence: 92,
        sourceSection: "Section 4.1",
        sourcePage: 14,
      },
    ],
  },
  {
    id: "budget-commercial",
    label: "Budget & Commercial Terms",
    items: [
      {
        id: "bc-1",
        text: "Total project budget: $310,000 with 70/30 T&M/Fixed-price split across phases.",
        state: "pending",
        confidence: 97,
        sourceSection: "Section 5.1",
        sourcePage: 18,
      },
    ],
  },
  {
    id: "compliance",
    label: "Compliance Requirements",
    items: [
      {
        id: "cr-1",
        text: "SOC 2 Type II compliance required for all cloud infrastructure components.",
        state: "pending",
        confidence: 91,
        sourceSection: "Section 6.2",
        sourcePage: 20,
      },
    ],
  },
  {
    id: "assumptions",
    label: "Assumptions & Constraints",
    items: [
      {
        id: "ac-1",
        text: "Client will provide dedicated API access to SAP ERP within first 2 weeks of project kickoff.",
        state: "pending",
        confidence: 89,
        sourceSection: "Section 7.1",
        sourcePage: 22,
      },
      {
        id: "ac-2",
        text: "All user acceptance testing will be conducted by client's QA team within agreed timelines.",
        state: "pending",
        confidence: 86,
        sourceSection: "Section 7.2",
        sourcePage: 23,
      },
    ],
  },
  {
    id: "technical-requirements",
    label: "Technical Requirements",
    items: [
      {
        id: "tr-1",
        text: "Cloud-native architecture on AWS with multi-AZ deployment for 99.9% uptime SLA.",
        state: "pending",
        confidence: 94,
        sourceSection: "Section 8.1",
        sourcePage: 24,
      },
    ],
  },
  {
    id: "risk-factors",
    label: "Risk Factors",
    items: [
      {
        id: "rf-1",
        text: "Third-party API dependency on legacy SAP system may introduce integration delays.",
        state: "pending",
        confidence: 82,
        sourceSection: "Section 9.1",
        sourcePage: 26,
      },
      {
        id: "rf-2",
        text: "Resource availability risk: client-side SMEs needed for UAT may have competing priorities.",
        state: "pending",
        confidence: 78,
        sourceSection: "Section 9.2",
        sourcePage: 26,
      },
    ],
  },
];

function getStateStyle(state: ReviewState) {
  switch (state) {
    case "accepted":
      return { badge: "forest" as const, label: "Accepted", dotColor: "bg-forest-500" };
    case "edited":
      return { badge: "gold" as const, label: "Edited", dotColor: "bg-gold-500" };
    case "excluded":
      return { badge: "danger" as const, label: "Excluded", dotColor: "bg-red-400" };
    default:
      return { badge: "beige" as const, label: "Pending", dotColor: "bg-beige-400" };
  }
}

/* ────────────────────────────────────────────────────────────
   Page component
   ──────────────────────────────────────────────────────────── */
/* Transform flat API items → grouped ExtractionCategory[] */
function apiItemsToCategories(
  items: Array<{ id: string; text?: string; content?: string; category?: string; review_state?: string; state?: string; confidence?: number; source_section?: string; source_page?: number }>,
): ExtractionCategory[] {
  const grouped: Record<string, ExtractionCategory> = {};
  for (const item of items) {
    const catId = item.category ?? "general";
    if (!grouped[catId]) {
      grouped[catId] = { id: catId, label: catId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), items: [] };
    }
    grouped[catId].items.push({
      id: item.id,
      text: item.text ?? item.content ?? "",
      state: (item.review_state ?? item.state ?? "pending") as ReviewState,
      confidence: item.confidence ?? 80,
      sourceSection: item.source_section ?? "",
      sourcePage: item.source_page ?? 0,
    });
  }
  return Object.values(grouped);
}

export default function ParsedReviewPage() {
  const store = useSOWUploadStore();
  const sowId = store.uploadedSowId;
  const { data: itemsRes } = useExtractionItems(sowId);
  const reviewMutation = useReviewExtractionItem(sowId);
  const acceptAllMutation = useAcceptAllExtractionItems(sowId);

  const apiItems = (itemsRes?.data as { items?: unknown[] } | null)?.items ?? (Array.isArray(itemsRes?.data) ? itemsRes?.data : null);
  const initialCategories = React.useMemo(
    () => (apiItems && (apiItems as unknown[]).length > 0 ? apiItemsToCategories(apiItems as Parameters<typeof apiItemsToCategories>[0]) : INITIAL_CATEGORIES),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [!!apiItems],
  );

  const [categories, setCategories] = React.useState<ExtractionCategory[]>(initialCategories);
  const [expandedCategory, setExpandedCategory] = React.useState<string>("business-objectives");
  const [editingItem, setEditingItem] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");

  /* Document viewer pagination */
  const TOTAL_DOC_PAGES = 28;
  const PAGES_PER_VIEW = 4;
  const totalDocPaginatedPages = Math.ceil(TOTAL_DOC_PAGES / PAGES_PER_VIEW);
  const [docPage, setDocPage] = React.useState(1);
  const docPagesStart = (docPage - 1) * PAGES_PER_VIEW + 1;
  const docPagesEnd = Math.min(docPage * PAGES_PER_VIEW, TOTAL_DOC_PAGES);

  /* Sync if API data loads after initial render */
  React.useEffect(() => {
    if (apiItems && (apiItems as unknown[]).length > 0) {
      setCategories(apiItemsToCategories(apiItems as Parameters<typeof apiItemsToCategories>[0]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!apiItems]);

  // Calculate stats
  const allItems = categories.flatMap((c) => c.items);
  const totalItems = allItems.length;
  const reviewedItems = allItems.filter((i) => i.state !== "pending").length;
  const pendingItems = totalItems - reviewedItems;
  const progressPercent = totalItems > 0 ? Math.round((reviewedItems / totalItems) * 100) : 0;

  const updateItemState = (categoryId: string, itemId: string, newState: ReviewState, newText?: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      state: newState,
                      ...(newText !== undefined ? { editedText: newText } : {}),
                    }
                  : item
              ),
            }
          : cat
      )
    );
    /* Sync to API — only accepted/edited/excluded map to API states */
    if (sowId && newState !== "pending") {
      reviewMutation.mutate({
        itemId,
        reviewState: { state: newState as "accepted" | "edited" | "excluded", ...(newText !== undefined ? { edited_value: newText } : {}) },
      });
    }
  };

  const acceptAllPending = () => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) =>
          item.state === "pending" ? { ...item, state: "accepted" } : item
        ),
      }))
    );
    /* Sync to API */
    if (sowId) acceptAllMutation.mutate();
  };

  const startEdit = (item: ExtractionItem) => {
    setEditingItem(item.id);
    setEditText(item.editedText || item.text);
  };

  const saveEdit = (categoryId: string, itemId: string) => {
    updateItemState(categoryId, itemId, "edited", editText);
    setEditingItem(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditText("");
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-5"
    >
      {/* Back Link */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/sow/upload/extraction-report"
          className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-colors group"
          style={{ color: "var(--ink-muted)" }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Extraction Report
        </Link>
      </motion.div>

      {/* Page Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-heading"
            style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--ink)" }}
          >
            Parsed SOW Review
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            Review, accept, or edit AI-extracted information before proceeding.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-muted)" }}>
            <Save className="w-3.5 h-3.5" />
            <span>Last saved: 2 min ago</span>
          </div>
          <Button variant="outline" size="sm" onClick={acceptAllPending}>
            <ListChecks className="w-3.5 h-3.5" />
            Accept All Pending ({pendingItems})
          </Button>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl px-5 py-4"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-soft)",
            borderRadius: 12,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
              Review Progress
            </span>
            <span className="text-[12px] font-semibold" style={{ color: "var(--ink-muted)" }}>
              {reviewedItems} of {totalItems} items reviewed ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} variant="gradient-forest" size="md" />
          <div className="flex items-center gap-4 mt-2.5">
            {[
              { label: "Accepted", color: "bg-forest-500", count: allItems.filter((i) => i.state === "accepted").length },
              { label: "Edited", color: "bg-gold-500", count: allItems.filter((i) => i.state === "edited").length },
              { label: "Excluded", color: "bg-red-400", count: allItems.filter((i) => i.state === "excluded").length },
              { label: "Pending", color: "bg-beige-400", count: pendingItems },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", s.color)} />
                <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                  {s.label}: {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Split Panel */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* LEFT: Document Viewer */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl sticky top-6 overflow-hidden"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-soft)",
                borderRadius: 12,
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-2.5 px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--border-soft)" }}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brown-400 to-brown-500 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-[13px] font-semibold"
                    style={{ color: "var(--ink)" }}
                  >
                    Acme_Corp_SOW_v2.1.pdf
                  </h3>
                  <p className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                    {TOTAL_DOC_PAGES} pages · 2.4 MB · Showing pages {docPagesStart}–{docPagesEnd}
                  </p>
                </div>
              </div>

              {/* Document content */}
              <ScrollArea className="h-[580px]">
                <div className="p-5 space-y-5">
                  {Array.from({ length: PAGES_PER_VIEW }).map((_, pageOffset) => {
                    const pageNum = docPagesStart + pageOffset;
                    if (pageNum > TOTAL_DOC_PAGES) return null;
                    const sectionIdx = (docPage - 1) * PAGES_PER_VIEW + pageOffset;
                    return (
                      <div key={pageNum} className="space-y-2.5">
                        {/* Page label */}
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                            style={{ background: "var(--border-soft)", color: "var(--ink-faint)" }}
                          >
                            Page {pageNum}
                          </span>
                          <div className="flex-1 h-px" style={{ background: "var(--border-soft)" }} />
                        </div>
                        {/* Heading skeleton */}
                        <div
                          className="h-4 rounded-full"
                          style={{
                            background: "var(--border-soft)",
                            width: `${35 + Math.sin(sectionIdx) * 20}%`,
                          }}
                        />
                        {/* Line skeletons */}
                        {Array.from({ length: 3 + (sectionIdx % 3) }).map((_, lineIdx) => (
                          <div
                            key={lineIdx}
                            className="h-2.5 rounded-full"
                            style={{
                              background: "var(--border-soft)",
                              opacity: 0.4,
                              width: `${65 + Math.cos(lineIdx + sectionIdx) * 25}%`,
                            }}
                          />
                        ))}
                        {/* AI extracted highlight (every 3rd page) */}
                        {sectionIdx % 3 === 0 && (
                          <div
                            className="rounded-lg p-3 mt-2"
                            style={{
                              background: "rgba(76, 175, 80, 0.06)",
                              border: "1px dashed rgba(76, 175, 80, 0.25)",
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Sparkles className="w-3 h-3 text-forest-500" />
                              <span className="text-[10px] font-bold text-forest-600 uppercase">
                                AI Extracted
                              </span>
                            </div>
                            {[1, 2].map((l) => (
                              <div
                                key={l}
                                className="h-2 rounded-full mb-1"
                                style={{
                                  background: "var(--border-soft)",
                                  opacity: 0.5,
                                  width: `${60 + l * 15}%`,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Pagination controls */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: "1px solid var(--border-soft)" }}
              >
                <button
                  onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                  disabled={docPage === 1}
                  className={cn(
                    "flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all",
                    docPage === 1
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:opacity-80"
                  )}
                  style={{ color: "var(--ink-muted)", background: "var(--page-bg)", border: "1px solid var(--border-soft)" }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalDocPaginatedPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setDocPage(i + 1)}
                      className={cn(
                        "w-7 h-7 rounded-lg text-[11px] font-semibold transition-all",
                        docPage === i + 1
                          ? "text-white"
                          : "hover:opacity-80"
                      )}
                      style={
                        docPage === i + 1
                          ? { background: "var(--color-brown-500)", color: "white" }
                          : { color: "var(--ink-faint)", background: "var(--page-bg)", border: "1px solid var(--border-soft)" }
                      }
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setDocPage((p) => Math.min(totalDocPaginatedPages, p + 1))}
                  disabled={docPage === totalDocPaginatedPages}
                  className={cn(
                    "flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all",
                    docPage === totalDocPaginatedPages
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:opacity-80"
                  )}
                  style={{ color: "var(--ink-muted)", background: "var(--page-bg)", border: "1px solid var(--border-soft)" }}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Extractions Panel */}
          <div className="lg:col-span-4 space-y-3">
            {categories.map((category) => {
              const isExpanded = expandedCategory === category.id;
              const catPending = category.items.filter((i) => i.state === "pending").length;
              const catAccepted = category.items.filter((i) => i.state === "accepted").length;
              const catEdited = category.items.filter((i) => i.state === "edited").length;

              return (
                <div
                  key={category.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: 12,
                  }}
                >
                  {/* Category header */}
                  <button
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:opacity-90 transition-all text-left"
                    onClick={() => setExpandedCategory(isExpanded ? "" : category.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--ink-muted)" }} />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--ink-muted)" }} />
                    )}
                    <span
                      className="text-[13px] font-semibold flex-1"
                      style={{ color: "var(--ink)" }}
                    >
                      {category.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {catAccepted > 0 && (
                        <Badge variant="forest" size="sm">
                          {catAccepted} accepted
                        </Badge>
                      )}
                      {catEdited > 0 && (
                        <Badge variant="gold" size="sm">
                          {catEdited} edited
                        </Badge>
                      )}
                      {catPending > 0 && (
                        <Badge variant="beige" size="sm">
                          {catPending} pending
                        </Badge>
                      )}
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: "var(--ink-faint)" }}
                      >
                        {category.items.length} items
                      </span>
                    </div>
                  </button>

                  {/* Expanded items */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-5 pb-4 space-y-3"
                          style={{ borderTop: "1px solid var(--border-soft)" }}
                        >
                          <div className="pt-3" />
                          {category.items.map((item) => {
                            const stateStyle = getStateStyle(item.state);
                            const isEditing = editingItem === item.id;

                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "rounded-xl px-4 py-3.5 transition-all",
                                  item.state === "excluded" && "opacity-50"
                                )}
                                style={{
                                  background: "var(--page-bg)",
                                  border: "1px solid var(--border-soft)",
                                  borderRadius: 10,
                                }}
                              >
                                {/* Item header */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full shrink-0", stateStyle.dotColor)} />
                                    <Badge variant={stateStyle.badge} size="sm">
                                      {stateStyle.label}
                                    </Badge>
                                    <span className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
                                      {item.sourceSection} - Page {item.sourcePage}
                                    </span>
                                  </div>
                                  <Badge
                                    variant={item.confidence >= 90 ? "forest" : item.confidence >= 80 ? "gold" : "danger"}
                                    size="sm"
                                  >
                                    {item.confidence}%
                                  </Badge>
                                </div>

                                {/* Item text */}
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      className="w-full rounded-lg px-3 py-2 text-[13px] resize-none"
                                      style={{
                                        background: "var(--card-bg)",
                                        border: "1px solid var(--border-soft)",
                                        color: "var(--ink)",
                                        minHeight: 80,
                                      }}
                                    />
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => saveEdit(category.id, item.id)}
                                      >
                                        <Check className="w-3 h-3" />
                                        Save
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={cancelEdit}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--ink)" }}>
                                      {item.state === "edited" && item.editedText
                                        ? item.editedText
                                        : item.text}
                                    </p>

                                    {/* Action buttons */}
                                    {item.state !== "excluded" && (
                                      <div className="flex items-center gap-2">
                                        {item.state !== "accepted" && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateItemState(category.id, item.id, "accepted")}
                                          >
                                            <Check className="w-3 h-3" />
                                            Accept
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => startEdit(item)}
                                        >
                                          <Edit3 className="w-3 h-3" />
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => updateItemState(category.id, item.id, "excluded")}
                                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                          <X className="w-3 h-3" />
                                          Exclude
                                        </Button>
                                      </div>
                                    )}
                                  </>
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
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl px-6 py-4 flex items-center justify-between"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-soft)",
            borderRadius: 12,
          }}
        >
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
              {pendingItems > 0
                ? `${pendingItems} items still pending review`
                : "All items reviewed!"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              You can continue with pending items -- they will be auto-accepted.
            </p>
          </div>
          <Link href="/enterprise/sow/upload/gap-analysis">
            <Button variant="gradient-primary" size="lg">
              Continue to Gap Analysis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
