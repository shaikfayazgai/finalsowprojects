"use client";

/**
 * New ticket form — matches payout-method / support detail workroom pattern.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  LifeBuoy,
  MessageSquarePlus,
  Paperclip,
  Scale,
  Send,
  ShieldAlert,
  Upload,
  User,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import type { MockTask } from "@/mocks/contributor";
import { fetchTask } from "@/lib/api/contributor-mock";
import { cn } from "@/lib/utils/cn";

type TicketCategory = "task" | "payout" | "credential" | "account" | "other";

const CATEGORIES: {
  value: TicketCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  {
    value: "task",
    label: "Task",
    description: "Assignments, submissions, mentor questions",
    icon: Wrench,
  },
  {
    value: "payout",
    label: "Payout",
    description: "Withdrawals, balances, payment rails",
    icon: Wallet,
  },
  {
    value: "credential",
    label: "Credential",
    description: "Issuance, sharing, verification",
    icon: Award,
  },
  {
    value: "account",
    label: "Account",
    description: "Login, profile, privacy settings",
    icon: User,
  },
  {
    value: "other",
    label: "Other",
    description: "Anything not covered above",
    icon: LifeBuoy,
  },
];

const inputCls = cn(
  "w-full h-9 px-3 rounded-md bg-surface border border-stroke",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

interface NewTicketViewProps {
  taskId: string;
}

export function NewTicketView({ taskId }: NewTicketViewProps) {
  const router = useRouter();

  const [task, setTask] = React.useState<MockTask | null>(null);
  const [category, setCategory] = React.useState<TicketCategory>("other");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [submittedRef, setSubmittedRef] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!taskId) return;
    const c = new AbortController();
    fetchTask(taskId, c.signal)
      .then((res) => {
        setTask(res.task);
        setSubject((s) => s || `Need help with: ${res.task.title}`);
        setCategory((cat) => (cat === "other" ? "task" : cat));
        setDescription((d) =>
          d ||
          `Task context:\n- ID: ${res.task.id}\n- Title: ${res.task.title}\n- Status: ${res.task.status}\n\n`,
        );
      })
      .catch(() => {
        /* no context, fall through */
      });
    return () => c.abort();
  }, [taskId]);

  const canSubmit = subject.trim().length > 0 && description.trim().length > 0 && !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    const ref = `TKT-${Date.now().toString().slice(-6)}`;
    setSubmitting(false);
    setSubmittedRef(ref);
    setTimeout(() => router.push("/contributor/support"), 1800);
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setAttachments((prev) => [...prev, ...files.map((f) => f.name)]);
    e.currentTarget.value = "";
  };

  if (submittedRef) {
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
              Ticket submitted
            </h2>
            <p className="mt-2 font-body text-[12.5px] text-text-secondary">
              Reference{" "}
              <span className="font-mono text-[12px] font-semibold text-foreground">{submittedRef}</span>
            </p>
            <p className="mt-1 font-body text-[12px] text-text-secondary">
              Expected response within 24 hours on business days.
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
              Ticket details
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Include task IDs, error messages, or steps to reproduce where relevant.
            </p>
          </div>

          <div className="p-5 space-y-5">
            {task ? (
              <div className="rounded-lg border border-brand/20 bg-brand-subtle/30 px-4 py-3 flex items-start gap-3">
                <MessageSquarePlus
                  className="h-4 w-4 text-brand-subtle-text shrink-0 mt-0.5"
                  strokeWidth={2}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-body text-[12px] font-semibold text-brand-subtle-text">
                    Task context attached
                  </p>
                  <p className="mt-0.5 font-body text-[12.5px] text-foreground truncate">
                    {task.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-text-secondary tabular-nums">
                    {task.id}
                  </p>
                </div>
              </div>
            ) : null}

            <Field label="Category">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {CATEGORIES.map((opt) => {
                  const selected = category === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
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

            <Field label="Subject" required>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className={inputCls}
              />
            </Field>

            <Field label="Description" required>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include task IDs, error messages, or steps to reproduce if applicable."
                rows={6}
                className={cn(inputCls, "h-auto py-2.5 resize-y min-h-[140px]")}
              />
            </Field>

            <Field label="Attachments">
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
              {submitting ? "Submitting…" : "Submit ticket"}
            </button>
          </footer>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
          <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <h3 className="font-body text-[13px] font-semibold text-foreground">Before you submit</h3>
            <ul className="mt-3 space-y-2.5">
              <InfoRow
                icon={Clock}
                text="Support replies within 24 hours on business days. Payout issues may take an extra day."
              />
              <InfoRow
                icon={MessageSquarePlus}
                text="Check the FAQ on Help & safety — many payout and task questions are answered there."
              />
              <InfoRow
                icon={LifeBuoy}
                text="Include reference IDs (task, transaction, credential) so we can investigate faster."
              />
            </ul>
          </div>

          <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-3">
            <h3 className="font-body text-[13px] font-semibold text-foreground">Not the right channel?</h3>
            <p className="font-body text-[11.5px] text-text-secondary leading-relaxed">
              Use a dedicated route for sensitive or process disputes — they go to separate review
              queues.
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
              href="/contributor/support/grievance"
              className="flex items-start gap-2.5 rounded-lg border border-warning-border/40 bg-warning-subtle/20 px-3.5 py-3 hover:bg-warning-subtle/40 transition-colors duration-fast"
            >
              <Scale className="h-4 w-4 text-warning-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <span>
                <span className="block font-body text-[12.5px] font-semibold text-foreground">
                  Open a grievance
                </span>
                <span className="mt-0.5 block font-body text-[11px] text-text-secondary">
                  Unfair rejection, payment dispute, process issue
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
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required ? <span className="text-error-text ml-0.5">*</span> : null}
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
