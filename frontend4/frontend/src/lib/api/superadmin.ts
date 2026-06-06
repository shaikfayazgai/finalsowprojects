/**
 * Superadmin API client — user provisioning via platform backend.
 */

export interface CreateSuperadminUserInput {
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  [key: string]: unknown;
}

export async function createSuperadminUser(
  input: CreateSuperadminUserInput,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const res = await fetch("/api/superadmin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err =
      typeof data.error === "string"
        ? data.error
        : "Failed to create user";
    return { ok: false, error: err };
  }
  return { ok: true, data };
}
