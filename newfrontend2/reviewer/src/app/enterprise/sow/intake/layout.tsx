"use client";

/**
 * SOW intake layout — focused-flow shell.
 *
 * Single back link only (the topbar already renders the breadcrumb trail);
 * cancel lives in each step's footer.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SowIntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <Link
        href="/enterprise/sow"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        Back to workspace
      </Link>

      <header className="border-b border-stroke-subtle pb-5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
          Enterprise · Origination
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Start a new SOW
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Originate a Statement of Work — upload an existing document, author from scratch, or start from a configured template.
        </p>
      </header>
      {children}
    </div>
  );
}
