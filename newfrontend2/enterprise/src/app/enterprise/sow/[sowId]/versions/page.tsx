"use client";

/**
 * SOW version history — spec doc 02 §5.C.8.
 *
 * Phase 1 backend exposes only the active version (`activeVersionDetail`).
 * Older versions are listed by number from `activeVersion` count with
 * placeholder rows. A full per-version GET endpoint lands in Phase 2.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, History } from "lucide-react";
import { useSow } from "@/lib/hooks/use-sow-v2";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { canViewSowByConfidentiality } from "@/lib/sow/confidentiality-access";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import { Chip, secondaryBtnClass } from "@/app/admin/_shell/aurora-ui";

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SowVersionsPage() {
  const params = useParams<{ sowId: string }>();
  const sowId = params?.sowId ?? "";
  const { data: sow, isLoading, error } = useSow(sowId);
  const { roles, email, meLoading } = useEnterpriseAccess();

  if (isLoading) return <VersionsSkeleton />;
  if (error || !sow) {
    return (
      <div className="space-y-5 pb-12">
        <Link
          href="/enterprise/sow"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-body text-[12px] text-text-secondary hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Back to SOWs
        </Link>
        <div className={cn(DASH_CARD, "px-4 py-10 text-center")}>
          <p className="font-body text-[13px] font-semibold text-foreground">
            SOW not found
          </p>
        </div>
      </div>
    );
  }

  if (meLoading) return <VersionsSkeleton />;

  const payload = sow.activeVersionDetail?.payload ?? ({} as Record<string, unknown>);
  const canView = canViewSowByConfidentiality({
    confidentiality: sow.confidentiality,
    roles,
    actorEmail: email,
    ownerId: sow.ownerId,
    payload,
  });
  if (!canView) {
    return (
      <div className="space-y-5 pb-12">
        <Link
          href="/enterprise/sow"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-body text-[12px] text-text-secondary hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Back to SOWs
        </Link>
        <div className="rounded-lg border border-warning-border bg-warning-subtle/40 px-4 py-10 text-center">
          <p className="font-body text-[13px] font-semibold text-foreground">
            Restricted SOW visibility
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary">
            You do not have access to this version history.
          </p>
        </div>
      </div>
    );
  }

  const versionCount = sow.activeVersion;
  const activeDetail = sow.activeVersionDetail;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href={`/enterprise/sow/${sow.id}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span className="truncate max-w-[260px]">{sow.title}</span>
        </Link>
        <span aria-hidden className="opacity-60">
          /
        </span>
        <span className="text-text-secondary">Versions</span>
      </nav>

      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
          Enterprise · SOW
        </p>
        <h1 className="font-display text-[22px] sm:text-[24px] font-semibold text-foreground tracking-[-0.02em] leading-tight inline-flex items-center gap-2">
          <History className="h-5 w-5 text-text-tertiary" strokeWidth={2} aria-hidden />
          Versions
        </h1>
        <p className="mt-1.5 font-body text-[13px] text-text-secondary">
          {versionCount} version{versionCount === 1 ? "" : "s"} on file. Restore
          creates a new draft; older versions are never overwritten.
        </p>
      </header>

      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <ul className="divide-y divide-stroke-subtle">
          {/* Active / current */}
          {activeDetail && (
            <li className="px-5 py-4 space-y-1.5 transition-colors duration-fast hover:bg-bg-subtle/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] font-semibold text-foreground tabular-nums">
                  v{activeDetail.version}
                </span>
                <Chip tone="ai" dot={false}>Current</Chip>
                <span className="font-body text-[12.5px] text-text-secondary">
                  {activeDetail.createdBy.slice(0, 12)}…
                </span>
                <span aria-hidden className="text-stroke-subtle">·</span>
                <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
                  {timeAgo(activeDetail.createdAt)}
                </span>
                <span aria-hidden className="text-stroke-subtle">·</span>
                <span className="font-body text-[12px] text-text-secondary capitalize">
                  {sow.status}
                </span>
              </div>
              {activeDetail.changeNote && (
                <p className="font-body text-[12px] text-text-secondary">
                  Changes: {activeDetail.changeNote}
                </p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/enterprise/sow/${sow.id}`}
                  className={cn(secondaryBtnClass, "h-7 px-2.5 text-[11.5px]")}
                >
                  <Eye className="h-3 w-3" strokeWidth={2} aria-hidden />
                  View
                </Link>
              </div>
            </li>
          )}

          {/* Older versions (count-based placeholders) */}
          {Array.from({ length: Math.max(0, versionCount - 1) }).map((_, i) => {
            const v = versionCount - 1 - i;
            return (
              <li key={v} className="px-5 py-4 flex items-center gap-2 flex-wrap transition-colors duration-fast hover:bg-bg-subtle/60">
                <span className="font-mono text-[11px] font-semibold text-text-secondary tabular-nums">
                  v{v}
                </span>
                <Chip tone="neutral" dot={false}>Archived</Chip>
                <span className="font-body text-[12px] text-text-tertiary italic">
                  Older version snapshot — per-version GET ships in Phase 2.
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function VersionsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-40 rounded" />
      <Skeleton className="h-6 w-72 rounded" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}
