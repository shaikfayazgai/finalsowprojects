"use client";

/**
 * Decomposition workspace layout — editorial header.
 *
 * Matches the SOW/dashboard pass: 22px h1, hairline border separator.
 */

import * as React from "react";

export default function DecompositionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
          Enterprise · Decomposition
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Decomposition
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
          Approved SOWs ready to be broken into work plans.
        </p>
      </header>
      {children}
    </div>
  );
}
