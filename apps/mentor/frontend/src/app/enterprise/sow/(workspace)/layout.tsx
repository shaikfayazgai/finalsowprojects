"use client";

/**
 * SOW workspace layout — editorial header.
 * Topbar carries "SOW Workspace" + New SOW; page title lives here.
 */

import * as React from "react";

export default function SowWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
          Enterprise · SOW
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Statements of Work
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-xl">
          Originate, approve, and hand off to decomposition.
        </p>
      </header>
      {children}
    </div>
  );
}
