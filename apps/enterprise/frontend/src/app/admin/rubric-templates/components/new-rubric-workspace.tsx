"use client";

/**
 * New rubric template — aligned with new skill + new pool form patterns.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, Plus } from "lucide-react";
import { Select } from "@/components/meridian";
import { createAdminRubric } from "@/lib/admin/mocks/rubrics-service";
import { useAdminRubricsList } from "@/lib/hooks/use-admin-rubrics";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockRubricTemplate } from "@/mocks/admin/rubrics";
import { cn } from "@/lib/utils/cn";

const APPLIES_OPTIONS: MockRubricTemplate["appliesTo"][] = [
  "Code",
  "Design",
  "Data",
  "Marketing",
  "Documentation",
];

const APPLIES_LABEL: Record<MockRubricTemplate["appliesTo"], string> = {
  Code: "Code / engineering",
  Design: "Design",
  Data: "Data",
  Marketing: "Marketing",
  Documentation: "Documentation",
};

const DEFAULT_CRITERIA = [
  { label: "Quality", weight: 50, description: "Overall deliverable quality." },
  { label: "Completeness", weight: 50, description: "Meets all stated requirements." },
];

const MIN_NAME_LENGTH = 2;

export function NewRubricWorkspace() {
  const router = useRouter();
  const canEdit = useAdminSectionCanEdit("rubricTemplates");
  const templates = useAdminRubricsList();

  const [name, setName] = React.useState("");
  const [appliesTo, setAppliesTo] = React.useState<MockRubricTemplate["appliesTo"]>("Code");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!canEdit) router.replace("/admin/rubric-templates");
  }, [canEdit, router]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length >= MIN_NAME_LENGTH && !submitting;

  const duplicateHint = React.useMemo(() => {
    if (trimmedName.length < MIN_NAME_LENGTH) return null;
    const needle = trimmedName.toLowerCase();
    return (
      templates.find(
        (t) =>
          t.name.toLowerCase() === needle &&
          t.appliesTo === appliesTo,
      ) ?? null
    );
  }, [templates, trimmedName, appliesTo]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    if (!trimmedName) {
      setError("Template name is required.");
      return;
    }
    setSubmitting(true);
    const created = createAdminRubric({ name: trimmedName, appliesTo });
    router.push(`/admin/rubric-templates/${created.id}?created=1`);
  }

  if (!canEdit) return null;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/rubric-templates"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          <span>Rubric templates</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">New template</span>
      </nav>

      <header className="min-w-0">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Template
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          New rubric template
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Create a platform default rubric for a deliverable type. Enterprises copy and customize
          for their review workflows.
        </p>
      </header>

      <div className="rounded-xl border border-brand-border/40 bg-brand-subtle/15 px-4 py-3">
        <p className="font-body text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-brand-emphasis shrink-0" strokeWidth={2} aria-hidden />
          Default criteria included
        </p>
        <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
          New templates start with two criteria at 50% weight each. Refine labels, weights, and
          add feedback snippets after creation from the template editor.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden"
      >
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Template identity
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Name and task type for this rubric
          </p>
        </header>

        <div className="px-5 py-5 space-y-5">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-error-border bg-error-subtle px-3 py-2 font-body text-[12.5px] text-error-text"
            >
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Display name" required>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className={inputCls}
                placeholder="e.g. QA default, Design system review"
                autoFocus
                required
              />
              {duplicateHint && (
                <p className="mt-1.5 font-body text-[11.5px] text-warning-text">
                  A {APPLIES_LABEL[appliesTo]} template named{" "}
                  <Link
                    href={`/admin/rubric-templates/${duplicateHint.id}`}
                    className="font-semibold underline underline-offset-2 hover:opacity-80"
                  >
                    {duplicateHint.name}
                  </Link>{" "}
                  already exists.
                </p>
              )}
            </Field>

            <Field label="Applies to" required>
              <Select
                variant="outline"
                size="sm"
                value={appliesTo}
                onChange={(e) =>
                  setAppliesTo(e.target.value as MockRubricTemplate["appliesTo"])
                }
              >
                {APPLIES_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {APPLIES_LABEL[o]}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
                Task type this rubric scores during mentor review
              </p>
            </Field>
          </div>

          <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/30 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-stroke-subtle">
              <p className="font-body text-[12px] font-semibold text-foreground">
                Starting criteria
              </p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
                1–5 scale · 100% total weight
              </p>
            </div>
            <ul className="divide-y divide-stroke-subtle">
              {DEFAULT_CRITERIA.map((c, i) => (
                <li key={c.label} className="flex gap-3 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-subtle font-mono text-[11px] font-bold tabular-nums text-brand-subtle-text">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-body text-[12.5px] font-semibold text-foreground">
                        {c.label}
                      </p>
                      <span className="font-mono text-[10.5px] tabular-nums text-text-tertiary">
                        {c.weight}%
                      </span>
                    </div>
                    <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
                      {c.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-stroke-subtle">
          <Link
            href="/admin/rubric-templates"
            className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
          >
            Cancel
          </Link>
          <button type="submit" disabled={!canSubmit} className={primaryBtnCls}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            {submitting ? "Creating…" : "Create template"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && (
          <span className="text-error-text normal-case tracking-normal"> *</span>
        )}
      </span>
      {children}
    </div>
  );
}

const inputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke bg-surface",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);
