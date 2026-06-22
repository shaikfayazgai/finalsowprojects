"use client";

/**
 * Grievance layout — editorial header (wayfinding via shell topbar).
 */

export default function GrievanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Open a grievance
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          For unfair rejection, payment dispute, or other process issues outside a single task.
          Reviewed by an independent panel outside your mentor chain.
        </p>
      </header>

      {children}
    </div>
  );
}
