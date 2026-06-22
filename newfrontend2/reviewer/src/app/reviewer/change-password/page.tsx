"use client";

/**
 * Reviewer forced password change — shown after sign-in when the account was
 * provisioned with a temporary password (login returns requiresPasswordChange).
 * The reviewer must set a new password (≠ the temp one) before entering the
 * portal. Authenticated via the NextAuth session's access token.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { CheckCircle2 } from "lucide-react";
import {
  AuthAlert,
  AuthBackLink,
  AuthField,
  AuthScreen,
  AuthSubmitButton,
  authInputCls,
} from "@/components/auth/auth-screen";

function safeReturnTo(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default function ReviewerChangePasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const returnTo = safeReturnTo(sp.get("returnTo"));
  const { data: session, status } = useSession();

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const canSubmit = password.length >= 8 && password === confirm && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      // The reviewer just signed in with the temporary password, so the session
      // is proof enough — we don't re-collect it. The backend enforces that the
      // new password differs from the current one.
      const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
      const res = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          new_password: password,
          confirmPassword: confirm,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string; detail?: string };
        const msg = (body.message || body.detail || "").toLowerCase();
        if (msg.includes("different")) {
          setError("Your new password must be different from your temporary password.");
        } else if (msg.includes("incorrect") || msg.includes("invalid")) {
          setError("Couldn't verify your session. Please sign in again.");
        } else {
          setError("Couldn't update your password. Please try again.");
        }
        return;
      }
      setDone(true);
      // Re-auth is cleanest after a password change; send them to sign in again.
      setTimeout(() => {
        void signOut({ redirect: false }).then(() => {
          const next = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
          router.push(`/reviewer/login${next}`);
        });
      }, 1200);
    } catch {
      setError("Couldn't update your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "unauthenticated") {
    if (typeof window !== "undefined") router.replace("/reviewer/login");
    return null;
  }

  return (
    <AuthScreen
      title={done ? "Password updated" : "Set a new password"}
      subtitle={
        done
          ? "Sign in again with your new password to continue."
          : "Your account uses a temporary password. Choose a new one to continue — it must be different from the temporary password."
      }
    >
      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      {done ? (
        <div className="space-y-3">
          <AuthAlert variant="success">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden />
              <p>Your password has been updated. Redirecting you to sign in…</p>
            </div>
          </AuthAlert>
          <AuthBackLink href="/reviewer/login">Go to sign in</AuthBackLink>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField label="New password" htmlFor="rcp-new">
            <input
              id="rcp-new"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={authInputCls}
              required
            />
          </AuthField>
          <AuthField label="Confirm new password" htmlFor="rcp-confirm">
            <input
              id="rcp-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
              className={authInputCls}
              required
            />
          </AuthField>
          <AuthSubmitButton disabled={!canSubmit} loading={submitting} loadingLabel="Saving…">
            Set new password
          </AuthSubmitButton>
        </form>
      )}
    </AuthScreen>
  );
}
