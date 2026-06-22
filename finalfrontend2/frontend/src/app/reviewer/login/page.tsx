"use client";

/**
 * Reviewer sign-in. Credential-only (enterprise-provisioned) —
 * email/password + Forgot password. No SSO, no self-signup.
 * The reviewer workspace lives under /enterprise/reviewer.
 */

import * as React from "react";
import { RoleLoginForm } from "@/components/auth/role-login-form";
import { LoginLoading } from "@/app/auth/login/_components/login-loading";

export default function ReviewerLoginPage() {
  return (
    <React.Suspense fallback={<LoginLoading />}>
      <RoleLoginForm
        title="Reviewer sign in"
        subtitle="Sign in to your QA review workspace"
        showSso={false}
        allowSignup={false}
      />
    </React.Suspense>
  );
}
