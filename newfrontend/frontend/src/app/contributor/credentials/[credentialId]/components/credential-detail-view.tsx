"use client";

/**
 * Credential detail — certificate workroom (matches Completed / revision detail).
 */

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  Check,
  Copy,
  ExternalLink,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { ShareCredentialModal } from "@/components/contributor/share-credential-modal";
import { useMyCredential } from "@/lib/hooks/use-contributor-payouts";
import type { MockCredential } from "@/mocks/contributor";
import { cn } from "@/lib/utils/cn";
import { CredentialDetailSkeleton } from "./detail-skeleton";
import {
  fmtIssuedDate,
  fmtIssuedDateTime,
  fmtRelative,
  levelLabel,
  publicCredentialUrl,
} from "../../lib/credentials-ui-utils";

interface CredentialDetailViewProps {
  credentialId: string;
}

export function CredentialDetailView({ credentialId }: CredentialDetailViewProps) {
  const searchParams = useSearchParams();
  const { data, isPending, isError, error } = useMyCredential(credentialId || undefined);
  const cred = data?.credential ?? null;

  const [shareOpen, setShareOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (searchParams.get("share") === "1" && cred) {
      setShareOpen(true);
    }
  }, [searchParams, cred]);

  const publicUrl = cred ? publicCredentialUrl(cred.shareId) : "";

  if (!credentialId || isPending) {
    return <CredentialDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!cred) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <div className="rounded-lg border border-stroke bg-surface px-4 py-8 text-center">
          <p className="font-body text-[13px] font-semibold text-foreground">Credential not found</p>
          <Link
            href="/contributor/credentials"
            className="mt-3 inline-flex h-8 items-center px-3 rounded-md bg-brand text-on-brand font-body text-[12px] font-semibold hover:bg-brand-hover"
          >
            Back to wallet
          </Link>
        </div>
      </div>
    );
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="pb-12 animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-5 min-w-0">
          <header className="border-b border-stroke-subtle pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
                  {cred.taskTitle}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-body text-[12.5px] text-text-secondary">
                  <StatusChip status="success" size="sm">
                    Verified
                  </StatusChip>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>{cred.skill}</span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>
                    {cred.level} · {levelLabel(cred.level)}
                  </span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>Issued {fmtRelative(cred.issuedAt)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 px-3.5 rounded-md shadow-xs shrink-0",
                  "bg-brand text-on-brand font-body text-[13px] font-semibold",
                  "hover:bg-brand-hover transition-colors duration-fast",
                )}
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Share
              </button>
            </div>
          </header>

          <CertificatePreview credential={cred} />

          <DashboardSection
            title="What this certifies"
            description="Scope and outcome recorded at issue time"
          >
            <p className="font-body text-[13px] text-foreground leading-relaxed">{cred.description}</p>
            <dl className="mt-4 pt-4 border-t border-stroke-subtle grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <DetailField label="Skill" value={cred.skill} />
              <DetailField label="Proficiency" value={`${cred.level} · ${levelLabel(cred.level)}`} />
              <DetailField label="Project" value={cred.project} />
              <DetailField label="Issued" value={fmtIssuedDateTime(cred.issuedAt)} />
              <DetailField label="Credential ID" value={cred.id} mono />
              <DetailField label="Share code" value={cred.shareId} mono />
            </dl>
          </DashboardSection>

          <DashboardSection title="Earned through" description="Accepted task linked to this credential">
            <Link
              href={`/contributor/tasks/completed/${cred.taskId}`}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border border-stroke-subtle px-4 py-3",
                "bg-bg-subtle/40 hover:bg-bg-subtle transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
              )}
            >
              <span className="min-w-0">
                <span className="block font-body text-[13px] font-semibold text-foreground truncate">
                  {cred.taskTitle}
                </span>
                <span className="mt-0.5 block font-body text-[11.5px] text-text-tertiary">
                  View accepted submission and evidence
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-text-link shrink-0" strokeWidth={2} aria-hidden />
            </Link>

            {cred.evidenceUrl ? (
              <a
                href={cred.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-3 flex items-center justify-between gap-3 rounded-lg border border-stroke-subtle px-4 py-3",
                  "hover:bg-bg-subtle transition-colors duration-fast",
                )}
              >
                <span className="font-body text-[12.5px] font-semibold text-text-link">
                  Open supporting evidence
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-text-link shrink-0" strokeWidth={2} aria-hidden />
              </a>
            ) : null}
          </DashboardSection>
        </div>

        <aside className="xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain space-y-4">
          <DashboardSection title="Public verification" description="Anyone can verify without logging in">
            <dl className="space-y-3">
              <RailItem label="Status">
                <StatusChip status="success" size="sm">
                  Issued & verifiable
                </StatusChip>
              </RailItem>
              <RailItem label="Share code">
                <span className="font-mono text-[12px] tabular-nums">{cred.shareId}</span>
              </RailItem>
              <RailItem label="Issued">{fmtIssuedDate(cred.issuedAt)}</RailItem>
            </dl>

            <div className="mt-4 pt-4 border-t border-stroke-subtle space-y-2">
              <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                Public link
              </label>
              <div className="flex flex-col gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  aria-label="Public credential URL"
                  className="w-full h-9 px-3 rounded-md bg-bg-subtle border border-stroke font-mono text-[11px] text-foreground"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onCopy()}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        Copy link
                      </>
                    )}
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 h-8 px-3 rounded-md font-body text-[12px] font-semibold text-text-link border border-stroke-subtle hover:bg-bg-subtle"
                  >
                    Preview
                    <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-md shadow-xs mt-1",
                  "bg-brand text-on-brand font-body text-[13px] font-semibold",
                  "hover:bg-brand-hover transition-colors duration-fast",
                )}
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Share credential
              </button>
            </div>
          </DashboardSection>

          <DashboardSection title="Verifier" description="Who attested this delivery">
            <dl className="space-y-3">
              <RailItem label="Reviewer">{cred.verifierName}</RailItem>
              <RailItem label="Organisation">{cred.verifierOrg}</RailItem>
            </dl>
            <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[11.5px] text-text-secondary leading-relaxed">
              Counter-signed by Glimmora at issue. The public verify page recomputes the signature
              on each visit.
            </p>
          </DashboardSection>
        </aside>
      </div>

      <ShareCredentialModal
        shareId={cred.shareId}
        title={cred.taskTitle}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}

function CertificatePreview({ credential: c }: { credential: MockCredential }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-stroke-subtle bg-surface overflow-hidden shadow-xs",
        "ring-1 ring-black/[0.02]",
      )}
      aria-label="Credential certificate preview"
    >
      <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-brand-subtle/90 via-surface to-bg-subtle border-b border-stroke-subtle">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.14em] text-brand-subtle-text">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
            Glimmora verified credential
          </span>
          <span className="font-mono text-[10.5px] font-semibold tabular-nums text-text-tertiary">
            {c.shareId}
          </span>
        </div>

        <div className="mt-5 flex items-start gap-4">
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand border border-brand/20"
            aria-hidden
          >
            <Award className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              {c.skill}
            </p>
            <p className="mt-0.5 font-display text-[20px] font-semibold text-foreground tracking-[-0.02em] leading-tight">
              {c.level}
              <span className="font-body text-[14px] font-normal text-text-secondary">
                {" "}
                · {levelLabel(c.level)}
              </span>
            </p>
            <p className="mt-2 font-body text-[13px] text-text-secondary leading-relaxed line-clamp-3">
              {c.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stroke-subtle bg-bg-subtle/50">
        {[
          { label: "Project", value: c.project },
          { label: "Reviewer", value: c.verifierName },
          { label: "Organisation", value: c.verifierOrg },
          { label: "Issued", value: fmtIssuedDate(c.issuedAt) },
        ].map((item) => (
          <div key={item.label} className="px-4 py-3 min-w-0">
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
              {item.label}
            </p>
            <p className="mt-0.5 font-body text-[12px] font-medium text-foreground truncate">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[12.5px] text-foreground",
          mono && "font-mono text-[11.5px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function RailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="font-body text-[12.5px] text-foreground text-right min-w-0">{children}</dd>
    </div>
  );
}
