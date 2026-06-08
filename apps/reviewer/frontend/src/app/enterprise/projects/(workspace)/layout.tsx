"use client";

/**
 * Projects workspace layout — editorial header.
 *
 * Spec §5.E.1 doesn't use a tab bar; each project's tabs live inside
 * the detail page.
 */

import * as React from "react";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
          Enterprise · Projects
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Projects
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
          Active delivery projects from decomposed and provisioned SOWs.
        </p>
      </header>
      {children}
    </div>
  );
}
