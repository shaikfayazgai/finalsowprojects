"use client";

/**
 * Completed list layout — editorial header (matches Submissions / Revisions).
 */

export default function ContributorCompletedListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Completed work
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Tasks your mentor accepted. Payout eligibility and credentials are tied to each
          acceptance — amounts reflect agreed scope, not hours logged in the portal.
        </p>
      </header>
      {children}
    </div>
  );
}
