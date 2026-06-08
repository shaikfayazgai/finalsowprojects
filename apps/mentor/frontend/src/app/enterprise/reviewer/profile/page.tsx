"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { useHydrated } from "@/lib/utils/use-hydrated";
import { useSessions } from "@/lib/hooks/use-auth";
import { MOCK_REVIEWER_PROFILE } from "@/mocks/reviewer";
import { AccountMfaSection } from "@/components/enterprise/account-security/account-mfa-section";
import { AccountPasswordSection } from "@/components/enterprise/account-security/account-password-section";
import { AccountSessionsSection } from "@/components/enterprise/account-security/account-sessions-section";

function avatarInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export default function ReviewerProfilePage() {
  const hydrated = useHydrated();
  const { data: session } = useSession();
  const { data: sessions } = useSessions();

  const displayName = session?.user?.name ?? MOCK_REVIEWER_PROFILE.name;
  const email = session?.user?.email ?? MOCK_REVIEWER_PROFILE.email;
  const sessionCount = sessions?.length ?? 0;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Link
        href="/enterprise/reviewer"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-medium text-text-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Back to QA review
      </Link>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Reviewer · Profile
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          {hydrated ? displayName : "Your profile"}
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Your reviewer identity, sign-in security, and active sessions.
        </p>
      </header>

      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4 border-b border-stroke-subtle">
          <span
            aria-hidden
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-inverse text-text-inverse font-body text-[14px] font-bold"
          >
            {avatarInitials(displayName)}
          </span>
          <div className="min-w-0">
            <p className="font-body text-[15px] font-semibold text-foreground truncate">
              {displayName}
            </p>
            <p className="font-body text-[12.5px] text-text-secondary truncate">{email}</p>
            <p className="font-body text-[11.5px] text-text-tertiary mt-0.5">
              {MOCK_REVIEWER_PROFILE.title}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 px-5 py-4">
          <div>
            <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Role
            </dt>
            <dd className="mt-1 font-body text-[13px] text-foreground">Enterprise Reviewer</dd>
          </div>
          <div>
            <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Workspace
            </dt>
            <dd className="mt-1 font-body text-[13px] text-foreground">Glimmora HQ · Acme Corp</dd>
          </div>
          <div>
            <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Member since
            </dt>
            <dd className="mt-1 font-body text-[13px] text-foreground">
              {new Date(MOCK_REVIEWER_PROFILE.joinedAt).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Active sessions
            </dt>
            <dd className="mt-1 font-body text-[13px] text-foreground tabular-nums">
              {sessionCount || "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-5">
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          {hydrated ? (
            <AccountPasswordSection />
          ) : (
            <div className="px-5 py-8 font-body text-[13px] text-text-tertiary">Loading password…</div>
          )}
        </section>

        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          {hydrated ? (
            <AccountMfaSection />
          ) : (
            <div className="px-5 py-8 font-body text-[13px] text-text-tertiary">Loading security…</div>
          )}
        </section>

        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
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
