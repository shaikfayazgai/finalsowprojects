"use client";

/**
 * Platform admin profile — operator identity, access, security, and sessions.
 *
 * Workflow:
 *   1. Orient — who you are on this console
 *   2. Understand — role scope and catalog link
 *   3. Secure — MFA status and active sessions
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, LogOut, Monitor, ShieldCheck, Smartphone } from "lucide-react";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { ADMIN_SECTION_VISIBILITY, type AdminRole } from "@/mocks/admin/personas";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { AdminModal, dangerBtnClass, secondaryBtnClass } from "../../_shell/aurora-ui";

const ROLE_LABEL: Record<AdminRole, string> = {
  "plat.admin": "Platform Admin",
  "plat.tsm": "Tenant Success Manager",
  "plat.mpm": "Mentor Program Manager",
  "plat.tns": "Trust & Safety Officer",
  "plat.compliance": "Compliance Officer",
  "plat.payments": "Payments Operator",
  "plat.partnerships": "Partnership Manager",
  "plat.ai": "AI Operator",
};

const ROLE_SCOPE: Record<AdminRole, string> = {
  "plat.admin": "Full read/write across all platform modules.",
  "plat.tsm": "Tenant lifecycle, commercial gate, and scoped audit visibility.",
  "plat.mpm": "Mentor roster, competency, rubrics, and skill taxonomy.",
  "plat.tns": "Governance cases, KYC decisions, and rubric templates.",
  "plat.compliance": "Audit export, governance read, and role catalog reference.",
  "plat.payments": "Payment rails, commercial gate, and payout audit slice.",
  "plat.partnerships": "Women workforce partnerships and scoped KYC.",
  "plat.ai": "AI agents, prompt registry, and rollback operations.",
};

type Session = {
  id: string;
  device: string;
  browser: string;
  location: string;
  detail: string;
  current?: boolean;
  icon: "desktop" | "mobile";
};

const INITIAL_SESSIONS: Session[] = [
  {
    id: "sess-current",
    device: "macOS",
    browser: "Chrome",
    location: "Bangalore, IN",
    detail: "started 2h ago",
    current: true,
    icon: "desktop",
  },
  {
    id: "sess-mobile",
    device: "iOS",
    browser: "Safari",
    location: "Bangalore, IN",
    detail: "last seen 1d ago",
    icon: "mobile",
  },
];


function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <header className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
        <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function ProfileWorkspace() {
  const { role, profile } = useActiveAdmin();
  const canViewRoles = ADMIN_SECTION_VISIBILITY.roles.includes(role);

  const [sessions, setSessions] = React.useState(INITIAL_SESSIONS);
  const [revokeTarget, setRevokeTarget] = React.useState<Session | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  function confirmRevoke() {
    if (!revokeTarget) return;
    setSessions((prev) => prev.filter((s) => s.id !== revokeTarget.id));
    setToast(`${revokeTarget.device} · ${revokeTarget.browser} session revoked.`);
    setRevokeTarget(null);
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {toast ? (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-subtle/60 px-4 py-2.5 font-body text-[13px] font-medium text-success-text"
        >
          {toast}
        </div>
      ) : null}

      <header className="min-w-0">
        <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
          Profile
        </h1>
        <p className="mt-1.5 font-body text-[14px] text-text-secondary">
          Your operator identity, platform role, and active sessions on the admin console.
        </p>
      </header>

      <section className={cn(DASH_CARD, "px-4 sm:px-5 py-5")}>
        <div className="flex flex-wrap items-center gap-4">
          <div
            aria-hidden
            className="h-14 w-14 rounded-full bg-brand text-on-brand inline-flex items-center justify-center font-display text-[18px] font-semibold shrink-0"
          >
            {profile.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-foreground">
              {profile.displayName}
            </h2>
            <p className="mt-0.5 font-body text-[13px] text-text-secondary">{profile.title}</p>
            <p className="mt-1 font-mono text-[12px] text-text-tertiary">{profile.email}</p>
          </div>
        </div>
        <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[13px] text-text-secondary">
          Last sign-in <span suppressHydrationWarning>just now</span>
          <span aria-hidden className="mx-1.5 opacity-40">·</span>
          IP <span className="font-mono text-[12px]">10.42.18.4</span>
        </p>
      </section>

      <Card title="Role & access" description="Platform permissions for this console session">
        <div className="px-4 sm:px-5 py-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-[22px] items-center px-2.5 rounded-full bg-info-subtle font-mono text-[11px] font-medium text-info-text">
              {role}
            </span>
            <span className="font-body text-[13px] font-medium text-foreground">{ROLE_LABEL[role]}</span>
          </div>
          <p className="font-body text-[13px] text-text-secondary leading-relaxed">{ROLE_SCOPE[role]}</p>
          {canViewRoles ? (
            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2"
            >
              Platform role catalog
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            </Link>
          ) : null}
        </div>
      </Card>

      <Card title="Security" description="Authentication protections on this account">
        <div className="px-4 sm:px-5 py-5 flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-success-text mt-0.5" strokeWidth={2} aria-hidden />
          <div>
            <p className="font-body text-[13px] font-medium text-foreground">Multi-factor authentication enabled</p>
            <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">TOTP via authenticator app · required for admin console</p>
          </div>
        </div>
      </Card>

      <Card title="Active sessions" description="Devices signed in to this admin account">
        {sessions.length === 0 ? (
          <p className="px-4 sm:px-5 py-8 text-center font-body text-[13px] text-text-secondary">
            No other active sessions.
          </p>
        ) : (
          <ul className="divide-y divide-stroke-subtle">
            {sessions.map((session) => {
              const Icon = session.icon === "desktop" ? Monitor : Smartphone;
              return (
                <li key={session.id} className="flex items-center gap-3 px-4 sm:px-5 py-4">
                  <Icon className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[13px] text-foreground flex flex-wrap items-center gap-1.5">
                      {session.device} · {session.browser}
                      {session.current ? (
                        <span className="inline-flex h-[20px] items-center px-2 rounded-full bg-success-subtle font-body text-[10px] font-medium text-success-text">
                          this device
                        </span>
                      ) : null}
                    </p>
                    <p className="font-mono text-[11px] text-text-tertiary mt-0.5">
                      {session.location} · {session.detail}
                    </p>
                  </div>
                  {!session.current ? (
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(session)}
                      className="font-body text-[12px] font-semibold text-error-text hover:underline underline-offset-2 shrink-0"
                    >
                      Revoke
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <AdminModal
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        icon={LogOut}
        tone="error"
        title="Revoke session"
        description={
          revokeTarget ? `Sign out ${revokeTarget.device} · ${revokeTarget.browser} from the admin console.` : undefined
        }
        footer={
          <>
            <button type="button" onClick={() => setRevokeTarget(null)} className={secondaryBtnClass}>
              Cancel
            </button>
            <button type="button" onClick={confirmRevoke} className={dangerBtnClass}>
              Revoke session
            </button>
          </>
        }
      >
        <p className="font-body text-[13px] text-text-secondary leading-relaxed">
          The device will need to sign in again with MFA. This action is logged to the audit trail.
        </p>
      </AdminModal>
    </div>
  );
}
