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
      <header className="border-b border-stroke-subtle pb-5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
          Enterprise · Acceptance
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Acceptance
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary">
          Mentor-approved deliverables awaiting your final business sign-off — accept to release payout.
        </p>
      </header>
      {children}
    </div>
  );
}
