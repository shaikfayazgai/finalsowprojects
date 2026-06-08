"use client";

/**
 * Workspace security — tenant-wide policies (not personal MFA/sessions).
 */

import Link from "next/link";
import { Shield } from "lucide-react";
import { useHydrated } from "@/lib/utils/use-hydrated";
import { SecurityWorkspacePolicySection } from "./security-workspace-policy-section";
import { cn } from "@/lib/utils/cn";

export function SecurityWorkspace() {
  const hydrated = useHydrated();

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Settings · Workspace security
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Workspace security
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Tenant-wide session timeout, IP allowlist, and audit signing keys. For your personal MFA
          and sessions, use Profile.
        </p>
        <RecordLinks />
      </header>

      <OverviewCard />

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        {hydrated ? (
          <SecurityWorkspacePolicySection />
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="font-body text-[12.5px] text-text-tertiary">Loading policies…</p>
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewCard() {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke-subtle bg-surface text-text-secondary shrink-0">
          <Shield className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <p className="font-body text-[15px] font-semibold text-foreground">Org security posture</p>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Applies to all members · requires admin or IT role to change
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-3 max-w-sm">
            <Stat label="Timeout" value="30d" />
            <Stat label="IP allowlist" value="Off" />
            <Stat label="Audit keys" value="1" />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className="mt-0.5 font-body text-[16px] font-semibold text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/profile"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Your profile (MFA & sessions)
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/settings/integrations/sso"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        SSO configuration
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/settings/policies"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Policies
      </Link>
    </p>
  );
}
