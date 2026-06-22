"use client";

/**
 * Grievance form — matches new-ticket / safety-report workroom pattern.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock,
  GitBranch,
  MessageSquarePlus,
  MoreHorizontal,
  Paperclip,
  RotateCcw,
  Scale,
  Send,
  ShieldAlert,
  Target,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type GrievanceType = "unfair_rejection" | "payment_dispute" | "process_issue" | "other";

const TYPES: {
  value: GrievanceType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  {
    value: "unfair_rejection",
    label: "Unfair rejection",
    description: "Submission rejected without fair rubric alignment",
    icon: RotateCcw,
  },
  {
    value: "payment_dispute",
    label: "Payment dispute",
    description: "Withheld payout, incorrect amount, or timing issue",
    icon: Wallet,
  },
  {
    value: "process_issue",
    label: "Process / fairness issue",
    description: "Policy applied inconsistently or process breakdown",
    icon: GitBranch,
  },
  {
    value: "other",
    label: "Other",
    description: "Another process grievance not listed above",
    icon: MoreHorizontal,
  },
];

const inputCls = cn(
  "w-full h-9 px-3 rounded-md bg-surface border border-stroke",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

export function GrievanceFormView() {
  const router = useRouter();

  const [type, setType] = React.useState<GrievanceType>("unfair_rejection");
  const [story, setStory] = React.useState("");
  const [when, setWhen] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [outcome, setOutcome] = React.useState("");
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [caseRef, setCaseRef] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const canSubmit = story.trim().length > 0 && !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contributor/support/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Grievance: ${type.replace(/_/g, " ")}`,
          type,
          story: story.trim(),
          when,
          reference,
          outcome,
          priority: "high",
          attachments,
        }),
      });
      if (!res.ok) throw new Error(`Submit failed (${res.status})`);
      const row = (await res.json().catch(() => ({}))) as { id?: string | number };
      setCaseRef(row?.id != null ? `GR-${row.id}` : `GR-${Date.now().toString().slice(-6)}`);
      setTimeout(() => router.push("/contributor/support"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your grievance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setAttachments((p) => [...p, ...files.map((f) => f.name)]);
    e.currentTarget.value = "";
  };

  if (caseRef) {
    return (
      <div className="pb-12 flex justify-center">
        <section className="w-full max-w-md rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          <div className="px-6 py-8 text-center">
            <div
              className="mx-auto h-12 w-12 rounded-full bg-success-subtle flex items-center justify-center mb-4"
              aria-hidden
            >
              <CheckCircle2 className="h-6 w-6 text-success-text" strokeWidth={2} />
            </div>
            <h2 className="font-body text-[18px] font-semibold text-foreground tracking-[-0.01em]">
              Grievance submitted
            </h2>
            <p className="mt-2 font-body text-[12.5px] text-text-secondary">
              Case{" "}
              <span className="font-mono text-[12px] font-semibold text-foreground">{caseRef}</span>
            </p>
            <p className="mt-1 font-body text-[12px] text-text-secondary">
              Reviewed by an independent team. Expected response within 5 business days.
            </p>
            <p className="mt-4 font-body text-[11.5px] text-text-tertiary italic">
              Returning to Help & safety…
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6 xl:items-start space-y-4 xl:space-y-0"
      >
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-stroke-subtle">
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Grievance details
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Include task IDs, dates, and the events leading up to the issue. The panel reviews
              without your mentor in the loop.
            </p>
          </div>

          <div className="p-5 space-y-5">
            <Field label="Type of grievance">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TYPES.map((opt) => {
                  const selected = type === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={cn(
                        "relative flex flex-col items-start gap-2 rounded-lg border px-3.5 py-3 text-left transition-colors duration-fast",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
                        selected
                          ? "border-brand bg-brand-subtle/40"
                          : "border-stroke-subtle bg-surface hover:bg-bg-subtle/60",
                      )}
                    >
                      {selected ? (
                        <span className="absolute top-2.5 right-2.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand text-on-brand">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                        </span>
                      ) : null}
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selected ? "text-brand-subtle-text" : "text-text-secondary",
                        )}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span>
                        <span className="block font-body text-[12.5px] font-semibold text-foreground">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block font-body text-[11px] text-text-tertiary leading-snug">
                          {opt.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Tell us what happened" required>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Include relevant dates, task IDs, and the events leading up to the issue."
                rows={6}
                className={cn(inputCls, "h-auto py-2.5 resize-y min-h-[140px]")}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="When did this happen?">
                <input
                  type="date"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Related task / project / ticket">
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. task-008 or TKT-1042"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="What outcome are you seeking?">
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g. re-review of the submission, refund of withheld payout, policy correction."
                rows={3}
                className={cn(inputCls, "h-auto py-2.5 resize-y min-h-[88px]")}
              />
            </Field>

            <Field label="Attach evidence" optional>
              <div className="space-y-2">
                {attachments.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {attachments.map((file, i) => (
                      <li
                        key={`${file}-${i}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-subtle border border-stroke-subtle font-body text-[11px] text-foreground"
                      >
                        <Paperclip className="h-3 w-3 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                        {file}
                        <button
                          type="button"
                          onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))}
                          aria-label={`Remove ${file}`}
                          className="text-text-tertiary hover:text-error-text"
                        >
                          <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <input ref={fileRef} type="file" multiple onChange={onPickFiles} className="hidden" aria-hidden />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-dashed border-stroke text-text-tertiary hover:text-foreground hover:border-stroke-strong font-body text-[11.5px] font-medium transition-colors duration-fast"
                >
                  <Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Add file
                </button>
              </div>
            </Field>
          </div>

          {error ? (
            <div className="mx-5 mb-3 rounded-md bg-error-subtle border border-error-border px-3 py-2.5">
              <p className="font-body text-[12px] text-error-text">{error}</p>
            </div>
          ) : null}

          <footer className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-stroke-subtle bg-bg-subtle/60">
            <Link
              href="/contributor/support"
              className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
                "bg-brand text-on-brand font-body text-[13px] font-semibold",
                "hover:bg-brand-hover transition-colors duration-fast",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {submitting ? "Submitting…" : "Submit grievance"}
            </button>
          </footer>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
          <div className="rounded-xl border border-warning-border/50 bg-warning-subtle/30 p-5">
            <div className="flex items-start gap-2.5">
              <Scale className="h-4 w-4 text-warning-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <div>
                <h3 className="font-body text-[13px] font-semibold text-foreground">Independent review</h3>
                <p className="mt-1.5 font-body text-[11.5px] text-text-secondary leading-relaxed">
                  Grievances are handled by a panel outside your mentor chain. Your current mentor
                  is not involved in the decision.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <h3 className="font-body text-[13px] font-semibold text-foreground">What happens next</h3>
            <ul className="mt-3 space-y-2.5">
              <InfoRow
                icon={Clock}
                text="First response within 5 business days. You'll be notified here and by email."
              />
              <InfoRow
                icon={Target}
                text="Possible outcomes include re-review, payout correction, or policy updates."
              />
              <InfoRow
                icon={Scale}
                text="Include the outcome you're seeking — it helps the panel frame their decision."
              />
            </ul>
          </div>

          <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-3">
            <h3 className="font-body text-[13px] font-semibold text-foreground">Wrong channel?</h3>
            <p className="font-body text-[11.5px] text-text-secondary leading-relaxed">
              Safety concerns and general questions use dedicated routes.
            </p>
            <Link
              href="/contributor/support/safety-report"
              className="flex items-start gap-2.5 rounded-lg border border-error-border/30 bg-error-subtle/20 px-3.5 py-3 hover:bg-error-subtle/40 transition-colors duration-fast"
            >
              <ShieldAlert className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <span>
                <span className="block font-body text-[12.5px] font-semibold text-foreground">
                  Safety report
                </span>
                <span className="mt-0.5 block font-body text-[11px] text-text-secondary">
                  Harassment, unsafe content, discrimination
                </span>
              </span>
            </Link>
            <Link
              href="/contributor/support/tickets/new"
              className="flex items-start gap-2.5 rounded-lg border border-stroke-subtle bg-bg-subtle/50 px-3.5 py-3 hover:bg-bg-subtle transition-colors duration-fast"
            >
              <MessageSquarePlus className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <span>
                <span className="block font-body text-[12.5px] font-semibold text-foreground">
                  Open a ticket
                </span>
                <span className="mt-0.5 block font-body text-[11px] text-text-secondary">
                  Tasks, payouts, credentials, account help
                </span>
              </span>
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required ? <span className="text-error-text ml-0.5">*</span> : null}
        {optional ? (
          <span className="normal-case font-medium tracking-normal text-text-disabled ml-1">
            (optional)
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      <span className="font-body text-[11.5px] text-text-secondary leading-relaxed">{text}</span>
    </li>
  );
}
