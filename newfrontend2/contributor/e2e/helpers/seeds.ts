import type { APIRequestContext } from "@playwright/test";

async function postJsonWithRetry(
  request: APIRequestContext,
  path: string,
  data: unknown,
  attempts = 3,
) {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await request.post(path, { data });
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 750 * (i + 1)));
      }
    }
  }
  throw lastError;
}

export async function createReviewerInvite(
  request: APIRequestContext,
  email: string,
): Promise<{ code: string; registerUrl: string }> {
  const res = await postJsonWithRetry(request, "/api/reviewers/invites", {
    email,
    note: "E2E reviewer invite",
  });
  if (!res.ok()) {
    throw new Error(`createReviewerInvite failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { code?: string; registerUrl?: string };
  if (!body.code) throw new Error("createReviewerInvite: missing code");
  return { code: body.code, registerUrl: body.registerUrl ?? "" };
}

export async function createMentorInvite(
  request: APIRequestContext,
  email: string,
): Promise<{ code: string; registerUrl: string }> {
  const res = await postJsonWithRetry(request, "/api/mentors/invites", {
    email,
    firstName: "E2E",
    lastName: "Mentor",
    mentorRoles: ["mentor"],
    poolIds: [],
  });
  if (!res.ok()) {
    throw new Error(`createMentorInvite failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { code?: string; registerUrl?: string };
  if (!body.code) throw new Error("createMentorInvite: missing code");
  return { code: body.code, registerUrl: body.registerUrl ?? "" };
}

export async function contributorMentorshipOptIn(request: APIRequestContext) {
  const res = await request.post("/api/contributor/mentorship/opt-in", {
    data: { focus: "E2E mentorship opt-in" },
  });
  return { ok: res.ok(), status: res.status(), body: await res.text() };
}
