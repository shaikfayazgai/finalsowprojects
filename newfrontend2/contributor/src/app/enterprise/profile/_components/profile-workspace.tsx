"use client";

/**
 * Enterprise profile — personal identity, account security, preferences.
 *
 * USE-CASE: Enterprise operator needs to review their identity, manage MFA,
 * audit active sessions, and update preferences.
 *
 * HEURISTIC EVAL:
 * H1 (Visibility): GLASS_CARD overview lacked clear stat hierarchy — dividers
 *   were white/60 on white background, invisible on solid surfaces.
 * H6 (Recognition): Identity field rows used border-white/55 which reads as a
 *   flat undivided list on a non-glass surface.
 * H7 (Flexibility): Three-stat strip is a detail panel pattern, not a KPI
 *   pattern — stats aren't actionable here. An identity header card with
 *   name/email/tenant reads faster.
 * H8 (Minimalist): divide-white/60, bg-white/40, shadow backdrop-blur all
 *   carry glass weight on non-glass surfaces.
 *
 * LAYOUT: DASH_CARD identity header (avatar chip + name + email + tenant +
 * status chip) + DASH_CARD sections with plain headings.
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
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip } from "@/app/admin/_shell/aurora-ui";

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
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          {hydrated ? summary.displayName : "Your profile"}
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Your identity, sign-in security, and personal preferences in this workspace.
        </p>
      </header>

      {/* Identity header card */}
      <div className={cn(DASH_CARD, "p-5")}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar + info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span
              aria-hidden
              className="inline-flex h-14 w-14 items-center justify-center rounded-xl text-white font-display text-[16px] font-bold shrink-0"
              style={GLASS_GRADIENT}
            >
              {hydrated ? avatarInitials(summary.displayName) : "—"}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-[17px] font-bold text-foreground tracking-[-0.015em] truncate">
                  {hydrated ? summary.displayName : "—"}
                </p>
                {hydrated && summary.memberStatus && (
                  <Chip
                    tone={
                      summary.memberStatus === "active"
                        ? "success"
                        : summary.memberStatus === "suspended"
                          ? "error"
                          : "neutral"
                    }
                  >
                    {summary.memberStatus.charAt(0).toUpperCase() + summary.memberStatus.slice(1)}
                  </Chip>
                )}
              </div>
              <p className="mt-0.5 font-body text-[12.5px] text-text-secondary font-mono truncate">
                {hydrated ? summary.email : "—"}
              </p>
              <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
                {hydrated ? summary.tenantName : "—"}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <dl className="flex items-center gap-6 shrink-0 border-t sm:border-t-0 sm:border-l border-stroke-subtle pt-4 sm:pt-0 sm:pl-6">
            <QuickStat label="MFA" value={hydrated ? (summary.mfaEnabled ? "On" : "Off") : "—"} />
            <QuickStat label="Sessions" value={hydrated ? String(summary.sessionCount) : "—"} />
            <QuickStat label="Roles" value={hydrated ? String(summary.roles.length || "—") : "—"} />
          </dl>
        </div>
      </div>

      <div className="space-y-5">
        <section className={cn(DASH_CARD, "overflow-hidden")}>
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

        <section className={cn(DASH_CARD, "overflow-hidden")}>
          {hydrated ? <AccountMfaSection /> : <SectionPlaceholder label="Loading MFA…" />}
        </section>

        <section className={cn(DASH_CARD, "overflow-hidden")}>
          {hydrated ? <AccountSessionsSection /> : <SectionPlaceholder label="Loading sessions…" />}
        </section>

        <section className={cn(DASH_CARD, "overflow-hidden")}>
          {hydrated ? (
            <AccountPasswordSection description="Update the password you use to sign in." />
          ) : (
            <SectionPlaceholder label="Loading password…" />
          )}
        </section>

        <section className={cn(DASH_CARD, "overflow-hidden")}>
          {hydrated ? <ProfilePreferencesSection /> : <SectionPlaceholder label="Loading preferences…" />}
        </section>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className="mt-1 font-display text-[17px] font-bold text-foreground tabular-nums leading-none">{value}</dd>
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
