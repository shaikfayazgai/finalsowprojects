"use client";

/**
 * AI-Generated SOW wizard — V2.0 Pathway A.
 *
 *   Step 1: parameter wizard (industry · objective · budget · timeline · team)
 *   Step 2: generation animation through the 8 hallucination-prevention
 *           layers → generated SOW review (template, clause library,
 *           confidence, completeness, editable fields)
 *   Step 3: SubmissionStep (shared approver picker)
 *   Step 4: success
 *
 * Mock-backed via src/lib/enterprise/mocks/sow-generation.ts.
 */

import * as React from "react";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Trash2,
  Plus,
} from "lucide-react";
import { useCreateSow } from "@/lib/hooks/use-sow-v2";
import {
  generateSow,
  INDUSTRY_OPTIONS,
  type GenerateParams,
  type GeneratedSow,
  type Industry,
} from "@/lib/enterprise/mocks/sow-generation";
import type { ClauseKind } from "@/lib/enterprise/mocks/sow-extraction";
import { cn } from "@/lib/utils/cn";
import { SubmissionStep, type CommitArgs } from "./submission-step";

type Phase = "params" | "generating" | "review" | "submit" | "done";

export function GenerateWizard({ onCancel, onDone }: { onCancel: () => void; onDone: (sowId: string) => void }) {
  const createSow = useCreateSow();

  const [phase, setPhase] = React.useState<Phase>("params");
  const [params, setParams] = React.useState<GenerateParams>({
    industry: "software",
    objective: "",
    budgetInr: 600000,
    timelineWeeks: 6,
    teamSize: 4,
    classification: "internal",
  });
  const [generated, setGenerated] = React.useState<GeneratedSow | null>(null);
  const [submitting, setSubmitting] = React.useState<"draft" | "submit" | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [committedKind, setCommittedKind] = React.useState<"draft" | "submit">("draft");
  const [createdSowId, setCreatedSowId] = React.useState<string | null>(null);

  const runGeneration = async () => {
    setPhase("generating");
    const result = await generateSow(params);
    setGenerated(result);
    setPhase("review");
  };

  const handleCommit = async (args: CommitArgs) => {
    if (!generated) return;
    setSubmitting(args.kind);
    setSubmitError(null);
    try {
      const created = await createSow.mutateAsync({
        title: generated.title.trim() || "Generated SOW",
        confidentiality: params.classification === "restricted" ? "restricted" : params.classification === "confidential" ? "confidential" : "internal",
        body: generated.scopeBody.trim() || undefined,
        payload: {
          intakeMode: "ai_generated",
          generation: {
            params,
            templateUsed: generated.templateUsed,
            confidence: generated.confidence,
            patternMatch: generated.patternMatch,
            guardrails: generated.guardrails,
            auditTrace: generated.auditTrace,
            deliverables: generated.deliverables,
            clauses: generated.clauses,
            period: generated.period,
          },
          submission: {
            approvers: Object.fromEntries(
              Object.entries(args.config.approvers).map(([k, v]) => [k, { id: v.id, email: v.email, name: v.name }]),
            ),
            notify: args.config.notify,
            coverNote: args.config.coverNote || undefined,
          },
        },
      });
      setCreatedSowId(created.id);
      setCommittedKind(args.kind);
      if (args.kind === "submit") {
        const { submitSow } = await import("@/lib/api/sow-v2");
        await submitSow(created.id);
      }
      setPhase("done");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save SOW");
    } finally {
      setSubmitting(null);
    }
  };

  if (phase === "done" && createdSowId) {
    return (
      <SuccessCard
        title={committedKind === "submit" ? "Submitted for approval" : "Draft saved"}
        description={
          committedKind === "submit"
            ? "Your AI-generated SOW is now in the 5-stage approval pipeline."
            : "Your AI-generated SOW is saved as a draft."
        }
        sowId={createdSowId}
        committedKind={committedKind}
        onView={() => onDone(createdSowId)}
      />
    );
  }

  if (phase === "submit" && generated) {
    return (
      <SubmissionStep
        title={generated.title}
        saving={submitting}
        error={submitError}
        onBack={() => setPhase("review")}
        onCancel={onCancel}
        onCommit={handleCommit}
      />
    );
  }

  if (phase === "generating") {
    return <GenerationProgress params={params} />;
  }

  if (phase === "review" && generated) {
    return (
      <GenerationReview
        data={generated}
        onChange={setGenerated}
        onBack={() => setPhase("params")}
        onCancel={onCancel}
        onContinue={() => setPhase("submit")}
      />
    );
  }

  return (
    <ParameterWizard
      params={params}
      onChange={setParams}
      onCancel={onCancel}
      onGenerate={runGeneration}
    />
  );
}

/* ───────────────────── Step 1 — parameter wizard ─────────────────────── */

function ParameterWizard({
  params, onChange, onCancel, onGenerate,
}: {
  params: GenerateParams;
  onChange: (p: GenerateParams) => void;
  onCancel: () => void;
  onGenerate: () => void;
}) {
  const set = <K extends keyof GenerateParams>(k: K, v: GenerateParams[K]) => onChange({ ...params, [k]: v });
  const valid = params.objective.trim().length >= 8 && params.budgetInr > 0 && params.timelineWeeks > 0 && params.teamSize > 0;

  return (
    <Panel
      title={<span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-emphasis" strokeWidth={2.5} aria-hidden /> Generate a SOW with AI</span>}
      subtitle="Give the AI a few parameters. It drafts a complete SOW from approved templates + clause library — you review before anything is final."
    >
      <div className="p-4 space-y-4">
        <Field label="Industry">
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRY_OPTIONS.map((o) => {
              const active = params.industry === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set("industry", o.value as Industry)}
                  className={cn(
                    "h-8 px-3 rounded-md font-body text-[12.5px] font-semibold transition-colors duration-fast",
                    active ? "bg-brand text-on-brand" : "bg-surface border border-stroke text-text-secondary hover:bg-bg-subtle hover:text-foreground",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Objective" required hint={params.objective.length > 0 && params.objective.trim().length < 8 ? "Describe the goal in a few words" : "What outcome should this engagement deliver?"}>
          <textarea
            value={params.objective}
            onChange={(e) => set("objective", e.target.value)}
            rows={3}
            placeholder="e.g. Modernise the Acme billing platform with a self-serve portal and per-tenant rate cards"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Budget (₹)">
            <input
              type="number" min={0} step={50000}
              value={params.budgetInr}
              onChange={(e) => set("budgetInr", Number(e.target.value))}
              className={cn(inputCls, "font-mono tabular-nums")}
            />
          </Field>
          <Field label="Timeline (weeks)">
            <input
              type="number" min={1} max={52}
              value={params.timelineWeeks}
              onChange={(e) => set("timelineWeeks", Number(e.target.value))}
              className={cn(inputCls, "font-mono tabular-nums")}
            />
          </Field>
          <Field label="Team size">
            <input
              type="number" min={1} max={50}
              value={params.teamSize}
              onChange={(e) => set("teamSize", Number(e.target.value))}
              className={cn(inputCls, "font-mono tabular-nums")}
            />
          </Field>
        </div>

        <Field label="Confidentiality">
          <div className="inline-flex flex-wrap gap-1.5">
            {(["internal", "confidential", "restricted"] as const).map((c) => {
              const active = params.classification === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("classification", c)}
                  className={cn(
                    "h-8 px-3 rounded-md font-body text-[12px] font-semibold capitalize transition-colors duration-fast",
                    active ? "bg-brand text-on-brand" : "bg-surface border border-stroke text-text-secondary hover:bg-bg-subtle hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary mb-0.5">Guardrails applied</p>
          <p className="font-body text-[11.5px] text-text-secondary leading-snug">
            Generation is <span className="font-semibold text-foreground">template-locked</span> with an approved <span className="font-semibold text-foreground">clause library</span> and passes an <span className="font-semibold text-foreground">8-layer hallucination-prevention</span> check (≥90% confidence). A human must approve before it's final.
          </p>
        </div>
      </div>
      <Footer
        onCancel={onCancel}
        primary={{ label: "Generate SOW", icon: <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />, onClick: onGenerate, disabled: !valid }}
      />
    </Panel>
  );
}

/* ───────────────────── Step 2a — generation progress ─────────────────────── */

function GenerationProgress({ params }: { params: GenerateParams }) {
  const lines = [
    "Validating parameters…",
    "Selecting locked template…",
    "Composing from approved clause library…",
    "Running completeness + confidence checks…",
    "Pattern-matching against historical SOWs…",
  ];
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setActive((n) => Math.min(n + 1, lines.length - 1)), 420);
    return () => clearInterval(id);
  }, [lines.length]);
  return (
    <Panel
      title={<span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand" strokeWidth={2.5} aria-hidden /> SOW Generation Engine is drafting your SOW</span>}
      subtitle={`Industry: ${INDUSTRY_OPTIONS.find((o) => o.value === params.industry)?.label} · ${params.timelineWeeks} weeks · team of ${params.teamSize}`}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-brand animate-spin" strokeWidth={2.5} aria-hidden />
          <p className="font-body text-[12.5px] text-text-secondary">Generating under template + clause-library guardrails…</p>
        </div>
        <ol className="space-y-1.5">
          {lines.map((l, i) => (
            <li key={l} className="flex items-center gap-2 font-body text-[12px]">
              {i <= active ? <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2.5} aria-hidden /> : <span aria-hidden className="h-3.5 w-3.5 inline-block rounded-full border border-stroke" />}
              <span className={cn(i <= active ? "text-text-secondary" : "text-text-tertiary")}>{l}</span>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

/* ───────────────────── Step 2b — generated SOW review ─────────────────────── */

function GenerationReview({
  data, onChange, onBack, onCancel, onContinue,
}: {
  data: GeneratedSow;
  onChange: (d: GeneratedSow) => void;
  onBack: () => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const patch = <K extends keyof GeneratedSow>(k: K, v: GeneratedSow[K]) => onChange({ ...data, [k]: v });
  const confPct = Math.round(data.confidence * 100);
  const allPass = data.guardrails.every((g) => g.status === "pass" || g.n === 7); // layer 7 (human approval) is expected "warn"

  return (
    <Panel
      title="Review the AI-generated SOW"
      subtitle="The AI authored this from a locked template. Edit anything before you submit — nothing is final until a human approves."
    >
      <div className="p-4 space-y-5">
        {/* Generation banner */}
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] font-body">
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <FileText className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
            Template <span className="font-mono">{data.templateUsed}</span>
          </span>
          <span className="text-text-tertiary">· {data.industryLabel}</span>
          <span className="text-text-tertiary">· pattern match {Math.round(data.patternMatch.similarity * 100)}%</span>
          <span className={cn("ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10.5px] font-semibold tabular-nums", confPct >= 90 ? "bg-success-subtle text-success-text" : "bg-warning-subtle text-warning-text")}>
            {confPct}% confidence
          </span>
        </div>

        {/* 8-layer guardrail report */}
        <section>
          <h3 className="mb-1.5 inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-emphasis" strokeWidth={2} aria-hidden />
            Hallucination-prevention report
            <span className="font-mono text-[10px] text-text-tertiary">· 8 layers</span>
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {data.guardrails.map((g) => (
              <li key={g.n} className="rounded-md border border-stroke-subtle bg-white/70 backdrop-blur-sm px-2.5 py-1.5 flex items-start gap-2">
                {g.status === "pass"
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-success-text mt-0.5 shrink-0" strokeWidth={2.5} aria-hidden />
                  : <AlertTriangle className="h-3.5 w-3.5 text-warning-text mt-0.5 shrink-0" strokeWidth={2.5} aria-hidden />}
                <div className="min-w-0">
                  <p className="font-body text-[11.5px] font-semibold text-foreground">
                    <span className="font-mono text-[9.5px] text-text-tertiary mr-1">L{g.n}</span>{g.name}
                  </p>
                  <p className="font-body text-[10.5px] text-text-tertiary leading-tight">{g.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          {!allPass && (
            <p className="mt-1.5 font-body text-[11px] text-warning-text">Some layers need attention before final approval.</p>
          )}
        </section>

        {/* Title */}
        <Field label="Title" required>
          <input value={data.title} onChange={(e) => patch("title", e.target.value)} className={inputCls} />
        </Field>

        {/* Deliverables */}
        <section>
          <h3 className="mb-1.5 font-body text-[12.5px] font-semibold text-foreground">Deliverables <span className="font-mono text-[10px] text-text-tertiary">· {data.deliverables.length}</span></h3>
          <ul className="space-y-1.5">
            {data.deliverables.map((d, i) => (
              <li key={d.id} className="rounded-md border border-stroke-subtle bg-white/70 px-2.5 py-1.5 flex items-center gap-2">
                <span className="font-mono text-[10px] text-text-tertiary tabular-nums w-6 shrink-0">D{String(i + 1).padStart(2, "0")}</span>
                <input value={d.title} onChange={(e) => { const n = [...data.deliverables]; n[i] = { ...d, title: e.target.value }; patch("deliverables", n); }} className={cellCls} />
                <input type="number" min={0} value={d.hours ?? ""} onChange={(e) => { const n = [...data.deliverables]; n[i] = { ...d, hours: e.target.value ? Number(e.target.value) : undefined }; patch("deliverables", n); }} placeholder="hrs" className={cn(cellCls, "w-16 font-mono tabular-nums")} />
                <button type="button" onClick={() => patch("deliverables", data.deliverables.filter((_, j) => j !== i))} aria-label="Remove" className="h-7 w-7 inline-flex items-center justify-center rounded text-text-tertiary hover:text-error-text hover:bg-bg-subtle">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => patch("deliverables", [...data.deliverables, { id: `gd-${Date.now()}`, title: "", hours: 8 }])} className="mt-2 inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover">
            <Plus className="h-3 w-3" strokeWidth={2} aria-hidden /> Add deliverable
          </button>
        </section>

        {/* Clauses */}
        <section>
          <h3 className="mb-1.5 font-body text-[12.5px] font-semibold text-foreground">Clauses <span className="font-mono text-[10px] text-text-tertiary">· from approved library</span></h3>
          <ul className="space-y-1.5">
            {data.clauses.map((c, i) => (
              <li key={c.id} className="rounded-md border border-stroke-subtle bg-white/70 px-2.5 py-1.5 flex items-start gap-2">
                <span className={cn("h-7 px-1.5 inline-flex items-center rounded border font-mono text-[10px] uppercase tracking-[0.08em] shrink-0", clauseClass(c.kind))}>{c.kind}</span>
                <textarea value={c.text} onChange={(e) => { const n = [...data.clauses]; n[i] = { ...c, text: e.target.value }; patch("clauses", n); }} rows={1} className={cn(cellCls, "flex-1 min-h-[28px] resize-y")} />
                <span className="font-mono text-[10px] text-text-tertiary tabular-nums mt-1 shrink-0">{Math.round(c.confidence * 100)}%</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Scope body */}
        <Field label="Scope body (Markdown)" hint="AI-generated. Edit freely.">
          <textarea value={data.scopeBody} onChange={(e) => patch("scopeBody", e.target.value)} rows={10} className={inputCls} />
        </Field>
      </div>
      <Footer
        onBack={onBack}
        onCancel={onCancel}
        primary={{ label: "Continue · pick approvers", onClick: onContinue, disabled: data.title.trim().length < 3 }}
      />
    </Panel>
  );
}

/* ───────────────────── shared bits ─────────────────────── */

function SuccessCard({
  title,
  description,
  sowId,
  committedKind,
  onView,
}: {
  title: string;
  description: string;
  sowId: string;
  committedKind: "draft" | "submit";
  onView: () => void;
}) {
  return (
    <div className="rounded-lg border border-stroke bg-surface shadow-xs p-6">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-success-subtle text-success-text mb-3">
        <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} aria-hidden />
      </div>
      <p className="font-body text-[15px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary max-w-md">{description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onView} className={cn("inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover")}>
          View SOW
        </button>
        {committedKind === "submit" ? (
          <span className="font-body text-[12px] text-text-secondary">Already in approval pipeline</span>
        ) : null}
        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">{sowId}</span>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
      <header className="px-4 py-2.5 border-b border-stroke-subtle">
        <h2 className="font-body text-[13.5px] font-semibold text-foreground tracking-[-0.005em]">{title}</h2>
        {subtitle && <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary leading-snug">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}{required && <span className="text-error-text normal-case tracking-normal"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 font-body text-[11px] text-text-tertiary">{hint}</p>}
    </div>
  );
}

function Footer({
  onBack, onCancel, primary,
}: {
  onBack?: () => void;
  onCancel: () => void;
  primary: { label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean };
}) {
  return (
    <footer className="flex items-center justify-between gap-3 px-4 py-3 border-t border-stroke-subtle bg-bg-subtle/30">
      <div className="flex items-center gap-2">
        {onBack && (
          <button type="button" onClick={onBack} className="inline-flex items-center h-9 px-3.5 rounded-md font-body text-[13px] font-semibold text-text-secondary hover:bg-bg-subtle hover:text-foreground transition-colors duration-fast">Back</button>
        )}
        <button type="button" onClick={onCancel} className="inline-flex items-center h-9 px-3.5 rounded-md font-body text-[13px] font-semibold text-text-tertiary hover:text-foreground transition-colors duration-fast">Cancel</button>
      </div>
      <button
        type="button"
        onClick={primary.onClick}
        disabled={primary.disabled}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {primary.icon}
        {primary.label}
      </button>
    </footer>
  );
}

const inputCls = cn(
  "w-full px-3 py-2 rounded-md bg-surface border border-stroke",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);
const cellCls = cn(
  "h-8 px-2 rounded border border-stroke-subtle bg-surface",
  "font-body text-[12.5px] text-foreground",
  "focus-visible:outline-none focus-visible:border-brand",
);

function clauseClass(kind: ClauseKind): string {
  switch (kind) {
    case "dependency": return "border-brand/30 text-brand-emphasis bg-brand-subtle/60";
    case "assumption": return "border-warning-border text-warning-text bg-warning-subtle";
    case "constraint": return "border-stroke text-text-secondary";
  }
}
