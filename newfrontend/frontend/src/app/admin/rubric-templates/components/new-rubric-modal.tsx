"use client";

/**
 * New rubric template — modal on the library page (no separate route).
 * Essentials only: name and deliverable type.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { createAdminRubric } from "@/lib/admin/mocks/rubrics-service";
import { useAdminRubricsList } from "@/lib/hooks/use-admin-rubrics";
import type { MockRubricTemplate } from "@/mocks/admin/rubrics";
import { cn } from "@/lib/utils/cn";
import { AdminModal, TONE, primaryBtnClass, primaryStyle, secondaryBtnClass } from "../../_shell/aurora-ui";

const APPLIES_OPTIONS: MockRubricTemplate["appliesTo"][] = ["Code", "Design", "Data", "Marketing", "Documentation"];

const APPLIES_LABEL: Record<MockRubricTemplate["appliesTo"], string> = {
  Code: "Code / engineering",
  Design: "Design",
  Data: "Data",
  Marketing: "Marketing",
  Documentation: "Documentation",
};

const MIN_NAME_LENGTH = 2;

const FIELD =
  "w-full h-10 px-3 rounded-lg border border-stroke-subtle bg-surface font-body text-[13.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";

const SELECT = cn(FIELD, "appearance-none pr-10 cursor-pointer");

interface NewRubricModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewRubricModal({ open, onClose }: NewRubricModalProps) {
  const router = useRouter();
  const templates = useAdminRubricsList();

  const [name, setName] = React.useState("");
  const [appliesTo, setAppliesTo] = React.useState<MockRubricTemplate["appliesTo"]>("Code");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setAppliesTo("Code");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length >= MIN_NAME_LENGTH && !submitting;

  const duplicate = React.useMemo(() => {
    if (trimmedName.length < MIN_NAME_LENGTH) return null;
    const needle = trimmedName.toLowerCase();
    return templates.find((t) => t.name.toLowerCase() === needle && t.appliesTo === appliesTo) ?? null;
  }, [templates, trimmedName, appliesTo]);

  function handleClose() {
    if (!submitting) onClose();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = createAdminRubric({ name: trimmedName, appliesTo });
      onClose();
      router.push(`/admin/rubric-templates/${created.id}?created=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create template.");
      setSubmitting(false);
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={handleClose}
      icon={Plus}
      tone="ai"
      title="New rubric template"
      description="Platform default for a deliverable type. Starts with Quality and Completeness criteria — refine on the template detail page."
      footer={
        <>
          <button type="button" onClick={handleClose} disabled={submitting} className={secondaryBtnClass}>
            Cancel
          </button>
          <button type="submit" form="new-rubric-form" disabled={!canSubmit} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
            <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {submitting ? "Creating…" : "Create template"}
          </button>
        </>
      }
    >
      <form id="new-rubric-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="rubric-name" className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
            Display name <span style={{ color: TONE.error.text }}>*</span>
          </label>
          <input
            id="rubric-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. QA default, Design system review"
            autoFocus
            required
            className={FIELD}
          />
          {duplicate ? (
            <p className="mt-1.5 font-body text-[12px]" style={{ color: TONE.warning.text }}>
              A {APPLIES_LABEL[appliesTo]} template named{" "}
              <Link
                href={`/admin/rubric-templates/${duplicate.id}`}
                className="font-semibold underline underline-offset-2 hover:opacity-80"
                onClick={handleClose}
              >
                {duplicate.name}
              </Link>{" "}
              already exists.
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="rubric-applies" className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
            Applies to
          </label>
          <div className="relative">
            <select
              id="rubric-applies"
              value={appliesTo}
              onChange={(e) => {
                setAppliesTo(e.target.value as MockRubricTemplate["appliesTo"]);
                setError(null);
              }}
              className={SELECT}
            >
              {APPLIES_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {APPLIES_LABEL[o]}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <p className="mt-1.5 font-body text-[12px] text-text-tertiary">
            Task type this rubric scores during mentor review.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border px-3 py-2 font-body text-[12px]"
            style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
          >
            {error}
          </p>
        ) : null}
      </form>
    </AdminModal>
  );
}
