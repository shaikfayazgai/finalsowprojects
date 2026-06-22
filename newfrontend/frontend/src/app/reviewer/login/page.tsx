"use client";

/**
 * Reviewer sign-in route — /reviewer/login.
 * Dedicated reviewer portal entry, modelled on the admin login pattern:
 * login + forgot-password only (no self-registration, no OAuth).
 */

import * as React from "react";
import { ReviewerLoginScreen } from "./_components/reviewer-login-screen";

export default function ReviewerLoginPage() {
  return (
    <React.Suspense fallback={<ReviewerLoginFallback />}>
      <ReviewerLoginScreen />
    </React.Suspense>
  );
}

function ReviewerLoginFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface">
      <span
        className="h-6 w-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}
