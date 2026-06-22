"use client";

/**
 * SOW workspace layout — editorial header.
 * Topbar carries "SOW Workspace" + New SOW; page title lives here.
 */

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AURORA_ACCENT } from "@/app/admin/_shell/aurora";

export default function SowWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-start justify-between gap-4 border-b border-white/55 pb-5">
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
            Enterprise · SOW
          </p>
          <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Statements of Work
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-xl">
            Originate, approve, and hand off to decomposition.
          </p>
        </div>
        <Link
          href="/enterprise/sow/intake"
          style={{ backgroundImage: AURORA_ACCENT, boxShadow: "0 14px 26px -10px rgba(108,76,230,0.6)" }}
          className="shrink-0 inline-flex h-10 items-center gap-1.5 px-4 rounded-2xl text-white font-body text-[13px] font-bold transition-transform duration-fast hover:scale-[1.02] active:scale-100"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Create SOW
        </Link>
      </header>
      {children}
    </div>
  );
}
