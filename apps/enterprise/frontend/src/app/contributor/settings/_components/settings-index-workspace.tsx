"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import { PERSONAS } from "@/mocks/contributor/personas";
import { CONTRIBUTOR_SETTINGS_SECTIONS } from "../lib/settings-sections";
import { cn } from "@/lib/utils/cn";

export function SettingsIndexWorkspace() {
  const { persona } = useActivePersona();
  const personaLabel = PERSONAS.find((p) => p.key === persona)?.shortLabel ?? persona;

  return (
    <div className="space-y-5 pb-12">
      <header>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Settings
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Account sign-in, notifications, privacy, and regional preferences.
          Identity, skills, evidence, and your digital twin live under{" "}
          <Link href="/contributor/profile" className="text-text-link hover:underline font-medium">
            Profile
          </Link>
          .
        </p>
      </header>

      <OverviewCard personaLabel={personaLabel} sectionCount={CONTRIBUTOR_SETTINGS_SECTIONS.length} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CONTRIBUTOR_SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={section.href}
              className={cn(
                "group rounded-xl border border-stroke-subtle bg-surface p-4",
                "hover:border-stroke hover:bg-bg-subtle/40 transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stroke-subtle text-text-secondary shrink-0"
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <h2 className="font-body text-[14px] font-semibold text-foreground truncate">
                    {section.label}
                  </h2>
                </div>
                <ArrowRight
                  className="h-3.5 w-3.5 text-text-tertiary shrink-0 group-hover:text-foreground transition-colors duration-fast"
                  strokeWidth={2}
                  aria-hidden
                />
              </div>
              <p className="font-body text-[12.5px] text-text-secondary">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function OverviewCard({
  personaLabel,
  sectionCount,
}: {
  personaLabel: string;
  sectionCount: number;
}) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-stroke-subtle">
        <div className="flex items-start gap-3 px-5 py-4 min-w-0 flex-1">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke-subtle bg-surface text-text-secondary shrink-0 font-body text-[13px] font-semibold">
            {personaLabel.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="font-body text-[15px] font-semibold text-foreground">Your preferences</p>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Signed in as <span className="text-foreground font-medium">{personaLabel}</span> persona
              · changes apply to this account only
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 sm:w-[200px] shrink-0 divide-x divide-stroke-subtle">
          <Stat label="Sections" value={String(sectionCount)} />
          <Stat label="MFA" value="On" highlight />
        </dl>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-3 py-3 text-center">
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[18px] font-semibold tabular-nums",
          highlight ? "text-brand" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

