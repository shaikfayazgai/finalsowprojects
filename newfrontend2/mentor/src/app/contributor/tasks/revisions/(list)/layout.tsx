"use client";

/**
 * Revisions list layout — editorial header (matches Assigned / Submissions).
 */

export default function ContributorRevisionsListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Revisions
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Tasks your mentor sent back with required corrections. Address each item in the
          revision workroom, then resubmit when every correction is marked complete.
        </p>
      </header>
      {children}
    </div>
  );
}
