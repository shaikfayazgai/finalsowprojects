"use client";

/**
 * Contributor sign-in route — /contributor/login.
 * Dedicated contributor portal entry, modelled on the reviewer/admin login:
 * authenticates against the real backend (so the session carries a backend
 * token), with a local-Prisma fallback. Login + forgot-password only.
 */

import * as React from "react";
import { ContributorLoginScreen } from "./_components/contributor-login-screen";

export default function ContributorLoginPage() {
  return (
    <React.Suspense fallback={<ContributorLoginFallback />}>
      <ContributorLoginScreen />
    </React.Suspense>
  );
}

function ContributorLoginFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface">
      <span
        className="h-6 w-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}
