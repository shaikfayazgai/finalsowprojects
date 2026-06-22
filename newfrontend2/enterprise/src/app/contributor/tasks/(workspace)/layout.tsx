"use client";

/**
 * Contributor · My Work workspace layout — editorial header (enterprise pattern).
 */

export default function ContributorTasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Assigned tasks
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-xl">
          Work you need to act on — accept, draft, or unblock. Submit-by dates reflect the agreed
          estimate; payout on acceptance is fixed scope, not a timesheet.
        </p>
      </header>
      {children}
    </div>
  );
}
