"use client";

import * as React from "react";
import { Building2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import {
  useAccountAuth,
  useInvalidateAccountAuth,
} from "@/lib/hooks/use-account-auth";
import { changeContributorAccountPassword } from "@/lib/api/contributor-account-auth";
import { providerLabel } from "@/lib/contributor/account-auth";
import { SettingsSectionHeader } from "../../_components/settings-section-header";
import {
  settingsFieldLabelCls,
  settingsInputCls,
  settingsPrimaryBtnCls,
  settingsSectionCls,
  settingsSectionFooterCls,
  settingsSectionHeaderCls,
} from "../../lib/settings-ui-utils";
import { cn } from "@/lib/utils/cn";

export function AccountSettingsWorkspace() {
  const { profile } = useActivePersona();
  const accountAuth = useAccountAuth();
  const invalidateAccountAuth = useInvalidateAccountAuth();

  const [email, setEmail] = React.useState(profile.email);
  React.useEffect(() => {
    setEmail(profile.email);
  }, [profile.email]);

  const [emailSaving, setEmailSaving] = React.useState(false);
  const [emailMsg, setEmailMsg] = React.useState<string | null>(null);

  const authMode = accountAuth.data?.authMode;
  const loadingAuth = accountAuth.isLoading;

  const onSaveEmail = async () => {
    setEmailMsg(null);
    setEmailSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setEmailSaving(false);
    setEmailMsg("Verification email sent (mock).");
  };

  return (
    <div className="space-y-5 pb-12">
      <SettingsSectionHeader
        sectionId="account"
        description="Manage sign-in email, password, and two-factor authentication for this account."
      />

      <section className={settingsSectionCls}>
        <header className={settingsSectionHeaderCls}>
          <Mail className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
          <h2 className="font-body text-[13px] font-semibold text-foreground">Email</h2>
        </header>
        <div className="p-5 space-y-3">
          <Field label="Sign-in email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={settingsInputCls}
            />
          </Field>
          <p className="font-body text-[11.5px] text-text-tertiary">
            Changing your email sends a verification link to the new address. You stay signed in
            with your current email until you verify.
          </p>
          {emailMsg && (
            <p className="rounded-md border border-success-border bg-success-subtle px-3 py-2 font-body text-[11.5px] text-success-text">
              {emailMsg}
            </p>
          )}
        </div>
        <footer className={settingsSectionFooterCls}>
          <button
            type="button"
            onClick={onSaveEmail}
            disabled={emailSaving || email === profile.email}
            className={settingsPrimaryBtnCls}
          >
            {emailSaving ? "Sending…" : "Send verification"}
          </button>
        </footer>
      </section>

      {loadingAuth ? (
        <section className={settingsSectionCls}>
          <div className="px-5 py-8 font-body text-[12.5px] text-text-tertiary">
            Loading sign-in options…
          </div>
        </section>
      ) : authMode === "enterprise_sso" ? (
        <EnterpriseSsoPasswordPanel organizationName={accountAuth.data?.organizationName ?? null} />
      ) : authMode === "social_oauth" ? (
        <SetPasswordPanel
          connectedProviders={accountAuth.data?.connectedProviders ?? []}
          onSuccess={invalidateAccountAuth}
        />
      ) : (
        <ChangePasswordPanel onSuccess={invalidateAccountAuth} />
      )}

      <section className={settingsSectionCls}>
        <header className={settingsSectionHeaderCls}>
          <ShieldCheck className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
          <h2 className="font-body text-[13px] font-semibold text-foreground">
            Two-factor authentication
          </h2>
        </header>
        <MfaPanel />
      </section>
    </div>
  );
}

function EnterpriseSsoPasswordPanel({
  organizationName,
}: {
  organizationName: string | null;
}) {
  const org = organizationName ?? "your organization";
  return (
    <section className={settingsSectionCls}>
      <header className={settingsSectionHeaderCls}>
        <Building2 className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
        <h2 className="font-body text-[13px] font-semibold text-foreground">Password</h2>
      </header>
      <div className="p-5 space-y-3">
        <p className="font-body text-[13px] font-semibold text-foreground">
          Sign-in managed by {org}
        </p>
        <p className="font-body text-[12.5px] text-text-secondary max-w-[60ch]">
          Your employer provisions this account through HRIS and company SSO. Passwords are not
          stored in Glimmora — use your organization&apos;s Microsoft or Google workspace to sign
          in.
        </p>
        <p className="font-body text-[11.5px] text-text-tertiary">
          Need access help? Contact your IT administrator or HR team.
        </p>
      </div>
    </section>
  );
}

function SetPasswordPanel({
  connectedProviders,
  onSuccess,
}: {
  connectedProviders: Array<"google" | "microsoft">;
  onSuccess: () => void;
}) {
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [pwdMsg, setPwdMsg] = React.useState<string | null>(null);
  const [pwdErr, setPwdErr] = React.useState<string | null>(null);
  const [pwdSaving, setPwdSaving] = React.useState(false);

  const pwdValid = newPwd.length >= 8 && newPwd === confirmPwd;

  const onSavePwd = async () => {
    setPwdMsg(null);
    setPwdErr(null);
    if (!pwdValid) return;
    setPwdSaving(true);
    try {
      await changeContributorAccountPassword({
        new_password: newPwd,
        confirmPassword: confirmPwd,
      });
      setNewPwd("");
      setConfirmPwd("");
      setPwdMsg(
        "Password added. You can now sign in with email and password or continue using your connected account.",
      );
      onSuccess();
    } catch (e) {
      setPwdErr(e instanceof Error ? e.message : "Could not set password.");
    } finally {
      setPwdSaving(false);
    }
  };

  const connectedLabel =
    connectedProviders.length > 0
      ? connectedProviders.map(providerLabel).join(" or ")
      : "Google or Microsoft";

  return (
    <section className={settingsSectionCls}>
      <header className={settingsSectionHeaderCls}>
        <KeyRound className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
        <h2 className="font-body text-[13px] font-semibold text-foreground">Password</h2>
      </header>
      <div className="p-5 space-y-3">
        <p className="font-body text-[12.5px] text-text-secondary max-w-[60ch]">
          You currently sign in with <span className="font-medium text-foreground">{connectedLabel}</span>.
          Add an optional password as a backup sign-in method.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="New password">
            <input
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className={settingsInputCls}
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className={settingsInputCls}
            />
          </Field>
        </div>
        <p className="font-body text-[11px] text-text-tertiary">Minimum 8 characters.</p>
        {pwdErr && (
          <p
            role="alert"
            className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[11.5px] text-error-text"
          >
            {pwdErr}
          </p>
        )}
        {pwdMsg && (
          <p className="rounded-md border border-success-border bg-success-subtle px-3 py-2 font-body text-[11.5px] text-success-text">
            {pwdMsg}
          </p>
        )}
      </div>
      <footer className={settingsSectionFooterCls}>
        <button
          type="button"
          onClick={onSavePwd}
          disabled={!pwdValid || pwdSaving}
          className={settingsPrimaryBtnCls}
        >
          {pwdSaving ? "Saving…" : "Add password"}
        </button>
      </footer>
    </section>
  );
}

function ChangePasswordPanel({ onSuccess }: { onSuccess: () => void }) {
  const [currentPwd, setCurrentPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [pwdMsg, setPwdMsg] = React.useState<string | null>(null);
  const [pwdErr, setPwdErr] = React.useState<string | null>(null);
  const [pwdSaving, setPwdSaving] = React.useState(false);

  const pwdValid = newPwd.length >= 8 && newPwd === confirmPwd && currentPwd.length > 0;

  const onSavePwd = async () => {
    setPwdMsg(null);
    setPwdErr(null);
    if (!pwdValid) return;
    setPwdSaving(true);
    try {
      await changeContributorAccountPassword({
        old_password: currentPwd,
        new_password: newPwd,
        confirmPassword: confirmPwd,
      });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setPwdMsg("Password updated.");
      onSuccess();
    } catch (e) {
      setPwdErr(e instanceof Error ? e.message : "Could not update password.");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <section className={settingsSectionCls}>
      <header className={settingsSectionHeaderCls}>
        <KeyRound className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
        <h2 className="font-body text-[13px] font-semibold text-foreground">Password</h2>
      </header>
      <div className="p-5 space-y-3">
        <Field label="Current password">
          <input
            type="password"
            autoComplete="current-password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            className={settingsInputCls}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="New password">
            <input
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className={settingsInputCls}
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className={settingsInputCls}
            />
          </Field>
        </div>
        <p className="font-body text-[11px] text-text-tertiary">Minimum 8 characters.</p>
        {pwdErr && (
          <p
            role="alert"
            className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[11.5px] text-error-text"
          >
            {pwdErr}
          </p>
        )}
        {pwdMsg && (
          <p className="rounded-md border border-success-border bg-success-subtle px-3 py-2 font-body text-[11.5px] text-success-text">
            {pwdMsg}
          </p>
        )}
      </div>
      <footer className={settingsSectionFooterCls}>
        <button
          type="button"
          onClick={onSavePwd}
          disabled={!pwdValid || pwdSaving}
          className={settingsPrimaryBtnCls}
        >
          {pwdSaving ? "Updating…" : "Update password"}
        </button>
      </footer>
    </section>
  );
}

function MfaPanel() {
  const [mfaOn, setMfaOn] = React.useState(true);

  return (
    <div className="p-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-body text-[12.5px] font-semibold text-foreground">
          MFA is{" "}
          <span className={mfaOn ? "text-success-text" : "text-text-tertiary"}>
            {mfaOn ? "on" : "off"}
          </span>
        </p>
        <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary max-w-[60ch]">
          {mfaOn
            ? "Authenticator app required at sign-in. You can fall back to a recovery code."
            : "Add an authenticator app to require a second code at sign-in."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setMfaOn((v) => !v)}
        className={cn(
          "inline-flex items-center h-8 px-3 rounded-md",
          "bg-surface border border-stroke font-body text-[12.5px] font-semibold text-foreground",
          "hover:bg-surface-hover transition-colors duration-fast",
        )}
      >
        {mfaOn ? "Turn off MFA" : "Set up MFA"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={settingsFieldLabelCls}>{label}</label>
      {children}
    </div>
  );
}
