"use client";

/**
 * Platform Admin · Profile — spec doc 04 §5.P.1.
 */

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Smartphone, Monitor } from "lucide-react";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";

export default function AdminProfilePage() {
  return (
    <React.Suspense fallback={<div className="h-4 w-48 rounded bg-bg-subtle animate-pulse" />}>
      <ProfileInner />
    </React.Suspense>
  );
}

function ProfileInner() {
  const { role, profile } = useActiveAdmin();

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">Profile</h1>
      </header>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <div className="px-5 py-5 flex flex-wrap items-center gap-5">
          <div aria-hidden className="h-16 w-16 rounded-full bg-brand text-on-brand inline-flex items-center justify-center font-body text-[20px] font-semibold shrink-0">
            {profile.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-body text-[16px] font-semibold text-foreground">{profile.displayName}</h2>
            <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">{profile.title}</p>
            <p className="mt-1 font-mono text-[11.5px] text-text-tertiary">{profile.email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <header className="px-4 py-2.5 border-b border-stroke-subtle">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">Roles</h2>
        </header>
        <div className="px-4 py-3">
          <code className="inline-flex items-center font-mono text-[11.5px] text-text-secondary bg-bg-subtle rounded px-1.5 py-0.5">{role}</code>
          {role === "plat.admin" && <span className="ml-2 font-body text-[11px] text-text-tertiary">super-admin · full read/write</span>}
          {(role === "plat.admin" || role === "plat.compliance") && (
            <p className="mt-2 font-body text-[12px] text-text-secondary">
              <Link href="/admin/roles" className="font-semibold text-brand-emphasis hover:text-brand transition-colors duration-fast">
                Platform role catalog (reference) →
              </Link>
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <header className="px-4 py-2.5 border-b border-stroke-subtle">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">Multi-factor authentication</h2>
        </header>
        <div className="px-4 py-3 flex items-center gap-2 font-body text-[12.5px] text-foreground">
          <ShieldCheck className="h-4 w-4 text-success-text" strokeWidth={2} aria-hidden />
          <span>Enabled · TOTP via authenticator app</span>
        </div>
      </section>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <header className="px-4 py-2.5 border-b border-stroke-subtle">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">Active sessions</h2>
        </header>
        <ul className="divide-y divide-stroke-subtle">
          <li className="flex items-center gap-3 px-4 py-2.5">
            <Monitor className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
            <div className="flex-1">
              <p className="font-body text-[12.5px] text-foreground">macOS · Chrome <span className="ml-1.5 inline-flex items-center rounded bg-success-subtle text-success-text ring-1 ring-success-border px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-[0.06em]">this device</span></p>
              <p className="font-mono text-[11px] text-text-tertiary mt-0.5">Bangalore, IN · started 2h ago</p>
            </div>
          </li>
          <li className="flex items-center gap-3 px-4 py-2.5">
            <Smartphone className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
            <div className="flex-1">
              <p className="font-body text-[12.5px] text-foreground">iOS · Safari</p>
              <p className="font-mono text-[11px] text-text-tertiary mt-0.5">Bangalore, IN · last seen 1d ago</p>
            </div>
            <button type="button" className="font-body text-[12px] text-error-text hover:underline underline-offset-2">Revoke</button>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <header className="px-4 py-2.5 border-b border-stroke-subtle">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">Last activity</h2>
        </header>
        <p className="px-4 py-3 font-body text-[12.5px] text-foreground">Last sign-in: just now · IP 10.42.18.4</p>
      </section>
    </div>
  );
}
