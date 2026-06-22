"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/lib/stores/auth-store";

const PROFILE_RETURN = "/enterprise/profile";

function generateRecoveryCodes(): string[] {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () =>
    Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)])
      .join("")
      .replace(/(.{5})/, "$1-"),
  );
}

const btnOutline = cn(
  "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md",
  "border border-stroke bg-surface font-body text-[12px] font-semibold text-foreground",
);

const btnDangerOutline = cn(
  "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md",
  "border border-error-border bg-surface font-body text-[12px] font-semibold text-error-text",
);

export function AccountMfaSection() {
  const router = useRouter();
  const isMfaEnabled = useAuthStore((s) => s.isMfaEnabled);
  const setMfaEnabled = useAuthStore((s) => s.setMfaEnabled);

  const recoveryCodes = React.useMemo(() => generateRecoveryCodes(), []);

  const [showCodes, setShowCodes] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showDisableForm, setShowDisableForm] = React.useState(false);
  const [disablePassword, setDisablePassword] = React.useState("");
  const [showDisablePw, setShowDisablePw] = React.useState(false);
  const [disableLoading, setDisableLoading] = React.useState(false);
  const [disableError, setDisableError] = React.useState("");

  const mfaSetupUrl = `/auth/mfa-setup?redirect=${encodeURIComponent(PROFILE_RETURN)}`;

  const onCopy = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onDownload = () => {
    const blob = new Blob([recoveryCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "glimmorateam-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setDisableError("Please enter your password");
      return;
    }
    setDisableError("");
    setDisableLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setDisableLoading(false);
    setMfaEnabled(false);
    setShowDisableForm(false);
    setDisablePassword("");
  };

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border shrink-0",
              isMfaEnabled
                ? "border-success-border text-success-text bg-surface"
                : "border-stroke-subtle text-text-secondary bg-surface",
            )}
          >
            {isMfaEnabled ? (
              <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
            ) : (
              <Shield className="h-4 w-4" strokeWidth={2} aria-hidden />
            )}
          </span>
          <div>
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Two-factor authentication
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              TOTP via authenticator app on every sign-in
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex px-2 py-0.5 rounded-full font-body text-[10.5px] font-semibold shrink-0",
            isMfaEnabled
              ? "bg-success-subtle text-success-text"
              : "border border-stroke-subtle text-text-tertiary",
          )}
        >
          {isMfaEnabled ? "Enabled" : "Not configured"}
        </span>
      </div>

      <div className="space-y-4">
        {isMfaEnabled ? (
          <>
            <p className="flex items-start gap-2 rounded-lg border border-success-border px-3 py-2.5 font-body text-[12px] text-text-secondary">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success-text" strokeWidth={2} aria-hidden />
              Your account is protected with TOTP two-factor authentication.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" onClick={() => router.push(mfaSetupUrl)} className={btnOutline}>
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Re-setup authenticator
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDisableForm((v) => !v);
                  setDisableError("");
                }}
                className={btnDangerOutline}
              >
                <ShieldOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {showDisableForm ? "Cancel" : "Disable MFA"}
              </button>
            </div>

            {showDisableForm && (
              <form
                onSubmit={onDisableMfa}
                className="rounded-lg border border-error-border px-3 py-3 space-y-2.5"
              >
                <p className="font-body text-[12px] font-semibold text-error-text">
                  Confirm your password to disable two-factor authentication.
                </p>
                <div>
                  <label
                    htmlFor="disable-pw"
                    className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary"
                  >
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="disable-pw"
                      type={showDisablePw ? "text" : "password"}
                      placeholder="Enter your current password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      autoFocus
                      className={cn(
                        "w-full h-8 px-2.5 pr-9 rounded-md border border-stroke bg-surface",
                        "font-body text-[12px] text-foreground placeholder:text-text-tertiary",
                        "focus-visible:outline-none focus-visible:border-error-border focus-visible:ring-2 focus-visible:ring-error-border/20",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDisablePw((v) => !v)}
                      aria-label={showDisablePw ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary"
                    >
                      {showDisablePw ? (
                        <EyeOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      ) : (
                        <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
                {disableError && (
                  <div className="flex items-center gap-1.5 font-body text-[11.5px] text-error-text">
                    <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                    {disableError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={disableLoading}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md",
                    "bg-error text-on-brand font-body text-[12px] font-semibold",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {disableLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />
                      Disabling…
                    </>
                  ) : (
                    "Confirm and disable MFA"
                  )}
                </button>
              </form>
            )}

            <div className="rounded-lg border border-stroke-subtle overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCodes((v) => !v)}
                aria-expanded={showCodes}
                className="w-full flex items-center justify-between px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                  <span className="font-body text-[12.5px] font-semibold text-foreground">
                    Recovery codes
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-text-tertiary transition-transform duration-fast",
                    showCodes && "rotate-180",
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
              {showCodes && (
                <div className="border-t border-stroke-subtle px-3 py-3 space-y-3">
                  <p className="font-body text-[11.5px] text-text-tertiary leading-snug">
                    Each code works once if you lose your authenticator. Store them somewhere safe.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-brand text-on-brand p-3 font-mono">
                    {recoveryCodes.map((code, i) => (
                      <div key={i} className="text-[11.5px] tabular-nums">
                        <span className="opacity-50 mr-1.5">{i + 1}.</span>
                        {code}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={onCopy} className={cn(btnOutline, "flex-1 text-[11.5px]")}>
                      <Copy className="h-3 w-3" strokeWidth={2} aria-hidden />
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button type="button" onClick={onDownload} className={cn(btnOutline, "flex-1 text-[11.5px]")}>
                      <Download className="h-3 w-3" strokeWidth={2} aria-hidden />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="flex items-start gap-2 rounded-lg border border-warning-border px-3 py-2.5 font-body text-[12px] text-text-secondary">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning-text" strokeWidth={2} aria-hidden />
              Your account is not protected with two-factor authentication yet.
            </p>
            <button
              type="button"
              onClick={() => router.push(mfaSetupUrl)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-md",
                "bg-brand text-on-brand font-body text-[12px] font-semibold",
                "hover:bg-brand-hover transition-colors duration-fast",
              )}
            >
              <Shield className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Set up two-factor auth
            </button>
          </>
        )}
      </div>
    </div>
  );
}
