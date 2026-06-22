"use client";

/**
 * Enterprise — Create SOW. Three steps:
 *   Step 1: Source — choose how to start: upload a document, or generate with
 *           AI (AI generation is not integrated yet — shown as "in progress").
 *   Step 2: Details — SOW fields (budget + scope + skills + effort/duration…).
 *           An "AI help" autofill button is present but not integrated yet.
 *   Step 3: Reviewer — select the enterprise-assigned reviewer.
 * Submits to POST /api/sow → /api/v1/sow (enterprise backend) which persists
 * the fields + reviewer and enters the approval pipeline.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  UploadCloud,
  UserCheck,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button, Input, Textarea, Label } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";

const SELECT_CLS =
  "flex h-10 w-full rounded-md border border-stroke-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus";

interface Reviewer {
  id: string;
  name: string;
  email: string;
}

type SourceMode = "upload" | "ai";

const CONFIDENTIALITY = [
  { v: "internal", l: "Internal" },
  { v: "confidential", l: "Confidential" },
  { v: "restricted", l: "Restricted" },
];
const PRIORITY = [
  { v: "low", l: "Low" },
  { v: "medium", l: "Medium" },
  { v: "high", l: "High" },
  { v: "urgent", l: "Urgent" },
];
const ENGAGEMENT = [
  { v: "fixed", l: "Fixed price" },
  { v: "hourly", l: "Hourly" },
];
const CURRENCY = [
  { v: "INR", l: "₹ INR" },
  { v: "USD", l: "$ USD" },
];

const STEP_LABEL: Record<1 | 2 | 3, string> = {
  1: "Choose a source",
  2: "Details & budget",
  3: "Assign reviewer",
};

export default function CreateSowPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Step 1 — source
  const [sourceMode, setSourceMode] = React.useState<SourceMode>("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = React.useState("");

  // Step 2 — details
  const [title, setTitle] = React.useState("");
  const [clientOrg, setClientOrg] = React.useState("");
  const [confidentiality, setConfidentiality] = React.useState("internal");
  const [priority, setPriority] = React.useState("medium");
  const [engagementType, setEngagementType] = React.useState("fixed");
  const [budgetAmount, setBudgetAmount] = React.useState("");
  const [budgetCurrency, setBudgetCurrency] = React.useState("INR");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [effortHours, setEffortHours] = React.useState("");
  const [durationWeeks, setDurationWeeks] = React.useState("");
  const [skills, setSkills] = React.useState("");
  const [objectives, setObjectives] = React.useState("");
  const [deliverables, setDeliverables] = React.useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = React.useState("");

  // Step 3 — reviewer
  const [reviewers, setReviewers] = React.useState<Reviewer[]>([]);
  const [reviewersLoading, setReviewersLoading] = React.useState(true);
  const [reviewerId, setReviewerId] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/enterprise/team", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const list: Reviewer[] = (data.items ?? [])
          .filter((m: { roleCodes?: string[]; roleCode?: string }) =>
            (m.roleCodes ?? []).some((c) => c.replace(/^ent\./, "") === "reviewer") ||
            (m.roleCode ?? "").replace(/^ent\./, "") === "reviewer",
          )
          .map((m: { id: string; name?: string; email: string }) => ({
            id: m.id,
            name: m.name || m.email,
            email: m.email,
          }));
        setReviewers(list);
      } catch {
        // leave empty → step 3 shows the "no reviewers" hint
      } finally {
        setReviewersLoading(false);
      }
    })();
  }, []);

  const onPickFile = (f: File | null) => {
    setFileError(null);
    if (f && f.size > 20 * 1024 * 1024) {
      setFileError("File exceeds 20 MB.");
      return;
    }
    setFile(f);
  };

  const aiNotYet = () =>
    toast.info(
      "AI assist is still in progress",
      "This will read your document / draft the SOW for you. It isn't connected yet — continue and fill the details manually for now.",
    );

  const goToDetails = () => {
    setError(null);
    // A source is mandatory: a document in upload mode, or AI mode selected.
    if (sourceMode === "upload" && !file) {
      setFileError("Attach a SOW document to continue — or switch to Generate with AI.");
      return;
    }
    // AI generation isn't integrated yet, so either source mode lands on the
    // manual details step (the toast on selecting AI already explained this).
    setStep(2);
  };

  const goToReviewer = () => {
    setError(null);
    if (!title.trim()) {
      setError("A SOW title is required.");
      return;
    }
    if (!budgetAmount || Number(budgetAmount) <= 0) {
      setError("Enter a budget amount.");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }
    setStep(3);
  };

  const submit = async () => {
    setError(null);
    if (!reviewerId) {
      setError("Assign a reviewer before creating the SOW.");
      return;
    }
    setSubmitting(true);
    try {
      // If a document is attached, upload it to Blob first and attach the URL.
      let fileInfo: { fileName?: string; fileUrl?: string; fileSize?: number } = {};
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/sow/upload-file", { method: "POST", body: fd });
        if (!up.ok) {
          setError("Couldn't upload the document. Try again or create without it.");
          setSubmitting(false);
          return;
        }
        const upData = await up.json().catch(() => ({}));
        const d = upData?.data ?? upData;
        fileInfo = { fileName: d.fileName, fileUrl: d.fileUrl, fileSize: d.fileSize };
      }
      const reviewer = reviewers.find((r) => r.id === reviewerId);
      const payload = {
        ...fileInfo,
        title: title.trim(),
        clientOrganisation: clientOrg.trim() || undefined,
        confidentiality,
        priority,
        engagementType,
        budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
        budgetCurrency,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        effortHours: effortHours ? Number(effortHours) : undefined,
        durationWeeks: durationWeeks ? Number(durationWeeks) : undefined,
        requiredSkills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        objectives: objectives.trim() || undefined,
        deliverables: deliverables.split("\n").map((s) => s.trim()).filter(Boolean),
        acceptanceCriteria: acceptanceCriteria.trim() || undefined,
        reviewerId: reviewer?.id,
        reviewerName: reviewer?.name,
        pricing: {
          enterpriseProposed: budgetAmount ? Number(budgetAmount) : undefined,
          currency: budgetCurrency,
          mode: "manual",
        },
      };
      const res = await fetch("/api/sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.message || `Create failed (${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      const sow = data?.data ?? data?.sow ?? data;
      const id = sow?.id;
      toast.success("SOW created", reviewer ? `Reviewer ${reviewer.name} assigned.` : "Draft saved.");
      router.push(id ? `/enterprise/sow/${id}` : "/enterprise/sow");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the SOW.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <Link
          href="/enterprise/sow"
          className="grid h-9 w-9 place-items-center rounded-lg border border-stroke-subtle text-text-secondary hover:bg-surface-hover"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Create SOW</h1>
          <p className="text-sm text-text-secondary">Step {step} of 3 — {STEP_LABEL[step]}</p>
        </div>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        <StepChip active={step === 1} done={step > 1} icon={UploadCloud} label="Source" />
        <span className="h-px w-6 bg-stroke-subtle" />
        <StepChip active={step === 2} done={step > 2} icon={FileText} label="Details" />
        <span className="h-px w-6 bg-stroke-subtle" />
        <StepChip active={step === 3} done={false} icon={UserCheck} label="Reviewer" />
      </div>

      {error ? (
        <p className="rounded-md border border-error-border bg-error-subtle px-3 py-2 text-sm text-error-text">{error}</p>
      ) : null}

      <div className="rounded-2xl border border-stroke-subtle bg-surface p-5">
        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">How do you want to start?</h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                Upload an existing SOW document, or generate one with AI.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SourceCard
                active={sourceMode === "upload"}
                onClick={() => setSourceMode("upload")}
                icon={UploadCloud}
                title="Upload a document"
                description="Attach your SOW (PDF/DOC). You'll confirm the details on the next step."
              />
              <SourceCard
                active={sourceMode === "ai"}
                onClick={() => {
                  setSourceMode("ai");
                  aiNotYet();
                }}
                icon={Sparkles}
                title="Generate with AI"
                description="Describe the work and let AI draft the SOW."
                badge="In progress"
                muted
              />
            </div>

            {sourceMode === "upload" ? (
              <div className="space-y-1.5">
                <Label htmlFor="doc">
                  SOW document <span className="text-text-tertiary">(optional, PDF/DOC ≤ 20 MB)</span>
                </Label>
                <input
                  id="doc"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-on-brand hover:file:opacity-90 file:cursor-pointer"
                />
                {file ? (
                  <p className="text-xs text-text-secondary">
                    Attached: <span className="font-medium text-foreground">{file.name}</span> ({Math.round(file.size / 1024)} KB)
                  </p>
                ) : null}
                {fileError ? <p className="text-xs text-error-text">{fileError}</p> : null}
                <p className="flex items-start gap-1.5 rounded-md border border-stroke-subtle bg-surface-sunken px-3 py-2 text-xs text-text-tertiary">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                  Auto-filling the details from your document is coming soon (AI). For now, attach the
                  file and fill the details on the next step — the document is stored and shown to
                  reviewers.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="aiPrompt" className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-brand" />
                    Describe your idea — AI will draft the SOW
                  </Label>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    Write your plan, goals, scope, skills, timeline and budget. This becomes the
                    prompt the AI uses to generate a full SOW you can review and edit.
                  </p>
                </div>
                <Textarea
                  id="aiPrompt"
                  rows={12}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[220px]"
                  placeholder={
                    "Describe the project so AI can draft the SOW — e.g.\n\n• Goal: build a customer analytics dashboard\n• Scope: data pipeline, charts, role-based access\n• Skills: React, Node.js, Postgres\n• Timeline: ~6 weeks · Budget: ₹3,00,000\n• Deliverables & how success is judged"
                  }
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-text-tertiary">{aiPrompt.trim().length} characters</p>
                  <p className="text-[11px] text-text-tertiary">Tip: more detail → better draft</p>
                </div>
                <p className="flex items-start gap-1.5 rounded-md border border-dashed border-stroke-subtle bg-surface-sunken px-3 py-2 text-xs text-text-tertiary">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  AI SOW generation is still in progress — this prompt isn&apos;t sent anywhere yet.
                  Once it&apos;s connected, &ldquo;Generate SOW draft&rdquo; will turn this into a full
                  SOW. For now, continue and fill the details manually (or switch to{" "}
                  <strong>Upload a document</strong>).
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              {sourceMode === "ai" ? (
                <>
                  <Button onClick={goToDetails} variant="outline" className="gap-2">
                    Continue manually <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button onClick={aiNotYet} className="gap-2">
                    <Sparkles className="h-4 w-4" /> Generate SOW draft
                    <span className="rounded-full bg-on-brand/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Soon
                    </span>
                  </Button>
                </>
              ) : (
                <Button onClick={goToDetails} disabled={!file} className="gap-2">
                  Continue to details <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            {/* AI help (not integrated yet) */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stroke-subtle bg-surface-sunken px-3 py-2.5">
              <p className="text-xs text-text-secondary">
                Fill the SOW details below
                {file ? <> · attached: <span className="font-medium text-foreground">{file.name}</span></> : null}
              </p>
              <button
                type="button"
                onClick={aiNotYet}
                className="inline-flex items-center gap-1.5 rounded-md border border-stroke-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-hover"
              >
                <Wand2 className="h-3.5 w-3.5 text-brand" />
                AI help — autofill
                <span className="rounded-full bg-bg-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  Soon
                </span>
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">SOW title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Analytics warehouse migration" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client">Client / business unit</Label>
              <Input id="client" value={clientOrg} onChange={(e) => setClientOrg(e.target.value)} placeholder="Optional" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="confid">Confidentiality</Label>
                <select id="confid" className={SELECT_CLS} value={confidentiality} onChange={(e) => setConfidentiality(e.target.value)}>
                  {CONFIDENTIALITY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prio">Priority</Label>
                <select id="prio" className={SELECT_CLS} value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eng">Engagement</Label>
                <select id="eng" className={SELECT_CLS} value={engagementType} onChange={(e) => setEngagementType(e.target.value)}>
                  {ENGAGEMENT.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="budget">Budget</Label>
                <Input id="budget" type="number" min="0" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cur">Currency</Label>
                <select id="cur" className={SELECT_CLS} value={budgetCurrency} onChange={(e) => setBudgetCurrency(e.target.value)}>
                  {CURRENCY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="effort">Est. effort (hrs)</Label>
                <Input id="effort" type="number" min="0" value={effortHours} onChange={(e) => setEffortHours(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start">Start date</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">End date</Label>
                <Input id="end" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dur">Duration (weeks)</Label>
                <Input id="dur" type="number" min="0" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skills">Required skills <span className="text-text-tertiary">(comma-separated)</span></Label>
              <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Postgres" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="obj">Objectives / scope</Label>
              <Textarea id="obj" rows={3} value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="What this SOW must achieve." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliv">Deliverables <span className="text-text-tertiary">(one per line)</span></Label>
              <Textarea id="deliv" rows={3} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder={"Migration runbook\nValidated data pipeline"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accept">Acceptance criteria</Label>
              <Textarea id="accept" rows={3} value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} placeholder="How the reviewer will judge completion." />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={goToReviewer} className="gap-2">
                Next: assign reviewer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reviewer">Reviewer (enterprise-assigned)</Label>
              {reviewersLoading ? (
                <p className="text-sm text-text-secondary">Loading reviewers…</p>
              ) : reviewers.length === 0 ? (
                <p className="rounded-md border border-stroke-subtle bg-surface-sunken p-3 text-sm text-text-secondary">
                  No reviewers in your workspace yet. Add one in{" "}
                  <Link href="/enterprise/settings/tenant" className="font-medium text-text-link hover:underline">
                    Settings → Tenant &amp; roles
                  </Link>{" "}
                  (assign the Reviewer role), then come back. You can also create the SOW now and assign a reviewer later.
                </p>
              ) : (
                <select id="reviewer" className={SELECT_CLS} value={reviewerId} onChange={(e) => setReviewerId(e.target.value)}>
                  <option value="">— Select a reviewer —</option>
                  {reviewers.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
                  ))}
                </select>
              )}
              <p className="text-xs text-text-tertiary">The reviewer gives the final business acceptance before payout.</p>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-stroke-subtle bg-surface-sunken p-3 text-sm">
              <p className="font-semibold text-foreground">{title || "Untitled SOW"}</p>
              <p className="mt-1 text-text-secondary">
                {PRIORITY.find((p) => p.v === priority)?.l} priority · {CONFIDENTIALITY.find((c) => c.v === confidentiality)?.l} ·{" "}
                {budgetAmount ? `${budgetCurrency} ${Number(budgetAmount).toLocaleString()}` : "no budget set"}
                {durationWeeks ? ` · ${durationWeeks}w` : ""}
                {file ? ` · 📎 ${file.name}` : ""}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={submit} disabled={submitting || !reviewerId} className="gap-2">
                <Send className="h-4 w-4" /> {submitting ? "Creating…" : "Create SOW"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepChip({
  active,
  done,
  icon: Icon,
  label,
}: {
  active: boolean;
  done: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${
        active
          ? "border-primary bg-primary-subtle text-primary-subtle-text"
          : done
            ? "border-stroke-subtle text-text-secondary"
            : "border-stroke-subtle text-text-tertiary"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function SourceCard({
  active,
  onClick,
  icon: Icon,
  title,
  description,
  badge,
  muted,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors ${
        active
          ? "border-primary bg-primary-subtle/40 ring-1 ring-primary"
          : "border-stroke-subtle bg-surface hover:bg-surface-hover"
      }`}
    >
      <span className="flex w-full items-center justify-between">
        <span
          className={`grid h-9 w-9 place-items-center rounded-lg ${
            active ? "bg-primary text-on-brand" : "bg-bg-subtle text-text-secondary"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        {badge ? (
          <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
            {badge}
          </span>
        ) : null}
      </span>
      <span className={`text-sm font-semibold ${muted ? "text-text-secondary" : "text-foreground"}`}>{title}</span>
      <span className="text-xs leading-snug text-text-tertiary">{description}</span>
    </button>
  );
}
