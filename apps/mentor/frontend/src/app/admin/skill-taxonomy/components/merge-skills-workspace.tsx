"use client";

/**
 * Merge skills — aligned with new pool + skill detail patterns.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  GitMerge,
  Users,
} from "lucide-react";
import { Modal, Select, StatusChip } from "@/components/meridian";
import { mergeAdminSkills } from "@/lib/admin/mocks/skills-service";
import { useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockSkill, SkillStatus } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";

const STATUS_LABEL: Record<SkillStatus, string> = {
  active: "Active",
  deprecated: "Deprecated",
  pending: "Pending review",
};

const STATUS_CHIP: Record<
  SkillStatus,
  "success" | "neutral" | "pending"
> = {
  active: "success",
  deprecated: "neutral",
  pending: "pending",
};

const MIN_REASON_LENGTH = 5;

function sortSkillsForSelect(skills: MockSkill[]): MockSkill[] {
  const rank = (s: SkillStatus) => {
    if (s === "active") return 0;
    if (s === "pending") return 1;
    return 2;
  };
  return [...skills].sort(
    (a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name),
  );
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
  const canSubmit =
    Boolean(source && target && source.id !== target.id && reasonValid) && !submitting;

  function doMerge() {
    if (!canSubmit || !source || !target) return;
    setSubmitting(true);
    mergeAdminSkills(source.id, target.id, reason.trim());
    setConfirmOpen(false);
    router.push(`/admin/skill-taxonomy/${target.id}?merged=1`);
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
        <span className="text-text-secondary">Merge skills</span>
      </nav>

      <header className="min-w-0">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Skill taxonomy
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Merge skills
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Consolidate duplicate or overlapping skills. Holders move to the target; the source
          becomes a deprecated alias.
        </p>
      </header>

      <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
        <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          Permanent operation
        </p>
        <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
          All holders of the source skill move to the target. The source is deprecated and its
          name added as an alias on the target. This cannot be undone in the demo.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) setConfirmOpen(true);
        }}
        className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden"
      >
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Merge configuration
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Select source and target skills, then provide an audit reason
          </p>
        </header>

        <div className="px-5 py-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Source" hint="Deprecated — becomes an alias of the target" required>
              <Select
                variant="outline"
                size="sm"
                value={sourceId}
                onChange={(e) => {
                  setSourceId(e.target.value);
                  if (e.target.value === targetId) setTargetId("");
                }}
              >
                <option value="">Select source skill</option>
                {sorted.map((s) => (
                  <option key={s.id} value={s.id}>
                    {skillOptionLabel(s)}
                  </option>
                ))}
              </Select>
              {source && <SkillPreviewCard skill={source} role="source" />}
            </Field>

            <Field label="Target" hint="Kept — receives all holders and aliases" required>
              <Select
                variant="outline"
                size="sm"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                <option value="">Select target skill</option>
                {targetOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {skillOptionLabel(s)}
                  </option>
                ))}
              </Select>
              {target && <SkillPreviewCard skill={target} role="target" />}
            </Field>
          </div>

          {source && target && (
            <MergeImpactPanel source={source} target={target} />
          )}

          <Field
            label="Reason for merge"
            hint="Required — recorded in the cross-tenant audit log"
            required
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="e.g. ReactJS is a duplicate of React — consolidate contributor profiles."
              className={textareaCls}
            />
            {reason.length > 0 && !reasonValid && (
              <p className="mt-1.5 font-body text-[11.5px] text-warning-text">
                Enter at least {MIN_REASON_LENGTH} characters for the audit log.
              </p>
            )}
          </Field>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-stroke-subtle">
          <Link
            href="/admin/skill-taxonomy"
            className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className={primaryBtnCls}
          >
            <GitMerge className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Merge skills
          </button>
        </footer>
      </form>

      <Modal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        title="Confirm permanent merge"
        description="Review the impact before proceeding."
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              className={cancelBtnCls}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={doMerge}
              disabled={!canSubmit}
              className={dangerBtnCls}
            >
              <GitMerge className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              {submitting ? "Merging…" : "Merge permanently"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2.5">
            <span className="font-body text-[13px] font-semibold text-foreground truncate">
              {source?.name}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
            <span className="font-body text-[13px] font-semibold text-foreground truncate">
              {target?.name}
            </span>
          </div>

          {source && target && (
            <ul className="space-y-2 font-body text-[12px] text-text-secondary leading-relaxed">
              <li>
                <span className="font-display text-[16px] font-semibold tabular-nums text-foreground">
                  {source.holders}
                </span>{" "}
                contributor{source.holders === 1 ? "" : "s"} move to {target.name}
              </li>
              <li>
                {source.name} becomes deprecated; name and aliases added to target
              </li>
              <li>Proficiency levels on the source skill are preserved</li>
            </ul>
          )}

          <ContextStrip label="Audit reason" value={reason.trim()} />
        </div>
      </Modal>
    </div>
  );
}

function SkillPreviewCard({
  skill,
  role,
}: {
  skill: MockSkill;
  role: "source" | "target";
}) {
  return (
    <div className="mt-3 rounded-lg border border-stroke-subtle bg-bg-subtle/30 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/skill-taxonomy/${skill.id}`}
          className="font-body text-[13px] font-semibold text-foreground hover:text-brand-emphasis transition-colors duration-fast"
        >
          {skill.name}
        </Link>
        <StatusChip status={STATUS_CHIP[skill.status]} size="sm">
          {STATUS_LABEL[skill.status]}
        </StatusChip>
        <span className="font-body text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          {role === "source" ? "Source" : "Target"}
        </span>
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

function MergeImpactPanel({
  source,
  target,
}: {
  source: MockSkill;
  target: MockSkill;
}) {
  const combinedHolders = target.holders + source.holders;
  const newAliases = Array.from(
    new Set([...target.aliases, source.name, ...source.aliases]),
  ).filter((a) => a !== target.name);

  return (
    <div className="rounded-lg border border-brand-border/40 bg-brand-subtle/15 px-4 py-3.5">
      <p className="font-body text-[12px] font-semibold text-foreground flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-brand-emphasis shrink-0" strokeWidth={2} aria-hidden />
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
        <ImpactStat
          label="New aliases on target"
          value={newAliases.length > 0 ? newAliases.slice(0, 2).join(", ") + (newAliases.length > 2 ? "…" : "") : "—"}
        />
      </dl>
      <p className="mt-2 font-body text-[11.5px] text-text-tertiary">
        Contributor proficiency levels on {source.name} are preserved on {target.name}.
      </p>
    </div>
  );
}

function ImpactStat({
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
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[13px] font-semibold truncate",
          highlight ? "text-brand-emphasis" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ContextStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2">
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </p>
      <p className="mt-0.5 font-body text-[12.5px] text-foreground leading-relaxed">{value}</p>
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

const textareaCls = cn(
  "block w-full min-h-[96px] px-3 py-2.5 rounded-md border border-stroke bg-surface resize-y",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled leading-relaxed",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

const cancelBtnCls = cn(
  "inline-flex items-center h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

const dangerBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-error-solid text-on-brand",
  "font-body text-[13px] font-semibold",
  "hover:bg-error transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);
