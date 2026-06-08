"use client";

/**
 * Skill detail — evidence, tasks, credentials for one declared skill.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  AlertCircle,
  Award,
  ExternalLink,
  FileText,
  FolderOpen,
  Info,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { ConfirmationDialog, Modal } from "@/components/meridian/overlays";
import {
  ModalCancelButton,
  ModalPrimaryButton,
  modalFieldLabelClass,
  modalInputClass,
} from "@/components/meridian/overlays/modal-actions";
import { ContributorProfileError } from "@/lib/contributor/profile-errors";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import { useContributorSkillDetail } from "@/lib/hooks/use-contributor-skills";
import { cn } from "@/lib/utils/cn";
import { SkillDetailSkeleton } from "./skill-detail-skeleton";
import {
  fmtSkillDate,
  isEvidenceLink,
  levelDescription,
  levelTone,
  primaryRole,
  skillCategoryLabel,
  taskHref,
  taskStatusChip,
  taskStatusLabel,
} from "../../lib/skills-ui-utils";

export function SkillDetailWorkspace() {
  const params = useParams<{ skillId: string }>();
  const skillId = params?.skillId ?? "";
  const { isLoading: personaLoading } = useActivePersona();

  const { data, isLoading, error, refetch, isFetching } = useContributorSkillDetail(skillId);
  const loading = personaLoading || (isLoading && !data);

  const [evidence, setEvidence] = React.useState<string[]>([]);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkDraft, setLinkDraft] = React.useState("");
  const [removeEvidenceIdx, setRemoveEvidenceIdx] = React.useState<number | null>(null);

  const skill = data?.skill;
  const tasksUsingSkill = data?.tasksUsingSkill ?? [];
  const credentialsForSkill = data?.credentialsForSkill ?? [];

  if (loading) return <SkillDetailSkeleton />;

  if (error) {
    const is404 = error instanceof ContributorProfileError && error.status === 404;
    if (is404) notFound();
    return (
      <div className="space-y-4 pb-12">
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
      </div>
    );
  }

  if (!skill) notFound();

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setEvidence((p) => [...p, ...files.map((f) => f.name)]);
    e.currentTarget.value = "";
  }

  function addLink() {
    const v = linkDraft.trim();
    if (!v) return;
    setEvidence((p) => [...p, v]);
    setLinkDraft("");
    setLinkOpen(false);
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Skill hero */}
      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-br from-brand-subtle/40 via-surface to-bg-subtle border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
                  {skill.name}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded border font-mono text-[11px] font-semibold tabular-nums",
                    levelTone(skill.level),
                  )}
                >
                  {skill.level}
                </span>
              </div>
              <p className="mt-1.5 font-body text-[12.5px] text-text-secondary">
                {primaryRole(skill.category)} · {skillCategoryLabel(skill.category)}
              </p>
              <p className="mt-1 font-body text-[12px] text-text-tertiary">
                {levelDescription(skill.level)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover disabled:opacity-60"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                strokeWidth={2}
                aria-hidden
              />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <DashboardSection title="Skill record" description="Observations from your delivery history">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat
            label="Tasks"
            value={String(tasksUsingSkill.length || skill.tasksCompletedWithThisSkill || 0)}
            highlight={(tasksUsingSkill.length || skill.tasksCompletedWithThisSkill) > 0}
          />
          <SummaryStat
            label="Evidence"
            value={String(evidence.length)}
            highlight={evidence.length > 0}
          />
          <SummaryStat
            label="Credentials"
            value={String(credentialsForSkill.length)}
            highlight={credentialsForSkill.length > 0}
          />
          <SummaryStat label="Level" value={skill.level} highlight={skill.level === "L3" || skill.level === "L4"} />
        </dl>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <div className="space-y-4 min-w-0">
          {/* Evidence */}
          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                  Evidence
                </h2>
                <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                  Portfolio links and documents supporting this skill
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <EvidenceFileUpload onChange={onPickFiles} />
                <button
                  type="button"
                  onClick={() => setLinkOpen(true)}
                  className={secondaryActionCls}
                >
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Add link
                </button>
              </div>
            </div>

            {evidence.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FolderOpen
                  className="h-9 w-9 text-text-disabled mx-auto mb-3"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="font-body text-[13px] font-semibold text-foreground mb-1">
                  No evidence attached
                </p>
                <p className="font-body text-[12px] text-text-secondary mb-4">
                  Add a portfolio link, repo, or document so reviewers can validate this skill.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <EvidenceFileUpload onChange={onPickFiles} />
                  <button type="button" onClick={() => setLinkOpen(true)} className={secondaryActionCls}>
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Add link
                  </button>
                  <Link
                    href="/contributor/profile/evidence"
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md font-body text-[13px] font-semibold text-text-link hover:underline"
                  >
                    Open evidence library
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-stroke-subtle">
                {evidence.map((item, i) => {
                  const link = isEvidenceLink(item);
                  const Icon = link ? ExternalLink : FileText;
                  return (
                    <li
                      key={`${item}-${i}`}
                      className="group flex items-center gap-3 px-5 min-h-[56px] py-3 hover:bg-bg-subtle/60 transition-colors duration-fast"
                    >
                      <div
                        aria-hidden
                        className="h-8 w-8 rounded-md bg-bg-subtle border border-stroke-subtle inline-flex items-center justify-center shrink-0"
                      >
                        <Icon className="h-3.5 w-3.5 text-text-secondary" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        {link ? (
                          <a
                            href={item}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-body text-[13px] font-medium text-brand hover:underline truncate block"
                          >
                            {item}
                          </a>
                        ) : (
                          <span className="font-body text-[13px] font-medium text-foreground truncate block">
                            {item}
                          </span>
                        )}
                        <span className="font-body text-[11px] text-text-tertiary">
                          {link ? "Link" : "Document"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRemoveEvidenceIdx(i)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-tertiary hover:text-error-text hover:bg-error-subtle opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity"
                        aria-label={`Remove evidence ${item}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Tasks */}
          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke-subtle">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Tasks using this skill
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                Deliveries where this skill was required or observed
              </p>
            </div>
            {tasksUsingSkill.length === 0 ? (
              <p className="px-5 py-8 font-body text-[12.5px] text-text-tertiary text-center italic">
                No tasks logged for this skill yet.
              </p>
            ) : (
              <ul className="divide-y divide-stroke-subtle">
                {tasksUsingSkill.slice(0, 10).map((task) => (
                  <li key={task.id}>
                    <Link
                      href={taskHref(task.id, task.status)}
                      className="flex items-center justify-between gap-3 px-5 min-h-[56px] py-3.5 hover:bg-bg-subtle/60 transition-colors duration-fast"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-body text-[13px] font-semibold text-foreground truncate">
                          {task.title}
                        </span>
                        <span className="mt-0.5 block font-body text-[11px] text-text-tertiary truncate">
                          {task.sow.tenantName}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <StatusChip status={taskStatusChip(task.status)} size="sm">
                          {taskStatusLabel(task.status)}
                        </StatusChip>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Credentials */}
          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke-subtle">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Credentials earned
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                Verified records issued for accepted work
              </p>
            </div>
            {credentialsForSkill.length === 0 ? (
              <p className="px-5 py-8 font-body text-[12.5px] text-text-tertiary text-center italic">
                No credentials issued for this skill yet.
              </p>
            ) : (
              <ul className="divide-y divide-stroke-subtle">
                {credentialsForSkill.map((cred) => (
                  <li key={cred.id}>
                    <Link
                      href={`/contributor/credentials/${cred.id}`}
                      className="flex items-center justify-between gap-3 px-5 min-h-[56px] py-3.5 hover:bg-bg-subtle/60 transition-colors duration-fast"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-body text-[13px] font-semibold text-foreground truncate">
                          {cred.taskTitle}
                        </span>
                        <span className="mt-0.5 block font-body text-[11px] text-text-tertiary truncate">
                          {cred.project} · {cred.verifierOrg}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded border font-mono text-[10px] font-semibold",
                            levelTone(cred.level),
                          )}
                        >
                          {cred.level}
                        </span>
                        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                          {fmtSkillDate(cred.issuedAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
          <DashboardSection title="Proficiency" description="Self-declared level">
            <p className="font-body text-[13px] text-foreground leading-relaxed">
              {levelDescription(skill.level)}
            </p>
            <p className="mt-3 pt-3 border-t border-stroke-subtle font-body text-[11.5px] text-text-tertiary leading-relaxed">
              Levels are self-rated. Reviewers may adjust match scoring based on observed delivery
              quality on tasks.
            </p>
          </DashboardSection>

          <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-2">
            <h3 className="font-body text-[13px] font-semibold text-foreground">Related</h3>
            <Link
              href="/contributor/profile/evidence"
              className="flex items-start gap-2 font-body text-[12.5px] text-brand hover:underline"
            >
              <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={2} aria-hidden />
              Manage all evidence
            </Link>
            <Link
              href="/contributor/credentials"
              className="flex items-start gap-2 font-body text-[12.5px] text-brand hover:underline"
            >
              <Award className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={2} aria-hidden />
              Credential wallet
            </Link>
            <Link
              href="/contributor/profile/skills"
              className="flex items-start gap-2 font-body text-[12.5px] text-brand hover:underline"
            >
              Back to skill registry
            </Link>
          </div>

          <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3 flex items-start gap-2.5">
            <Info className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[11.5px] text-text-secondary leading-relaxed">
              Evidence attached here helps reviewers confirm skill claims. It is not shown publicly.
            </p>
          </div>
        </aside>
      </div>

      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Add evidence link"
        description="Paste a portfolio URL, GitHub repo, or case study link."
        size="md"
        footer={
          <>
            <ModalCancelButton onClick={() => setLinkOpen(false)} />
            <ModalPrimaryButton onClick={addLink} disabled={!linkDraft.trim()}>
              Add link
            </ModalPrimaryButton>
          </>
        }
      >
        <label htmlFor="evidence-link" className={modalFieldLabelClass}>
          URL
        </label>
        <input
          id="evidence-link"
          type="url"
          value={linkDraft}
          onChange={(e) => setLinkDraft(e.target.value)}
          placeholder="https://…"
          className={modalInputClass}
          autoFocus
        />
      </Modal>

      <ConfirmationDialog
        open={removeEvidenceIdx !== null}
        onCancel={() => setRemoveEvidenceIdx(null)}
        onConfirm={() => {
          if (removeEvidenceIdx === null) return;
          setEvidence((p) => p.filter((_, idx) => idx !== removeEvidenceIdx));
          setRemoveEvidenceIdx(null);
        }}
        title="Remove evidence?"
        description="This detaches the item from this skill. It will not delete files from your evidence library."
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

const secondaryActionCls = cn(
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[12px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

/** Nested label + input — same pattern as workroom evidence uploads. */
function EvidenceFileUpload({
  onChange,
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <label className={cn(secondaryActionCls, "cursor-pointer")}>
      <Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Upload
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.csv,.zip,.txt,image/*"
        onChange={(e) => {
          onChange(e);
          if (inputRef.current) inputRef.current.value = "";
        }}
        className="sr-only"
      />
    </label>
  );
}
