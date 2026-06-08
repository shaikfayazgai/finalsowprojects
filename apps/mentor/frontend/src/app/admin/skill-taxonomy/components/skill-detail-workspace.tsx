"use client";

/**
 * Skill detail — aligned with mentor + pool detail patterns.
 *
 *   · DashboardSection summary above tabs
 *   · URL-synced tabs (?tab=overview|levels|adjacency)
 *   · Context banners for pending / deprecated
 *   · Scannable level + adjacency rows
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  GitMerge,
  Layers,
  Users,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  SkillActionButtons,
  SkillActionModals,
} from "@/app/admin/skill-taxonomy/components/skill-action-modals";
import { useAdminSkill, useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockSkill, SkillStatus } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "levels" | "adjacency";
type ModalKind = "edit" | "deprecate" | "approve" | null;

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "levels", label: "Levels" },
  { key: "adjacency", label: "Adjacency" },
];

const STATUS_LABEL: Record<SkillStatus, string> = {
  active: "Active",
  deprecated: "Deprecated",
  pending: "Pending review",
};

const STATUS_CHIP: Record<
  SkillStatus,
  "success" | "warning" | "neutral" | "pending"
> = {
  active: "success",
  deprecated: "neutral",
  pending: "pending",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SkillDetailWorkspace() {
  const params = useParams<{ skillId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const skill = useAdminSkill(params.skillId);
  const allSkills = useAdminSkillsList();

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

  const [modal, setModal] = React.useState<ModalKind>(null);
  const [toast, setToast] = React.useState<string | null>(() => {
    if (searchParams.get("created") === "1") return "Skill created.";
    if (searchParams.get("merged") === "1") return "Skills merged — source deprecated as alias.";
    return null;
  });

  React.useEffect(() => {
    if (searchParams.get("created") === "1") setToast("Skill created.");
    if (searchParams.get("merged") === "1") setToast("Skills merged — source deprecated as alias.");
  }, [searchParams]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "overview") nextParams.delete("tab");
      else nextParams.set("tab", next);
      nextParams.delete("created");
      nextParams.delete("merged");
      const qs = nextParams.toString();
      router.replace(
        qs
          ? `/admin/skill-taxonomy/${params.skillId}?${qs}`
          : `/admin/skill-taxonomy/${params.skillId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.skillId],
  );

  if (!skill) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/skill-taxonomy"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Skill taxonomy
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Skill not found.</p>
      </div>
    );
  }

  const adjacent = skill.adjacency
    .map((id) => allSkills.find((s) => s.id === id))
    .filter((s): s is MockSkill => Boolean(s));

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text"
        >
          {toast}
        </div>
      )}

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
        <span className="text-text-secondary truncate">{skill.name}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Skill
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {skill.name}
            </h1>
            <StatusChip status={STATUS_CHIP[skill.status]} size="sm" showDot>
              {STATUS_LABEL[skill.status]}
            </StatusChip>
            <CategoryBadge category={skill.category} />
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            <span className="font-mono text-[12px]">{skill.id}</span>
            {skill.aliases.length > 0 && (
              <>
                <span aria-hidden className="opacity-50 mx-1.5">·</span>
                aka {skill.aliases.join(", ")}
              </>
            )}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Added {fmtDate(skill.createdAt)}
            {skill.createdBy && (
              <>
                <span aria-hidden className="opacity-50 mx-1.5">·</span>
                {skill.createdBy}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <SkillActionButtons skill={skill} onOpen={setModal} />
          <Link
            href={`/admin/skill-taxonomy/merge?source=${skill.id}`}
            className={actionBtnCls}
          >
            <GitMerge className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Merge
          </Link>
        </div>
      </header>

      {skill.status === "pending" && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Pending taxonomy review
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            {skill.createdBy ??
              "This skill is not yet active in the taxonomy or available for competency assignment."}
            {" "}
            <button
              type="button"
              onClick={() => setModal("approve")}
              className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              Approve skill
            </button>
          </p>
        </div>
      )}

      {skill.status === "deprecated" && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
            Deprecated skill
          </p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            Existing profiles retain this skill, but it cannot be assigned to new work.
            {skill.aliases.length > 0 && (
              <> Aliases may redirect to a canonical entry after merge.</>
            )}
          </p>
        </div>
      )}

      <DashboardSection
        title="Taxonomy profile"
        description="Usage and structure in the platform skill graph"
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat
            label="Holders"
            value={String(skill.holders)}
            highlight={skill.holders > 0}
          />
          <SummaryStat label="Levels" value={String(skill.levels.length)} />
          <SummaryStat
            label="Adjacent skills"
            value={String(adjacent.length)}
            highlight={adjacent.length > 0}
          />
          <SummaryStat label="Category" value={skill.category} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="Skill sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge =
              t.key === "levels"
                ? skill.levels.length
                : t.key === "adjacency"
                  ? adjacent.length
                  : null;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                  "font-body text-[13px] font-medium whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                  active ? "text-foreground" : "text-text-secondary",
                )}
              >
                {t.label}
                {badge != null && badge > 0 && (
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                      active ? "bg-brand-subtle text-brand-subtle-text" : "text-text-tertiary",
                    )}
                  >
                    {badge}
                  </span>
                )}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className={activeTab === "overview" ? "p-5 space-y-5" : undefined}>
          {activeTab === "overview" && (
            <>
              <DashboardSection bare title="Profile" description="Canonical identity in the taxonomy">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  <ProfileField label="Display name" value={skill.name} />
                  <ProfileField label="Skill ID" value={skill.id} mono />
                  <ProfileField label="Category" value={skill.category} />
                  <ProfileField
                    label="Aliases"
                    value={skill.aliases.length > 0 ? skill.aliases.join(", ") : "—"}
                  />
                  <ProfileField label="Status" value={STATUS_LABEL[skill.status]} />
                  <ProfileField label="Added" value={fmtDate(skill.createdAt)} />
                  {skill.createdBy && (
                    <ProfileField label="Source" value={skill.createdBy} className="sm:col-span-2" />
                  )}
                </dl>
              </DashboardSection>

              <DashboardSection
                bare
                title="Level definitions"
                description="L1–L4 proficiency scale used in competency assignment"
              >
                <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
                  {skill.levels.map((level) => (
                    <LevelRow key={level.level} level={level} compact />
                  ))}
                </ul>
                {skill.levels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTab("levels")}
                    className="mt-3 inline-flex items-center gap-1 font-body text-[12px] font-semibold text-brand hover:opacity-80"
                  >
                    View all levels
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </button>
                )}
              </DashboardSection>

              <DashboardSection
                bare
                title="Adjacency"
                description="Fallback skills used during matching when exact hits are unavailable"
              >
                {adjacent.length === 0 ? (
                  <EmptyPanel
                    icon={Layers}
                    title="No adjacent skills"
                    description="Add related skills to improve fallback matching."
                  />
                ) : (
                  <>
                    <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
                      {adjacent.slice(0, 4).map((adj) => (
                        <AdjacencyRow key={adj.id} skill={adj} />
                      ))}
                    </ul>
                    {adjacent.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setTab("adjacency")}
                        className="mt-3 inline-flex items-center gap-1 font-body text-[12px] font-semibold text-brand hover:opacity-80"
                      >
                        View all {adjacent.length} adjacent skills
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      </button>
                    )}
                  </>
                )}
              </DashboardSection>

              <DashboardSection bare title="Holders" description="Contributors with this skill on profile">
                <div className="flex items-center gap-3 rounded-lg border border-stroke-subtle bg-bg-subtle/30 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface border border-stroke-subtle">
                    <Users className="h-4 w-4 text-brand-emphasis" strokeWidth={2} aria-hidden />
                  </div>
                  <div>
                    <p className="font-display text-[22px] font-semibold tabular-nums text-foreground leading-none">
                      {skill.holders}
                    </p>
                    <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
                      contributor{skill.holders === 1 ? "" : "s"} hold this skill
                    </p>
                  </div>
                </div>
              </DashboardSection>
            </>
          )}

          {activeTab === "levels" && (
            <div className="divide-y divide-stroke-subtle">
              {skill.levels.map((level) => (
                <LevelRow key={level.level} level={level} />
              ))}
            </div>
          )}

          {activeTab === "adjacency" && (
            <div>
              {adjacent.length === 0 ? (
                <div className="p-8">
                  <EmptyPanel
                    icon={Layers}
                    title="No adjacent skills declared"
                    description="Adjacent skills act as fallback targets during contributor matching."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-stroke-subtle">
                  {adjacent.map((adj) => (
                    <AdjacencyRow key={adj.id} skill={adj} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      <SkillActionModals
        skill={skill}
        open={modal}
        onClose={() => setModal(null)}
        onSuccess={setToast}
      />
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-stroke-subtle bg-bg-subtle/60 px-2 py-0.5 font-body text-[10.5px] font-semibold text-text-secondary">
      {category}
    </span>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-display text-[20px] font-semibold tabular-nums leading-none",
          alert ? "text-warning-text" : highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ProfileField({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function LevelRow({
  level,
  compact,
}: {
  level: MockSkill["levels"][number];
  compact?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex gap-3 bg-surface",
        compact ? "px-4 py-3" : "px-5 py-4 hover:bg-bg-subtle/40 transition-colors duration-fast",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-subtle font-mono text-[12px] font-bold tabular-nums text-brand-subtle-text">
        L{level.level}
      </span>
      <div className="min-w-0">
        <p className="font-body text-[13px] font-semibold text-foreground">{level.label}</p>
        <p className="mt-0.5 font-body text-[12px] text-text-secondary leading-relaxed">
          {level.description}
        </p>
      </div>
    </li>
  );
}

function AdjacencyRow({ skill }: { skill: MockSkill }) {
  return (
    <li>
      <Link
        href={`/admin/skill-taxonomy/${skill.id}`}
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-subtle/40 transition-colors duration-fast group"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-body text-[13px] font-semibold text-foreground group-hover:text-brand-emphasis transition-colors duration-fast">
              {skill.name}
            </p>
            <StatusChip status={STATUS_CHIP[skill.status]} size="sm">
              {STATUS_LABEL[skill.status]}
            </StatusChip>
            <CategoryBadge category={skill.category} />
          </div>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
            <span className="font-mono text-[11px]">{skill.id}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {skill.holders} holder{skill.holders === 1 ? "" : "s"}
          </p>
        </div>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-fast"
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </li>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-stroke-subtle bg-bg-subtle/20 px-4 py-6 text-center">
      <Icon className="mx-auto h-5 w-5 text-text-tertiary" strokeWidth={1.75} aria-hidden />
      <p className="mt-2 font-body text-[13px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">{description}</p>
    </div>
  );
}

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-bg-subtle transition-colors duration-fast",
);
