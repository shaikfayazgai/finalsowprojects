"use client";

/**
 * New skill — aligned with merge skills + new pool form patterns.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, Plus } from "lucide-react";
import { Select } from "@/components/meridian";
import { createAdminSkill } from "@/lib/admin/mocks/skills-service";
import { useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockSkill } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";

const CATEGORIES: MockSkill["category"][] = [
  "Frontend",
  "Backend",
  "Data",
  "Design",
  "Marketing",
  "Documentation",
  "DevOps",
  "AI/ML",
  "Other",
];

const STD_LEVELS = [
  { level: "L1", label: "Familiar", description: "Have done it; need supervision." },
  { level: "L2", label: "Competent", description: "Can deliver to spec." },
  { level: "L3", label: "Strong", description: "Can deliver + help others." },
  { level: "L4", label: "Expert", description: "Can shape the spec." },
];

const MIN_NAME_LENGTH = 2;

export function NewSkillWorkspace() {
  const router = useRouter();
  const skills = useAdminSkillsList();

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<MockSkill["category"]>("Frontend");
  const [aliases, setAliases] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const trimmedName = name.trim();
  const parsedAliases = aliases
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  const duplicateHint = React.useMemo(() => {
    if (trimmedName.length < MIN_NAME_LENGTH) return null;
    const needle = trimmedName.toLowerCase();
    const match = skills.find(
      (s) =>
        s.name.toLowerCase() === needle ||
        s.aliases.some((a) => a.toLowerCase() === needle),
    );
    return match ?? null;
  }, [skills, trimmedName]);

  const canSubmit = trimmedName.length >= MIN_NAME_LENGTH && !submitting;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const skill = createAdminSkill({
      name: trimmedName,
      category,
      aliases: parsedAliases,
    });
    router.push(`/admin/skill-taxonomy/${skill.id}?created=1`);
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/skill-taxonomy"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          <span>Skill taxonomy</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">New skill</span>
      </nav>

      <header className="min-w-0">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Skill taxonomy
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          New skill
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Add a canonical skill to the platform taxonomy. Skills are active immediately and
          available for competency assignment.
        </p>
      </header>

      <div className="rounded-xl border border-brand-border/40 bg-brand-subtle/15 px-4 py-3">
        <p className="font-body text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-brand-emphasis shrink-0" strokeWidth={2} aria-hidden />
          Standard level scale applied
        </p>
        <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
          New skills receive the platform L1–L4 proficiency definitions. Adjacency links can be
          configured after creation from the skill detail page.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden"
      >
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Skill identity
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Display name, category, and optional aliases
          </p>
        </header>

        <div className="px-5 py-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Display name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="e.g. React, PostgreSQL, Technical writing"
                required
                autoFocus
              />
              {duplicateHint && (
                <p className="mt-1.5 font-body text-[11.5px] text-warning-text">
                  Similar skill exists:{" "}
                  <Link
                    href={`/admin/skill-taxonomy/${duplicateHint.id}`}
                    className="font-semibold underline underline-offset-2 hover:opacity-80"
                  >
                    {duplicateHint.name}
                  </Link>
                  . Consider merging instead.
                </p>
              )}
            </Field>

            <Field label="Category" required>
              <Select
                variant="outline"
                size="sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as MockSkill["category"])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Aliases" hint="Comma-separated alternate names contributors may use">
            <input
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              className={inputCls}
              placeholder="e.g. ReactJS, React.js"
            />
            {parsedAliases.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parsedAliases.map((alias) => (
                  <span
                    key={alias}
                    className="inline-flex items-center rounded-full border border-stroke-subtle bg-bg-subtle/60 px-2 py-0.5 font-body text-[11px] font-medium text-text-secondary"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            )}
          </Field>

          <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/30 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-stroke-subtle">
              <p className="font-body text-[12px] font-semibold text-foreground">
                Default level definitions
              </p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
                Applied automatically on creation
              </p>
            </div>
            <ul className="divide-y divide-stroke-subtle">
              {STD_LEVELS.map((level) => (
                <li key={level.level} className="flex gap-3 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-subtle font-mono text-[11px] font-bold tabular-nums text-brand-subtle-text">
                    {level.level}
                  </span>
                  <div>
                    <p className="font-body text-[12.5px] font-semibold text-foreground">
                      {level.label}
                    </p>
                    <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
                      {level.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-stroke-subtle">
          <Link
            href="/admin/skill-taxonomy"
            className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
          >
            Cancel
          </Link>
          <button type="submit" disabled={!canSubmit} className={primaryBtnCls}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            {submitting ? "Creating…" : "Create skill"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
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
      {hint && (
        <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">{hint}</p>
      )}
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
