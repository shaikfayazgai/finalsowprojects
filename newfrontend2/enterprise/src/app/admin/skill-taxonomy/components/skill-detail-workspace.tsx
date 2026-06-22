"use client";

/**
 * Skill detail — Aurora Glass, tabbed (mirrors the mentor/tenant detail).
 *
 *   · URL-synced tabs (?tab=overview|levels|adjacency)
 *   · Glass section panels, divided level + adjacency rows
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronRight, GitMerge, Layers } from "lucide-react";
import {
  SkillActionButtons,
  SkillActionModals,
} from "@/app/admin/skill-taxonomy/components/skill-action-modals";
import { useAdminSkill, useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockSkill, SkillStatus } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";
import {
  AURORA_ACCENT,
  Banner,
  Chip,
  Crumbs,
  GlassCard,
  PageHeader,
  SectionCard,
  Stat,
  Tabs,
  TONE,
  type Tone,
  ghostBtnClass,
} from "../../_shell/aurora-ui";

type Tab = "overview" | "levels" | "adjacency";
type ModalKind = "edit" | "deprecate" | "approve" | null;

const TABS: Tab[] = ["overview", "levels", "adjacency"];
const TAB_LABEL: Record<Tab, string> = { overview: "Overview", levels: "Levels", adjacency: "Adjacency" };

const STATUS_LABEL: Record<SkillStatus, string> = { active: "Active", deprecated: "Deprecated", pending: "Pending review" };
const STATUS_TONE: Record<SkillStatus, Tone> = { active: "success", pending: "warning", deprecated: "neutral" };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SkillDetailWorkspace() {
  const params = useParams<{ skillId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const skill = useAdminSkill(params.skillId);
  const allSkills = useAdminSkillsList();

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "overview";

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
      const p = new URLSearchParams(searchParams.toString());
      if (next === "overview") p.delete("tab");
      else p.set("tab", next);
      p.delete("created");
      p.delete("merged");
      const qs = p.toString();
      router.replace(qs ? `/admin/skill-taxonomy/${params.skillId}?${qs}` : `/admin/skill-taxonomy/${params.skillId}`, { scroll: false });
    },
    [router, searchParams, params.skillId],
  );

  if (!skill) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Crumbs items={[{ label: "Skill taxonomy", href: "/admin/skill-taxonomy" }, { label: "Not found" }]} />
        <p className="font-body text-[13px] text-text-secondary">Skill not found.</p>
      </div>
    );
  }

  const adjacent = skill.adjacency.map((id) => allSkills.find((s) => s.id === id)).filter((s): s is MockSkill => Boolean(s));

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div role="status" className="rounded-xl border px-4 py-2.5 font-body text-[12.5px] font-semibold" style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}>
          {toast}
        </div>
      )}

      <Crumbs items={[{ label: "Skill taxonomy", href: "/admin/skill-taxonomy" }, { label: skill.name }]} />

      <PageHeader
        eyebrow="Platform · Skill"
        title={skill.name}
        chips={
          <>
            <Chip tone={STATUS_TONE[skill.status]}>{STATUS_LABEL[skill.status]}</Chip>
            <Chip tone="neutral" dot={false}>{skill.category}</Chip>
          </>
        }
        subtitle={
          <>
            <span className="font-mono text-[11px]">{skill.id}</span>
            {skill.aliases.length > 0 && (
              <>
                <span aria-hidden className="opacity-50 mx-1.5">·</span>
                aka {skill.aliases.join(", ")}
              </>
            )}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Added {fmtDate(skill.createdAt)}
          </>
        }
        actions={
          <>
            <SkillActionButtons skill={skill} onOpen={setModal} />
            <Link href={`/admin/skill-taxonomy/merge?source=${skill.id}`} className={ghostBtnClass}>
              <GitMerge className="h-4 w-4" strokeWidth={2} aria-hidden />
              Merge
            </Link>
          </>
        }
      />

      {skill.status === "pending" && (
        <Banner tone="warning" icon={AlertTriangle} title="Pending taxonomy review">
          {skill.createdBy ?? "This skill is not yet active or available for competency assignment."}{" "}
          <button type="button" onClick={() => setModal("approve")} className="font-bold underline underline-offset-2 hover:opacity-80" style={{ color: TONE.warning.text }}>
            Approve skill
          </button>
        </Banner>
      )}

      {skill.status === "deprecated" && (
        <Banner tone="neutral" icon={AlertTriangle} title="Deprecated skill">
          Existing profiles retain this skill, but it cannot be assigned to new work.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">Taxonomy profile</p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Holders" value={skill.holders} size="lg" />
          <Stat label="Levels" value={skill.levels.length} size="lg" />
          <Stat label="Adjacent skills" value={adjacent.length} size="lg" />
          <Stat label="Category" value={<span className="text-[15px]">{skill.category}</span>} size="lg" />
        </dl>
      </GlassCard>

      <Tabs
        tabs={TABS.map((t) => ({ key: t, label: TAB_LABEL[t], badge: t === "levels" ? skill.levels.length : t === "adjacency" ? adjacent.length : null }))}
        active={activeTab}
        onChange={(k) => setTab(k as Tab)}
      />

      {activeTab === "overview" && (
        <div className="space-y-5">
          <SectionCard title="Profile" description="Canonical identity in the taxonomy">
            <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <DetailRow label="Display name" value={skill.name} />
              <DetailRow label="Skill ID" value={skill.id} mono />
              <DetailRow label="Category" value={skill.category} />
              <DetailRow label="Aliases" value={skill.aliases.length > 0 ? skill.aliases.join(", ") : "—"} />
              <DetailRow label="Status" value={STATUS_LABEL[skill.status]} />
              <DetailRow label="Added" value={fmtDate(skill.createdAt)} />
              {skill.createdBy && <DetailRow label="Source" value={skill.createdBy} className="sm:col-span-2" />}
            </dl>
          </SectionCard>

          <SectionCard
            title="Level definitions"
            description="L1–L4 proficiency scale used in competency assignment"
            action={
              skill.levels.length > 0 ? (
                <button type="button" onClick={() => setTab("levels")} className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground self-center">
                  View all →
                </button>
              ) : undefined
            }
          >
            <ul className="px-3 sm:px-4 py-3 space-y-2">
              {skill.levels.slice(0, 2).map((level) => (
                <LevelRow key={level.level} level={level} />
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Adjacency" description="Fallback skills used during matching when exact hits are unavailable">
            {adjacent.length === 0 ? (
              <div className="px-5 sm:px-6 py-10 text-center">
                <Layers className="mx-auto h-6 w-6 text-text-tertiary" strokeWidth={1.75} aria-hidden />
                <p className="mt-2 font-display text-[13.5px] font-semibold text-foreground">No adjacent skills</p>
                <p className="mt-1 font-body text-[12px] text-text-tertiary">Add related skills to improve fallback matching.</p>
              </div>
            ) : (
              <ul className="px-3 sm:px-4 py-3 space-y-2">
                {adjacent.slice(0, 4).map((adj) => (
                  <AdjacencyRow key={adj.id} skill={adj} />
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {activeTab === "levels" && (
        <SectionCard title="Level definitions" description="L1–L4 proficiency scale used in competency assignment">
          <ul className="px-3 sm:px-4 py-3 space-y-2">
            {skill.levels.map((level) => (
              <LevelRow key={level.level} level={level} />
            ))}
          </ul>
        </SectionCard>
      )}

      {activeTab === "adjacency" && (
        <SectionCard title="Adjacent skills" description="Fallback targets during contributor matching">
          {adjacent.length === 0 ? (
            <div className="px-5 sm:px-6 py-12 text-center">
              <Layers className="mx-auto h-6 w-6 text-text-tertiary" strokeWidth={1.75} aria-hidden />
              <p className="mt-2 font-display text-[13.5px] font-semibold text-foreground">No adjacent skills declared</p>
              <p className="mt-1 font-body text-[12px] text-text-tertiary">Adjacent skills act as fallback targets during contributor matching.</p>
            </div>
          ) : (
            <ul className="px-3 sm:px-4 py-3 space-y-2">
              {adjacent.map((adj) => (
                <AdjacencyRow key={adj.id} skill={adj} />
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      <SkillActionModals skill={skill} open={modal} onClose={() => setModal(null)} onSuccess={setToast} />
    </div>
  );
}

function DetailRow({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={cn("mt-1 font-body text-[13.5px] text-foreground", mono && "font-mono text-[12.5px]")}>{value}</dd>
    </div>
  );
}

function LevelRow({ level }: { level: MockSkill["levels"][number] }) {
  return (
    <li className="flex gap-3 rounded-xl border border-white/60 bg-white/45 px-4 py-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white font-mono text-[12px] font-bold tabular-nums" style={{ backgroundImage: AURORA_ACCENT }}>
        L{level.level}
      </span>
      <div className="min-w-0">
        <p className="font-body text-[13px] font-semibold text-foreground">{level.label}</p>
        <p className="mt-0.5 font-body text-[12px] text-text-secondary leading-relaxed">{level.description}</p>
      </div>
    </li>
  );
}

function AdjacencyRow({ skill }: { skill: MockSkill }) {
  return (
    <li>
      <Link
        href={`/admin/skill-taxonomy/${skill.id}`}
        className="group flex items-center gap-3 rounded-xl border border-white/55 bg-white/40 px-4 py-3 hover:bg-white/65 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.4)]"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-[13px] font-semibold text-foreground">{skill.name}</span>
            <Chip tone={STATUS_TONE[skill.status]}>{STATUS_LABEL[skill.status]}</Chip>
            <Chip tone="neutral" dot={false}>{skill.category}</Chip>
          </span>
          <span className="block mt-0.5 font-body text-[11.5px] text-text-tertiary">
            <span className="font-mono text-[10.5px]">{skill.id}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {skill.holders} holder{skill.holders === 1 ? "" : "s"}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0" strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}
