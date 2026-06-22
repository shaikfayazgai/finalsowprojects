"use client";

import Link from "next/link";
import {
  FileText,
  Image as ImageIcon,
  Play,
  FlaskConical,
  Star,
  ShieldCheck,
} from "lucide-react";
import type { EnterpriseReviewQueueItem } from "@/lib/enterprise-review/types";
import type { AcceptanceDetailContext } from "../acceptance-detail-context";
import { cn } from "@/lib/utils/cn";
import { TONE } from "@/app/admin/_shell/aurora-ui";

const ARTIFACT_ICON = {
  doc: FileText,
  image: ImageIcon,
  test: FlaskConical,
  video: Play,
} as const;

export function MentorVerdictSection({ ctx }: { ctx: AcceptanceDetailContext }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
        <div className="min-w-0">
          <p className="font-body text-[13px] font-semibold text-foreground">
            {ctx.mentorName}
            <span className="text-text-tertiary font-normal mx-1.5">·</span>
            <span className="inline-flex items-center gap-0.5 align-middle">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("h-3.5 w-3.5", i < ctx.mentorStars ? "" : "text-text-disabled")}
                  style={i < ctx.mentorStars ? { color: TONE.warning.text, fill: TONE.warning.text } : undefined}
                  strokeWidth={2}
                  aria-hidden
                />
              ))}
            </span>
          </p>
          <p className="mt-1.5 font-body text-[13px] text-text-secondary leading-relaxed">
            {ctx.mentorNote}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DeliveryFactsSection({
  item,
  ctx,
}: {
  item: EnterpriseReviewQueueItem;
  ctx: AcceptanceDetailContext;
}) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      <Fact label="Submission ID" value={item.submissionId} mono />
      <Fact label="Task ID" value={item.taskDefinitionId} mono />
      <Fact label="Contributor" value={item.contributorName} />
      <Fact label="Version" value={`v${item.version}`} mono />
      <Fact label="Project" value={ctx.projectName} />
      <Fact label="SOW" value={ctx.sowTitle} />
      <Fact
        label="Artifacts"
        value={`${item.artifactCount} file${item.artifactCount === 1 ? "" : "s"}`}
        mono
      />
      <Fact
        label="Claim status"
        value={item.enterpriseReviewerId ? "Claimed by you" : "Unclaimed"}
      />
    </dl>
  );
}

export function CriteriaSection({ ctx }: { ctx: AcceptanceDetailContext }) {
  const unmet = ctx.criteria.filter((c) => !c.met).length;

  return (
    <>
      {unmet > 0 && (
        <p className="font-body text-[12px] font-medium mb-3 -mt-1" style={{ color: TONE.warning.text }}>
          {unmet} criterion{unmet === 1 ? "" : "a"} not fully met — review before accepting.
        </p>
      )}
      <ul className="divide-y divide-stroke-subtle -mx-5 sm:-mx-6">
        {ctx.criteria.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 px-5 sm:px-6 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-bg-subtle"
          >
            <span className="font-body text-[13px] text-foreground min-w-0 truncate">{c.label}</span>
            <span
              className="font-body text-[11px] shrink-0 tabular-nums font-medium"
              style={{ color: c.met ? TONE.success.text : TONE.warning.text }}
            >
              {c.met ? "Met" : "Gap"} · {c.mentorScore}/5
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function EvidenceSection({ ctx }: { ctx: AcceptanceDetailContext }) {
  return (
    <ul className="divide-y divide-stroke-subtle -mx-5 sm:-mx-6">
      {ctx.artifacts.map((a) => {
        const Icon = ARTIFACT_ICON[a.kind];
        return (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 px-5 sm:px-6 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-bg-subtle"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="h-7 w-7 rounded-lg bg-foreground/[0.08] flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="font-body text-[13px] font-medium text-foreground truncate block">
                  {a.name}
                </span>
              </span>
            </span>
            <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
              {a.sizeLabel}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function LineageSection({ ctx }: { ctx: AcceptanceDetailContext }) {
  return (
    <ol className="divide-y divide-stroke-subtle -mx-5 sm:-mx-6">
      {ctx.lineage.map((step) => (
        <li
          key={step.stage}
          className="px-5 sm:px-6 py-2.5 min-h-[44px] flex items-center justify-between gap-3 transition-colors duration-fast hover:bg-bg-subtle"
        >
          <span className="min-w-0">
            <span className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              {step.stage}
            </span>
            {step.href ? (
              <Link
                href={step.href}
                className="block font-body text-[13px] font-medium text-foreground hover:text-text-secondary truncate transition-colors duration-fast"
              >
                {step.label}
              </Link>
            ) : (
              <span className="block font-body text-[13px] font-medium text-foreground truncate">
                {step.label}
              </span>
            )}
          </span>
          <span className="font-body text-[11px] text-text-tertiary shrink-0 text-right truncate max-w-[45%]">
            {step.actor}
            {step.at ? ` · ${step.at}` : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function AuditSection({ ctx, submissionId }: { ctx: AcceptanceDetailContext; submissionId: string }) {
  const auditHref = `/enterprise/audit?resourceType=submission&resourceId=${encodeURIComponent(submissionId)}`;

  return (
    <>
      <ul className="divide-y divide-stroke-subtle -mx-5 sm:-mx-6">
        {ctx.auditEvents.map((e, i) => (
          <li key={i} className="px-5 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap transition-colors duration-fast hover:bg-bg-subtle">
            <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
              {new Date(e.at).toLocaleString("en-GB", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="font-mono text-[11px] text-foreground">{e.action}</span>
            <span className="font-body text-[11.5px] text-text-secondary truncate flex-1 min-w-0">
              {e.actor}
              {e.detail ? ` · ${e.detail}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-body text-[12px]">
        <Link
          href={auditHref}
          className="font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
        >
          Full audit trail
        </Link>
      </p>
    </>
  );
}

function Fact({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && typeof value === "string" && "font-mono text-[12px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
