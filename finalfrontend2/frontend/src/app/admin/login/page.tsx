"use client";

/**
 * Super Admin sign-in. Credential-only (platform operators) —
 * email/password + Forgot password. No SSO, no self-signup.
 */

import * as React from "react";
import { RoleLoginForm } from "@/components/auth/role-login-form";
import { LoginLoading } from "@/app/auth/login/_components/login-loading";

export default function AdminLoginPage() {
  return (
    <React.Suspense fallback={<LoginLoading />}>
      <RoleLoginForm
        title="Platform sign in"
        subtitle="Sign in to the operations console"
        showSso={false}
        allowSignup={false}
      />
    </React.Suspense>
  );
}
