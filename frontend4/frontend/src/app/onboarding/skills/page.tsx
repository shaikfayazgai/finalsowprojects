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

/** Skills grouped by domain so the picker is organised and covers the work
 * categories a project's tasks draw from (engineering, data, design, content),
 * instead of a flat unrelated list. */
const SKILL_CATEGORIES: Array<{ category: string; skills: Array<{ id: string; name: string }> }> = [
  {
    category: "Engineering",
    skills: [
      { id: "s-react", name: "React" }, { id: "s-ts", name: "TypeScript" }, { id: "s-nextjs", name: "Next.js" },
      { id: "s-tailwind", name: "Tailwind CSS" }, { id: "s-node", name: "Node.js" }, { id: "s-python", name: "Python" },
      { id: "s-fastapi", name: "FastAPI" }, { id: "s-java", name: "Java" }, { id: "s-go", name: "Go" },
    ],
  },
  {
    category: "Data & Databases",
    skills: [
      { id: "s-sql", name: "SQL" }, { id: "s-postgres", name: "PostgreSQL" }, { id: "s-db-design", name: "Database design" },
      { id: "s-data-modeling", name: "Data modeling" }, { id: "s-pandas", name: "Pandas" },
      { id: "s-etl", name: "ETL / pipelines" }, { id: "s-analytics", name: "Analytics" },
    ],
  },
  {
    category: "Design",
    skills: [
      { id: "s-figma", name: "Figma" }, { id: "s-ui", name: "UI design" }, { id: "s-ux", name: "UX research" },
      { id: "s-a11y", name: "Accessibility" }, { id: "s-prototyping", name: "Prototyping" },
    ],
  },
  {
    category: "Content & Docs",
    skills: [
      { id: "s-tech-write", name: "Technical writing" }, { id: "s-content", name: "Content marketing" },
      { id: "s-curriculum", name: "Curriculum design" }, { id: "s-editing", name: "Editing" },
    ],
  },
];

const SUGGESTED = SKILL_CATEGORIES.flatMap((c) => c.skills);

const LEVELS: SkillLevel[] = ["L1", "L2", "L3", "L4"];

function renderSkillChip(
  s: { id: string; name: string },
  on: boolean,
  toggle: (id: string, name: string) => void,
) {
  return (
    <button
      type="button"
      onClick={() => toggle(s.id, s.name)}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border font-body text-[12px] transition-colors duration-fast",
        on ? "bg-brand text-on-brand border-brand" : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle",
      )}
    >
      {on ? <X className="h-3 w-3" strokeWidth={2} aria-hidden /> : <Plus className="h-3 w-3" strokeWidth={2} aria-hidden />}
      {s.name}
    </button>
  );
}

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

  const [q, setQ] = React.useState("");
  // Start EMPTY so the server render and the first client render agree (the
  // saved draft lives in localStorage and isn't available during SSR — reading
  // it in the initializer caused a hydration mismatch on the "N selected" count).
  // Hydrate from the draft after mount instead.
  const [skills, setSkills] = React.useState<Map<string, OnboardingSkillEntry>>(
    () => new Map<string, OnboardingSkillEntry>(),
  );
  React.useEffect(() => {
    const saved = readOnboardingDraft();
    if (!saved.skills?.length) return;
    const map = new Map<string, OnboardingSkillEntry>();
    for (const s of saved.skills) {
      const id = SUGGESTED.find((x) => x.name === s.name)?.id ?? s.name;
      map.set(id, s);
    }
    setSkills(map);
  }, []);

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
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">
              {q ? "Search results" : "Suggested skills"}
            </h2>
            <span className="font-mono text-[11px] text-text-tertiary tabular-nums">{skills.size} selected</span>
          </header>
          {q ? (
            <ul className="p-3 flex flex-wrap gap-1.5">
              {filtered.length === 0 ? (
                <li className="font-body text-[12px] text-text-tertiary px-1 py-1">No skills match “{q}”.</li>
              ) : (
                filtered.map((s) => (
                  <li key={s.id}>{renderSkillChip(s, skills.has(s.id), toggle)}</li>
                ))
              )}
            </ul>
          ) : (
            <div className="p-3 space-y-3">
              {SKILL_CATEGORIES.map((cat) => (
                <div key={cat.category}>
                  <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
                    {cat.category}
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {cat.skills.map((s) => (
                      <li key={s.id}>{renderSkillChip(s, skills.has(s.id), toggle)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
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
