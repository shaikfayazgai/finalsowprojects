"use client";

/**
 * Onboarding · Availability — Meridian redesign.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton } from "@/components/auth/auth-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { patchOnboardingDraft, readOnboardingDraft } from "@/lib/contributor/onboarding-draft";
import { nextStepPath } from "@/lib/contributor/onboarding-steps";
import { useOnboardingTrack } from "@/lib/hooks/use-onboarding-track";
import { cn } from "@/lib/utils/cn";

export default function AvailabilityPage() {
  return (
    <React.Suspense fallback={null}>
      <AvailabilityInner />
    </React.Suspense>
  );
}

function AvailabilityInner() {
  const router = useRouter();
  const { track, steps } = useOnboardingTrack();
  const saved = React.useMemo(() => readOnboardingDraft(), []);

  const [hours, setHours] = React.useState(
    saved.availability ? Number(saved.availability) : 10,
  );
  const [tz, setTz] = React.useState(saved.timezone ?? "Asia/Kolkata");
  const [preferred, setPreferred] = React.useState<"async" | "live" | "either">(
    saved.workStyle ?? "async",
  );

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Onboarding"
        title="When are you available?"
        subtitle="Matching uses this to size your queue. You can change it any time from settings."
      >
        <OnboardingProgress steps={steps} current="/onboarding/availability" />

        <div className="rounded-lg border border-stroke bg-surface shadow-xs p-4 space-y-4">
          <div className="flex items-center gap-2 text-brand-emphasis">
            <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">Weekly availability</h2>
          </div>
          <div>
            <FieldLabel>Hours per week</FieldLabel>
            <div className="flex items-center gap-3">
              <input type="range" min={2} max={40} step={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="flex-1 h-1.5 rounded-full bg-bg-subtle accent-brand" aria-label="Weekly hours" />
              <span className="font-display text-[18px] font-semibold tabular-nums text-foreground w-12 text-right">{hours}h</span>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="tz">Timezone</FieldLabel>
            <select id="tz" value={tz} onChange={(e) => setTz(e.target.value)} className={inputCls}>
              <option>Asia/Kolkata</option><option>Asia/Singapore</option><option>Europe/London</option><option>Europe/Berlin</option><option>America/New_York</option><option>America/Los_Angeles</option><option>Australia/Sydney</option>
            </select>
          </div>
          <div>
            <FieldLabel>Work style</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {(["async", "live", "either"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setPreferred(m)} aria-pressed={preferred === m}
                  className={cn("h-9 rounded-md border font-body text-[12.5px] transition-colors duration-fast",
                    preferred === m ? "bg-brand text-on-brand border-brand" : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle")}>
                  {m === "async" ? "Async" : m === "live" ? "Live calls" : "Either"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PrimaryButton
          onClick={() => {
            patchOnboardingDraft({
              availability: String(hours),
              timezone: tz,
              workStyle: preferred,
            });
            const dest = nextStepPath(track, "/onboarding/availability");
            if (dest) router.push(dest);
          }}
        >
          Continue →
        </PrimaryButton>
      </AuthCard>
    </AuthShell>
  );
}
