"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BookOpen, Send, ChevronRight, HelpCircle,
  CreditCard, Wrench, Rocket, Phone, Mail,
  CheckCircle2, MessageSquare, ChevronDown, X, Plus, FileText,
  Shield, Scale, Paperclip,
  Eye, EyeOff, TriangleAlert, Lock, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Input, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { mockSupportTickets } from "@/mocks/data/contributor";

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

interface Grievance {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  anonymous: boolean;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

const mockGrievances: Grievance[] = [
  {
    id: "grv-001",
    category: "review_dispute",
    subject: "Submission rejected despite meeting all acceptance criteria",
    description: "My submission for task ctask-004 was rejected, but I've verified that all acceptance criteria were met. The reviewer's feedback mentions missing keyboard navigation, which was not listed in the original acceptance criteria.",
    status: "under_review",
    anonymous: false,
    createdAt: "2026-03-20T09:00:00Z",
    updatedAt: "2026-03-22T14:00:00Z",
  },
];

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

const faqCategories = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: Rocket,
    articles: [
      { q: "How do I set up my profile?", a: "After completing onboarding, navigate to Settings > Profile to add your skills, availability, and preferred languages. Your profile completeness percentage is shown on your dashboard." },
      { q: "What is a PoDL credential?", a: "PoDL (Proof-of-Delivery Ledger) is a verifiable credential that proves you completed real project work. Unlike traditional certificates, PoDL credentials are tied to actual deliverables that were reviewed and accepted." },
      { q: "How does task matching work?", a: "The platform uses your Skill Genome to match you with tasks. The AI considers your proficiency level, availability, timezone, and past performance to suggest the best-fit tasks." },
    ],
  },
  {
    id: "tasks",
    label: "Tasks & Submissions",
    icon: CheckCircle2,
    articles: [
      { q: "How do I submit my work?", a: "Open your active task, navigate to the Workroom, and use the Submit button. Before submitting, ensure all evidence checklist items are completed." },
      { q: "What happens after I submit?", a: "Your submission enters the review pipeline. The Review Assistant performs an automated quality check, then a human reviewer evaluates against acceptance criteria. Feedback within 24-48 hours." },
      { q: "Can I request a deadline extension?", a: "Yes. Submit a support ticket with category 'Task Question'. Include your task ID and the reason. The APG reviews extension requests within 24 hours." },
    ],
  },
  {
    id: "payments",
    label: "Payments & Earnings",
    icon: CreditCard,
    articles: [
      { q: "When do I get paid?", a: "Payment is triggered after your deliverable is accepted. Payouts are processed in weekly batches every Friday. Funds arrive within 3-5 business days." },
      { q: "What payout methods are available?", a: "Bank Transfer (global), UPI (India), Mobile Money/JazzCash/EasyPaisa (Pakistan), PayPal (global), and Crypto (USDC). Configure in Settings > Payments." },
      { q: "How is pricing determined?", a: "Task pricing is set by the Pricing Intelligence engine based on complexity, required skills, estimated hours, and market rates. No bidding or negotiation." },
    ],
  },
  {
    id: "technical",
    label: "Technical Issues",
    icon: Wrench,
    articles: [
      { q: "File upload is failing", a: "Check that your file is under 25MB and in a supported format (PDF, PNG, JPG, ZIP). Try clearing your browser cache or using a different browser." },
      { q: "I can't access my workroom", a: "Workroom access requires an active task assignment. Try refreshing the page. If the issue persists, check if your task status has changed." },
      { q: "How do I reset my password?", a: "Go to the login page and click 'Forgot Password'. Enter your email and you'll receive a reset link within 5 minutes." },
    ],
  },
  {
    id: "account",
    label: "Account & Safety",
    icon: Shield,
    articles: [
      { q: "How is my identity protected?", a: "The platform uses anonymized contributor IDs. Your real name is never shared with clients or other contributors. All grievances and safety reports are confidential by default." },
      { q: "What is the grievance process?", a: "File a grievance through the Grievance tab. An independent team reviews within 5 business days. You can request anonymity and appeal any decision." },
      { q: "How do I report harassment?", a: "Use the Safety tab. Reports are confidential by default. The safety team reviews within 24 hours. You can also block users from contacting you." },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   DRAWER FORMS
   ═══════════════════════════════════════════════════════════════ */

function NewTicketForm({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = React.useState("");
  const [category, setCategory] = React.useState("technical");
  const [priority, setPriority] = React.useState("medium");
  const [description, setDescription] = React.useState("");
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [ticketId, setTicketId] = React.useState("");

  const handleSubmit = () => {
    if (!subject.trim() || !description.trim()) return;
    const newId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    setTicketId(newId);
    setSubmitted(true);
    setTimeout(() => onClose(), 3000);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-forest-500" />
        </div>
        <h3 className="text-[16px] font-semibold text-gray-800 mb-1">Ticket Submitted</h3>
        <p className="text-[13px] text-gray-500 mb-2">Reference: <span className="font-mono font-semibold text-brown-600">{ticketId}</span></p>
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
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue in detail. Include task IDs, error messages, and steps to reproduce if applicable." className="min-h-[120px]" />
      </div>
      <div>
        <label className={fieldLabel}>Attachments</label>
        <div className="flex flex-wrap items-center gap-2">
          {attachments.map((file, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Paperclip className="w-3 h-3 text-gray-400" /> {file}
              <button onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <button onClick={() => setAttachments((p) => [...p, `file_${p.length + 1}.png`])} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors">
            <Upload className="w-3 h-3" /> Add file
          </button>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onClose} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={handleSubmit} disabled={!subject.trim() || !description.trim()} className={cn("flex items-center gap-1.5 text-[12px] font-semibold px-5 py-2 rounded-xl transition-all", subject.trim() && description.trim() ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
          <Send className="w-3.5 h-3.5" /> Submit Ticket
        </button>
      </div>
    </div>
  );
}

function NewGrievanceForm({ onClose }: { onClose: () => void }) {
  const [grvCategory, setGrvCategory] = React.useState("review_dispute");
  const [grvSubject, setGrvSubject] = React.useState("");
  const [grvDescription, setGrvDescription] = React.useState("");
  const [grvTaskId, setGrvTaskId] = React.useState("");
  const [grvAnonymous, setGrvAnonymous] = React.useState(false);
  const [grvAttachments, setGrvAttachments] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [refId, setRefId] = React.useState("");

  const handleSubmit = () => {
    if (!grvSubject.trim() || !grvDescription.trim()) return;
    setRefId(`GRV-${Date.now().toString(36).toUpperCase()}`);
    setSubmitted(true);
    setTimeout(() => onClose(), 3000);
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
          <button onClick={() => setGrvAttachments((p) => [...p, `evidence_${p.length + 1}.pdf`])} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors">
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
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onClose} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={handleSubmit} disabled={!grvSubject.trim() || !grvDescription.trim()} className={cn("flex items-center gap-1.5 text-[12px] font-semibold px-5 py-2 rounded-xl transition-all", grvSubject.trim() && grvDescription.trim() ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
          <Scale className="w-3.5 h-3.5" /> Submit Grievance
        </button>
      </div>
    </div>
  );
}

function SafetyReportForm({ onClose }: { onClose: () => void }) {
  const [safetyCategory, setSafetyCategory] = React.useState("harassment");
  const [safetyDescription, setSafetyDescription] = React.useState("");
  const [safetyRelated, setSafetyRelated] = React.useState("");
  const [safetyAttachments, setSafetyAttachments] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [refId, setRefId] = React.useState("");

  const handleSubmit = () => {
    if (!safetyDescription.trim()) return;
    setRefId(`SAF-${Date.now().toString(36).toUpperCase()}`);
    setSubmitted(true);
    setTimeout(() => onClose(), 3000);
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
          <button onClick={() => setSafetyAttachments((p) => [...p, `screenshot_${p.length + 1}.png`])} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors">
            <Upload className="w-3 h-3" /> Upload evidence
          </button>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onClose} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={handleSubmit} disabled={!safetyDescription.trim()} className={cn("flex items-center gap-1.5 text-[12px] font-semibold px-5 py-2 rounded-xl transition-all", safetyDescription.trim() ? "text-white bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
          <Shield className="w-3.5 h-3.5" /> Submit Report
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — HELP CENTER
   ═══════════════════════════════════════════════════════════════ */

function HelpCenterTab() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState(faqCategories[0].id);
  const [expandedArticle, setExpandedArticle] = React.useState<string | null>(null);

  const currentCategory = faqCategories.find((c) => c.id === activeCategory) || faqCategories[0];

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results: Array<{ q: string; a: string; category: string; key: string }> = [];
    faqCategories.forEach((cat) => {
      cat.articles.forEach((art, idx) => {
        if (art.q.toLowerCase().includes(q) || art.a.toLowerCase().includes(q))
          results.push({ ...art, category: cat.label, key: `s-${cat.id}-${idx}` });
      });
    });
    return results;
  }, [searchQuery]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
        <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-[13px] text-gray-700 bg-white rounded-xl pl-11 pr-10 py-3 shadow-sm outline-none focus:ring-2 focus:ring-brown-100 transition-all placeholder:text-gray-400" />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><X className="w-3 h-3 text-gray-500" /></button>
        )}
      </div>

      {searchResults ? (
        <div>
          <p className="text-[11px] text-gray-400 mb-3">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;</p>
          {searchResults.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm py-12 text-center">
              <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-[13px] text-gray-500">No articles match your search</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((r) => {
                const isOpen = expandedArticle === r.key;
                return (
                  <div key={r.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onClick={() => setExpandedArticle(isOpen ? null : r.key)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50/50 transition-colors">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-700">{r.q}</p>
                        <p className="text-[10px] text-gray-400">{r.category}</p>
                      </div>
                      <ChevronDown className={cn("w-3.5 h-3.5 text-gray-300 shrink-0 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && <div className="px-5 pb-4 pl-12"><p className="text-[12px] text-gray-500 leading-relaxed">{r.a}</p></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Category pills */}
          <div className="flex items-center gap-1.5 mb-5 flex-wrap">
            {faqCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setExpandedArticle(null); }} className={cn("flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-lg transition-all", isActive ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600 hover:bg-white/50")}>
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-brown-500" : "text-gray-400")} />
                  {cat.label}
                </button>
              );
            })}
          </div>
          {/* Articles */}
          <div className="space-y-2">
            {currentCategory.articles.map((art, idx) => {
              const key = `${activeCategory}-${idx}`;
              const isOpen = expandedArticle === key;
              return (
                <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button onClick={() => setExpandedArticle(isOpen ? null : key)} className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors">
                    <span className="w-6 h-6 rounded-lg bg-brown-50 flex items-center justify-center shrink-0 text-[10px] font-bold text-brown-400">{idx + 1}</span>
                    <span className="flex-1 text-[13px] font-medium text-gray-800">{art.q}</span>
                    <ChevronDown className={cn("w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-5 pb-5 pl-15">
                          <div className="border-t border-gray-50 pt-3">
                            <p className="text-[12px] text-gray-500 leading-[1.8]">{art.a}</p>
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
   TAB 2 — SUPPORT TICKETS
   ═══════════════════════════════════════════════════════════════ */

function TicketsTab({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const tickets = mockSupportTickets;
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [expandedTicket, setExpandedTicket] = React.useState<string | null>(null);

  const filteredTickets = statusFilter === "all" ? tickets : tickets.filter((t) => {
    if (statusFilter === "resolved") return t.status === "resolved" || t.status === "closed";
    return t.status === statusFilter;
  });

  const statusFilters = [
    { value: "all", label: "All", count: tickets.length },
    { value: "open", label: "Open", count: tickets.filter((t) => t.status === "open").length },
    { value: "in_progress", label: "In Progress", count: tickets.filter((t) => t.status === "in_progress").length },
    { value: "resolved", label: "Resolved", count: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm">
          {statusFilters.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)} className={cn("text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5", statusFilter === f.value ? "bg-brown-50 text-brown-700" : "text-gray-400 hover:text-gray-600")}>
              {f.label}
              {f.count > 0 && <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full min-w-4 text-center", statusFilter === f.value ? "bg-brown-100 text-brown-600" : "bg-gray-100 text-gray-400")}>{f.count}</span>}
            </button>
          ))}
        </div>
        <button onClick={onOpenDrawer} className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl bg-brown-500 text-white hover:bg-brown-600 transition-all cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> New Ticket
        </button>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm py-14 text-center">
          <MessageSquare className="w-9 h-9 text-gray-200 mx-auto mb-2" />
          <p className="text-[13px] font-medium text-gray-500">No tickets found</p>
          <p className="text-[11px] text-gray-400 mt-1">{statusFilter === "all" ? "You haven't submitted any support tickets yet" : `No ${statusFilter.replace("_", " ")} tickets`}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map((ticket) => {
            const st = statusColors[ticket.status] || statusColors.open;
            const prio = priorityColors[ticket.priority] || priorityColors.medium;
            const isExpanded = expandedTicket === ticket.id;
            const isResolved = ticket.status === "resolved" || ticket.status === "closed";

            return (
              <div key={ticket.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", isResolved ? "bg-forest-50" : "bg-teal-50")}>
                    {isResolved ? <CheckCircle2 className="w-4 h-4 text-forest-500" /> : <MessageSquare className="w-4 h-4 text-teal-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate mb-0.5">{ticket.subject}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill {...st} />
                      <Pill {...prio} />
                      <span className="text-[10px] text-gray-400">{timeAgo(ticket.createdAt)}</span>
                      <span className="text-[10px] text-gray-400">· {ticket.messages.length} msg{ticket.messages.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-gray-300 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-gray-50">
                        <p className="text-[12px] text-gray-500 leading-relaxed py-4">{ticket.description}</p>
                        <div className="space-y-4">
                          {ticket.messages.map((msg, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold", msg.sender === "contributor" ? "bg-brown-50 text-brown-500" : "bg-teal-50 text-teal-500")}>
                                {msg.sender === "contributor" ? "Y" : "S"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[11px] font-semibold text-gray-700">{msg.sender === "contributor" ? "You" : "Support Agent"}</span>
                                  <span className="text-[10px] text-gray-400">{formatDate(msg.sentAt)}</span>
                                </div>
                                <p className="text-[12px] text-gray-500 leading-relaxed">{msg.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {ticket.resolvedAt && (
                          <div className="flex items-start gap-2.5 mt-4 px-4 py-3 rounded-xl bg-forest-50">
                            <CheckCircle2 className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[11px] font-semibold text-forest-700 block mb-0.5">Resolved {formatDate(ticket.resolvedAt)}</span>
                              <p className="text-[11px] text-forest-600 leading-relaxed">{(ticket as Record<string, unknown>).resolution as string || "This ticket has been resolved."}</p>
                            </div>
                          </div>
                        )}
                        {ticket.relatedTaskId && (
                          <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-400">
                            <FileText className="w-3 h-3" /> Related task: <span className="text-gray-600 font-medium">{ticket.relatedTaskId}</span>
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
   TAB 3 — GRIEVANCE (Flow J2)
   ═══════════════════════════════════════════════════════════════ */

function GrievanceTab({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const [expandedGrievance, setExpandedGrievance] = React.useState<string | null>(null);

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
          {[
            { step: "1", label: "Submit" },
            { step: "2", label: "Review" },
            { step: "3", label: "Investigate" },
            { step: "4", label: "Resolution" },
          ].map((s, i) => (
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

      {/* Grievance list */}
      {mockGrievances.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm py-14 text-center">
          <Scale className="w-9 h-9 text-gray-200 mx-auto mb-2" />
          <p className="text-[13px] font-medium text-gray-500">No grievances filed</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mockGrievances.map((grv) => {
            const st = statusColors[grv.status] || statusColors.open;
            const isExpanded = expandedGrievance === grv.id;
            return (
              <div key={grv.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => setExpandedGrievance(isExpanded ? null : grv.id)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-gold-50 flex items-center justify-center shrink-0"><Scale className="w-4 h-4 text-gold-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate mb-0.5">{grv.subject}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill {...st} />
                      <span className="text-[10px] text-gray-400">{grievanceCategoryLabels[grv.category]}</span>
                      <span className="text-[10px] text-gray-400">· {timeAgo(grv.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-gray-300 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                        <p className="text-[12px] text-gray-500 leading-relaxed mb-4">{grv.description}</p>
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
                        <div className="flex items-center gap-4 text-[10px] text-gray-400">
                          <span>Filed: {formatDate(grv.createdAt)}</span>
                          <span>Updated: {formatDate(grv.updatedAt)}</span>
                          {grv.anonymous && <span className="flex items-center gap-1 text-gray-500"><EyeOff className="w-3 h-3" /> Anonymous</span>}
                        </div>
                        {grv.resolution && (
                          <div className="mt-3 px-4 py-3 rounded-xl bg-forest-50">
                            <p className="text-[11px] font-semibold text-forest-700 mb-1">Resolution</p>
                            <p className="text-[11px] text-forest-600 leading-relaxed">{grv.resolution}</p>
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
  const [activeTab, setActiveTab] = React.useState<TabId>("help");
  const [activeDrawer, setActiveDrawer] = React.useState<FormId>(null);
  const openTicketCount = mockSupportTickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

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
          {activeTab === "help" && <HelpCenterTab />}
          {activeTab === "tickets" && <TicketsTab onOpenDrawer={() => setActiveDrawer("ticket")} />}
          {activeTab === "grievance" && <GrievanceTab onOpenDrawer={() => setActiveDrawer("grievance")} />}
          {activeTab === "safety" && <SafetyTab onOpenDrawer={() => setActiveDrawer("safety")} />}
        </motion.div>
      </motion.div>

      {/* Drawers */}
      <FormDrawer open={activeDrawer === "ticket"} onClose={() => setActiveDrawer(null)} title={formTitles.ticket}>
        <NewTicketForm onClose={() => setActiveDrawer(null)} />
      </FormDrawer>
      <FormDrawer open={activeDrawer === "grievance"} onClose={() => setActiveDrawer(null)} title={formTitles.grievance}>
        <NewGrievanceForm onClose={() => setActiveDrawer(null)} />
      </FormDrawer>
      <FormDrawer open={activeDrawer === "safety"} onClose={() => setActiveDrawer(null)} title={formTitles.safety}>
        <SafetyReportForm onClose={() => setActiveDrawer(null)} />
      </FormDrawer>
    </>
  );
}
