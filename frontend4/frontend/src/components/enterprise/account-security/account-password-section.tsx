"use client";

import * as React from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { changeContributorAccountPassword } from "@/lib/api/contributor-account-auth";

const inputCls = cn(
  "w-full h-8 px-2.5 rounded-md border border-stroke bg-surface",
  "font-body text-[12px] text-foreground placeholder:text-text-tertiary",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const btnPrimary = cn(
  "inline-flex items-center justify-center h-8 px-3 rounded-md",
  "bg-brand text-on-brand font-body text-[12px] font-semibold",
  "hover:bg-brand-hover disabled:opacity-50 disabled:pointer-events-none",
);

interface AccountPasswordSectionProps {
  /** Optional helper shown under the section title. */
  description?: string;
}

export function AccountPasswordSection({
  description = "Update the password you use to sign in. Your name and email are managed by your workspace admin.",
}: AccountPasswordSectionProps) {
  const [currentPwd, setCurrentPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const valid =
    currentPwd.length > 0 && newPwd.length >= 8 && newPwd === confirmPwd;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!valid) return;

    setSaving(true);
    try {
      await changeContributorAccountPassword({
        old_password: currentPwd,
        new_password: newPwd,
        confirmPassword: confirmPwd,
      });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setMessage("Password updated. Other signed-in devices were signed out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3 mb-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stroke-subtle bg-surface text-text-secondary shrink-0">
          <KeyRound className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Password
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">{description}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
        <div>
          <label
            htmlFor="account-current-pwd"
            className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary"
          >
            Current password
          </label>
          <div className="relative mt-1">
            <input
              id="account-current-pwd"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className={cn(inputCls, "pr-9")}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              aria-label={showCurrent ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary"
            >
              {showCurrent ? (
                <EyeOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              ) : (
                <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="account-new-pwd"
              className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary"
            >
              New password
            </label>
            <div className="relative mt-1">
              <input
                id="account-new-pwd"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className={cn(inputCls, "pr-9")}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary"
              >
                {showNew ? (
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                ) : (
                  <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                )}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="account-confirm-pwd"
              className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary"
            >
              Confirm new password
            </label>
            <input
              id="account-confirm-pwd"
              type="password"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className={cn(inputCls, "mt-1")}
            />
          </div>
        </div>

        <p className="font-body text-[11px] text-text-tertiary">Minimum 8 characters.</p>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[11.5px] text-error-text"
          >
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md border border-success-border bg-success-subtle px-3 py-2 font-body text-[11.5px] text-success-text">
            {message}
          </p>
        )}

        <button type="submit" disabled={!valid || saving} className={btnPrimary}>
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
