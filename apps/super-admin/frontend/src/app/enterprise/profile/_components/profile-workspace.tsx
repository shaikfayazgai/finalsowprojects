"use client";

/**
 * Enterprise profile — personal identity, account security, preferences.
 */

import { AccountPasswordSection } from "@/components/enterprise/account-security/account-password-section";
import { useSession } from "next-auth/react";
import { useHydrated } from "@/lib/utils/use-hydrated";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSessions } from "@/lib/hooks/use-auth";
import { useEnterpriseTenantRoles } from "@/lib/hooks/use-enterprise-tenant-roles";
import {
  computeProfileSummary,
  resolveProfileMember,
} from "@/lib/settings/settings-mock";
import { AccountMfaSection } from "@/components/enterprise/account-security/account-mfa-section";
import { AccountSessionsSection } from "@/components/enterprise/account-security/account-sessions-section";
import { ProfileIdentitySection } from "./profile-identity-section";
import { ProfilePreferencesSection } from "./profile-preferences-section";
import { cn } from "@/lib/utils/cn";

function avatarInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function ProfileWorkspace() {
  const hydrated = useHydrated();
  const { data: session } = useSession();
  const user = session?.user;
  const isMfaEnabled = useAuthStore((s) => s.isMfaEnabled);
  const { data: sessions } = useSessions();
  const { sectionAccess } = useEnterpriseTenantRoles();

  const sessionCount = sessions?.length ?? 0;
  const member = resolveProfileMember(user?.email);
  const tenantAccess = sectionAccess("tenant");

  const summary = computeProfileSummary({
    name: user?.name,
    email: user?.email,
    sessionRole: user?.role,
    mfaEnabled: isMfaEnabled,
    sessionCount,
  });

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Profile
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          {hydrated ? summary.displayName : "Your profile"}
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Your identity, sign-in security, and personal preferences in this workspace.
        </p>
      </header>

      <OverviewCard
        hydrated={hydrated}
        initials={avatarInitials(summary.displayName)}
        summary={summary}
      />

      <div className="space-y-5">
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          {hydrated ? (
            <ProfileIdentitySection
              name={summary.displayName}
              email={summary.email}
              tenantName={summary.tenantName}
              roles={summary.roles}
              memberStatus={summary.memberStatus}
              member={member}
              tenantSettingsAccess={tenantAccess}
            />
          ) : (
            <SectionPlaceholder label="Loading identity…" />
          )}
        </section>

        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          {hydrated ? <AccountMfaSection /> : <SectionPlaceholder label="Loading MFA…" />}
        </section>

        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          {hydrated ? <AccountSessionsSection /> : <SectionPlaceholder label="Loading sessions…" />}
        </section>

        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          {hydrated ? (
            <AccountPasswordSection description="Update the password you use to sign in." />
          ) : (
            <SectionPlaceholder label="Loading password…" />
          )}
        </section>

        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          {hydrated ? <ProfilePreferencesSection /> : <SectionPlaceholder label="Loading preferences…" />}
        </section>
      </div>
    </div>
  );
}

function OverviewCard({
  hydrated,
  initials,
  summary,
}: {
  hydrated: boolean;
  initials: string;
  summary: ReturnType<typeof computeProfileSummary>;
}) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-stroke-subtle">
        <div className="flex items-start gap-3 px-5 py-4 min-w-0 flex-1">
          <span
            aria-hidden
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke-subtle bg-brand text-on-brand font-body text-[13px] font-semibold shrink-0"
          >
            {hydrated ? initials : "—"}
          </span>
          <div className="min-w-0">
            <p className="font-body text-[15px] font-semibold text-foreground truncate">
              {hydrated ? summary.displayName : "—"}
            </p>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary truncate">
              {hydrated ? summary.email : "—"}
            </p>
            <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
              {hydrated ? summary.tenantName : "—"}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 sm:w-[300px] shrink-0 divide-x divide-stroke-subtle">
          <Stat
            label="Roles"
            value={hydrated ? String(summary.roles.length || "—") : "—"}
            highlight={summary.roles.length > 1}
          />
          <Stat
            label="MFA"
            value={hydrated ? (summary.mfaEnabled ? "On" : "Off") : "—"}
            highlight={summary.mfaEnabled}
          />
          <Stat label="Sessions" value={hydrated ? String(summary.sessionCount) : "—"} />
        </dl>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-3 py-3 text-center">
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
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

function SectionPlaceholder({ label }: { label: string }) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="font-body text-[12.5px] text-text-tertiary">{label}</p>
    </div>
  );
}
