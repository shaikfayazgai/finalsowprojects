"use client";

/**
 * Contributor portal sign-in. Reuses the shared LoginScreen (same UI/theme) scoped to
 * this portal. Role is still verified by the backend + enforced by proxy.ts.
 */
import * as React from "react";
import { LoginScreen } from "@/app/auth/login/_components/login-screen";
import { LoginLoading } from "@/app/auth/login/_components/login-loading";

export default function ContributorLoginPage() {
  return (
    <React.Suspense fallback={<LoginLoading />}>
      <LoginScreen portalLabel="Contributor" showOauth={true} />
    </React.Suspense>
  );
}
