"use client";

/**
 * Settings → Team — provision enterprise team members.
 *
 * The enterprise admin creates members (reviewer, PMO, finance, IT/security,
 * compliance/legal, sponsor) under their own tenant. Each gets a temp password
 * + forced reset; they sign in via the existing login flow (this page builds no
 * login of its own). Mentors are provisioned by the super-admin, not here.
 */

import * as React from "react";
import { Loader2, UserPlus, Copy, Check, ShieldCheck, Mail, KeyRound } from "lucide-react";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import { primaryBtnClass, primaryStyle } from "@/app/admin/_shell/aurora-ui";
import { authInputCls } from "@/components/auth/auth-screen";
import { cn } from "@/lib/utils/cn";

type RoleOption = { code: string; label: string };

const ROLE_OPTIONS: RoleOption[] = [
  { code: "ent.reviewer", label: "Reviewer" },
  { code: "ent.pmo", label: "PMO / Project Manager" },
  { code: "ent.finance", label: "Finance" },
  { code: "ent.it", label: "IT / Security" },
  { code: "ent.compliance", label: "Compliance / Legal" },
  { code: "ent.sponsor", label: "Business Sponsor" },
  { code: "ent.admin", label: "Enterprise Admin" },
];

type Member = {
  id: string;
  email: string;
  name: string;
  portalRole: string;
  roleLabel: string | null;
  mustChangePassword: boolean;
  active: boolean;
  createdAt: string | null;
};

type CreatedResult = {
  email: string;
  roleLabel: string | null;
  tempPassword?: string;
  emailQueued?: boolean;
};

export default function EnterpriseTeamPage() {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [roleCode, setRoleCode] = React.useState("ent.reviewer");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<CreatedResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  const loadMembers = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/enterprise/team", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 403) setLoadError("You don't have permission to manage team members.");
        else setLoadError("Couldn't load the team. Please try again.");
        setMembers([]);
        return;
      }
      const body = (await res.json()) as { items?: Member[] };
      setMembers(body.items ?? []);
    } catch {
      setLoadError("Couldn't load the team. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const canSubmit = email.includes("@") && firstName.trim().length > 0 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setFormError(null);
    setCreated(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/enterprise/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          roleCode,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as CreatedResult & { detail?: string };
      if (!res.ok) {
        setFormError(body.detail ?? "Couldn't create the member. Please try again.");
        return;
      }
      setCreated(body);
      setFirstName("");
      setLastName("");
      setEmail("");
      setRoleCode("ent.reviewer");
      void loadMembers();
    } catch {
      setFormError("Couldn't create the member. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyTemp() {
    if (!created?.tempPassword) return;
    void navigator.clipboard.writeText(created.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const [resendingId, setResendingId] = React.useState<string | null>(null);
  const [resentFor, setResentFor] = React.useState<CreatedResult | null>(null);

  async function resendCredentials(member: Member) {
    setResendingId(member.id);
    setResentFor(null);
    try {
      const res = await fetch(`/api/enterprise/team/${member.id}/resend`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as CreatedResult & { detail?: string };
      if (!res.ok) {
        setFormError(body.detail ?? "Couldn't resend credentials.");
        return;
      }
      setResentFor({ email: member.email, roleLabel: member.roleLabel, tempPassword: body.tempPassword, emailQueued: true });
      void loadMembers();
    } catch {
      setFormError("Couldn't resend credentials.");
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div className="space-y-5 pb-12">
      <header>
        <h1 className="font-display text-[22px] font-bold text-foreground tracking-[-0.02em]">Team</h1>
        <p className="mt-1 font-body text-[13px] text-text-secondary max-w-2xl">
          Provision team members under your tenant — reviewers, PMO, finance, IT / security,
          compliance, and sponsors. Each member gets a temporary password and is required to set a
          new one on first sign-in. Mentors are provisioned by Glimmora, not here.
        </p>
      </header>

      {/* Create form */}
      <div className={cn(DASH_CARD, "p-5")}>
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-4 w-4 text-brand-emphasis" strokeWidth={2} aria-hidden />
          <h2 className="font-body text-[14px] font-semibold text-foreground">Add a team member</h2>
        </div>

        {formError && (
          <div role="alert" className="mb-4 rounded-lg border border-error-border bg-error-subtle/60 px-3.5 py-2.5 font-body text-[13px] text-error-text">
            {formError}
          </div>
        )}

        {created && (
          <div className="mb-4 rounded-lg border border-success-border bg-success-subtle/50 px-3.5 py-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-success-text" strokeWidth={1.9} aria-hidden />
              <div className="min-w-0">
                <p className="font-body text-[13px] font-semibold text-foreground">
                  {created.email} created{created.roleLabel ? ` as ${created.roleLabel}` : ""}.
                </p>
                <p className="mt-0.5 font-body text-[12.5px] text-text-secondary inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                  Credentials emailed. They&apos;ll set a new password on first sign-in.
                </p>
                {created.tempPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-body text-[12px] text-text-tertiary">Temp password:</span>
                    <code className="rounded bg-bg-subtle px-2 py-0.5 font-mono text-[12.5px] text-foreground">{created.tempPassword}</code>
                    <button
                      type="button"
                      onClick={copyTemp}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-text-link hover:underline"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="tm-first" className="block font-body text-[12.5px] font-medium text-foreground mb-1.5">First name</label>
            <input id="tm-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" className={authInputCls} required />
          </div>
          <div>
            <label htmlFor="tm-last" className="block font-body text-[12.5px] font-medium text-foreground mb-1.5">Last name</label>
            <input id="tm-last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={authInputCls} />
          </div>
          <div>
            <label htmlFor="tm-email" className="block font-body text-[12.5px] font-medium text-foreground mb-1.5">Email</label>
            <input id="tm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" className={authInputCls} required />
          </div>
          <div>
            <label htmlFor="tm-role" className="block font-body text-[12.5px] font-medium text-foreground mb-1.5">Role</label>
            <select id="tm-role" value={roleCode} onChange={(e) => setRoleCode(e.target.value)} className={cn(authInputCls, "appearance-none cursor-pointer")}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={!canSubmit} style={canSubmit ? primaryStyle : undefined} className={cn(primaryBtnClass, "h-10 px-5", !canSubmit && "opacity-60 cursor-not-allowed")}>
              {submitting ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating…</span>
              ) : (
                "Create member"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Member list */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 py-3.5 border-b border-stroke-subtle flex items-center justify-between">
          <h2 className="font-body text-[14px] font-semibold text-foreground">Team members</h2>
          <span className="font-body text-[12px] text-text-tertiary">{members.length} total</span>
        </div>

        {resentFor && (
          <div className="mx-5 mt-3 rounded-lg border border-info-border bg-info-subtle/40 px-3.5 py-2.5">
            <p className="font-body text-[12.5px] text-foreground">
              New credentials emailed to <span className="font-semibold">{resentFor.email}</span>. They&apos;ll reset their password on next sign-in.
              {resentFor.tempPassword && (
                <> Temp password: <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[12px]">{resentFor.tempPassword}</code></>
              )}
            </p>
          </div>
        )}

        {loading ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2 text-text-tertiary">
            <Loader2 className="h-4 w-4 animate-spin" /> <span className="font-body text-[13px]">Loading…</span>
          </div>
        ) : loadError ? (
          <div className="px-5 py-8 text-center font-body text-[13px] text-error-text">{loadError}</div>
        ) : members.length === 0 ? (
          <div className="px-5 py-8 text-center font-body text-[13px] text-text-secondary">No team members yet. Add your first above.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke-subtle">
                <th className="text-left px-5 py-2.5 font-body text-[11.5px] font-semibold uppercase tracking-wide text-text-tertiary">Member</th>
                <th className="text-left px-5 py-2.5 font-body text-[11.5px] font-semibold uppercase tracking-wide text-text-tertiary">Role</th>
                <th className="text-left px-5 py-2.5 font-body text-[11.5px] font-semibold uppercase tracking-wide text-text-tertiary">Status</th>
                <th className="text-right px-5 py-2.5 font-body text-[11.5px] font-semibold uppercase tracking-wide text-text-tertiary">Credentials</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-stroke-subtle/60 last:border-0">
                  <td className="px-5 py-3">
                    <div className="font-body text-[13px] font-medium text-foreground">{m.name || m.email}</div>
                    <div className="font-body text-[12px] text-text-tertiary">{m.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-body text-[12.5px] text-text-secondary">
                      {m.roleLabel ?? (m.portalRole === "reviewer" ? "Reviewer" : m.portalRole === "enterprise" ? "Enterprise" : m.portalRole)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {m.mustChangePassword ? (
                      <span className="inline-flex items-center rounded-full bg-warning-subtle/60 px-2 py-0.5 font-body text-[11.5px] font-medium text-warning-text">Pending first login</span>
                    ) : m.active ? (
                      <span className="inline-flex items-center rounded-full bg-success-subtle/60 px-2 py-0.5 font-body text-[11.5px] font-medium text-success-text">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-bg-subtle px-2 py-0.5 font-body text-[11.5px] font-medium text-text-tertiary">Inactive</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => resendCredentials(m)}
                      disabled={resendingId === m.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stroke-subtle px-2.5 py-1.5 font-body text-[12px] font-medium text-text-secondary hover:bg-bg-subtle hover:text-foreground transition-colors disabled:opacity-60"
                    >
                      {resendingId === m.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden />
                      )}
                      Resend credentials
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
