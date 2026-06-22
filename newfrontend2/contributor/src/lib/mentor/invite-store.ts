/**
 * Pending mentor self-register invites (Option 2).
 */

import { mintInviteToken } from "@/lib/admin/invite-routes";

export type MentorInviteStatus = "pending" | "accepted" | "expired";

export interface MentorInvite {
  code: string;
  email: string;
  firstName?: string;
  lastName?: string;
  mentorRoles: string[];
  poolIds: string[];
  invitedByUserId: string;
  invitedByName: string;
  invitedByEmail: string;
  note?: string;
  status: MentorInviteStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

const globalKey = "__glimmoraMentorInviteStore" as const;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getStore(): Map<string, MentorInvite> {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: Map<string, MentorInvite>;
  };
  if (!g[globalKey]) g[globalKey] = new Map();
  return g[globalKey]!;
}

function purgeExpired(store: Map<string, MentorInvite>) {
  const now = Date.now();
  for (const [code, invite] of store) {
    if (invite.status === "pending" && new Date(invite.expiresAt).getTime() < now) {
      store.set(code, { ...invite, status: "expired" });
    }
  }
}

export function createMentorInvite(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  mentorRoles: string[];
  poolIds?: string[];
  invitedByUserId: string;
  invitedByName: string;
  invitedByEmail: string;
  note?: string;
}): MentorInvite {
  const store = getStore();
  purgeExpired(store);
  const email = input.email.trim().toLowerCase();
  for (const invite of store.values()) {
    if (invite.email === email && invite.status === "pending") {
      throw new Error("A pending mentor invite already exists for this email.");
    }
  }
  const code = mintInviteToken();
  const now = new Date();
  const invite: MentorInvite = {
    code,
    email,
    firstName: input.firstName?.trim(),
    lastName: input.lastName?.trim(),
    mentorRoles: input.mentorRoles.length ? input.mentorRoles : ["mentor"],
    poolIds: input.poolIds ?? [],
    invitedByUserId: input.invitedByUserId,
    invitedByName: input.invitedByName,
    invitedByEmail: input.invitedByEmail,
    note: input.note?.trim() || undefined,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + INVITE_TTL_MS).toISOString(),
  };
  store.set(code, invite);
  return invite;
}

export function getMentorInvite(code: string): MentorInvite | undefined {
  const store = getStore();
  purgeExpired(store);
  const invite = store.get(code.trim());
  if (!invite) return undefined;
  if (invite.status !== "pending") return invite;
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    const expired = { ...invite, status: "expired" as const };
    store.set(code, expired);
    return expired;
  }
  return invite;
}

export function acceptMentorInvite(code: string): MentorInvite {
  const invite = getMentorInvite(code);
  if (!invite) throw new Error("Invalid or unknown invite code.");
  if (invite.status === "accepted") throw new Error("This invite has already been used.");
  if (invite.status === "expired") throw new Error("This invite has expired.");
  const accepted: MentorInvite = {
    ...invite,
    status: "accepted",
    acceptedAt: new Date().toISOString(),
  };
  getStore().set(code.trim(), accepted);
  return accepted;
}
