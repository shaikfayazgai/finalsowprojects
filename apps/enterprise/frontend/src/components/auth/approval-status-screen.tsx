"use client";

import { signOut } from "next-auth/react";
import { Clock, XCircle } from "lucide-react";

/**
 * Hard status wall for approval-gated accounts (women / approval-required
 * contributor tracks). Shown instead of any portal/onboarding content until a
 * Super Admin approves the KYC. Shared by the contributor layout and the
 * /onboarding layout so a pending user can't slip in via any route.
 */
export function ApprovalStatusScreen({ status }: { status: string }) {
  const rejected = status === "rejected";
  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div
        className={
          rejected
            ? "h-12 w-12 rounded-full bg-error-subtle flex items-center justify-center"
            : "h-12 w-12 rounded-full bg-warning-subtle flex items-center justify-center"
        }
      >
        {rejected ? (
          <XCircle className="h-6 w-6 text-error-text" strokeWidth={2} aria-hidden />
        ) : (
          <Clock className="h-6 w-6 text-warning-text" strokeWidth={2} aria-hidden />
        )}
      </div>
      <div className="max-w-md space-y-1.5">
        <h1 className="font-display text-[20px] font-semibold text-foreground">
          {rejected ? "Application not approved" : "Application under review"}
        </h1>
        <p className="font-body text-[13px] text-text-secondary leading-relaxed">
          {rejected
            ? "Your application wasn't approved. Please contact the Glimmora team if you believe this is a mistake."
            : "Thanks for applying. A Glimmora reviewer is verifying your details. You'll get access to your dashboard once your application is approved."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/contributor/login" })}
        className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-stroke bg-surface font-body text-[13px] font-semibold text-foreground hover:bg-bg-subtle transition-colors duration-fast"
      >
        Sign out
      </button>
    </div>
  );
}
