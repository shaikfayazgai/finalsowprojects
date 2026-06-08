"use client";

/**
 * Provision a platform user (enterprise admin, mentor, reviewer, etc.) with a
 * RANDOM temp password emailed to them. First sign-in forces a password reset.
 * No invite URLs — credential-based per the locked auth model.
 *
 * Calls the real backend superadmin users endpoint via /api/superadmin/users.
 */

export interface ProvisionUserInput {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: string; // "enterprise" | "mentor" | "reviewer" | "contributor" | ...
  tenantId?: string;
  department?: string;
}

export interface ProvisionUserResult {
  ok: boolean;
  emailSent?: boolean;
  /** Surfaced only when the backend couldn't email it (fallback to show). */
  tempPassword?: string;
  mustChangePassword?: boolean;
  error?: string;
}

export async function provisionUser(input: ProvisionUserInput): Promise<ProvisionUserResult> {
  try {
    const res = await fetch("/api/superadmin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, sendCredentials: true }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error:
          (typeof data.detail === "string" && data.detail) ||
          (typeof data.error === "string" && data.error) ||
          `HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      emailSent: data.emailSent === true,
      tempPassword: typeof data.tempPassword === "string" ? data.tempPassword : undefined,
      mustChangePassword: data.mustChangePassword === true,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}
