"use client";

/**
 * Revision compare modal — submitted version vs working draft.
 */

import * as React from "react";
import {
  ArrowRight,
  File as FileIcon,
  Minus,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Modal } from "@/components/meridian/overlays/Modal";
import { StatusChip } from "@/components/meridian";
import type { MockSubmission, MockTask } from "@/mocks/contributor";
import { cn } from "@/lib/utils/cn";

export interface RevisionCompareModalProps {
  open: boolean;
  onClose: () => void;
  fromVersion: number;
  submission: MockSubmission;
  task: MockTask;
}

type ChangeKind = "unchanged" | "modified" | "added";

interface EvidenceRow {
  id: string;
  name: string;
  left: boolean;
  right: boolean;
  change: ChangeKind;
}

export function RevisionCompareModal({
  open,
  onClose,
  fromVersion,
  submission,
  task,
}: RevisionCompareModalProps) {
  const criteriaBefore = task.criteriaAddressed.filter(Boolean).length;
  const criteriaTotal = task.criteriaAddressed.length || task.acceptanceCriteria.length;
  const criteriaAfter = Math.min(criteriaTotal, criteriaBefore + 1);

  const addedLines = [
    "Added Safari clip-path fix; verified on iOS 17.",
    "Bound haptic to navigator.vibrate(10) on mobile success.",
  ];

  const evidenceRows: EvidenceRow[] = [
    ...submission.artifacts.map((a) => ({
      id: a.id,
      name: a.name,
      left: true,
      right: true,
      change: "modified" as const,
    })),
    {
      id: "working-patch",
      name: "safari-focus-fix.patch",
      left: false,
      right: true,
      change: "added",
    },
  ];

  const modifiedCount = evidenceRows.filter((r) => r.change === "modified").length;
  const addedCount = evidenceRows.filter((r) => r.change === "added").length;
  const criteriaGain = criteriaAfter - criteriaBefore;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Version comparison"
      description={`Submitted v${fromVersion} against your working draft — review changes before resubmit.`}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 items-center px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
        >
          Done
        </button>
      }
    >
      <div className="space-y-5 -mt-1">
        {/* Summary strip */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stroke-subtle bg-bg-subtle/60 px-3 py-2.5">
          {modifiedCount > 0 && (
            <SummaryPill tone="warning">{modifiedCount} modified</SummaryPill>
          )}
          {addedCount > 0 && (
            <SummaryPill tone="success">{addedCount} added</SummaryPill>
          )}
          {criteriaGain > 0 && (
            <SummaryPill tone="info">
              <TrendingUp className="h-3 w-3" strokeWidth={2} aria-hidden />
              Criteria +{criteriaGain}
            </SummaryPill>
          )}
          <span className="font-body text-[11.5px] text-text-tertiary ml-auto tabular-nums">
            {criteriaBefore}/{criteriaTotal} → {criteriaAfter}/{criteriaTotal} addressed
          </span>
        </div>

        {/* Compare grid shell */}
        <div className="rounded-xl border border-stroke overflow-hidden">
          <CompareColumnHeader left={`Submitted · v${fromVersion}`} right="Working draft" />

          {/* Evidence */}
          <CompareSection title="Evidence" count={evidenceRows.length}>
            {evidenceRows.length === 0 ? (
              <CompareEmpty message="No evidence in the submitted version." />
            ) : (
              <ul className="divide-y divide-stroke-subtle">
                {evidenceRows.map((row) => (
                  <li key={row.id} className="grid grid-cols-2 divide-x divide-stroke-subtle">
                    <CompareCell muted={!row.left}>
                      {row.left ? (
                        <FileRow name={row.name} />
                      ) : (
                        <EmptyCellHint icon={Minus} label="Not in v1" />
                      )}
                    </CompareCell>
                    <CompareCell highlight={row.change !== "unchanged"}>
                      {row.right ? (
                        <FileRow
                          name={row.name}
                          trailing={
                            row.change !== "unchanged" ? (
                              <ChangeBadge kind={row.change} />
                            ) : null
                          }
                        />
                      ) : (
                        <EmptyCellHint icon={Minus} label="Removed" />
                      )}
                    </CompareCell>
                  </li>
                ))}
              </ul>
            )}
          </CompareSection>

          {/* Notes */}
          <CompareSection title="Cover notes">
            <div className="grid grid-cols-2 divide-x divide-stroke-subtle">
              <CompareCell>
                <pre className="whitespace-pre-wrap font-body text-[12px] text-text-secondary leading-relaxed">
                  {submission.body?.trim() || "No notes attached."}
                </pre>
              </CompareCell>
              <CompareCell highlight>
                <div className="space-y-2">
                  {submission.body?.trim() && (
                    <pre className="whitespace-pre-wrap font-body text-[12px] text-text-secondary leading-relaxed">
                      {submission.body.trim()}
                    </pre>
                  )}
                  <ul className="space-y-1.5">
                    {addedLines.map((line) => (
                      <li
                        key={line}
                        className="flex items-start gap-2 rounded-md bg-success-subtle/40 border border-success-border/40 px-2.5 py-1.5"
                      >
                        <Plus
                          className="h-3.5 w-3.5 text-success-text shrink-0 mt-0.5"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span className="font-body text-[12px] text-foreground leading-relaxed">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CompareCell>
            </div>
          </CompareSection>

          {/* Criteria */}
          <CompareSection title="Acceptance criteria">
            <div className="px-4 py-3.5">
              <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                <CriteriaMeter
                  label={`v${fromVersion}`}
                  done={criteriaBefore}
                  total={criteriaTotal}
                  tone="neutral"
                />
                <ArrowRight
                  className="h-4 w-4 text-text-tertiary mx-auto hidden sm:block"
                  strokeWidth={2}
                  aria-hidden
                />
                <CriteriaMeter
                  label="Working"
                  done={criteriaAfter}
                  total={criteriaTotal}
                  tone="success"
                />
              </div>
              {criteriaGain > 0 && (
                <p className="mt-3 font-body text-[11.5px] text-success-text font-medium">
                  +{criteriaGain} criterion{criteriaGain === 1 ? "" : "a"} addressed since submit
                </p>
              )}
            </div>
          </CompareSection>
        </div>
      </div>
    </Modal>
  );
}

function SummaryPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "warning" | "success" | "info";
}) {
  const styles = {
    warning: "bg-warning-subtle text-warning-text border-warning-border/50",
    success: "bg-success-subtle text-success-text border-success-border/50",
    info: "bg-info-subtle text-info-text border-info-border/50",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border",
        "font-body text-[10.5px] font-semibold tabular-nums",
        styles,
      )}
    >
      {children}
    </span>
  );
}

function CompareColumnHeader({ left, right }: { left: string; right: string }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-stroke-subtle bg-bg-subtle border-b border-stroke-subtle">
      {[left, right].map((label) => (
        <div key={label} className="px-4 py-2.5">
          <p className="font-body text-[11px] font-semibold text-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

function CompareSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-stroke-subtle first:border-t-0">
      <header className="px-4 py-2 border-b border-stroke-subtle bg-surface">
        <h4 className="font-body text-[12px] font-semibold text-foreground">
          {title}
          {count !== undefined && (
            <span className="ml-1.5 font-normal text-text-tertiary tabular-nums">({count})</span>
          )}
        </h4>
      </header>
      {children}
    </section>
  );
}

function CompareCell({
  children,
  muted,
  highlight,
}: {
  children: React.ReactNode;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3 min-h-[52px]",
        muted && "bg-bg-subtle/40",
        highlight && "bg-brand-subtle/5",
      )}
    >
      {children}
    </div>
  );
}

function FileRow({ name, trailing }: { name: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <FileIcon className="h-3.5 w-3.5 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      <span className="font-mono text-[11.5px] text-foreground truncate flex-1">{name}</span>
      {trailing}
    </div>
  );
}

function ChangeBadge({ kind }: { kind: Exclude<ChangeKind, "unchanged"> }) {
  return (
    <StatusChip status={kind === "added" ? "success" : "warning"} size="sm">
      {kind === "added" ? "Added" : "Modified"}
    </StatusChip>
  );
}

function EmptyCellHint({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 font-body text-[11px] text-text-disabled italic">
      <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
      {label}
    </span>
  );
}

function CompareEmpty({ message }: { message: string }) {
  return (
    <p className="px-4 py-6 text-center font-body text-[12px] text-text-tertiary italic">{message}</p>
  );
}

function CriteriaMeter({
  label,
  done,
  total,
  tone,
}: {
  label: string;
  done: number;
  total: number;
  tone: "neutral" | "success";
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-stroke-subtle bg-surface px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-body text-[11px] font-semibold text-foreground">{label}</span>
        <span
          className={cn(
            "font-mono text-[11px] tabular-nums font-semibold",
            tone === "success" ? "text-success-text" : "text-text-secondary",
          )}
        >
          {done}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-fast",
            tone === "success" ? "bg-success-text" : "bg-text-tertiary/40",
          )}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
