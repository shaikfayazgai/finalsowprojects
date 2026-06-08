"use client";

/**
 * Add payout method layout — sub-page header (parent list header not inherited).
 */

export default function AddPayoutMethodLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Add payout method
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Choose how you want to receive withdrawals. Bank accounts in India are verified with a
          ₹1 penny drop that is reversed automatically.
        </p>
      </header>

      {children}
    </div>
  );
}
