"use client";

import * as React from "react";
import {
  Bug,
  Eye,
  FileText,
  Minus,
  Play,
  Plus,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { MockReviewerItem } from "@/mocks/reviewer";
import { cn } from "@/lib/utils/cn";
import { TONE, Chip, type Tone, ghostBtnClass } from "@/app/admin/_shell/aurora-ui";
import { EvidencePreviewDialog } from "./evidence-preview-dialog";

const EVIDENCE_ICON = {
  doc: FileText,
  text: FileText,
  image: FileText,
  video: Play,
} as const;

export function MentorVerdictSection({ review }: { review: MockReviewerItem }) {
  return (
    <div className="space-y-3 -mx-5 sm:-mx-6 px-5 sm:px-6">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-body text-[13px] font-semibold text-foreground">
            {review.mentorName}
            <span className="text-text-tertiary font-normal mx-1.5">·</span>
            <span className="font-mono tabular-nums text-text-secondary font-medium">
              {review.mentorOverall.toFixed(2)}
            </span>
            <span className="text-text-tertiary font-normal"> / 5 overall</span>
          </p>
          {review.mentorNote ? (
            <p className="mt-1.5 font-body text-[13px] text-text-secondary leading-relaxed">
              {review.mentorNote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CriteriaSection({ review }: { review: MockReviewerItem }) {
  return (
    <ul className="divide-y divide-white/60 -mx-5 sm:-mx-6">
      {review.criteria.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 px-5 sm:px-6 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-white/50">
          <span className="font-body text-[13px] text-foreground min-w-0">{c.label}</span>
          <span className="inline-flex items-center gap-0.5 shrink-0" aria-label={`Mentor score ${c.mentorStars} of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("h-3 w-3", i < c.mentorStars ? "" : "text-text-disabled")}
                style={i < c.mentorStars ? { color: TONE.warning.text, fill: TONE.warning.text } : undefined}
                strokeWidth={2}
                aria-hidden
              />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function EvidenceSection({ review }: { review: MockReviewerItem }) {
  const [previewFile, setPreviewFile] = React.useState<
    MockReviewerItem["evidence"][number] | null
  >(null);

  return (
    <>
      <ul className="divide-y divide-white/60 -mx-5 sm:-mx-6">
        {review.evidence.map((e) => {
          const Icon = EVIDENCE_ICON[e.kind] ?? FileText;
          return (
            <li key={e.id} className="flex items-center justify-between gap-3 px-5 sm:px-6 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-white/50">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="h-7 w-7 rounded-lg bg-foreground/[0.08] flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                </span>
                <span className="font-body text-[13px] font-medium text-foreground truncate">
                  {e.name}
                </span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                  {(e.sizeBytes / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewFile(e)}
                  className={cn(ghostBtnClass, "h-7 px-2 text-[11px] gap-1")}
                >
                  <Eye className="h-3 w-3" strokeWidth={2} aria-hidden />
                  {e.kind === "video" ? "Play" : "View"}
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <EvidencePreviewDialog
        file={previewFile}
        open={previewFile !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
      />
    </>
  );
}

export function CoverNoteSection({ review }: { review: MockReviewerItem }) {
  return (
    <p className="font-body text-[13px] text-foreground leading-relaxed -mx-5 sm:-mx-6 px-5 sm:px-6">
      {review.contributorCoverNote}
    </p>
  );
}

export function DeliveryFactsSection({ review }: { review: MockReviewerItem }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      <Fact label="Review ID" value={review.id} mono />
      <Fact label="Project" value={review.project} />
      <Fact label="Tenant" value={review.tenant} />
      <Fact label="Contributor" value={review.contributorName} />
      <Fact label="Round" value={`${review.round} of ${review.totalRounds}`} mono />
      <Fact
        label="Criteria validated"
        value={`${review.criteriaValidatedCount} of ${review.criteria.length}`}
        mono
      />
      <Fact
        label="Submitted"
        value={new Date(review.submittedAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      />
      <Fact
        label="Mentor accepted"
        value={new Date(review.mentorAcceptedAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      />
    </dl>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12.5px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* ── File scan ── */

interface ScanResult {
  provider: "virus" | "plagiarism";
  label: string;
  status: "clean" | "warning" | "blocked";
  score: string;
  detail: string;
}

function buildScanResults(reviewId: string): ScanResult[] {
  const seed = reviewId.length % 5;
  const variants: ScanResult[][] = [
    [
      { provider: "virus", label: "ClamAV virus scan", status: "clean", score: "0 threats", detail: "All 4 files scanned · signatures up to date." },
      { provider: "plagiarism", label: "Copyleaks similarity", status: "clean", score: "3% similarity", detail: "Within acceptable threshold (≤15%)." },
    ],
    [
      { provider: "virus", label: "ClamAV virus scan", status: "clean", score: "0 threats", detail: "All files scanned clean." },
      { provider: "plagiarism", label: "Copyleaks similarity", status: "warning", score: "18% similarity", detail: "Above warn threshold — surface to reviewer." },
    ],
    [
      { provider: "virus", label: "ClamAV virus scan", status: "warning", score: "1 PUP detected", detail: "Potentially Unwanted Program in attached zip." },
      { provider: "plagiarism", label: "Copyleaks similarity", status: "clean", score: "8% similarity", detail: "Within threshold." },
    ],
    [
      { provider: "virus", label: "ClamAV virus scan", status: "clean", score: "0 threats", detail: "All files scanned clean." },
      { provider: "plagiarism", label: "Copyleaks similarity", status: "clean", score: "6% similarity", detail: "Within threshold." },
    ],
    [
      { provider: "virus", label: "ClamAV virus scan", status: "blocked", score: "1 threat blocked", detail: "Trojan signature matched — upload quarantined." },
      { provider: "plagiarism", label: "Copyleaks similarity", status: "warning", score: "22% similarity", detail: "Above warn threshold." },
    ],
  ];
  return variants[seed] ?? variants[0]!;
}

export function FileScanSection({ review }: { review: MockReviewerItem }) {
  const scans = React.useMemo(() => buildScanResults(review.id), [review.id]);
  const worst = scans.reduce<ScanResult["status"]>(
    (acc, s) =>
      s.status === "blocked" || acc === "blocked"
        ? "blocked"
        : s.status === "warning" || acc === "warning"
          ? "warning"
          : "clean",
    "clean",
  );

  return (
    <>
      <div className="flex items-center justify-end -mt-1 mb-2">
        <ScanBadge status={worst} />
      </div>
      <ul className="divide-y divide-white/60 -mx-5 sm:-mx-6">
        {scans.map((s) => (
          <li key={s.provider} className="px-5 sm:px-6 py-2.5 flex items-start gap-3 min-h-[44px] transition-colors duration-fast hover:bg-white/50">
            <ScanIcon status={s.status} provider={s.provider} />
            <div className="flex-1 min-w-0">
              <p className="font-body text-[13px] font-semibold text-foreground">
                {s.label}{" "}
                <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums font-normal">
                  · {s.score}
                </span>
              </p>
              <p className="font-body text-[12px] text-text-secondary">{s.detail}</p>
            </div>
            <ScanBadge status={s.status} compact />
          </li>
        ))}
      </ul>
      <p className="mt-3 font-body text-[11.5px] text-text-tertiary -mx-5 sm:-mx-6 px-5 sm:px-6">
        {review.evidence.length} file{review.evidence.length === 1 ? "" : "s"} scanned · ClamAV + Copyleaks
      </p>
    </>
  );
}

function ScanIcon({
  status,
  provider,
}: {
  status: ScanResult["status"];
  provider: ScanResult["provider"];
}) {
  const Icon = provider === "virus" ? Bug : ShieldCheck;
  const color =
    status === "clean"
      ? TONE.success.text
      : status === "warning"
        ? TONE.warning.text
        : TONE.error.text;
  return <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color }} strokeWidth={2} aria-hidden />;
}

function ScanBadge({ status, compact = false }: { status: ScanResult["status"]; compact?: boolean }) {
  const tone: Tone =
    status === "clean" ? "success" : status === "warning" ? "warning" : "error";
  const label = status === "clean" ? "Clean" : status === "warning" ? "Review" : "Blocked";
  return (
    <Chip tone={tone} dot={false} className={compact ? "h-5 text-[9.5px]" : undefined}>
      {label}
    </Chip>
  );
}

/* ── Version diff ── */

function buildDiffMock(reviewId: string): { v1: string[]; v2: string[] } {
  const lower = reviewId.toLowerCase();
  if (lower.includes("api") || lower.includes("v3")) {
    return {
      v1: [
        "## Endpoints",
        "- GET /v3/users",
        "- GET /v3/users/:id",
        "- POST /v3/users",
        "",
        "## Errors",
        "- 400 invalid payload",
        "- 404 not found",
        "- 500 server error",
      ],
      v2: [
        "## Endpoints",
        "- GET /v3/users",
        "- GET /v3/users/:id",
        "- POST /v3/users",
        "- DELETE /v3/users/:id",
        "",
        "## Errors",
        "- 400 invalid payload (with `code` discriminator)",
        "- 404 not found",
        "- 409 conflict (new)",
        "- 500 server error",
      ],
    };
  }
  return {
    v1: [
      "## Deliverables",
      "- Initial sketch",
      "- Wireframe (low-fi)",
      "- Acceptance: stakeholder review",
    ],
    v2: [
      "## Deliverables",
      "- Initial sketch",
      "- Wireframe (low-fi)",
      "- Hi-fi mockup (new)",
      "- Acceptance: stakeholder review with rubric checklist",
      "- Audit pack export (new)",
    ],
  };
}

type DiffLine = { kind: "same" | "add" | "del"; text: string };

function diffLines(a: string[], b: string[]): DiffLine[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: "same", text: a[i]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      out.push({ kind: "del", text: a[i]! });
      i++;
    } else {
      out.push({ kind: "add", text: b[j]! });
      j++;
    }
  }
  while (i < n) {
    out.push({ kind: "del", text: a[i++]! });
  }
  while (j < m) {
    out.push({ kind: "add", text: b[j++]! });
  }
  return out;
}

export function VersionDiffSection({ review }: { review: MockReviewerItem }) {
  const { v1, v2 } = React.useMemo(() => buildDiffMock(review.id), [review.id]);
  const lines = React.useMemo(() => diffLines(v1, v2), [v1, v2]);
  const adds = lines.filter((l) => l.kind === "add").length;
  const dels = lines.filter((l) => l.kind === "del").length;

  return (
    <div className="-mx-5 sm:-mx-6">
      <div className="px-5 sm:px-6 pb-2 flex items-center justify-end gap-2 font-mono text-[10.5px] tabular-nums">
        <span className="inline-flex items-center gap-0.5" style={{ color: TONE.success.text }}>
          <Plus className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
          {adds}
        </span>
        <span className="inline-flex items-center gap-0.5" style={{ color: TONE.error.text }}>
          <Minus className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
          {dels}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 border-t border-white/60 divide-y md:divide-y-0 md:divide-x divide-white/60">
        <div>
          <p className="px-5 sm:px-6 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-tertiary border-b border-white/60">
            Previous (v{review.round - 1})
          </p>
          <pre className="font-mono text-[11.5px] leading-relaxed p-5 sm:px-6 overflow-x-auto">
            {lines
              .filter((l) => l.kind !== "add")
              .map((l, idx) => (
                <div
                  key={idx}
                  className="px-1.5 -mx-1.5 rounded-sm"
                  style={
                    l.kind === "del"
                      ? { background: TONE.error.soft, color: TONE.error.text }
                      : { color: "var(--color-text-secondary)" }
                  }
                >
                  {l.kind === "del" ? "− " : "  "}
                  {l.text || " "}
                </div>
              ))}
          </pre>
        </div>
        <div>
          <p className="px-5 sm:px-6 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-tertiary border-b border-white/60">
            Current (v{review.round})
          </p>
          <pre className="font-mono text-[11.5px] leading-relaxed p-5 sm:px-6 overflow-x-auto">
            {lines
              .filter((l) => l.kind !== "del")
              .map((l, idx) => (
                <div
                  key={idx}
                  className="px-1.5 -mx-1.5 rounded-sm"
                  style={
                    l.kind === "add"
                      ? { background: TONE.success.soft, color: TONE.success.text }
                      : { color: "var(--color-text-secondary)" }
                  }
                >
                  {l.kind === "add" ? "+ " : "  "}
                  {l.text || " "}
                </div>
              ))}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function useScanWorstStatus(reviewId: string): ScanResult["status"] {
  const scans = React.useMemo(() => buildScanResults(reviewId), [reviewId]);
  return scans.reduce<ScanResult["status"]>(
    (acc, s) =>
      s.status === "blocked" || acc === "blocked"
        ? "blocked"
        : s.status === "warning" || acc === "warning"
          ? "warning"
          : "clean",
    "clean",
  );
}
