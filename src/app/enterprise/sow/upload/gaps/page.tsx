"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Ban,
  Sparkles, X, Clock, Send, Bot, Undo2, MessageSquare, Pencil, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useGapItems, useUpdateGapItem } from "@/lib/hooks/use-manual-sow";
import type { GapItem, GapSeverity } from "@/types/enterprise";
import { Skeleton } from "@/components/ui";

/* ── Severity config ── */

const SEV = {
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    text: "text-red-600",
    border: "border-red-200",
    badgeBg: "bg-red-50 text-red-600 border-red-200",
    icon: Ban,
  },
  important: {
    label: "Important",
    dot: "bg-amber-400",
    text: "text-amber-600",
    border: "border-amber-200",
    badgeBg: "bg-amber-50 text-amber-600 border-amber-200",
    icon: AlertTriangle,
  },
  optional: {
    label: "Optional",
    dot: "bg-gray-300",
    text: "text-gray-400",
    border: "border-gray-200",
    badgeBg: "bg-gray-50 text-gray-500 border-gray-200",
    icon: CheckCircle2,
  },
} as const;

/* ── Chat message type ── */

type ChatMessage = {
  id: string;
  role: "ai" | "user" | "system";
  content: string;
  suggestions?: string[];
};

const AI_REMEDIATION = [
  "Add numbered acceptance criteria for each deliverable tied to specific test scenarios.",
  "Define pass/fail conditions using measurable metrics (e.g. response time < 500ms).",
  "Include sign-off authority and review process per milestone.",
];

/* ── Gap List Row ── */

function GapRow({
  gap,
  isSelected,
  onClick,
}: {
  gap: GapItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cfg = SEV[gap.severity];
  const isHandled = gap.isResolved || gap.isAcknowledged || gap.isDismissed;
  const SevIcon = cfg.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 px-3.5 py-3 rounded-xl border transition-all duration-150",
        isSelected
          ? "bg-brown-50 border-brown-200 shadow-sm"
          : "bg-white border-gray-100 hover:border-brown-200 hover:bg-brown-50/40",
        isHandled && !isSelected && "opacity-60",
      )}
    >
      <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
        <div className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[12px] font-semibold leading-snug truncate",
          isSelected ? "text-brown-700" : "text-gray-800",
        )}>
          {gap.title}
        </p>
        <p className="text-[10.5px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">
          {gap.description}
        </p>
      </div>
      <div className="shrink-0">
        {isHandled ? (
          <span className="text-[9px] font-bold text-forest-700 bg-forest-50 border border-forest-200 px-1.5 py-0.5 rounded-full">
            {gap.isResolved ? "Resolved" : gap.isAcknowledged ? "Ack." : "Dismissed"}
          </span>
        ) : (
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", cfg.badgeBg)}>
            {cfg.label}
          </span>
        )}
      </div>
    </button>
  );
}

/* ── Suggestion Card ── */

function SuggestionCard({
  index,
  text,
  state,
  onAccept,
  onDismiss,
  onEdit,
}: {
  index: number;
  text: string;
  state?: "accepted" | "dismissed";
  onAccept: (text: string) => void;
  onDismiss: () => void;
  onEdit: (text: string) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(text);

  const handleSave = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        "px-3.5 py-2.5 rounded-xl border text-[12px] leading-relaxed transition-all",
        state === "accepted"
          ? "bg-forest-50 border-forest-200 text-forest-800"
          : state === "dismissed"
          ? "bg-gray-50 border-gray-200 text-gray-400 line-through opacity-50"
          : "bg-white border-teal-100 text-gray-700",
      )}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            autoFocus
            className="w-full text-[12px] text-gray-700 px-2.5 py-1.5 rounded-lg border border-brown-200 bg-white outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-100 resize-none transition-all"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!editText.trim()}
              className="flex items-center gap-1 text-[10px] font-semibold text-white bg-brown-500 hover:bg-brown-600 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-3 h-3" /> Save
            </button>
            <button
              type="button"
              onClick={() => { setEditText(text); setIsEditing(false); }}
              className="flex items-center gap-1 text-[10px] font-medium text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-all"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p>{editText}</p>
          {!state && (
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => onAccept(editText)}
                className="flex items-center gap-1 text-[10px] font-semibold text-forest-700 bg-forest-50 border border-forest-200 px-2.5 py-1 rounded-lg hover:bg-forest-100 transition-all"
              >
                <CheckCircle2 className="w-3 h-3" /> Accept
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-[10px] font-medium text-brown-600 border border-brown-200 px-2.5 py-1 rounded-lg hover:bg-brown-50 transition-all"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="flex items-center gap-1 text-[10px] font-medium text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-all"
              >
                <Ban className="w-3 h-3" /> Exclude
              </button>
            </div>
          )}
          {state === "accepted" && (
            <p className="text-[10px] font-bold text-forest-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Accepted
            </p>
          )}
          {state === "dismissed" && (
            <p className="text-[10px] text-gray-400 mt-1">Excluded</p>
          )}
        </>
      )}
    </motion.div>
  );
}

/* ── Chat Bubble ── */

function ChatBubble({
  msg,
  suggStates,
  onAccept,
  onDismiss,
  onEdit,
}: {
  msg: ChatMessage;
  suggStates?: Record<number, "accepted" | "dismissed">;
  onAccept?: (idx: number, text: string) => void;
  onDismiss?: (idx: number) => void;
  onEdit?: (idx: number, text: string) => void;
}) {
  if (msg.role === "system") {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.role === "ai") {
    return (
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mt-0.5">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 max-w-[88%] space-y-2">
          {/* Intro line */}
          <div
            className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-[12px] text-gray-600"
            style={{ background: "linear-gradient(135deg, #F0F9F9, #E8F5F5)", border: "1px solid #C5E4E4" }}
          >
            {msg.content}
          </div>

          {/* Per-suggestion cards with Accept / Edit / Dismiss */}
          {msg.suggestions?.map((s, i) => {
            const state = suggStates?.[i];
            return (
              <SuggestionCard
                key={i}
                index={i}
                text={s}
                state={state}
                onAccept={(text) => onAccept?.(i, text)}
                onDismiss={() => onDismiss?.(i)}
                onEdit={(text) => onEdit?.(i, text)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 flex-row-reverse">
      <div className="shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center mt-0.5">
        <span className="text-[10px] font-bold text-white">U</span>
      </div>
      <div className="flex-1 max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-sm text-[12.5px] leading-relaxed text-gray-700 bg-brown-50 border border-brown-100">
        {msg.content}
      </div>
    </div>
  );
}

/* ══ PAGE ══ */

/* ── API → GapItem mapper ── */
function apiToGapItem(raw: Record<string, unknown>): GapItem {
  const get = (c: string, s: string, fb: unknown) => raw[c] ?? raw[s] ?? fb;
  return {
    id:           String(get("id", "_id", Math.random())),
    severity:     (String(get("severity", "severity", "important")).toLowerCase()) as GapSeverity,
    title:        String(get("title", "name", "")),
    description:  String(get("description", "detail", "")),
    section:         String(get("section", "affected_section", "")),
    affectedSection: String(get("affectedSection", "affected_section", "")),
    isResolved:      Boolean(get("isResolved", "is_resolved", false)),
    isAcknowledged:  Boolean(get("isAcknowledged", "is_acknowledged", false)),
    isDismissed:     Boolean(get("isDismissed", "is_dismissed", false)),
    isProhibited:    Boolean(get("isProhibited", "is_prohibited", false)),
    remediationSuggestions: (get("remediationSuggestions", "remediation_suggestions", undefined) as string[] | undefined),
  };
}

export default function GapAnalysisPage() {
  const router = useRouter();
  const store = useSOWUploadStore();
  const sowId = store.uploadedSowId;
  const { data: gapRes, isLoading: gapsLoading } = useGapItems(sowId);
  const updateGapItem = useUpdateGapItem(sowId);

  /* Map API data */
  const apiGaps: GapItem[] = React.useMemo(() => {
    if (!gapRes) return [];
    const res = gapRes as unknown as Record<string, unknown>;
    const payload = (res.data !== undefined && res.data !== null ? res.data : res) as Record<string, unknown>;
    const list = payload.items ?? payload.gaps ?? payload.gap_items ?? payload.gapItems ?? payload.results ?? payload;
    if (Array.isArray(list) && list.length > 0) return list.map((r) => apiToGapItem(r as Record<string, unknown>));
    return [];
  }, [gapRes]);

  const [gaps, setGaps] = React.useState<GapItem[]>(() =>
    store.gapItems.length > 0 ? store.gapItems : [],
  );

  /* Load from API on initial mount only — do not overwrite local state on subsequent refetches */
  const hasInitiallyLoaded = React.useRef(false);
  React.useEffect(() => {
    if (apiGaps.length > 0 && !hasInitiallyLoaded.current) {
      setGaps(apiGaps);
      hasInitiallyLoaded.current = true;
    }
  }, [apiGaps]);

  const [selectedGapId, setSelectedGapId] = React.useState<string | null>(null);
  const [chatHistory, setChatHistory] = React.useState<Record<string, ChatMessage[]>>({});
  // suggestionStates: msgId → { suggIdx → "accepted" | "dismissed" }
  const [suggestionStates, setSuggestionStates] = React.useState<Record<string, Record<number, "accepted" | "dismissed">>>({});
  const [chatInput, setChatInput] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [fpInput, setFpInput] = React.useState<Record<string, string>>({});
  const [showAcceptModal, setShowAcceptModal] = React.useState(false);

  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const selectedGap = gaps.find((g) => g.id === selectedGapId) ?? null;
  const currentChat = selectedGapId ? (chatHistory[selectedGapId] ?? []) : [];

  const unreviewedCount = store.extractionItems.filter((e) => e.reviewState === "pending").length;

  /* ── Derived counts ── */
  const criticalGaps  = gaps.filter((g) => g.severity === "critical");
  const importantGaps = gaps.filter((g) => g.severity === "important");
  const optionalGaps  = gaps.filter((g) => g.severity === "optional");

  const unresolvedCritical      = criticalGaps.filter((g) => !g.isResolved);
  const unacknowledgedImportant = importantGaps.filter((g) => !g.isAcknowledged && !g.isResolved);
  const prohibitedCount         = gaps.filter((g) => g.isProhibited && !g.isResolved).length;
  const resolvedCritical        = criticalGaps.filter((g) => g.isResolved).length;
  const handledImportant        = importantGaps.filter((g) => g.isAcknowledged || g.isResolved).length;
  const dismissedOptional       = optionalGaps.filter((g) => g.isDismissed).length;

  const canProceed =
    unresolvedCritical.length === 0 &&
    unacknowledgedImportant.length === 0 &&
    prohibitedCount === 0;

  /* ── Auto scroll chat ── */
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat.length]);

  /* ── Gap actions ── */
  const resolveGap = React.useCallback((id: string) => {
    setGaps((p) => p.map((g) => g.id === id ? { ...g, isResolved: true } : g));
    if (sowId) updateGapItem.mutate({ gapId: id, data: { is_resolved: true } });
  }, [sowId, updateGapItem]);

  const acknowledgeGap = React.useCallback((id: string) => {
    setGaps((p) => p.map((g) => {
      if (g.id !== id) return g;
      const next = !g.isAcknowledged;
      if (sowId) updateGapItem.mutate({ gapId: id, data: { is_acknowledged: next } });
      return { ...g, isAcknowledged: next };
    }));
  }, [sowId, updateGapItem]);

  const dismissGap = React.useCallback((id: string) => {
    setGaps((p) => p.map((g) => g.id === id ? { ...g, isDismissed: true } : g));
    if (sowId) updateGapItem.mutate({ gapId: id, data: { is_dismissed: true } });
  }, [sowId, updateGapItem]);

  const resetGap = React.useCallback((id: string) => {
    setGaps((p) => p.map((g) => g.id === id ? { ...g, isResolved: false, isAcknowledged: false, isDismissed: false } : g));
    if (sowId) updateGapItem.mutate({ gapId: id, data: { is_resolved: false, is_acknowledged: false, is_dismissed: false } });
  }, [sowId, updateGapItem]);

  /* ── Select gap ── */
  const handleSelectGap = (gap: GapItem) => {
    setSelectedGapId(gap.id);
    setChatInput("");
    if (!chatHistory[gap.id]) {
      setChatHistory((prev) => ({
        ...prev,
        [gap.id]: [
          {
            id: "init",
            role: "system",
            content: `Reviewing: "${gap.title}"`,
          },
        ],
      }));
    }
  };

  /* ── Generate AI suggestion ── */
  const handleGenerateAI = () => {
    if (!selectedGapId || isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => {
      const msgId = `ai-${Date.now()}`;
      setChatHistory((prev) => ({
        ...prev,
        [selectedGapId]: [
          ...(prev[selectedGapId] ?? []),
          {
            id: msgId,
            role: "ai",
            content: "Here are AI-generated remediation suggestions. Accept or dismiss each one:",
            suggestions: AI_REMEDIATION,
          },
        ],
      }));
      setIsGenerating(false);
    }, 1400);
  };

  const handleAcceptSuggestion = React.useCallback((msgId: string, idx: number, _text: string) => {
    setSuggestionStates((prev) => ({
      ...prev,
      [msgId]: { ...(prev[msgId] ?? {}), [idx]: "accepted" },
    }));
    // Auto-resolve the gap when any suggestion is accepted
    if (selectedGapId) resolveGap(selectedGapId);
  }, [selectedGapId, resolveGap]);

  const handleDismissSuggestion = React.useCallback((msgId: string, idx: number) => {
    setSuggestionStates((prev) => ({
      ...prev,
      [msgId]: { ...(prev[msgId] ?? {}), [idx]: "dismissed" },
    }));
  }, []);

  /* ── Send user message ── */
  const handleSend = () => {
    if (!selectedGapId || !chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatHistory((prev) => ({
      ...prev,
      [selectedGapId]: [
        ...(prev[selectedGapId] ?? []),
        { id: `user-${Date.now()}`, role: "user", content: msg },
      ],
    }));
    setChatInput("");
  };

  /* ── Apply & Resolve from chat ── */
  const handleApplyResolve = () => {
    if (!selectedGapId) return;
    resolveGap(selectedGapId);
    setChatHistory((prev) => ({
      ...prev,
      [selectedGapId]: [
        ...(prev[selectedGapId] ?? []),
        { id: `sys-${Date.now()}`, role: "system", content: "Gap marked as resolved." },
      ],
    }));
  };

  /* ── False positive submit ── */
  const handleFPSubmit = (id: string) => {
    const text = fpInput[id] || "";
    if (text.length < 30) return;
    resolveGap(id);
    setChatHistory((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] ?? []),
        { id: `sys-${Date.now()}`, role: "system", content: "Marked as false positive and resolved." },
      ],
    }));
  };

  const handleAcceptAllPending = () => { store.acceptAllPending(); setShowAcceptModal(false); };
  const handleContinue = () => { store.setGapItems(gaps); store.setFlowStep(5); router.push("/enterprise/sow/upload/details"); };

  /* ══ Render ══ */
  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col h-full">

        <motion.div variants={fadeUp} className="mb-6">
          <FlowStepProgress currentStep={4} />
        </motion.div>

        <motion.div variants={fadeUp} className="mb-5">
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">
            Gap Analysis Resolution
          </h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Select a gap on the left to review, configure, or generate AI remediation suggestions.
          </p>
        </motion.div>

        {/* Summary strip */}
        <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-4">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            <div className="px-5 py-3.5 flex items-center gap-3">
              <span className={cn("num-display text-[22px] leading-none", unresolvedCritical.length === 0 ? "text-forest-600" : "text-red-500")}>
                {resolvedCritical}/{criticalGaps.length}
              </span>
              <span className="text-[11px] text-gray-400 leading-tight">Critical<br />resolved</span>
            </div>
            <div className="px-5 py-3.5 flex items-center gap-3">
              <span className={cn("num-display text-[22px] leading-none", unacknowledgedImportant.length === 0 ? "text-forest-600" : "text-amber-500")}>
                {handledImportant}/{importantGaps.length}
              </span>
              <span className="text-[11px] text-gray-400 leading-tight">Important<br />acknowledged</span>
            </div>
            <div className="px-5 py-3.5 flex items-center gap-3">
              <span className="num-display text-[22px] leading-none text-gray-500">
                {dismissedOptional}/{optionalGaps.length}
              </span>
              <span className="text-[11px] text-gray-400 leading-tight">Optional<br />dismissed</span>
            </div>
            <div className={cn("px-5 py-3.5 flex items-center gap-2", canProceed ? "bg-forest-50/50" : "bg-red-50/40")}>
              {canProceed ? (
                <><CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" /><span className="text-[12px] font-medium text-forest-700">Ready to proceed</span></>
              ) : (
                <><AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /><span className="text-[12px] font-medium text-red-600">{unresolvedCritical.length + unacknowledgedImportant.length + prohibitedCount} item{unresolvedCritical.length + unacknowledgedImportant.length + prohibitedCount !== 1 ? "s" : ""} remaining</span></>
              )}
            </div>
          </div>
        </motion.div>

        {/* Split layout */}
        <motion.div variants={fadeUp} className="grid grid-cols-[300px_1fr] gap-4 flex-1 min-h-0" style={{ height: "380px" }}>

          {/* ── LEFT: Gap list ── */}
          <div className="card-parchment flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="text-[12px] font-semibold text-gray-700">All Gaps
                <span className="ml-1.5 text-[10px] font-normal text-gray-400">({gaps.length} total)</span>
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {/* Loading skeleton */}
              {gapsLoading && gaps.length === 0 && (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-gray-100 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-2.5 w-full" />
                      <Skeleton className="h-2.5 w-2/3" />
                    </div>
                  ))}
                </div>
              )}
              {/* Empty state */}
              {!gapsLoading && gaps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-center px-4">
                  <CheckCircle2 className="w-8 h-8 text-forest-300 mb-2" />
                  <p className="text-[12px] font-medium text-gray-500">No gaps detected</p>
                  <p className="text-[11px] text-gray-400 mt-1">Your SOW meets all required standards.</p>
                </div>
              )}
              {/* Critical */}
              {criticalGaps.length > 0 && (
                <>
                  <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-1 pt-1 pb-0.5">Critical</p>
                  {criticalGaps.map((gap) => (
                    <GapRow key={gap.id} gap={gap} isSelected={selectedGapId === gap.id} onClick={() => handleSelectGap(gap)} />
                  ))}
                </>
              )}
              {/* Important */}
              {importantGaps.length > 0 && (
                <>
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest px-1 pt-2 pb-0.5">Important</p>
                  {importantGaps.map((gap) => (
                    <GapRow key={gap.id} gap={gap} isSelected={selectedGapId === gap.id} onClick={() => handleSelectGap(gap)} />
                  ))}
                </>
              )}
              {/* Optional */}
              {optionalGaps.length > 0 && (
                <>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1 pt-2 pb-0.5">Optional</p>
                  {optionalGaps.map((gap) => (
                    <GapRow key={gap.id} gap={gap} isSelected={selectedGapId === gap.id} onClick={() => handleSelectGap(gap)} />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT: Chat window ── */}
          <div className="card-parchment flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {!selectedGap ? (
                /* Empty state */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-8"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-[14px] font-semibold text-gray-500 mb-1">Select a gap to begin</p>
                  <p className="text-[12px] text-gray-400 max-w-[260px] leading-relaxed">
                    Click any gap on the left to review details, generate AI suggestions, or manually configure a resolution.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedGap.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Chat header — gap info */}
                  {(() => {
                    const cfg = SEV[selectedGap.severity];
                    const SevIcon = cfg.icon;
                    const isHandled = selectedGap.isResolved || selectedGap.isAcknowledged || selectedGap.isDismissed;
                    return (
                      <div className="shrink-0 px-5 py-3.5 border-b border-gray-100" style={{ background: "linear-gradient(160deg, #FEFDFB, #FAF8F5)" }}>
                        <div className="flex items-start gap-3">
                          <div className={cn("shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5",
                            selectedGap.severity === "critical" ? "bg-red-50 border border-red-200" :
                            selectedGap.severity === "important" ? "bg-amber-50 border border-amber-200" :
                            "bg-gray-50 border border-gray-200"
                          )}>
                            <SevIcon className={cn("w-4 h-4", cfg.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13px] font-bold text-gray-800 leading-snug">{selectedGap.title}</p>
                              <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", cfg.badgeBg)}>
                                {cfg.label}
                              </span>
                              {selectedGap.isProhibited && (
                                <span className="text-[9px] font-bold text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">Prohibited</span>
                              )}
                              {isHandled && (
                                <span className="text-[9px] font-bold text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  {selectedGap.isResolved ? "Resolved" : selectedGap.isAcknowledged ? "Acknowledged" : "Dismissed"}
                                </span>
                              )}
                            </div>
                            <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed">{selectedGap.description}</p>
                          </div>
                          {isHandled && (
                            <button type="button" onClick={() => resetGap(selectedGap.id)}
                              className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-gray-500 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
                              <Undo2 className="w-3 h-3" /> Reset
                            </button>
                          )}
                        </div>

                        {/* Quick actions row */}
                        {!isHandled && (
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {selectedGap.severity === "important" && (
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={selectedGap.isAcknowledged} onChange={() => acknowledgeGap(selectedGap.id)}
                                  className="w-3.5 h-3.5 rounded border-gray-300 accent-amber-500" />
                                <span className="text-[11px] text-gray-600">Acknowledge this gap</span>
                              </label>
                            )}
                            {selectedGap.severity === "optional" && (
                              <button type="button" onClick={() => dismissGap(selectedGap.id)}
                                className="flex items-center gap-1 text-[11px] font-medium text-red-500 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 transition-all">
                                <Ban className="w-3 h-3" /> Exclude
                              </button>
                            )}
                            {selectedGap.severity === "critical" && !selectedGap.isProhibited && (
                              <button type="button" onClick={handleApplyResolve}
                                className="flex items-center gap-1 text-[11px] font-medium text-forest-700 px-3 py-1.5 rounded-lg border border-forest-200 bg-forest-50 hover:bg-forest-100 transition-all">
                                <CheckCircle2 className="w-3 h-3" /> Mark Resolved
                              </button>
                            )}
                          </div>
                        )}

                        {/* False positive (prohibited) */}
                        {selectedGap.isProhibited && !selectedGap.isResolved && (
                          <div className="mt-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                            <p className="text-[11px] font-semibold text-orange-700 mb-1.5">False Positive — Justification required (min 30 chars)</p>
                            <textarea
                              value={fpInput[selectedGap.id] || ""}
                              onChange={(e) => setFpInput((p) => ({ ...p, [selectedGap.id]: e.target.value }))}
                              placeholder="Explain why this is a false positive…"
                              rows={2}
                              className="w-full text-[11px] rounded-lg border border-orange-200 px-2.5 py-1.5 resize-none focus:outline-none focus:border-orange-400 bg-white placeholder:text-gray-300"
                            />
                            <div className="flex items-center justify-between mt-1.5">
                              <span className={cn("text-[10px] font-medium tabular-nums", (fpInput[selectedGap.id] || "").length < 30 ? "text-red-400" : "text-forest-600")}>
                                {(fpInput[selectedGap.id] || "").length} / 30 min
                              </span>
                              <button type="button" onClick={() => handleFPSubmit(selectedGap.id)}
                                disabled={(fpInput[selectedGap.id] || "").length < 30}
                                className={cn("text-[10px] font-semibold px-3 py-1 rounded-lg border transition-all",
                                  (fpInput[selectedGap.id] || "").length >= 30
                                    ? "text-white bg-orange-500 border-orange-500 hover:bg-orange-600"
                                    : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed")}>
                                Submit False Positive
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Chat messages area */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
                    {currentChat.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        msg={msg}
                        suggStates={suggestionStates[msg.id]}
                        onAccept={(idx, text) => handleAcceptSuggestion(msg.id, idx, text)}
                        onDismiss={(idx) => handleDismissSuggestion(msg.id, idx)}
                        onEdit={() => {}}
                      />
                    ))}
                    {isGenerating && (
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-teal-50 border border-teal-100">
                          {[0, 1, 2].map((i) => (
                            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-400"
                              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.9, delay: i * 0.2, repeat: Infinity }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input area */}
                  <div className="shrink-0 border-t border-gray-100 px-4 py-3 space-y-2.5" style={{ background: "linear-gradient(160deg, #FEFDFB, #FAF8F5)" }}>
                    {/* Generate AI button */}
                    <button type="button" onClick={handleGenerateAI} disabled={isGenerating}
                      className="flex items-center gap-2 text-[11.5px] font-semibold text-teal-700 px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      <Sparkles className="w-3.5 h-3.5" />
                      {isGenerating ? "Generating…" : "Generate AI Suggestion"}
                    </button>

                    {/* Text input + send */}
                    <div className="flex items-end gap-2">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type your configuration or notes…"
                        rows={2}
                        className="flex-1 text-[12.5px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-100 resize-none placeholder:text-gray-300 transition-all"
                      />
                      <button type="button" onClick={handleSend} disabled={!chatInput.trim()}
                        className={cn(
                          "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          chatInput.trim()
                            ? "bg-gradient-to-br from-brown-400 to-brown-600 text-white shadow-sm hover:from-brown-500 hover:to-brown-700"
                            : "bg-gray-100 text-gray-300 cursor-not-allowed",
                        )}>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>

        {/* Footer nav */}
        <motion.div variants={fadeUp} className="flex items-center justify-between mt-4">
          <button type="button"
            onClick={() => router.push("/enterprise/sow/upload/review")}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Review
          </button>
          {unreviewedCount > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl">
              <Clock className="w-3.5 h-3.5" />
              {unreviewedCount} unreviewed extraction{unreviewedCount !== 1 ? "s" : ""}
              <button type="button" onClick={() => setShowAcceptModal(true)} className="font-semibold underline underline-offset-2">Accept all</button>
            </div>
          )}
          <button type="button"
            onClick={handleContinue}
            disabled={!canProceed}
            className={cn(
              "flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all",
              canProceed
                ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-sm"
                : "text-gray-400 bg-gray-100 cursor-not-allowed",
            )}>
            Continue to Project Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </motion.div>

      {/* Accept All Pending modal */}
      <AnimatePresence>
        {showAcceptModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowAcceptModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-[15px] font-semibold text-gray-800">Accept All Pending?</h3>
              </div>
              <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
                This will accept all <span className="font-semibold text-gray-700">{unreviewedCount}</span> pending extraction items as-is.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAcceptModal(false)}
                  className="flex-1 text-[12px] font-medium text-gray-600 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                <button type="button" onClick={handleAcceptAllPending}
                  className="flex-1 text-[12px] font-semibold text-white bg-amber-500 hover:bg-amber-600 py-2.5 rounded-xl transition-all">Accept All</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
