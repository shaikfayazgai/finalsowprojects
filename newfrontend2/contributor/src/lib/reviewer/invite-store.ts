/**
 * Pending reviewer self-register invites (Option 2).
 * In-memory for dev — survives HMR within the same Node process.
 */

import { mintInviteToken } from "@/lib/admin/invite-routes";

export type ReviewerInviteStatus = "pending" | "accepted" | "expired";

export interface ReviewerInvite {
  code: string;
  email: string;
  tenantId: string;
  invitedByUserId: string;
  invitedByName: string;
  invitedByEmail: string;
  orgName: string;
  note?: string;
  status: ReviewerInviteStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

const globalKey = "__glimmoraReviewerInviteStore" as const;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getStore(): Map<string, ReviewerInvite> {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: Map<string, ReviewerInvite>;
  };
  if (!g[globalKey]) {
    g[globalKey] = new Map();
  }
  return g[globalKey]!;
}

function purgeExpired(store: Map<string, ReviewerInvite>) {
  const now = Date.now();
  for (const [code, invite] of store) {
    if (invite.status === "pending" && new Date(invite.expiresAt).getTime() < now) {
      store.set(code, { ...invite, status: "expired" });
    }
  }
}

export function createReviewerInvite(input: {
  email: string;
  tenantId: string;
  invitedByUserId: string;
  invitedByName: string;
  invitedByEmail: string;
  orgName: string;
  note?: string;
}): ReviewerInvite {
  const store = getStore();
  purgeExpired(store);

  const email = input.email.trim().toLowerCase();
  for (const invite of store.values()) {
    if (invite.email === email && invite.status === "pending") {
      throw new Error("A pending reviewer invite already exists for this email.");
    }
  }

  const code = mintInviteToken();
  const now = new Date();
  const invite: ReviewerInvite = {
    code,
    email,
    tenantId: input.tenantId,
    invitedByUserId: input.invitedByUserId,
    invitedByName: input.invitedByName,
    invitedByEmail: input.invitedByEmail,
    orgName: input.orgName,
    note: input.note?.trim() || undefined,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + INVITE_TTL_MS).toISOString(),
  };

  store.set(code, invite);
  return invite;
}

export function getReviewerInvite(code: string): ReviewerInvite | undefined {
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

export function acceptReviewerInvite(code: string): ReviewerInvite {
  const store = getStore();
  const invite = getReviewerInvite(code);
  if (!invite) {
    throw new Error("Invalid or unknown invite code.");
  }
  if (invite.status === "accepted") {
    throw new Error("This invite has already been used.");
  }
  if (invite.status === "expired") {
    throw new Error("This invite has expired. Ask your admin to send a new one.");
  }

  const accepted: ReviewerInvite = {
    ...invite,
    status: "accepted",
    acceptedAt: new Date().toISOString(),
  };
  store.set(code, accepted);
  return accepted;
}
