/**
 * Admin mentor write actions — call the super-admin backend via the proxy
 * (/api/superadmin/mentors*). Used by the admin mentor pages (invite, status,
 * roles, competency). Each throws an Error with the backend's message on failure.
 */

import type { MockAdminMentor, MockCompetencyRow } from "@/mocks/admin/mentors";

async function readError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { detail?: string | { message?: string } };
  if (typeof body.detail === "string") return body.detail;
  return body.detail?.message ?? fallback;
}

export interface InviteMentorInput {
  name: string;
  email: string;
  country: string;
  roles: MockAdminMentor["roles"];
  note?: string;
}

export async function inviteMentor(input: InviteMentorInput): Promise<MockAdminMentor> {
  const res = await fetch("/api/superadmin/mentors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      country: input.country,
      roles: input.roles.length ? input.roles : ["mentor"],
    }),
  });
  if (!res.ok) throw new Error(await readError(res, "Couldn't invite the mentor. Please try again."));
  const data = (await res.json()) as { mentor?: MockAdminMentor };
  return (data.mentor ?? (data as MockAdminMentor));
}

async function patchMentor(id: string, patch: Record<string, unknown>): Promise<MockAdminMentor> {
  const res = await fetch(`/api/superadmin/mentors/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await readError(res, "Couldn't update the mentor. Please try again."));
  const data = (await res.json()) as { mentor?: MockAdminMentor };
  return (data.mentor ?? (data as MockAdminMentor));
}

export function pauseMentor(id: string): Promise<MockAdminMentor> {
  return patchMentor(id, { status: "paused" });
}

export function resumeMentor(id: string): Promise<MockAdminMentor> {
  return patchMentor(id, { status: "active" });
}

export function updateMentorRoles(id: string, roles: MockAdminMentor["roles"]): Promise<MockAdminMentor> {
  return patchMentor(id, { roles });
}

export interface ResendResult {
  emailSent?: boolean;
  tempPassword?: string;
}

export async function resendMentorInvite(id: string): Promise<ResendResult> {
  const res = await fetch(`/api/superadmin/mentors/${encodeURIComponent(id)}/resend`, { method: "POST" });
  if (!res.ok) throw new Error(await readError(res, "Couldn't resend the invite. Please try again."));
  return (await res.json().catch(() => ({}))) as ResendResult;
}

export async function deleteMentor(id: string): Promise<void> {
  const res = await fetch(`/api/superadmin/mentors/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readError(res, "Couldn't delete the mentor. Please try again."));
}

export async function saveMentorCompetencyApi(
  mentorId: string,
  rows: MockCompetencyRow[],
): Promise<MockCompetencyRow[]> {
  const res = await fetch(`/api/superadmin/mentors/${encodeURIComponent(mentorId)}/competency`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) throw new Error(await readError(res, "Couldn't save competency. Please try again."));
  const data = (await res.json()) as { competency?: MockCompetencyRow[] };
  return data.competency ?? rows;
}
