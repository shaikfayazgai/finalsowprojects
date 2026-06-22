"use client";

import { Shield } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  SettingsFormPanel,
  SettingsSubpageShell,
} from "@/app/mentor/settings/_components/settings-subpage-shell";

export default function MentorSettingsPrivacyPage() {
  return (
    <SettingsSubpageShell
      title="Privacy"
      subtitle="Mentor program consents and data handling."
    >
      <SettingsFormPanel>
        <div className="p-5 space-y-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stroke-subtle bg-bg-subtle/60 text-text-secondary shrink-0"
            >
              <Shield className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="font-body text-[14px] font-semibold text-foreground">Program consents</p>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">
                You accepted the mentor code of conduct and confidentiality terms during onboarding.
                Contact your program manager to update legal consents.
              </p>
            </div>
          </div>
          <p className="font-body text-[12px] text-text-tertiary leading-relaxed">
            Data export and account deletion for mentors are handled by Glimmora platform operations.
            Email{" "}
            <a href="mailto:privacy@glimmora.team" className="text-brand font-semibold hover:underline">
              privacy@glimmora.team
            </a>
            .
          </p>
        </div>
      </SettingsFormPanel>

      <DashboardSection
        title="Your data"
        description="What we store and how to request changes"
        bare
      >
        <ul className="space-y-2 font-body text-[12.5px] text-text-secondary">
          <li className="rounded-xl border border-stroke-subtle bg-surface px-4 py-3">
            Review decisions and mentorship session notes are retained per platform policy.
          </li>
          <li className="rounded-xl border border-stroke-subtle bg-surface px-4 py-3">
            Profile and availability settings can be updated anytime from this settings area.
          </li>
        </ul>
      </DashboardSection>
    </SettingsSubpageShell>
  );
}
