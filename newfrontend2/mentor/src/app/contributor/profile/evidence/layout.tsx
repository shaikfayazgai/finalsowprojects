"use client";

/**
 * Evidence page layout — editorial header (wayfinding via shell topbar).
 */

export default function EvidenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Evidence &amp; portfolio
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Portfolio links, certificates, and files linked to your profile. Reviewers use this
          material when assessing skill claims on assigned work.
        </p>
      </header>

      {children}
    </div>
  );
}
