"use client";

/**
 * Mentor sign-in. Credential-only (Glimmora-provisioned) —
 * email/password + Forgot password. No SSO, no self-signup.
 */

import * as React from "react";
import { RoleLoginForm } from "@/components/auth/role-login-form";
import { LoginLoading } from "@/app/auth/login/_components/login-loading";

export default function MentorLoginPage() {
  return (
    <React.Suspense fallback={<LoginLoading />}>
      <RoleLoginForm
        title="Mentor sign in"
        subtitle="Sign in to your mentor workspace"
        showSso={false}
        allowSignup={false}
      />
    </React.Suspense>
  );
}
