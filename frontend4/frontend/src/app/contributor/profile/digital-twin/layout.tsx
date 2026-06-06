"use client";

/**
 * Digital twin layout — editorial header (wayfinding via shell topbar).
 */

export default function DigitalTwinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Digital twin
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          A summary of your delivery patterns and activity — used to match you to work. Numbers
          here are observations from accepted work, not targets or peer comparisons.
        </p>
      </header>

      {children}
    </div>
  );
}
