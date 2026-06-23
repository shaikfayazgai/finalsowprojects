"use client";

/**
 * Gate that blocks the public task marketplace until the contributor's profile
 * reaches 100 %. While incomplete it renders a completion prompt (the circular
 * ring + the remaining sections + a CTA); once complete it renders its children
 * (the real Opportunities list). A freelancer is only eligible to view / pick up
 * public tasks with a fully completed profile.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Lock } from "lucide-react";
import { useProfileCompletion, SECTION_LABELS } from "@/lib/hooks/use-profile-completion";
import { ProfileCompletionRing } from "./profile-completion-ring";

export function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useProfileCompletion();

  if (isLoading || !data) {
    return <div className="h-44 rounded-xl border border-stroke-subtle bg-surface animate-pulse" />;
  }

  // 100 % → eligible: show the real marketplace.
  if (data.complete) return <>{children}</>;

  const allSections = ["expertise", "projects", "experience", "education"] as const;

  return (
    <div className="rounded-xl border border-stroke bg-surface p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <ProfileCompletionRing value={data.completeness} size={132} stroke={10} />

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-stroke-subtle bg-surface-hover px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            <Lock className="h-3 w-3" strokeWidth={2.2} aria-hidden />
            Profile {data.completeness}% complete
          </span>

          <h2 className="mt-3 font-body text-[18px] font-semibold text-foreground tracking-[-0.01em]">
            Complete your profile to unlock tasks
          </h2>
          <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-md">
            Public opportunities open up only when your profile is 100% complete. Finish the
            remaining sections so the platform can match you to the right work.
          </p>

          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-w-md mx-auto sm:mx-0">
            {allSections.map((key) => {
              const done = data.sections[key] === true;
              return (
                <li key={key} className="flex items-center gap-2 font-body text-[12.5px]">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} style={{ color: "#0F9D6B" }} aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
                  )}
                  <span className={done ? "text-text-tertiary line-through" : "text-foreground"}>
                    {SECTION_LABELS[key] ?? key}
                  </span>
                </li>
              );
            })}
          </ul>

          <Link
            href="/contributor/profile/complete"
            className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-foreground text-surface font-body text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            Complete profile
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
