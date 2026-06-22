"use client";

/**
 * SOW workspace layout — editorial header.
 * Topbar carries "SOW Workspace" + New SOW; page title lives here.
 */

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { primaryBtnClass, primaryStyle } from "@/app/admin/_shell/aurora-ui";

export default function SowWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-start justify-between gap-4 border-b border-stroke-subtle pb-5">
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
            Enterprise · SOW
          </p>
          <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
            Statements of Work
          </h1>
          <p className="mt-2 font-body text-[12.5px] text-text-secondary max-w-xl">
            Originate, approve, and hand off to decomposition.
          </p>
        </div>
        <Link href="/enterprise/sow/intake" className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Create SOW
        </Link>
      </header>
      {children}
    </div>
  );
}
