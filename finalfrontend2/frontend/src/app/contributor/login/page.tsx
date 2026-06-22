"use client";

/**
 * Contributor sign-in (freelancers, women workforce, students).
 * Self-signup roles → email/password + Google + Microsoft SSO + Create account.
 */

import * as React from "react";
import { RoleLoginForm } from "@/components/auth/role-login-form";
import { LoginLoading } from "@/app/auth/login/_components/login-loading";

export default function ContributorLoginPage() {
  return (
    <React.Suspense fallback={<LoginLoading />}>
      <RoleLoginForm
        title="Welcome back"
        subtitle="Sign in to your contributor workspace"
        showSso
        allowSignup
      />
    </React.Suspense>
  );
}
