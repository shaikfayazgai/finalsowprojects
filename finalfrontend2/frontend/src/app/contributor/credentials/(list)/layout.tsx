"use client";

/**
 * Credentials list layout — editorial header (matches Earnings / Completed).
 */

export default function ContributorCredentialsListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Credentials
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Verifiable records of accepted deliveries. Share a public link with anyone — verification
          works without a Glimmora account.
        </p>
      </header>
      {children}
    </div>
  );
}
