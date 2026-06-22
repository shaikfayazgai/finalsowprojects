"use client";

/**
 * Open opportunities — published, priced decomposition tasks a contributor can
 * show interest in. Promoted to its own "My work" section (peer of Assigned /
 * Submissions / Revisions / Completed). Skill-matched tasks are highlighted and
 * sorted first; the price (net of GST) is shown before expressing interest.
 */

import { OpportunitiesSection } from "../tasks/components/opportunities-section";

export default function ContributorOpportunitiesPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Open opportunities
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-xl">
          Published tasks you can pick up — the price is shown up front. Skill-matched ones are
          highlighted and listed first. Show interest, and the enterprise selects one.
        </p>
      </header>
      <div className="space-y-4 pb-12">
        <OpportunitiesSection standalone />
      </div>
    </div>
  );
}
