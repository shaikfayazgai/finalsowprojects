"use client";

/**
 * Email activation — Meridian redesign.
 */

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { AuthShell, AuthCard, PrimaryButton } from "@/components/auth/auth-shell";

export default function ActivatePage() {
  return (
    <React.Suspense fallback={null}>
      <Inner />
    </React.Suspense>
  );
}

function Inner() {
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [state, setState] = React.useState<"working" | "success" | "expired" | "error" | "invalid">(token ? "working" : "invalid");

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        if (res.ok) { setState("success"); return; }
        const body = await res.json().catch(() => ({})) as { code?: string };
        setState(body.code === "expired" ? "expired" : "error");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const card = (() => {
    switch (state) {
      case "invalid":
        return {
          title: "This activation link is invalid",
          subtitle: "The link is missing its activation token. Use the link from the email we sent you.",
          body: (
            <Link href="/auth/login" className="inline-flex items-center justify-center w-full h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast">Go to sign in</Link>
          ),
        };
      case "working":
        return {
          title: "Activating your account…",
          subtitle: "Hang tight, this only takes a second.",
          body: (
            <div className="flex items-center gap-2.5 text-text-secondary">
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" aria-hidden />
              <span className="font-body text-[12.5px]">Verifying token</span>
            </div>
          ),
        };
      case "success":
        return {
          title: "Account activated",
          subtitle: "You're all set. Sign in to continue to your portal.",
          body: (
            <>
              <div className="rounded-md border border-success-border bg-success-subtle px-4 py-3 flex items-start gap-2.5 mb-3">
                <CheckCircle2 className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <p className="font-body text-[12.5px] text-success-text">Your email is verified. Welcome to GlimmoraTeam.</p>
              </div>
              <Link href="/auth/login" className="inline-flex items-center justify-center w-full h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast">Sign in</Link>
            </>
          ),
        };
      case "expired":
        return {
          title: "This activation link expired",
          subtitle: "Activation links are valid for 24 hours. We can send you a fresh one.",
          body: (
            <PrimaryButton onClick={() => location.assign(`/api/auth/resend-activation?token=${encodeURIComponent(token)}`)}>
              <Mail className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} aria-hidden /> Resend activation email
            </PrimaryButton>
          ),
        };
      case "error":
      default:
        return {
          title: "Couldn't activate your account",
          subtitle: "Something went wrong. Try again or contact support if it persists.",
          body: (
            <div className="rounded-md border border-error-border bg-error-subtle px-3 py-2 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <p className="font-body text-[12.5px] text-error-text flex-1">Activation request failed.</p>
            </div>
          ),
        };
    }
  })();

  return (
    <AuthShell>
      <AuthCard eyebrow="Account activation" title={card.title} subtitle={card.subtitle}>
        {card.body}
      </AuthCard>
    </AuthShell>
  );
}
