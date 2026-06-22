"use client";

/**
 * SOW intake layout — focused-flow shell with breadcrumb + cancel.
 *
 * Matches the editorial pass: 22px h1, hairline border separator,
 * cobalt link styling.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ghostBtnClass } from "@/app/admin/_shell/aurora-ui";

export default function SowIntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/enterprise/sow"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-text-secondary hover:text-foreground transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span>Statements of Work</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">New SOW</span>
      </nav>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap border-b border-white/55 pb-5">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
            Enterprise · Origination
          </p>
          <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Start a new SOW
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            Originate a Statement of Work — upload an existing document, author
            from scratch, or start from a configured template.
          </p>
        </div>
        <Link
          href="/enterprise/sow"
          aria-label="Cancel and return to SOW workspace"
          className={cn(ghostBtnClass, "h-8 px-3")}
        >
          <X className="h-3 w-3" strokeWidth={2} aria-hidden />
          Cancel
        </Link>
      </header>
      {children}
    </div>
  );
}
