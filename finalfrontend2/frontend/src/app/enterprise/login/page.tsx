"use client";

/**
 * Enterprise admin sign-in. Credential-only (provisioned accounts) —
 * email/password + Forgot password. No SSO, no self-signup.
 */

import * as React from "react";
import { RoleLoginForm } from "@/components/auth/role-login-form";
import { LoginLoading } from "@/app/auth/login/_components/login-loading";

export default function EnterpriseLoginPage() {
  return (
    <React.Suspense fallback={<LoginLoading />}>
      <RoleLoginForm
        title="Enterprise sign in"
        subtitle="Sign in to your enterprise workspace"
        showSso={false}
        allowSignup={false}
      />
    </React.Suspense>
  );
}
