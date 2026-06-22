"use client";

/**
 * Earnings overview layout — editorial header (matches Completed / Submissions).
 */

export default function ContributorEarningsOverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Earnings
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Milestone payouts from accepted work. Withdrawable balance reflects enterprise-released
          funds — not hours logged in the portal.
        </p>
      </header>
      {children}
    </div>
  );
}
