import { fetchInternal } from "@/lib/api/client";
import type { ContributorAccountAuth } from "@/lib/contributor/account-auth";

export type { ContributorAccountAuth };

export async function fetchContributorAccountAuth(): Promise<ContributorAccountAuth> {
  const res = await fetchInternal("/api/contributor/account-auth");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Account auth fetch failed (${res.status})`);
  }
  return res.json() as Promise<ContributorAccountAuth>;
}

export interface PasswordChangePayload {
  old_password?: string;
  new_password: string;
  confirmPassword: string;
}

export async function changeContributorAccountPassword(
  payload: PasswordChangePayload,
): Promise<void> {
  const res = await fetchInternal("/api/auth/password/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
  };
  if (!res.ok || body.success === false) {
    throw new Error(body.message ?? "Could not update password.");
  }
}
