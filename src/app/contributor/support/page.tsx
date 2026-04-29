"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BookOpen, Send, ChevronRight, HelpCircle,
  CreditCard, Wrench, Rocket, Phone, Mail,
  CheckCircle2, MessageSquare, ChevronDown, X, Plus, FileText,
  Shield, Scale, Paperclip,
  Eye, EyeOff, TriangleAlert, Lock, Upload,
  RefreshCw, AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Input, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { mockSupportTickets } from "@/mocks/data/contributor";
import {
  fetchSupportFaqs, type SupportFaqItem,
  fetchSupportTickets, type SupportTicketItem,
  fetchSupportTicketDetail, type SupportTicketDetail,
  createSupportTicket,
  postSupportTicketMessage,
  updateSupportTicketStatus, type SupportTicketStatus,
  fetchGrievances, type GrievanceItem,
  createGrievance,
  fetchGrievanceDetail, type GrievanceDetail,
  createSafetyReport,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/stores/toast-store";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

const statusColors: Record<string, { color: string; bg: string; label: string }> = {
  open:            { color: "text-teal-700",   bg: "bg-teal-50",   label: "Open" },
  in_progress:     { color: "text-gold-700",   bg: "bg-gold-50",   label: "In Progress" },
  waiting_on_user: { color: "text-brown-700",  bg: "bg-brown-50",  label: "Awaiting Reply" },
  resolved:        { color: "text-forest-700", bg: "bg-forest-50", label: "Resolved" },
  closed:          { color: "text-gray-500",   bg: "bg-gray-100",  label: "Closed" },
  submitted:       { color: "text-teal-700",   bg: "bg-teal-50",   label: "Submitted" },
  under_review:    { color: "text-gold-700",   bg: "bg-gold-50",   label: "Under Review" },
  investigation:   { color: "text-brown-700",  bg: "bg-brown-50",  label: "Investigation" },
};

const priorityColors: Record<string, { color: string; bg: string; label: string }> = {
  low:    { color: "text-gray-600",   bg: "bg-gray-100",  label: "Low" },
  medium: { color: "text-teal-700",   bg: "bg-teal-50",   label: "Medium" },
  high:   { color: "text-gold-700",   bg: "bg-gold-50",   label: "High" },
  urgent: { color: "text-red-600",    bg: "bg-red-50",    label: "Urgent" },
};

function Pill({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full", color, bg)}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DRAWER — Right slide-over (consistent with SOW generate page)
   ═══════════════════════════════════════════════════════════════ */

const fieldLabel = "mb-1.5 block text-[12px] font-semibold text-gray-600";

function FormDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */

/* mockGrievances removed — replaced by real API */

const grievanceCategoryLabels: Record<string, string> = {
  review_dispute: "Review Decision Dispute",
  payment_dispute: "Payment Dispute",
  unfair_treatment: "Unfair Treatment",
  accessibility: "Accessibility Issue",
  other: "Other",
};

const safetyCategoryLabels: Record<string, string> = {
  harassment: "Harassment",
  threatening: "Threatening Behavior",
  inappropriate: "Inappropriate Content",
  discrimination: "Discrimination",
  fraud: "Fraud / Scam",
  other: "Other Safety Concern",
};

/* ── Category slug → label + icon mapping ── */
const categoryMeta: Record<string, { label: string; icon: React.ElementType }> = {
  "getting-started":   { label: "Getting Started",      icon: Rocket },
  "getting_started":   { label: "Getting Started",      icon: Rocket },
  tasks:               { label: "Tasks & Submissions",  icon: CheckCircle2 },
  tasks_submissions:   { label: "Tasks & Submissions",  icon: CheckCircle2 },
  payments:            { label: "Payments & Earnings",  icon: CreditCard },
  payments_earnings:   { label: "Payments & Earnings",  icon: CreditCard },
  technical:           { label: "Technical Issues",     icon: Wrench },
  account:             { label: "Account & Safety",     icon: Shield },
  account_safety:      { label: "Account & Safety",     icon: Shield },
};

function getCategoryMeta(slug: string) {
  return categoryMeta[slug] ?? { label: slug.replace(/_|-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), icon: HelpCircle };
}

/* Group flat FAQ items by category slug */
function groupByCategory(items: SupportFaqItem[]): Array<{ id: string; label: string; icon: React.ElementType; articles: SupportFaqItem[] }> {
  const map = new Map<string, SupportFaqItem[]>();
  items.forEach((item) => {
    const existing = map.get(item.category) ?? [];
    map.set(item.category, [...existing, item]);
  });
  return Array.from(map.entries()).map(([slug, articles]) => ({
    id: slug,
    ...getCategoryMeta(slug),
    articles,
  }));
}

/* ═══════════════════════════════════════════════════════════════
   DRAWER FORMS
   ═══════════════════════════════════════════════════════════════ */

function NewTicketForm({
  token,
  onClose,
  onSuccess,
}: {
  token: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [subject,     setSubject]     = React.useState("");
  const [category,    setCategory]    = React.useState("technical");
  const [priority,    setPriority]    = React.useState("medium");
  const [description, setDescription] = React.useState("");
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const [submitting,  setSubmitting]  = React.useState(false);
  const [submitted,   setSubmitted]   = React.useState(false);
  const [ticketId,    setTicketId]    = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const canSubmit = subject.trim() && description.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createSupportTicket(token, {
        subject:        subject.trim(),
        category,
        priority,
        description:    description.trim(),
        attachment_ids: [],
      });
      setTicketId(result.id);
      setSubmitted(true);
      onSuccess?.();
      setTimeout(() => onClose(), 3500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit ticket. Please try again.";
      setSubmitError(msg);
      toast.error("Ticket Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTicketFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
    e.currentTarget.value = "";
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-forest-500" />
        </div>
        <h3 className="text-[16px] font-semibold text-gray-800 mb-1">Ticket Submitted</h3>
        <p className="text-[13px] text-gray-500 mb-2">
          Reference: <span className="font-mono font-semibold text-brown-600">{ticketId}</span>
        </p>
        <p className="text-[12px] text-gray-400">Expected response: within 24 hours</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={fieldLabel}>Subject *</label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={fieldLabel}>Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="technical">Technical Issue</SelectItem>
              <SelectItem value="account">Account Issue</SelectItem>
              <SelectItem value="task_question">Task Question</SelectItem>
              <SelectItem value="payment">Payment Issue</SelectItem>
              <SelectItem value="safety">Safety Concern</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={fieldLabel}>Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className={fieldLabel}>Description *</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue in detail. Include task IDs, error messages, and steps to reproduce if applicable."
          className="min-h-[120px]"
        />
      </div>
      <div>
        <label className={fieldLabel}>Attachments</label>
        <div className="flex flex-wrap items-center gap-2">
          {attachments.map((file, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Paperclip className="w-3 h-3 text-gray-400" /> {file}
              <button onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input ref={fileInputRef} onChange={handleTicketFiles} aria-hidden multiple type="file" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Upload className="w-3 h-3" /> Add file
          </button>
        </div>
      </div>

      {/* Inline error */}
      {submitError && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-600 leading-relaxed">{submitError}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={onClose}
          disabled={submitting}
          className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex items-center gap-1.5 text-[12px] font-semibold px-5 py-2 rounded-xl transition-all",
            canSubmit
              ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 cursor-pointer"
              : "bg-gray-100 text-gray-400 cursor-not-allowed",
          )}
        >
          {submitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" /> Submit Ticket
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function NewGrievanceForm({
  token,
  onClose,
  onSuccess,
}: {
  token: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [grvCategory,    setGrvCategory]    = React.useState("review_dispute");
  const [grvSubject,     setGrvSubject]     = React.useState("");
  const [grvDescription, setGrvDescription] = React.useState("");
  const [grvTaskId,      setGrvTaskId]      = React.useState("");
  const [grvAnonymous,   setGrvAnonymous]   = React.useState(false);
  const [grvAttachments, setGrvAttachments] = React.useState<string[]>([]);
  const [submitting,     setSubmitting]     = React.useState(false);
  const [submitted,      setSubmitted]      = React.useState(false);
  const [refId,          setRefId]          = React.useState("");
  const [submitError,    setSubmitError]    = React.useState<string | null>(null);
  const grvFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const canSubmit = grvSubject.trim() && grvDescription.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createGrievance(token, {
        category:          grvCategory,
        subject:           grvSubject.trim(),
        description:       grvDescription.trim(),
        related_reference: grvTaskId.trim() || undefined,
        anonymous:         grvAnonymous,
        attachment_ids:    [],
      });
      setRefId(result.id);
      setSubmitted(true);
      onSuccess?.();
      setTimeout(() => onClose(), 3500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit grievance. Please try again.";
      setSubmitError(msg);
      toast.error("Grievance Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrvFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setGrvAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
    e.currentTarget.value = "";
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-forest-500" />
        </div>
        <h3 className="text-[16px] font-semibold text-gray-800 mb-1">Grievance Submitted</h3>
        <p className="text-[13px] text-gray-500 mb-2">Reference: <span className="font-mono font-semibold text-brown-600">{refId}</span></p>
        <p className="text-[12px] text-gray-400">Expected response: 5 business days</p>
        <p className="text-[11px] text-gray-400 mt-1">Reviewed by an independent team</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={fieldLabel}>Category</label>
        <Select value={grvCategory} onValueChange={setGrvCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(grievanceCategoryLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className={fieldLabel}>Subject *</label>
        <Input value={grvSubject} onChange={(e) => setGrvSubject(e.target.value)} placeholder="Briefly describe your grievance" />
      </div>
      <div>
        <label className={fieldLabel}>Description *</label>
        <Textarea value={grvDescription} onChange={(e) => setGrvDescription(e.target.value)} placeholder="Include relevant dates, task IDs, and what outcome you're seeking." className="min-h-[120px]" />
      </div>
      <div>
        <label className={fieldLabel}>Related Task / Project</label>
        <Input value={grvTaskId} onChange={(e) => setGrvTaskId(e.target.value)} placeholder="e.g. ctask-004 or project name" />
      </div>
      <div>
        <label className={fieldLabel}>Evidence / Documentation</label>
        <div className="flex flex-wrap items-center gap-2">
          {grvAttachments.map((file, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Paperclip className="w-3 h-3 text-gray-400" /> {file}
              <button onClick={() => setGrvAttachments((p) => p.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <input ref={grvFileInputRef} onChange={handleGrvFiles} aria-hidden multiple type="file" className="hidden" />
          <button onClick={() => grvFileInputRef.current?.click()} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors">
            <Upload className="w-3 h-3" /> Upload evidence
          </button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={grvAnonymous} onChange={(e) => setGrvAnonymous(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-brown-500" />
          <div>
            <p className="text-[12px] font-medium text-gray-700 flex items-center gap-1.5"><Lock className="w-3 h-3 text-gray-400" /> Keep my identity anonymous</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Hidden from the other party. Known only to the review team.</p>
          </div>
        </label>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-600 leading-relaxed">{submitError}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onClose} disabled={submitting} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn("flex items-center gap-1.5 text-[12px] font-semibold px-5 py-2 rounded-xl transition-all", canSubmit ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed")}
        >
          {submitting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting…</> : <><Scale className="w-3.5 h-3.5" /> Submit Grievance</>}
        </button>
      </div>
    </div>
  );
}

function SafetyReportForm({ onClose, token }: { onClose: () => void; token: string }) {
  const [safetyCategory, setSafetyCategory] = React.useState("harassment");
  const [safetyDescription, setSafetyDescription] = React.useState("");
  const [safetyRelated, setSafetyRelated] = React.useState("");
  const [safetyAttachments, setSafetyAttachments] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [refId, setRefId] = React.useState("");
  const safetyFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSubmit = async () => {
    if (!safetyDescription.trim() || !token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createSafetyReport(token, {
        category: safetyCategory,
        description: safetyDescription.trim(),
        related_reference: safetyRelated.trim() || undefined,
        attachment_ids: safetyAttachments.length > 0 ? safetyAttachments : undefined,
      });
      setRefId(result.id);
      setSubmitted(true);
      setTimeout(() => onClose(), 4000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit report. Please try again.";
      setSubmitError(msg);
      toast.error("Safety Report", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSafetyFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setSafetyAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
    e.currentTarget.value = "";
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-forest-500" />
        </div>
        <h3 className="text-[16px] font-semibold text-gray-800 mb-1">Report Received</h3>
        <p className="text-[13px] text-gray-500 mb-2">Reference: <span className="font-mono font-semibold text-brown-600">{refId}</span></p>
        <p className="text-[12px] text-gray-400">Safety team will review within 24 hours</p>
        <p className="text-[11px] text-gray-400 mt-1">The reported person will not know your identity</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-200">
        <Lock className="w-4 h-4 text-gray-400 shrink-0" />
        <p className="text-[11px] text-gray-500">This report is <span className="font-medium text-gray-700">confidential by default</span>. Your identity is protected.</p>
      </div>
      <div>
        <label className={fieldLabel}>Category</label>
        <Select value={safetyCategory} onValueChange={setSafetyCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(safetyCategoryLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className={fieldLabel}>Description *</label>
        <Textarea value={safetyDescription} onChange={(e) => setSafetyDescription(e.target.value)} placeholder="Describe what happened, when, and who was involved." className="min-h-[120px]" />
      </div>
      <div>
        <label className={fieldLabel}>Related person / task / project</label>
        <Input value={safetyRelated} onChange={(e) => setSafetyRelated(e.target.value)} placeholder="e.g. contributor ID, task ID, or project name" />
      </div>
      <div>
        <label className={fieldLabel}>Evidence</label>
        <div className="flex flex-wrap items-center gap-2">
          {safetyAttachments.map((file, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Paperclip className="w-3 h-3 text-gray-400" /> {file}
              <button onClick={() => setSafetyAttachments((p) => p.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <input ref={safetyFileInputRef} onChange={handleSafetyFiles} aria-hidden multiple type="file" className="hidden" />
          <button onClick={() => safetyFileInputRef.current?.click()} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors">
            <Upload className="w-3 h-3" /> Upload evidence
          </button>
        </div>
      </div>
      {submitError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-600">{submitError}</p>
        </div>
      )}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onClose} disabled={submitting} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50">Cancel</button>
        <button onClick={handleSubmit} disabled={!safetyDescription.trim() || submitting} className={cn("flex items-center gap-1.5 text-[12px] font-semibold px-5 py-2 rounded-xl transition-all", safetyDescription.trim() && !submitting ? "text-white bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
          {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
          {submitting ? "Submitting…" : "Submit Report"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — HELP CENTER (real API)
   ═══════════════════════════════════════════════════════════════ */

function FaqSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm px-5 py-4 animate-pulse flex items-center gap-3.5">
          <div className="w-6 h-6 rounded-lg bg-gray-200 shrink-0" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}

function HelpCenterTab({ token }: { token: string }) {
  const [allFaqs,       setAllFaqs]       = React.useState<SupportFaqItem[]>([]);
  const [loading,       setLoading]       = React.useState(true);
  const [error,         setError]         = React.useState<string | null>(null);
  const [searchQuery,   setSearchQuery]   = React.useState("");
  const [searching,     setSearching]     = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<SupportFaqItem[] | null>(null);
  const [activeCategory,   setActiveCategory]   = React.useState("");
  const [expandedArticle,  setExpandedArticle]  = React.useState<string | null>(null);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Initial load — all FAQs ── */
  const loadAll = React.useCallback(async (t: string) => {
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const sk = sessionKeyFragment(t);
      const res = await dedupeAsync(`contrib:support-faqs-all:${sk}`, () => fetchSupportFaqs(t, {}));
      const items = res.items ?? [];
      setAllFaqs(items);
      /* auto-select first category */
      if (items.length > 0) setActiveCategory(items[0].category);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load help articles";
      setError(msg);
      toast.error("Help Center", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { if (token) loadAll(token); }, [token, loadAll]);

  /* ── Debounced search via API ── */
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults(null); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetchSupportFaqs(token, { q: val.trim() });
        setSearchResults(res.items ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const categories = React.useMemo(() => groupByCategory(allFaqs), [allFaqs]);
  const currentCategoryData = categories.find((c) => c.id === activeCategory) ?? categories[0];

  /* ── Articles shown in category view ── */
  const visibleArticles = currentCategoryData?.articles ?? [];

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full text-[13px] text-gray-700 bg-white rounded-xl pl-11 pr-10 py-3 shadow-sm outline-none focus:ring-2 focus:ring-brown-100 transition-all placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(""); setSearchResults(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="bg-white rounded-xl shadow-sm px-5 py-5 mb-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-red-600 mb-1">Could not load help articles</p>
            <p className="text-[11px] text-gray-400 mb-2">{error}</p>
            <button onClick={() => loadAll(token)} className="flex items-center gap-1.5 text-[11px] font-semibold text-brown-600 hover:text-brown-700 transition-colors">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Search results */}
      {searchQuery.trim() ? (
        <div>
          <p className="text-[11px] text-gray-400 mb-3">
            {searching ? "Searching…" : `${(searchResults ?? []).length} result${(searchResults ?? []).length !== 1 ? "s" : ""} for "${searchQuery}"`}
          </p>
          {searching ? (
            <FaqSkeleton />
          ) : (searchResults ?? []).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm py-12 text-center">
              <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-[13px] text-gray-500">No articles match your search</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(searchResults ?? []).map((r) => {
                const { label: catLabel } = getCategoryMeta(r.category);
                const isOpen = expandedArticle === r.id;
                return (
                  <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onClick={() => setExpandedArticle(isOpen ? null : r.id)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50/50 transition-colors">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-700">{r.question}</p>
                        <p className="text-[10px] text-gray-400">{catLabel}</p>
                      </div>
                      <ChevronDown className={cn("w-3.5 h-3.5 text-gray-300 shrink-0 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pl-12">
                        <p className="text-[12px] text-gray-500 leading-relaxed">{r.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Category browse */
        loading ? (
          <div>
            {/* Category pill skeletons */}
            <div className="flex items-center gap-1.5 mb-5 flex-wrap animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 w-28 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <FaqSkeleton />
          </div>
        ) : !error && categories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm py-12 text-center">
            <HelpCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-[13px] text-gray-500">No help articles available</p>
          </div>
        ) : (
          <div>
            {/* Category pills */}
            <div className="flex items-center gap-1.5 mb-5 flex-wrap">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setExpandedArticle(null); }}
                    className={cn("flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-lg transition-all", isActive ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600 hover:bg-white/50")}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-brown-500" : "text-gray-400")} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Articles */}
            <div className="space-y-2">
              {visibleArticles.map((art, idx) => {
                const key = `${activeCategory}-${art.id}`;
                const isOpen = expandedArticle === key;
                return (
                  <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onClick={() => setExpandedArticle(isOpen ? null : key)} className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors">
                      <span className="w-6 h-6 rounded-lg bg-brown-50 flex items-center justify-center shrink-0 text-[10px] font-bold text-brown-400">{idx + 1}</span>
                      <span className="flex-1 text-[13px] font-medium text-gray-800">{art.question}</span>
                      <ChevronDown className={cn("w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-5 pb-5 pl-15">
                            <div className="border-t border-gray-50 pt-3">
                              <p className="text-[12px] text-gray-500 leading-[1.8]">{art.answer}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Emergency contact */}
      <div className="mt-6 bg-white rounded-xl shadow-sm px-5 py-4 flex items-center gap-4">
        <Phone className="w-4 h-4 text-gold-500 shrink-0" />
        <div className="flex-1">
          <p className="text-[12px] font-medium text-gray-700">Need urgent help?</p>
          <p className="text-[10px] text-gray-400">For live delivery or account security issues.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <a href="tel:+18005550199" className="text-[10px] font-medium text-gray-500 hover:text-brown-600 transition-colors">+1 (800) 555-0199</a>
          <a href="mailto:urgent@glimmora.com" className="text-[10px] font-medium text-gray-500 hover:text-brown-600 transition-colors">urgent@glimmora.com</a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — SUPPORT TICKETS (real API)
   ═══════════════════════════════════════════════════════════════ */

function TicketRowSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm px-5 py-4 animate-pulse flex items-center gap-4">
      <div className="w-8 h-8 rounded-xl bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-48 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-4 w-14 bg-gray-200 rounded-full" />
          <div className="h-4 w-14 bg-gray-200 rounded-full" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
    </div>
  );
}

function TicketsTab({
  token,
  onOpenDrawer,
  onCountChange,
}: {
  token: string;
  onOpenDrawer: () => void;
  onCountChange: (count: number) => void;
}) {
  const [tickets,        setTickets]        = React.useState<SupportTicketItem[]>([]);
  const [loading,        setLoading]        = React.useState(true);
  const [error,          setError]          = React.useState<string | null>(null);
  const [statusFilter,   setStatusFilter]   = React.useState("all");
  const [expandedTicket, setExpandedTicket] = React.useState<string | null>(null);

  /* Detail cache: ticket_id → full detail (fetched on first expand) */
  const [detailCache,   setDetailCache]   = React.useState<Record<string, SupportTicketDetail>>({});
  const [detailLoading, setDetailLoading] = React.useState<Set<string>>(new Set());
  const [detailError,   setDetailError]   = React.useState<Record<string, string>>({});

  /* Reply state per ticket */
  const [replyText,     setReplyText]     = React.useState<Record<string, string>>({});
  const [replySending,  setReplySending]  = React.useState<Set<string>>(new Set());
  const [replyError,    setReplyError]    = React.useState<Record<string, string>>({});

  /* Status update in-flight per ticket */
  const [statusUpdating, setStatusUpdating] = React.useState<Set<string>>(new Set());

  const applyStatusToCaches = React.useCallback((ticketId: string, newStatus: string, updatedAt?: string) => {
    setTickets((prev) => prev.map((tk) => tk.id === ticketId ? { ...tk, status: newStatus, updated_at: updatedAt ?? tk.updated_at } : tk));
    setDetailCache((prev) => {
      const existing = prev[ticketId];
      if (!existing) return prev;
      return { ...prev, [ticketId]: { ...existing, status: newStatus, updated_at: updatedAt ?? existing.updated_at } };
    });
  }, []);

  const handleStatusChange = React.useCallback(async (ticketId: string, newStatus: SupportTicketStatus) => {
    if (!token || statusUpdating.has(ticketId)) return;
    setStatusUpdating((prev) => new Set(prev).add(ticketId));
    try {
      const updated = await updateSupportTicketStatus(token, ticketId, newStatus);
      applyStatusToCaches(ticketId, updated.status, updated.updated_at);
      const labels: Record<string, string> = { in_progress: "In Progress", resolved: "Resolved", closed: "Closed", open: "Open" };
      toast.success("Status updated", `Ticket marked as ${labels[updated.status] ?? updated.status}.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update status. Please try again.";
      toast.error("Status update failed", msg);
    } finally {
      setStatusUpdating((prev) => { const s = new Set(prev); s.delete(ticketId); return s; });
    }
  }, [token, statusUpdating, applyStatusToCaches]);

  /* ── Fetch all tickets once ── */
  const load = React.useCallback(async (t: string) => {
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const sk = sessionKeyFragment(t);
      const res = await dedupeAsync(`contrib:support-tickets:${sk}`, () =>
        fetchSupportTickets(t, { page: 1, page_size: 100 }),
      );
      const items = res.items ?? [];
      setTickets(items);
      const openCount = items.filter((tk) =>
        tk.status === "open" || tk.status === "in_progress" || tk.status === "pending",
      ).length;
      onCountChange(openCount);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load tickets";
      setError(msg);
      toast.error("Tickets", msg);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  React.useEffect(() => { if (token) load(token); }, [token, load]);

  /* ── Fetch ticket detail on expand (cached after first load) ── */
  const handleExpand = React.useCallback(async (ticketId: string) => {
    setExpandedTicket((prev) => (prev === ticketId ? null : ticketId));
    if (!token || detailCache[ticketId] || detailLoading.has(ticketId)) return;
    setDetailLoading((prev) => new Set(prev).add(ticketId));
    try {
      const detail = await fetchSupportTicketDetail(token, ticketId);
      setDetailCache((prev) => ({ ...prev, [ticketId]: detail }));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not load ticket details";
      setDetailError((prev) => ({ ...prev, [ticketId]: msg }));
    } finally {
      setDetailLoading((prev) => { const s = new Set(prev); s.delete(ticketId); return s; });
    }
  }, [token, detailCache, detailLoading]);

  /* ── Send a reply message to a ticket ── */
  const handleReply = React.useCallback(async (ticketId: string) => {
    const message = (replyText[ticketId] ?? "").trim();
    if (!message || !token || replySending.has(ticketId)) return;
    setReplySending((prev) => new Set(prev).add(ticketId));
    setReplyError((prev) => { const n = { ...prev }; delete n[ticketId]; return n; });
    try {
      const newMsg = await postSupportTicketMessage(token, ticketId, { message, attachment_ids: [] });
      /* Append new message to cached detail instantly */
      setDetailCache((prev) => {
        const existing = prev[ticketId];
        if (!existing) return prev;
        return { ...prev, [ticketId]: { ...existing, messages: [...existing.messages, newMsg] } };
      });
      /* Clear reply box */
      setReplyText((prev) => { const n = { ...prev }; delete n[ticketId]; return n; });
      toast.success("Reply sent", "Your message has been sent to support.");
      /* Auto-transition Open → In Progress when work begins on the ticket */
      const currentTicket = tickets.find((t) => t.id === ticketId);
      if (currentTicket?.status === "open") {
        try {
          const updated = await updateSupportTicketStatus(token, ticketId, "in_progress");
          applyStatusToCaches(ticketId, updated.status, updated.updated_at);
        } catch { /* best-effort */ }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to send reply. Please try again.";
      setReplyError((prev) => ({ ...prev, [ticketId]: msg }));
      toast.error("Reply failed", msg);
    } finally {
      setReplySending((prev) => { const s = new Set(prev); s.delete(ticketId); return s; });
    }
  }, [token, replyText, replySending, tickets, applyStatusToCaches]);

  /* ── Client-side status filter ── */
  const filteredTickets = React.useMemo(() => {
    if (statusFilter === "all") return tickets;
    if (statusFilter === "resolved") return tickets.filter((t) => t.status === "resolved" || t.status === "closed");
    if (statusFilter === "in_progress") return tickets.filter((t) => t.status === "in_progress" || t.status === "waiting_on_user" || t.status === "pending");
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const statusFilters = [
    { value: "all",         label: "All",         count: tickets.length },
    { value: "open",        label: "Open",        count: tickets.filter((t) => t.status === "open").length },
    { value: "in_progress", label: "In Progress", count: tickets.filter((t) => t.status === "in_progress" || t.status === "waiting_on_user" || t.status === "pending").length },
    { value: "resolved",    label: "Resolved",    count: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn("text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5", statusFilter === f.value ? "bg-brown-50 text-brown-700" : "text-gray-400 hover:text-gray-600")}
            >
              {f.label}
              {f.count > 0 && (
                <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full min-w-4 text-center", statusFilter === f.value ? "bg-brown-100 text-brown-600" : "bg-gray-100 text-gray-400")}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onOpenDrawer}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl bg-brown-500 text-white hover:bg-brown-600 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New Ticket
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-white rounded-xl shadow-sm px-5 py-5 mb-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-red-600 mb-1">Could not load tickets</p>
            <p className="text-[11px] text-gray-400 mb-2">{error}</p>
            <button onClick={() => load(token)} className="flex items-center gap-1.5 text-[11px] font-semibold text-brown-600 hover:text-brown-700 transition-colors">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <TicketRowSkeleton key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredTickets.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm py-14 text-center">
          <MessageSquare className="w-9 h-9 text-gray-200 mx-auto mb-2" />
          <p className="text-[13px] font-medium text-gray-500">No tickets found</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {statusFilter === "all" ? "You haven't submitted any support tickets yet" : `No ${statusFilter.replace("_", " ")} tickets`}
          </p>
        </div>
      )}

      {/* Ticket list */}
      {!loading && !error && filteredTickets.length > 0 && (
        <div className="space-y-2">
          {filteredTickets.map((ticket) => {
            const st      = statusColors[ticket.status]   || statusColors.open;
            const prio    = priorityColors[ticket.priority] || priorityColors.medium;
            const isExpanded = expandedTicket === ticket.id;
            const isResolved = ticket.status === "resolved" || ticket.status === "closed";
            const categoryLabel: Record<string, string> = {
              technical: "Technical Issue", account: "Account Issue",
              task_question: "Task Question", payment: "Payment Issue", safety: "Safety Concern",
            };

            const detail     = detailCache[ticket.id] ?? null;
            const isLoadingDetail = detailLoading.has(ticket.id);
            const detailErr  = detailError[ticket.id] ?? null;

            return (
              <div key={ticket.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => handleExpand(ticket.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", isResolved ? "bg-forest-50" : "bg-teal-50")}>
                    {isResolved
                      ? <CheckCircle2 className="w-4 h-4 text-forest-500" />
                      : <MessageSquare className="w-4 h-4 text-teal-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate mb-0.5">{ticket.subject}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill {...st} />
                      <Pill {...prio} />
                      <span className="text-[10px] text-gray-400">{timeAgo(ticket.created_at)}</span>
                      {ticket.category && (
                        <span className="text-[10px] text-gray-400">· {categoryLabel[ticket.category] ?? ticket.category}</span>
                      )}
                      {detail && detail.messages.length > 0 && (
                        <span className="text-[10px] text-gray-400">· {detail.messages.length} msg{detail.messages.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-gray-300 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">

                        {/* Loading detail */}
                        {isLoadingDetail && (
                          <div className="animate-pulse space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                                  <div className="h-2.5 w-16 bg-gray-200 rounded mb-1.5" />
                                  <div className="h-3.5 w-24 bg-gray-200 rounded" />
                                </div>
                              ))}
                            </div>
                            <div className="h-16 bg-gray-50 rounded-xl" />
                          </div>
                        )}

                        {/* Detail error */}
                        {detailErr && !isLoadingDetail && (
                          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <p className="text-[11px] text-red-600">{detailErr}</p>
                          </div>
                        )}

                        {/* Full detail */}
                        {detail && !isLoadingDetail && (
                          <>
                            {/* Metadata grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-medium text-gray-400 mb-0.5">Category</p>
                                <p className="text-[12px] font-semibold text-gray-700">{categoryLabel[detail.category] ?? detail.category ?? "—"}</p>
                              </div>
                              <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-medium text-gray-400 mb-0.5">Priority</p>
                                <p className="text-[12px] font-semibold text-gray-700 capitalize">{detail.priority ?? "—"}</p>
                              </div>
                              <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-medium text-gray-400 mb-0.5">Opened</p>
                                <p className="text-[12px] font-semibold text-gray-700">{formatDate(detail.created_at)}</p>
                              </div>
                              <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-medium text-gray-400 mb-0.5">Last Updated</p>
                                <p className="text-[12px] font-semibold text-gray-700">{formatDate(detail.updated_at)}</p>
                              </div>
                            </div>

                            {/* Description */}
                            {detail.description && (
                              <p className="text-[12px] text-gray-500 leading-relaxed">{detail.description}</p>
                            )}

                            {/* Message thread */}
                            {detail.messages.length > 0 && (
                              <div className="space-y-4">
                                {detail.messages.map((msg) => {
                                  const isContributor = msg.author?.toLowerCase() === "contributor" || msg.author?.toLowerCase() === "you";
                                  return (
                                    <div key={msg.id} className="flex gap-3 items-start">
                                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold", isContributor ? "bg-brown-50 text-brown-500" : "bg-teal-50 text-teal-500")}>
                                        {isContributor ? "Y" : "S"}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-[11px] font-semibold text-gray-700">{isContributor ? "You" : (msg.author ?? "Support Agent")}</span>
                                          <span className="text-[10px] text-gray-400">{formatDate(msg.created_at)}</span>
                                        </div>
                                        <p className="text-[12px] text-gray-500 leading-relaxed">{msg.message}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Status actions */}
                            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Manage Status</span>
                              <div className="flex items-center gap-2 flex-wrap">
                                {ticket.status === "open" && (
                                  <button
                                    onClick={() => handleStatusChange(ticket.id, "in_progress")}
                                    disabled={statusUpdating.has(ticket.id)}
                                    className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                  >
                                    {statusUpdating.has(ticket.id) ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
                                    Start Working
                                  </button>
                                )}
                                {(ticket.status === "open" || ticket.status === "in_progress") && (
                                  <button
                                    onClick={() => handleStatusChange(ticket.id, "resolved")}
                                    disabled={statusUpdating.has(ticket.id)}
                                    className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors disabled:opacity-50"
                                  >
                                    {statusUpdating.has(ticket.id) ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                    Mark Resolved
                                  </button>
                                )}
                                {ticket.status === "resolved" && (
                                  <button
                                    onClick={() => handleStatusChange(ticket.id, "closed")}
                                    disabled={statusUpdating.has(ticket.id)}
                                    className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                                  >
                                    {statusUpdating.has(ticket.id) ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                    Close Ticket
                                  </button>
                                )}
                                {(ticket.status === "resolved" || ticket.status === "closed") && (
                                  <button
                                    onClick={() => handleStatusChange(ticket.id, "open")}
                                    disabled={statusUpdating.has(ticket.id)}
                                    className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                  >
                                    {statusUpdating.has(ticket.id) ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                    Reopen
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Resolved banner */}
                            {isResolved && (
                              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-forest-50">
                                <CheckCircle2 className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-[11px] font-semibold text-forest-700 block mb-0.5">Ticket Resolved</span>
                                  <p className="text-[11px] text-forest-600">This ticket has been resolved. Thank you for reaching out.</p>
                                </div>
                              </div>
                            )}

                            {/* Related IDs */}
                            <div className="flex items-center gap-4 flex-wrap text-[11px] text-gray-400">
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-3 h-3" />
                                ID: <span className="font-mono font-semibold text-gray-600">{detail.id}</span>
                              </span>
                              {detail.related_task_id && (
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3 h-3" />
                                  Task: <span className="font-semibold text-gray-600">{detail.related_task_id}</span>
                                </span>
                              )}
                              {detail.related_project_id && (
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3 h-3" />
                                  Project: <span className="font-semibold text-gray-600">{detail.related_project_id}</span>
                                </span>
                              )}
                            </div>

                            {/* ── Reply box (only for non-resolved tickets) ── */}
                            {!isResolved && (
                              <div className="border-t border-gray-50 pt-4 space-y-2">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Reply to Support</p>
                                <div className="flex gap-2 items-end">
                                  <textarea
                                    rows={2}
                                    placeholder="Type your reply…"
                                    value={replyText[ticket.id] ?? ""}
                                    onChange={(e) => setReplyText((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply(ticket.id);
                                    }}
                                    className="flex-1 resize-none text-[12px] text-gray-700 placeholder-gray-300 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-200 transition-all leading-relaxed"
                                  />
                                  <button
                                    onClick={() => handleReply(ticket.id)}
                                    disabled={!(replyText[ticket.id] ?? "").trim() || replySending.has(ticket.id)}
                                    className={cn(
                                      "flex items-center gap-1.5 text-[11px] font-semibold px-4 py-2.5 rounded-xl transition-all shrink-0",
                                      (replyText[ticket.id] ?? "").trim() && !replySending.has(ticket.id)
                                        ? "bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 text-white cursor-pointer"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed",
                                    )}
                                  >
                                    {replySending.has(ticket.id)
                                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      : <Send className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                {replyError[ticket.id] && (
                                  <p className="text-[10px] text-red-500">{replyError[ticket.id]}</p>
                                )}
                                <p className="text-[10px] text-gray-300">Press Ctrl+Enter to send</p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Fallback while detail not yet loaded (first render) */}
                        {!detail && !isLoadingDetail && !detailErr && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                              <p className="text-[10px] font-medium text-gray-400 mb-0.5">Category</p>
                              <p className="text-[12px] font-semibold text-gray-700">{categoryLabel[ticket.category] ?? ticket.category ?? "—"}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                              <p className="text-[10px] font-medium text-gray-400 mb-0.5">Priority</p>
                              <p className="text-[12px] font-semibold text-gray-700 capitalize">{ticket.priority ?? "—"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 — GRIEVANCE (real API)
   ═══════════════════════════════════════════════════════════════ */

function GrievanceRowSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm px-5 py-4 animate-pulse flex items-center gap-4">
      <div className="w-8 h-8 rounded-xl bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-48 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-gray-200 rounded-full" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-4 h-4 bg-gray-200 rounded shrink-0" />
    </div>
  );
}

function GrievanceTab({
  token,
  onOpenDrawer,
  refreshKey,
}: {
  token: string;
  onOpenDrawer: () => void;
  refreshKey: number;
}) {
  const [grievances,        setGrievances]        = React.useState<GrievanceItem[]>([]);
  const [loading,           setLoading]           = React.useState(true);
  const [error,             setError]             = React.useState<string | null>(null);
  const [expandedGrievance, setExpandedGrievance] = React.useState<string | null>(null);
  const [detailCache,       setDetailCache]       = React.useState<Record<string, GrievanceDetail>>({});
  const [detailLoading,     setDetailLoading]     = React.useState<Set<string>>(new Set());
  const [detailError,       setDetailError]       = React.useState<Record<string, string>>({});

  const handleExpandGrievance = React.useCallback(async (grvId: string) => {
    setExpandedGrievance((prev) => (prev === grvId ? null : grvId));
    if (detailCache[grvId] || detailLoading.has(grvId) || !token) return;
    setDetailLoading((prev) => new Set(prev).add(grvId));
    try {
      const detail = await fetchGrievanceDetail(token, grvId);
      setDetailCache((prev) => ({ ...prev, [grvId]: detail }));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load grievance detail";
      setDetailError((prev) => ({ ...prev, [grvId]: msg }));
    } finally {
      setDetailLoading((prev) => { const s = new Set(prev); s.delete(grvId); return s; });
    }
  }, [token, detailCache, detailLoading]);

  const load = React.useCallback(async (t: string) => {
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const sk = sessionKeyFragment(t);
      const res = await dedupeAsync(`contrib:grievances:${sk}:${refreshKey}`, () => fetchGrievances(t));
      setGrievances(res.items ?? []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load grievances";
      setError(msg);
      toast.error("Grievances", msg);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  React.useEffect(() => { if (token) load(token); }, [token, load, refreshKey]);

  return (
    <div>
      {/* Process + CTA */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-700">How the process works</h3>
          <button onClick={onOpenDrawer} className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl bg-brown-500 text-white hover:bg-brown-600 transition-all cursor-pointer">
            <Scale className="w-3.5 h-3.5" /> File Grievance
          </button>
        </div>
        <div className="flex items-center gap-0">
          {[{ step: "1", label: "Submit" }, { step: "2", label: "Review" }, { step: "3", label: "Investigate" }, { step: "4", label: "Resolution" }].map((s, i) => (
            <React.Fragment key={s.step}>
              <div className="flex flex-col items-center flex-1">
                <div className="w-6 h-6 rounded-full bg-brown-50 text-brown-500 flex items-center justify-center text-[10px] font-bold mb-1">{s.step}</div>
                <p className="text-[10px] font-medium text-gray-600">{s.label}</p>
              </div>
              {i < 3 && <div className="w-8 h-px bg-gray-100 -mt-2.5" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-center">Response: 5 business days · Anonymity available · Appeal if unsatisfied</p>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-white rounded-xl shadow-sm px-5 py-5 mb-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-red-600 mb-1">Could not load grievances</p>
            <p className="text-[11px] text-gray-400 mb-2">{error}</p>
            <button onClick={() => load(token)} className="flex items-center gap-1.5 text-[11px] font-semibold text-brown-600 hover:text-brown-700">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => <GrievanceRowSkeleton key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && grievances.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm py-14 text-center">
          <Scale className="w-9 h-9 text-gray-200 mx-auto mb-2" />
          <p className="text-[13px] font-medium text-gray-500">No grievances filed</p>
        </div>
      )}

      {/* Grievance list */}
      {!loading && !error && grievances.length > 0 && (
        <div className="space-y-2">
          {grievances.map((grv) => {
            const st = statusColors[grv.status] || statusColors.open;
            const isExpanded = expandedGrievance === grv.id;
            return (
              <div key={grv.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => handleExpandGrievance(grv.id)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-gold-50 flex items-center justify-center shrink-0"><Scale className="w-4 h-4 text-gold-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate mb-0.5">{grv.subject}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill {...st} />
                      <span className="text-[10px] text-gray-400">{grievanceCategoryLabels[grv.category] ?? grv.category}</span>
                      <span className="text-[10px] text-gray-400">· {timeAgo(grv.created_at)}</span>
                      {grv.anonymous && <span className="flex items-center gap-1 text-[10px] text-gray-400"><EyeOff className="w-3 h-3" /> Anonymous</span>}
                    </div>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-gray-300 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                        {/* Status progress */}
                        <div className="flex items-center gap-0 mb-4">
                          {["Submitted", "Under Review", "Investigation", "Resolution"].map((step, i) => {
                            const stepStatuses = ["submitted", "under_review", "investigation", "resolved"];
                            const currentIdx = stepStatuses.indexOf(grv.status);
                            const isComplete = i <= currentIdx;
                            const isCurrent = i === currentIdx;
                            return (
                              <React.Fragment key={step}>
                                <div className="flex flex-col items-center flex-1">
                                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold mb-1", isComplete ? isCurrent ? "bg-gold-100 text-gold-600" : "bg-forest-50 text-forest-500" : "bg-gray-100 text-gray-400")}>
                                    {isComplete && !isCurrent ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                                  </div>
                                  <p className={cn("text-[9px]", isComplete ? "text-gray-600 font-medium" : "text-gray-400")}>{step}</p>
                                </div>
                                {i < 3 && <div className={cn("w-6 h-px -mt-3", isComplete && i < currentIdx ? "bg-forest-300" : "bg-gray-100")} />}
                              </React.Fragment>
                            );
                          })}
                        </div>
                        {/* Detail loading skeleton */}
                        {detailLoading.has(grv.id) && (
                          <div className="space-y-2 mb-3">
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
                          </div>
                        )}
                        {/* Detail error */}
                        {detailError[grv.id] && !detailLoading.has(grv.id) && (
                          <p className="text-[10px] text-red-500 mb-3">{detailError[grv.id]}</p>
                        )}
                        {/* Full detail: description + related_reference */}
                        {detailCache[grv.id] && !detailLoading.has(grv.id) && (
                          <div className="space-y-2 mb-3">
                            {detailCache[grv.id].description && (
                              <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                                <p className="text-[10px] font-semibold text-gray-500 mb-1">Description</p>
                                <p className="text-[11px] text-gray-700 whitespace-pre-wrap">{detailCache[grv.id].description}</p>
                              </div>
                            )}
                            {detailCache[grv.id].related_reference && (
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                <FileText className="w-3 h-3 shrink-0" />
                                Related: <span className="font-mono text-gray-600">{detailCache[grv.id].related_reference}</span>
                              </div>
                            )}
                            {detailCache[grv.id].updated_at && (
                              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span>Updated: {formatDate(detailCache[grv.id].updated_at)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Dates + anonymous badge */}
                        <div className="flex items-center gap-4 text-[10px] text-gray-400">
                          <span>Filed: {formatDate(grv.created_at)}</span>
                          {grv.anonymous && <span className="flex items-center gap-1 text-gray-500"><EyeOff className="w-3 h-3" /> Anonymous</span>}
                        </div>
                        {/* Grievance ID */}
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400">
                          <FileText className="w-3 h-3" />
                          ID: <span className="font-mono font-semibold text-gray-600">{grv.id}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4 — SAFETY (Flow J4)
   ═══════════════════════════════════════════════════════════════ */

function SafetyTab({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  return (
    <div>
      {/* Emergency */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <TriangleAlert className="w-4.5 h-4.5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-[13px] font-semibold text-gray-800 mb-1">If you are in immediate danger</h3>
            <p className="text-[11px] text-gray-500 mb-2.5">Contact local authorities first. Then reach our safety team:</p>
            <div className="flex items-center gap-5">
              <a href="tel:+18005550199" className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 hover:text-red-700 transition-colors"><Phone className="w-3.5 h-3.5" /> +1 (800) 555-0199</a>
              <a href="mailto:safety@glimmora.com" className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors"><Mail className="w-3 h-3" /> safety@glimmora.com</a>
            </div>
          </div>
        </div>
      </div>

      {/* Report CTA */}
      <button onClick={onOpenDrawer} className="w-full bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-all mb-5 group flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
          <Shield className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-[13px] font-semibold text-gray-800 group-hover:text-red-600 transition-colors">Report a Safety Concern</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Harassment, threatening behavior, discrimination, fraud — confidential</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
      </button>

      {/* What happens */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-[12px] font-semibold text-gray-700 mb-3">What happens after you report</h3>
        <div className="space-y-2.5">
          {[
            { icon: Eye, title: "Reviewed within 24 hours", desc: "Every report is reviewed by our dedicated safety team." },
            { icon: Lock, title: "Identity protected", desc: "The reported person will never know who filed the report." },
            { icon: Shield, title: "Actions taken", desc: "Outcomes include warnings, suspension, bans, or task reassignment." },
            { icon: Scale, title: "No penalty for reporting", desc: "We encourage reporting to maintain a safe environment." },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-gray-700">{item.title}</p>
                  <p className="text-[10px] text-gray-400">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

type TabId = "help" | "tickets" | "grievance" | "safety";
type FormId = "ticket" | "grievance" | "safety" | null;

export default function SupportPage() {
  const { data: session, status: sessionStatus } = useSession();
  const tokenRef = React.useRef<string>("");
  tokenRef.current = getContributorAccessToken(session);
  const token = tokenRef.current;

  const [activeTab,            setActiveTab]            = React.useState<TabId>("help");
  const [activeDrawer,         setActiveDrawer]         = React.useState<FormId>(null);
  const [openTicketCount,      setOpenTicketCount]      = React.useState(0);
  const [ticketsRefreshKey,    setTicketsRefreshKey]    = React.useState(0);
  const [grievancesRefreshKey, setGrievancesRefreshKey] = React.useState(0);

  const refreshTickets = React.useCallback(() => {
    setTicketsRefreshKey((k) => k + 1);
    setActiveTab("tickets");
    setActiveDrawer(null);
  }, []);

  const refreshGrievances = React.useCallback(() => {
    setGrievancesRefreshKey((k) => k + 1);
    setActiveTab("grievance");
    setActiveDrawer(null);
  }, []);

  /* wait for session before rendering API-driven tabs */
  const ready = sessionStatus !== "loading";

  const tabs: Array<{ id: TabId; label: string; icon: React.ElementType; count?: number }> = [
    { id: "help", label: "Help Center", icon: BookOpen },
    { id: "tickets", label: "Tickets", icon: MessageSquare, count: openTicketCount > 0 ? openTicketCount : undefined },
    { id: "grievance", label: "Grievance", icon: Scale },
    { id: "safety", label: "Safety", icon: Shield },
  ];

  const formTitles: Record<string, string> = {
    ticket: "New Support Ticket",
    grievance: "File a Grievance",
    safety: "Report Safety Concern",
  };

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="mb-6">
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Support</h1>
          <p className="text-[13px] text-gray-400 mt-1">Browse help articles, manage tickets, or file a report</p>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center gap-1 border-b border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-all -mb-px", isActive ? "border-brown-500 text-gray-800" : "border-transparent text-gray-400 hover:text-gray-600")}>
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-4.5 text-center", isActive ? "bg-brown-100 text-brown-600" : "bg-gray-100 text-gray-500")}>{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          {activeTab === "help" && <HelpCenterTab token={ready ? token : ""} />}
          {activeTab === "tickets" && (
            <TicketsTab
              key={ticketsRefreshKey}
              token={ready ? token : ""}
              onOpenDrawer={() => setActiveDrawer("ticket")}
              onCountChange={setOpenTicketCount}
            />
          )}
          {activeTab === "grievance" && (
            <GrievanceTab
              key={grievancesRefreshKey}
              token={ready ? token : ""}
              onOpenDrawer={() => setActiveDrawer("grievance")}
              refreshKey={grievancesRefreshKey}
            />
          )}
          {activeTab === "safety" && <SafetyTab onOpenDrawer={() => setActiveDrawer("safety")} />}
        </motion.div>
      </motion.div>

      {/* Drawers */}
      <FormDrawer open={activeDrawer === "ticket"} onClose={() => setActiveDrawer(null)} title={formTitles.ticket}>
        <NewTicketForm
          token={ready ? token : ""}
          onClose={() => setActiveDrawer(null)}
          onSuccess={refreshTickets}
        />
      </FormDrawer>
      <FormDrawer open={activeDrawer === "grievance"} onClose={() => setActiveDrawer(null)} title={formTitles.grievance}>
        <NewGrievanceForm
          token={ready ? token : ""}
          onClose={() => setActiveDrawer(null)}
          onSuccess={refreshGrievances}
        />
      </FormDrawer>
      <FormDrawer open={activeDrawer === "safety"} onClose={() => setActiveDrawer(null)} title={formTitles.safety}>
        <SafetyReportForm token={ready ? token : ""} onClose={() => setActiveDrawer(null)} />
      </FormDrawer>
    </>
  );
}
