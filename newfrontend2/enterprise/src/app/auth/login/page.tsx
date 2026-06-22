"use client";

/**
 * Sign-in — centered card, email-first (SSO-first for enterprise invites).
 */

import * as React from "react";
import { LoginScreen } from "./_components/login-screen";
import { LoginLoading } from "./_components/login-loading";

export default function LoginPage() {
  return (
    <React.Suspense fallback={<LoginLoading />}>
      <LoginScreen />
    </React.Suspense>
  );
}
