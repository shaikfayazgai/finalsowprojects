"use client";

import Link from "next/link";
import { Award, Share2, ShieldCheck } from "lucide-react";
import type { MockCredential } from "@/mocks/contributor";
import { cn } from "@/lib/utils/cn";
import { fmtIssuedDate, levelLabel } from "../lib/credentials-ui-utils";

interface CredentialCardProps {
  credential: MockCredential;
  onShare: () => void;
}

export function CredentialCard({ credential: c, onShare }: CredentialCardProps) {
  const href = `/contributor/credentials/${c.id}`;

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-stroke-subtle bg-surface overflow-hidden",
        "shadow-xs transition-shadow duration-fast hover:shadow-sm",
      )}
    >
      {/* Certificate header strip */}
      <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-brand-subtle/80 via-surface to-bg-subtle border-b border-stroke-subtle">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-brand-subtle-text">
            <ShieldCheck className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
            Verified
          </span>
          <span className="font-mono text-[10px] font-semibold tabular-nums text-text-tertiary">
            {c.shareId}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand border border-brand/15"
            aria-hidden
          >
            <Award className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
              {c.skill}
            </p>
            <p className="font-body text-[12px] font-semibold text-foreground">
              {c.level}
              <span className="font-normal text-text-tertiary"> · {levelLabel(c.level)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 py-3.5">
        <h3 className="font-body text-[14px] font-semibold text-foreground tracking-[-0.01em] leading-snug line-clamp-2">
          <Link
            href={href}
            className="hover:text-brand transition-colors duration-fast focus-visible:outline-none focus-visible:underline"
          >
            {c.taskTitle}
          </Link>
        </h3>
        <p className="mt-1.5 font-body text-[12px] text-text-secondary leading-relaxed line-clamp-2 flex-1">
          {c.description}
        </p>
        <dl className="mt-3 space-y-1 pt-3 border-t border-stroke-subtle">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="font-body text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary shrink-0">
              Project
            </dt>
            <dd className="font-body text-[11.5px] text-foreground text-right truncate">
              {c.project}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="font-body text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary shrink-0">
              Reviewer
            </dt>
            <dd className="font-body text-[11.5px] text-foreground text-right truncate">
              {c.verifierName}
              <span className="text-text-tertiary"> · {c.verifierOrg}</span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="font-body text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary shrink-0">
              Issued
            </dt>
            <dd className="font-body text-[11.5px] text-foreground tabular-nums">
              {fmtIssuedDate(c.issuedAt)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Footer */}
      <footer className="flex items-center gap-2 px-3 py-2.5 border-t border-stroke-subtle bg-bg-subtle/80">
        <Link
          href={href}
          className={cn(
            "flex-1 inline-flex items-center justify-center h-8 rounded-md",
            "font-body text-[12px] font-semibold text-text-link",
            "hover:bg-surface transition-colors duration-fast",
          )}
        >
          View credential
        </Link>
        <button
          type="button"
          onClick={onShare}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md",
            "bg-surface border border-stroke",
            "font-body text-[12px] font-semibold text-foreground",
            "hover:bg-surface-hover transition-colors duration-fast",
          )}
        >
          <Share2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Share
        </button>
      </footer>
    </article>
  );
}
