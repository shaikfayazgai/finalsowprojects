"use client";

/**
 * Merge skills — Aurora Glass.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, GitMerge, Users } from "lucide-react";
import { Modal } from "@/components/meridian";
import { mergeAdminSkills } from "@/lib/admin/mocks/skills-service";
import { useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockSkill, SkillStatus } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";
import {
  AuroraSelect,
  AuroraTextarea,
  Banner,
  Chip,
  Crumbs,
  Field,
  GlassCard,
  GLASS_MODAL_CLASS,
  GLASS_MODAL_OVERLAY,
  TONE,
  type Tone,
  dangerBtnClass,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

const STATUS_LABEL: Record<SkillStatus, string> = { active: "Active", deprecated: "Deprecated", pending: "Pending review" };
const STATUS_TONE: Record<SkillStatus, Tone> = { active: "success", pending: "warning", deprecated: "neutral" };
const MIN_REASON_LENGTH = 5;

function sortSkillsForSelect(skills: MockSkill[]): MockSkill[] {
  const rank = (s: SkillStatus) => (s === "active" ? 0 : s === "pending" ? 1 : 2);
  return [...skills].sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name));
}

function skillOptionLabel(skill: MockSkill): string {
  const alias = skill.aliases.length ? ` · aka ${skill.aliases.join(", ")}` : "";
  return `${skill.name}${alias} (${skill.holders} holders)`;
}

export function MergeSkillsWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const skills = useAdminSkillsList();

  const [sourceId, setSourceId] = React.useState(searchParams.get("source") ?? "");
  const [targetId, setTargetId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const fromQuery = searchParams.get("source");
    if (fromQuery) setSourceId(fromQuery);
  }, [searchParams]);

  const sorted = React.useMemo(() => sortSkillsForSelect(skills), [skills]);
  const source = skills.find((s) => s.id === sourceId);
  const target = skills.find((s) => s.id === targetId);
  const targetOptions = sorted.filter((s) => s.id !== sourceId);

  const reasonValid = reason.trim().length >= MIN_REASON_LENGTH;
  const canSubmit = Boolean(source && target && source.id !== target.id && reasonValid) && !submitting;

  function doMerge() {
    if (!canSubmit || !source || !target) return;
    setSubmitting(true);
    mergeAdminSkills(source.id, target.id, reason.trim());
    setConfirmOpen(false);
    router.push(`/admin/skill-taxonomy/${target.id}?merged=1`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) setConfirmOpen(true);
      }}
      className="space-y-6 animate-fade-in"
    >
      <Crumbs items={[{ label: "Skill taxonomy", href: "/admin/skill-taxonomy" }, { label: "Merge skills" }]} />

      <PageHeaderRow canSubmit={canSubmit} />

      <Banner tone="warning" icon={AlertTriangle} title="Permanent operation">
        All holders of the source skill move to the target. The source is deprecated and its name added as an alias on the target. This cannot be undone in the demo.
      </Banner>

      <GlassCard className="overflow-hidden">
        <header className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55">
          <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">Merge configuration</h2>
          <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">Select source and target skills, then provide an audit reason.</p>
        </header>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Source" hint="Deprecated — becomes an alias of the target" required>
              <AuroraSelect
                value={sourceId}
                onChange={(e) => {
                  setSourceId(e.target.value);
                  if (e.target.value === targetId) setTargetId("");
                }}
              >
                <option value="">Select source skill</option>
                {sorted.map((s) => (
                  <option key={s.id} value={s.id}>{skillOptionLabel(s)}</option>
                ))}
              </AuroraSelect>
              {source && <SkillPreviewCard skill={source} role="source" />}
            </Field>

            <Field label="Target" hint="Kept — receives all holders and aliases" required>
              <AuroraSelect value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">Select target skill</option>
                {targetOptions.map((s) => (
                  <option key={s.id} value={s.id}>{skillOptionLabel(s)}</option>
                ))}
              </AuroraSelect>
              {target && <SkillPreviewCard skill={target} role="target" />}
            </Field>
          </div>

          {source && target && <MergeImpactPanel source={source} target={target} />}

          <Field label="Reason for merge" hint="Required — recorded in the cross-tenant audit log" required>
            <AuroraTextarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="e.g. ReactJS is a duplicate of React — consolidate contributor profiles."
              className="min-h-[96px]"
            />
            {reason.length > 0 && !reasonValid && (
              <p className="mt-1.5 font-body text-[11.5px]" style={{ color: TONE.warning.text }}>Enter at least {MIN_REASON_LENGTH} characters for the audit log.</p>
            )}
          </Field>
        </div>
      </GlassCard>

      <Modal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        title="Confirm permanent merge"
        description="Review the impact before proceeding."
        footer={
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={submitting} className={ghostBtnClass}>Cancel</button>
            <button type="button" onClick={doMerge} disabled={!canSubmit} className={dangerBtnClass}>
              <GitMerge className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              {submitting ? "Merging…" : "Merge permanently"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/55 px-3.5 py-2.5">
            <span className="font-body text-[13px] font-semibold text-foreground truncate">{source?.name}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
            <span className="font-body text-[13px] font-semibold text-foreground truncate">{target?.name}</span>
          </div>
          {source && target && (
            <ul className="space-y-2 font-body text-[12px] text-text-secondary leading-relaxed">
              <li><span className="font-display text-[16px] font-semibold tabular-nums text-foreground">{source.holders}</span> contributor{source.holders === 1 ? "" : "s"} move to {target.name}</li>
              <li>{source.name} becomes deprecated; name and aliases added to target</li>
              <li>Proficiency levels on the source skill are preserved</li>
            </ul>
          )}
          <div className="rounded-xl border border-white/70 bg-white/55 px-3.5 py-2.5">
            <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">Audit reason</p>
            <p className="mt-0.5 font-body text-[12.5px] text-foreground leading-relaxed">{reason.trim()}</p>
          </div>
        </div>
      </Modal>
    </form>
  );
}

function PageHeaderRow({ canSubmit }: { canSubmit: boolean }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-2">Platform · Taxonomy</p>
        <h1 className="font-display text-[24px] sm:text-[26px] font-semibold tracking-[-0.02em] text-foreground leading-none">Merge skills</h1>
        <p className="mt-2 font-body text-[13px] text-text-secondary max-w-2xl">
          Consolidate duplicate or overlapping skills. Holders move to the target; the source becomes a deprecated alias.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link href="/admin/skill-taxonomy" className="inline-flex items-center h-10 px-3.5 font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors">Cancel</Link>
        <button type="submit" disabled={!canSubmit} className={primaryBtnClass} style={primaryStyle}>
          <GitMerge className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          Merge skills
        </button>
      </div>
    </header>
  );
}

function SkillPreviewCard({ skill, role }: { skill: MockSkill; role: "source" | "target" }) {
  return (
    <div className="mt-3 rounded-xl border border-white/60 bg-white/45 px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/admin/skill-taxonomy/${skill.id}`} className="font-display text-[13px] font-semibold text-foreground hover:underline">{skill.name}</Link>
        <Chip tone={STATUS_TONE[skill.status]}>{STATUS_LABEL[skill.status]}</Chip>
        <span className="font-body text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">{role}</span>
      </div>
      <p className="mt-1 font-body text-[11.5px] text-text-tertiary">
        <span className="font-mono text-[11px]">{skill.id}</span>
        <span aria-hidden className="opacity-50 mx-1.5">·</span>
        {skill.category}
        <span aria-hidden className="opacity-50 mx-1.5">·</span>
        {skill.holders} holder{skill.holders === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function MergeImpactPanel({ source, target }: { source: MockSkill; target: MockSkill }) {
  const combinedHolders = target.holders + source.holders;
  const newAliases = Array.from(new Set([...target.aliases, source.name, ...source.aliases])).filter((a) => a !== target.name);

  return (
    <div className="rounded-xl border px-4 py-3.5" style={{ background: TONE.ai.soft, borderColor: TONE.ai.border }}>
      <p className="flex items-center gap-2 font-body text-[12.5px] font-semibold text-foreground">
        <Users className="h-4 w-4 shrink-0" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
        Merge impact
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-[12.5px] text-text-secondary">
        <span className="font-semibold text-foreground">{source.name}</span>
        <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
        <span className="font-semibold text-foreground">{target.name}</span>
      </div>
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ImpactStat label="Holders moving" value={String(source.holders)} />
        <ImpactStat label="Target after merge" value={String(combinedHolders)} highlight />
        <ImpactStat label="New aliases on target" value={newAliases.length > 0 ? newAliases.slice(0, 2).join(", ") + (newAliases.length > 2 ? "…" : "") : "—"} />
      </dl>
    </div>
  );
}

function ImpactStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[10px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className="mt-0.5 font-body text-[13px] font-semibold truncate" style={{ color: highlight ? TONE.ai.text : "var(--color-foreground)" }}>{value}</dd>
    </div>
  );
}
