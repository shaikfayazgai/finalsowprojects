"use client";

/**
 * Skills registry — list, filters, add/remove skills.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { ConfirmationDialog } from "@/components/meridian/overlays";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import { useContributorSkillsList } from "@/lib/hooks/use-contributor-skills";
import type { MockSkill } from "@/mocks/contributor";
import { PERSONAS } from "@/mocks/contributor/personas";
import { cn } from "@/lib/utils/cn";
import { SkillsSkeleton } from "./skills-skeleton";
import { AddSkillDialog, buildSkillFromForm, type AddSkillFormState } from "./add-skill-dialog";
import {
  categoryCounts,
  filterSkills,
  levelTone,
  skillCategoryLabel,
  skillsSummary,
  CATEGORY_TABS,
} from "../lib/skills-ui-utils";

export function SkillsWorkspace() {
  const { persona, isLoading: personaLoading } = useActivePersona();
  const personaLabel = PERSONAS.find((p) => p.key === persona)?.shortLabel ?? persona;

  const { data, isLoading, error, refetch, isFetching } = useContributorSkillsList();
  const loading = personaLoading || (isLoading && !data);

  const [skills, setSkills] = React.useState<MockSkill[]>([]);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<"" | MockSkill["category"]>("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [removeId, setRemoveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (data?.items) setSkills(data.items);
  }, [data?.items]);

  const filtered = React.useMemo(
    () => filterSkills(skills, { q: search, category }),
    [skills, search, category],
  );
  const stats = React.useMemo(() => skillsSummary(skills), [skills]);
  const counts = React.useMemo(() => categoryCounts(skills), [skills]);

  const removeTarget = skills.find((s) => s.id === removeId);

  if (loading) return <SkillsSkeleton />;

  // Structured skills persist to contributor_skills (name + level + category)
  // via the real backend; refetch re-syncs with the server-assigned ids.
  async function handleAdd(form: AddSkillFormState) {
    setSkills((prev) => [buildSkillFromForm(form), ...prev]); // optimistic
    try {
      await fetch("/api/contributor/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          level: form.level,
          category: form.category,
        }),
      });
    } finally {
      void refetch();
    }
  }

  async function confirmRemove() {
    if (!removeId) return;
    const id = removeId;
    setRemoveId(null);
    setSkills((prev) => prev.filter((s) => s.id !== id)); // optimistic
    try {
      await fetch(`/api/contributor/skills/${encodeURIComponent(id)}`, { method: "DELETE" });
    } finally {
      void refetch();
    }
  }

  const listDescription =
    filtered.length === 0
      ? search.trim() || category
        ? "No matching skills"
        : "No skills declared yet"
      : `${filtered.length} skill${filtered.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex flex-wrap items-center gap-3">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {(error as Error).message}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Retry
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover disabled:opacity-60"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            strokeWidth={2}
            aria-hidden
          />
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Add skill
        </button>
      </div>

      <DashboardSection
        title="Registry snapshot"
        description="Declared skills linked to your profile"
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Declared" value={String(stats.total)} highlight={stats.total > 0} />
          <SummaryStat
            label="With evidence"
            value={String(stats.withEvidence)}
            highlight={stats.withEvidence > 0}
          />
          <SummaryStat
            label="Reinforced"
            value={String(stats.reinforced)}
            highlight={stats.reinforced > 0}
          />
          <SummaryStat
            label="L3+ levels"
            value={String(stats.topLevel)}
            highlight={stats.topLevel > 0}
          />
        </dl>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden min-w-0">
          <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
              <div>
                <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                  Your skills
                </h2>
                <p className="mt-1 font-body text-[12.5px] text-text-secondary">{listDescription}</p>
              </div>
              <div className="relative w-full sm:w-52 shrink-0">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                  strokeWidth={2}
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skills…"
                  aria-label="Search skills"
                  className={cn(
                    "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                    "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                    "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                  )}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                ) : null}
              </div>
            </div>

            <nav aria-label="Filter by category" className="flex flex-wrap gap-x-1 -mb-px">
              {CATEGORY_TABS.map((tab) => {
                const active = category === tab.id;
                const count = counts[tab.id] ?? 0;
                return (
                  <button
                    key={tab.id || "all"}
                    type="button"
                    onClick={() => setCategory(tab.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                      "font-body text-[13px] font-medium whitespace-nowrap",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                      active ? "text-foreground" : "text-text-secondary hover:text-foreground",
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "font-body text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                        active ? "bg-brand-subtle text-brand-subtle-text" : "bg-bg-subtle text-text-tertiary",
                      )}
                    >
                      {count}
                    </span>
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-brand rounded-full"
                      />
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <FolderOpen
                className="h-9 w-9 text-text-disabled mx-auto mb-3"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="font-body text-[13px] font-semibold text-foreground mb-1">
                No skills found
              </p>
              <p className="font-body text-[12px] text-text-secondary mb-4">
                {search.trim() || category
                  ? "Try a different search or category filter."
                  : "Add your first skill to help match you to relevant work."}
              </p>
              {!search.trim() && !category ? (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Add skill
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-stroke-subtle">
              {filtered.map((skill) => (
                <li
                  key={skill.id}
                  className="group flex items-center gap-2 min-h-[56px] hover:bg-bg-subtle/60 transition-colors duration-fast"
                >
                  <Link
                    href={`/contributor/profile/skills/${skill.id}`}
                    className="flex items-center justify-between gap-3 flex-1 min-w-0 px-5 py-3.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-body text-[13px] font-semibold text-foreground">
                          {skill.name}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded border font-mono text-[10px] font-semibold tabular-nums",
                            levelTone(skill.level),
                          )}
                        >
                          {skill.level}
                        </span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[11px] text-text-tertiary">
                        <span>{skillCategoryLabel(skill.category)}</span>
                        <span aria-hidden>·</span>
                        <span className="inline-flex items-center gap-0.5">
                          <FileText className="h-3 w-3" strokeWidth={2} aria-hidden />
                          {skill.evidenceCount} evidence
                        </span>
                        <span aria-hidden>·</span>
                        <span>{skill.tasksCompletedWithThisSkill} tasks</span>
                      </span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-text-tertiary shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setRemoveId(skill.id)}
                    className="h-8 w-8 mr-3 inline-flex items-center justify-center rounded-md text-text-tertiary hover:text-error-text hover:bg-error-subtle opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity"
                    aria-label={`Remove ${skill.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
          <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <div className="flex items-start gap-2.5">
              <Sparkles
                className="h-4 w-4 text-brand shrink-0 mt-0.5"
                strokeWidth={2}
                aria-hidden
              />
              <div>
                <h3 className="font-body text-[13px] font-semibold text-foreground">
                  How levels work
                </h3>
                <ul className="mt-2 space-y-1.5 font-body text-[12px] text-text-secondary leading-relaxed list-disc pl-4">
                  <li>L1–L2: learning with mentor support</li>
                  <li>L3: independent delivery on scoped tasks</li>
                  <li>L4: can review and guide others</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-right font-body text-[11px] text-text-tertiary">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-bg-subtle border border-stroke-subtle">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              Persona: {personaLabel}
            </span>
          </p>
        </aside>
      </div>

      <AddSkillDialog open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />

      <ConfirmationDialog
        open={Boolean(removeId)}
        onCancel={() => setRemoveId(null)}
        onConfirm={confirmRemove}
        title={removeTarget ? `Remove ${removeTarget.name}?` : "Remove skill?"}
        description="This removes the skill from your registry. Evidence linked elsewhere is not deleted."
        confirmLabel="Remove"
        confirmTone="danger"
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[11px] font-medium text-text-tertiary uppercase tracking-wide">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[22px] font-semibold tabular-nums tracking-[-0.02em]",
          highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
