"use client";

/**
 * New ticket layout — editorial header (wayfinding via shell topbar).
 */

export default function NewTicketLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Open a ticket
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          General support for tasks, payouts, credentials, or your account. We respond within 24
          hours on business days.
        </p>
      </header>

      {children}
    </div>
  );
}
