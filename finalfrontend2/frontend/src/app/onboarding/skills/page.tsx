"use client";

/**
 * Onboarding · Skills — L1–L4 self-assessment per spec §5.B.4.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Search } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton } from "@/components/auth/auth-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  patchOnboardingDraft,
  readOnboardingDraft,
  SKILL_LEVEL_LABELS,
  type OnboardingSkillEntry,
  type SkillLevel,
} from "@/lib/contributor/onboarding-draft";
import { nextStepPath } from "@/lib/contributor/onboarding-steps";
import { useOnboardingTrack } from "@/lib/hooks/use-onboarding-track";
import { cn } from "@/lib/utils/cn";

const SUGGESTED = [
  { id: "s-react", name: "React" }, { id: "s-ts", name: "TypeScript" }, { id: "s-nextjs", name: "Next.js" },
  { id: "s-tailwind", name: "Tailwind CSS" }, { id: "s-figma", name: "Figma" }, { id: "s-a11y", name: "Accessibility" },
  { id: "s-python", name: "Python" }, { id: "s-fastapi", name: "FastAPI" }, { id: "s-node", name: "Node.js" },
  { id: "s-postgres", name: "PostgreSQL" }, { id: "s-sql", name: "SQL" }, { id: "s-pandas", name: "Pandas" },
  { id: "s-content", name: "Content marketing" }, { id: "s-tech-write", name: "Technical writing" },
];

const LEVELS: SkillLevel[] = ["L1", "L2", "L3", "L4"];

function skillsToTierArrays(skills: OnboardingSkillEntry[]) {
  const primary: string[] = [];
  const secondary: string[] = [];
  const other: string[] = [];
  for (const s of skills) {
    if (s.level === "L4" || s.level === "L3") primary.push(s.name);
    else if (s.level === "L2") secondary.push(s.name);
    else other.push(s.name);
  }
  return { primary, secondary, other };
}

export default function SkillsPage() {
  return (
    <React.Suspense fallback={null}>
      <SkillsInner />
    </React.Suspense>
  );
}

function SkillsInner() {
  const router = useRouter();
  const { track, steps } = useOnboardingTrack();
  const saved = React.useMemo(() => readOnboardingDraft(), []);

  const [q, setQ] = React.useState("");
  const [skills, setSkills] = React.useState<Map<string, OnboardingSkillEntry>>(() => {
    const map = new Map<string, OnboardingSkillEntry>();
    for (const s of saved.skills ?? []) {
      const id = SUGGESTED.find((x) => x.name === s.name)?.id ?? s.name;
      map.set(id, s);
    }
    return map;
  });

  function toggle(id: string, name: string) {
    setSkills((cur) => {
      const next = new Map(cur);
      if (next.has(id)) next.delete(id);
      else next.set(id, { name, level: "L2" });
      return next;
    });
  }

  function setLevel(id: string, level: SkillLevel) {
    setSkills((cur) => {
      const entry = cur.get(id);
      if (!entry) return cur;
      const next = new Map(cur);
      next.set(id, { ...entry, level });
      return next;
    });
  }

  const filtered = q ? SUGGESTED.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())) : SUGGESTED;
  const can = skills.size >= 1;

  function continueNext() {
    const list = [...skills.values()];
    const tiers = skillsToTierArrays(list);
    patchOnboardingDraft({
      skills: list,
      primarySkills: tiers.primary.length ? tiers.primary : list.map((s) => s.name),
      secondarySkills: tiers.secondary,
      otherSkills: tiers.other,
    });
    const dest = nextStepPath(track, "/onboarding/skills");
    if (dest) router.push(dest);
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Onboarding"
        title="What can you do?"
        subtitle="Pick at least one skill and rate your level (L1–L4). Matching uses this to size your queue."
      >
        <OnboardingProgress steps={steps} current="/onboarding/skills" />

        <div>
          <FieldLabel htmlFor="search">Search skills</FieldLabel>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
            <input id="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="React, Figma, Python…" className={cn(inputCls, "pl-9")} />
          </div>
        </div>

        <div className="rounded-lg border border-stroke bg-surface shadow-xs">
          <header className="px-4 py-2.5 border-b border-stroke-subtle flex items-center justify-between">
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">Suggested</h2>
            <span className="font-mono text-[11px] text-text-tertiary tabular-nums">{skills.size} selected</span>
          </header>
          <ul className="p-3 flex flex-wrap gap-1.5">
            {filtered.map((s) => {
              const on = skills.has(s.id);
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => toggle(s.id, s.name)} className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border font-body text-[12px] transition-colors duration-fast",
                    on ? "bg-brand text-on-brand border-brand" : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle"
                  )}>
                    {on ? <X className="h-3 w-3" strokeWidth={2} aria-hidden /> : <Plus className="h-3 w-3" strokeWidth={2} aria-hidden />}
                    {s.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {skills.size > 0 && (
          <div className="rounded-lg border border-stroke bg-surface shadow-xs divide-y divide-stroke-subtle">
            {[...skills.entries()].map(([id, entry]) => (
              <div key={id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                <span className="font-body text-[12.5px] font-semibold text-foreground">{entry.name}</span>
                <select
                  value={entry.level}
                  onChange={(e) => setLevel(id, e.target.value as SkillLevel)}
                  className={cn(inputCls, "sm:w-48")}
                  aria-label={`Level for ${entry.name}`}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{SKILL_LEVEL_LABELS[l]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <PrimaryButton onClick={continueNext} disabled={!can}>Continue →</PrimaryButton>
      </AuthCard>
    </AuthShell>
  );
}
