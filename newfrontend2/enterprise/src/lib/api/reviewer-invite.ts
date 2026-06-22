/**
 * Reviewer self-register invite API client.
 */

export interface CreateReviewerInviteInput {
  email: string;
  note?: string;
}

export interface CreateReviewerInviteResult {
  code: string;
  registerUrl: string;
  email: string;
  expiresAt: string;
  emailSent: boolean;
}

export async function createReviewerInvite(
  input: CreateReviewerInviteInput,
): Promise<CreateReviewerInviteResult> {
  const res = await fetch("/api/reviewers/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as CreateReviewerInviteResult & {
    message?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not send reviewer invite.");
  }
  return data;
}
