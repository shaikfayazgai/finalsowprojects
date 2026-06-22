"use client";

/**
 * Help list layout — editorial header (matches Credentials / Earnings).
 */

export default function ContributorSupportListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Help & safety
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Answers to common questions, support tickets, and confidential channels for safety
          concerns or process grievances.
        </p>
      </header>
      {children}
    </div>
  );
}
