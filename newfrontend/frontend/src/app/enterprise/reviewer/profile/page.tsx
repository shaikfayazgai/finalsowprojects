"use client";

/**
 * QA reviewer profile — identity header card + security sections.
 *
 * USE-CASE: Enterprise reviewer needs to view their reviewer identity, manage
 * their sign-in security (MFA, password), and check active sessions.
 *
 * HEURISTIC EVAL:
 * H1 (Visibility): GLASS_CARD identity card with border-white/55 and
 *   divide-white/60 makes the grid invisible on non-glass backgrounds.
 * H6 (Recognition): Two-column dl grid for role/workspace/joined/sessions
 *   lacked visual container — bare labels on a glass card feel unanchored.
 * H7 (Flexibility): Security sections were glass-wrapped but inner content
 *   (AccountPasswordSection etc.) targets a solid surface — double wrapping.
 * H8 (Minimalist): backdrop-blur and GLASS_SHADOW on nested sections added
 *   redundant depth.
 *
 * LAYOUT: DASH_CARD identity header (gradient avatar + chips) + DASH_CARD
 * record rows + DASH_CARD security sections. Matches enterprise profile pattern.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { useHydrated } from "@/lib/utils/use-hydrated";
import { useSessions } from "@/lib/hooks/use-auth";
import { AccountMfaSection } from "@/components/enterprise/account-security/account-mfa-section";
import { AccountPasswordSection } from "@/components/enterprise/account-security/account-password-section";
import { AccountSessionsSection } from "@/components/enterprise/account-security/account-sessions-section";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip } from "@/app/admin/_shell/aurora-ui";

function avatarInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

interface MeResponse {
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt?: string | null;
  tenant?: { id?: string | null } | null;
}

export default function ReviewerProfilePage() {
  const hydrated = useHydrated();
  const { data: session } = useSession();
  const { data: sessions } = useSessions();
  const [me, setMe] = React.useState<MeResponse | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetch("/api/me", { cache: "no-store", signal: c.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setMe(j))
      .catch(() => {});
    return () => c.abort();
  }, []);

  const displayName =
    session?.user?.name ??
    ([me?.firstName, me?.lastName].filter(Boolean).join(" ").trim() || me?.email || "Reviewer");
  const email = session?.user?.email ?? me?.email ?? "";
  const sessionCount = sessions?.length ?? 0;
  const tenantId = me?.tenant?.id ?? null;
  const workspace = tenantId ? `Glimmora HQ · ${tenantId}` : "Glimmora HQ";
  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "—";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Link
        href="/enterprise/reviewer"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Back to QA review
      </Link>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Reviewer · Profile
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          {hydrated ? displayName : "Your profile"}
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Your reviewer identity, sign-in security, and active sessions.
        </p>
      </header>

      {/* Identity header card */}
      <div className={cn(DASH_CARD, "p-5")}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span
              aria-hidden
              className="inline-flex h-14 w-14 items-center justify-center rounded-xl text-white font-display text-[16px] font-bold shrink-0"
              style={GLASS_GRADIENT}
            >
              {avatarInitials(displayName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-[17px] font-bold text-foreground tracking-[-0.015em] truncate">
                  {displayName}
                </p>
                <Chip tone="info">Reviewer</Chip>
              </div>
              <p className="mt-0.5 font-body text-[12.5px] text-text-secondary font-mono truncate">
                {email}
              </p>
              <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
                Enterprise Reviewer
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <dl className="flex items-center gap-6 shrink-0 border-t sm:border-t-0 sm:border-l border-stroke-subtle pt-4 sm:pt-0 sm:pl-6">
            <QuickStat label="Sessions" value={hydrated ? String(sessionCount || "—") : "—"} />
            <QuickStat label="Member since" value={hydrated ? memberSince : "—"} />
          </dl>
        </div>
      </div>

      {/* Identity record rows */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-3.5 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-semibold text-foreground tracking-[-0.01em]">
            Identity
          </h2>
        </div>
        <dl className="divide-y divide-stroke-subtle">
          <IdentityRow label="Role" value="Enterprise Reviewer" />
          <IdentityRow label="Workspace" value={hydrated ? workspace : "—"} />
          <IdentityRow label="Member since" value={hydrated ? memberSince : "—"} />
          <IdentityRow
            label="Active sessions"
            value={hydrated ? String(sessionCount || "—") : "—"}
          />
        </dl>
      </div>

      {/* Security sections */}
      <div className="space-y-5">
        <section className={cn(DASH_CARD, "overflow-hidden")}>
          {hydrated ? (
            <AccountPasswordSection />
          ) : (
            <div className="px-5 py-8 font-body text-[13px] text-text-tertiary">Loading password…</div>
          )}
        </section>

        <section className={cn(DASH_CARD, "overflow-hidden")}>
          {hydrated ? (
            <AccountMfaSection />
          ) : (
            <div className="px-5 py-8 font-body text-[13px] text-text-tertiary">Loading security…</div>
          )}
        </section>

        <section className={cn(DASH_CARD, "overflow-hidden")}>
          {hydrated ? (
            <AccountSessionsSection />
          ) : (
            <div className="px-5 py-8 font-body text-[13px] text-text-tertiary">Loading sessions…</div>
          )}
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

function IdentityRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 px-5 sm:px-6 py-3 min-h-[52px]">
      <dt className="font-body text-[11.5px] font-semibold text-text-secondary">{label}</dt>
      <dd className="font-body text-[13px] text-foreground sm:text-right tabular-nums">
        {value}
      </dd>
    </div>
  );
}
