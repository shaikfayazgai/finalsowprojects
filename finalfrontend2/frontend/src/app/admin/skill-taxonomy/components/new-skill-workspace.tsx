"use client";

/**
 * New skill — Aurora Glass, full-width two-column (form + level reference).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createAdminSkill } from "@/lib/admin/mocks/skills-service";
import { useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockSkill } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";
import {
  AURORA_ACCENT,
  AuroraInput,
  AuroraSelect,
  Chip,
  Crumbs,
  Field,
  GlassCard,
  PageHeader,
  TONE,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

const CATEGORIES: MockSkill["category"][] = ["Frontend", "Backend", "Data", "Design", "Marketing", "Documentation", "DevOps", "AI/ML", "Other"];

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
  const parsedAliases = aliases.split(",").map((a) => a.trim()).filter(Boolean);

  const duplicateHint = React.useMemo(() => {
    if (trimmedName.length < MIN_NAME_LENGTH) return null;
    const needle = trimmedName.toLowerCase();
    return skills.find((s) => s.name.toLowerCase() === needle || s.aliases.some((a) => a.toLowerCase() === needle)) ?? null;
  }, [skills, trimmedName]);

  const canSubmit = trimmedName.length >= MIN_NAME_LENGTH && !submitting;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const skill = createAdminSkill({ name: trimmedName, category, aliases: parsedAliases });
    router.push(`/admin/skill-taxonomy/${skill.id}?created=1`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 animate-fade-in">
      <Crumbs items={[{ label: "Skill taxonomy", href: "/admin/skill-taxonomy" }, { label: "New skill" }]} />

      <PageHeader
        eyebrow="Platform · Taxonomy"
        title="New skill"
        subtitle="Add a canonical skill. It's active immediately and available for competency assignment; adjacency can be set afterward."
        actions={
          <>
            <Link href="/admin/skill-taxonomy" className="inline-flex items-center h-10 px-3.5 font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={!canSubmit} className={primaryBtnClass} style={primaryStyle}>
              <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              {submitting ? "Creating…" : "Create skill"}
            </button>
          </>
        }
      />

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
        {/* Form */}
        <GlassCard className="flex-1 min-w-0 overflow-hidden">
          <header className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55">
            <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">Skill identity</h2>
            <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">Display name, category, and optional aliases.</p>
          </header>
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Field label="Display name" required>
                <AuroraInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. React, PostgreSQL" required autoFocus />
                {duplicateHint && (
                  <p className="mt-1.5 font-body text-[11.5px]" style={{ color: TONE.warning.text }}>
                    Similar skill exists:{" "}
                    <Link href={`/admin/skill-taxonomy/${duplicateHint.id}`} className="font-semibold underline underline-offset-2 hover:opacity-80">{duplicateHint.name}</Link>. Consider merging instead.
                  </p>
                )}
              </Field>
              <Field label="Category" required>
                <AuroraSelect value={category} onChange={(e) => setCategory(e.target.value as MockSkill["category"])}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </AuroraSelect>
              </Field>
            </div>

            <Field label="Aliases" hint="Comma-separated alternate names contributors may use">
              <AuroraInput value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="e.g. ReactJS, React.js" />
              {parsedAliases.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parsedAliases.map((alias) => (
                    <Chip key={alias} tone="neutral" dot={false}>{alias}</Chip>
                  ))}
                </div>
              )}
            </Field>
          </div>
        </GlassCard>

        {/* Level reference */}
        <aside className="w-full lg:w-[340px] shrink-0 space-y-4">
          <GlassCard className="p-5">
            <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.12em] text-text-tertiary">Default levels</p>
            <p className="mt-1 font-body text-[11.5px] text-text-tertiary leading-relaxed">The platform L1–L4 scale is applied automatically on creation.</p>
            <ul className="mt-4 space-y-2">
              {STD_LEVELS.map((level) => (
                <li key={level.level} className="flex gap-2.5 rounded-lg border border-white/60 bg-white/45 px-3 py-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white font-mono text-[11px] font-bold tabular-nums" style={{ backgroundImage: AURORA_ACCENT }}>
                    {level.level}
                  </span>
                  <div className="min-w-0">
                    <p className="font-body text-[12.5px] font-semibold text-foreground">{level.label}</p>
                    <p className="mt-0.5 font-body text-[11px] text-text-tertiary leading-relaxed">{level.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        </aside>
      </div>
    </form>
  );
}
