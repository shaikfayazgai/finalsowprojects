"use client";

/**
 * Safety report layout — editorial header (wayfinding via shell topbar).
 */

export default function SafetyReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Report a safety concern
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Confidential channel for harassment, discrimination, or unsafe working conditions. Only
          the safety team sees your report — not your mentor or task reviewers.
        </p>
      </header>

      {children}
    </div>
  );
}
