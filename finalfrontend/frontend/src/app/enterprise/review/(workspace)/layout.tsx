"use client";

/**
 * Acceptance workspace layout — editorial header.
 */

import * as React from "react";

export default function AcceptanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="border-b border-white/55 pb-5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
          Enterprise · Acceptance
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Acceptance
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
          Mentor-approved deliverables awaiting your final business sign-off.
        </p>
      </header>
      {children}
    </div>
  );
}
