"use client";

/**
 * Full-page block shown when the tenant/workspace has been SUSPENDED by the
 * platform admin. The user can authenticate, but no portal content opens — they
 * see this screen with a "contact the platform admin" message + sign out.
 *
 * Because the rest of the portal is blocked (including /enterprise/support), this
 * screen carries its OWN contact form so a suspended tenant ADMIN can still reach
 * the platform. Only the workspace admin (owner / ent.admin) gets the form — other
 * tenant roles are told to contact their own admin instead. The submit token stays
 * valid while suspended (suspension is enforced in the layout, not on the
 * complaints endpoint), so the POST goes through and lands in super-admin Complaints.
 */

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ShieldAlert, Mail, CheckCircle2, Send, UserCog } from "lucide-react";
import { clearClientSession } from "@/lib/auth/clear-client-session";
import { COMPLAINT_REASONS, COMPLAINT_PRIORITIES, todayISO } from "@/lib/config/complaints";

export function SuspendedWorkspace({
  email,
  isAdmin = false,
}: {
  email?: string | null;
  isAdmin?: boolean;
}) {
  const today = todayISO();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("access");
  const [priority, setPriority] = useState("high");
  const [startedOn, setStartedOn] = useState("");
  const [subject, setSubject] = useState("Request to restore workspace access");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const subj = subject.trim();
    const msg = message.trim();
    if (!subj || !msg) {
      setError("Add a subject and describe the issue.");
      return;
    }
    if (startedOn && startedOn > today) {
      setError("The start date can't be in the future.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/enterprise/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: reason,
          priority,
          issueStartedOn: startedOn || null,
          subject: subj,
          message: msg,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || body?.message || "Could not send your request.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto grid place-items-center h-14 w-14 rounded-2xl border mb-5"
          style={{
            background: "var(--color-error-subtle)",
            borderColor: "var(--color-error-border)",
            color: "var(--color-error-text)",
          }}
          aria-hidden
        >
          <ShieldAlert className="h-7 w-7" strokeWidth={2} />
        </div>
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em] text-foreground">
          Workspace suspended
        </h1>
        <p className="mt-3 font-body text-[14px] text-text-secondary leading-relaxed">
          This workspace has been suspended and access is temporarily blocked.
          {email ? (
            <>
              {" "}You're signed in as <span className="font-semibold text-foreground">{email}</span>.
            </>
          ) : null}
        </p>
        <p className="mt-2 font-body text-[14px] text-text-secondary leading-relaxed">
          {isAdmin ? (
            <>
              Please <span className="font-semibold text-foreground">contact us</span> to restore access.
            </>
          ) : (
            <>
              Please <span className="font-semibold text-foreground">contact your workspace admin</span> to
              restore access.
            </>
          )}
        </p>

        {/* ── Contact us (admin only) ── */}
        {!isAdmin ? (
          <div className="mt-6 rounded-xl border border-stroke-subtle bg-surface p-4 text-left">
            <div className="flex items-start gap-3">
              <span
                className="grid place-items-center h-9 w-9 shrink-0 rounded-lg"
                style={{
                  background: "var(--color-info-subtle)",
                  color: "var(--color-info-text)",
                }}
                aria-hidden
              >
                <UserCog className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="font-body text-[13.5px] font-semibold text-foreground">Contact your admin</p>
                <p className="mt-1 font-body text-[13px] text-text-secondary leading-relaxed">
                  Only your workspace admin can contact Glimmora support. Please reach out to your
                  admin to get the workspace restored.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-stroke-subtle bg-surface p-4 text-left">
            {sent ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="h-7 w-7" style={{ color: "var(--color-success-text, #16a34a)" }} />
              <p className="font-body text-[14px] font-semibold text-foreground">Ticket sent</p>
              <p className="font-body text-[13px] text-text-secondary leading-relaxed">
                The platform admin has received your request. They'll follow up by email.
              </p>
            </div>
          ) : !open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex w-full items-center justify-center gap-2 h-10 px-4 rounded-lg border border-stroke-subtle bg-bg-subtle font-body text-[13.5px] font-semibold text-foreground hover:bg-bg transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact us
            </button>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="font-body text-[13px] font-semibold text-foreground">
                Contact us
              </p>
              <div className="space-y-1">
                <label htmlFor="sw-reason" className="font-body text-[12px] text-text-secondary">
                  Reason
                </label>
                <select
                  id="sw-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-stroke-subtle bg-bg font-body text-[13.5px] text-foreground outline-none focus:border-stroke transition-colors"
                >
                  {COMPLAINT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="sw-priority" className="font-body text-[12px] text-text-secondary">
                    Priority
                  </label>
                  <select
                    id="sw-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-stroke-subtle bg-bg font-body text-[13.5px] text-foreground outline-none focus:border-stroke transition-colors"
                  >
                    {COMPLAINT_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="sw-started" className="font-body text-[12px] text-text-secondary">
                    When did it start?
                  </label>
                  <input
                    id="sw-started"
                    type="date"
                    value={startedOn}
                    max={today}
                    onChange={(e) => setStartedOn(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-stroke-subtle bg-bg font-body text-[13.5px] text-foreground outline-none focus:border-stroke transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="sw-subject" className="font-body text-[12px] text-text-secondary">
                  Subject
                </label>
                <input
                  id="sw-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  className="w-full h-9 px-3 rounded-lg border border-stroke-subtle bg-bg font-body text-[13.5px] text-foreground outline-none focus:border-stroke transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="sw-message" className="font-body text-[12px] text-text-secondary">
                  Details
                </label>
                <textarea
                  id="sw-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Let the admin know what you need (e.g. why access should be restored, who to reach)."
                  className="w-full px-3 py-2 rounded-lg border border-stroke-subtle bg-bg font-body text-[13.5px] text-foreground outline-none focus:border-stroke transition-colors resize-none"
                />
              </div>
              {error ? (
                <p className="font-body text-[12.5px]" style={{ color: "var(--color-error-text)" }}>
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 h-10 px-4 rounded-lg bg-foreground font-body text-[13.5px] font-semibold text-bg hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending…" : "Send to platform admin"}
              </button>
            </form>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            clearClientSession();
            void signOut({ callbackUrl: "/enterprise/login" });
          }}
          className="mt-6 inline-flex items-center justify-center h-10 px-5 rounded-lg border border-stroke-subtle bg-surface font-body text-[13.5px] font-semibold text-text-secondary hover:text-foreground hover:bg-bg-subtle transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
