import type { Prisma } from "@/generated/prisma/client";
import type { SessionDetail } from "./types";

type Tx = Prisma.TransactionClient;

export interface SessionDetailEnriched extends SessionDetail {
  contributorName: string;
  contributorTitle: string | null;
  contributorCountry: string | null;
  focus: string;
  externalLink: string | null;
  durationMin: number;
}

export async function enrichSessions(
  tx: Tx,
  sessions: SessionDetail[],
): Promise<SessionDetailEnriched[]> {
  if (sessions.length === 0) return [];
  const contributorIds = [...new Set(sessions.map((s) => s.contributorId))];
  const users = await tx.user.findMany({
    where: { id: { in: contributorIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      contributorProfile: {
        select: {
          primarySkills: true,
          country: true,
          contribType: true,
        },
      },
    },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return sessions.map((s) => {
    const u = byId.get(s.contributorId);
    const name = u
      ? [u.firstName, u.lastName].filter(Boolean).join(" ") || "Contributor"
      : "Contributor";
    const skills = u?.contributorProfile?.primarySkills ?? [];
    const title =
      skills.length > 0 ? skills.slice(0, 2).join(" · ") : u?.contributorProfile?.contribType ?? null;

    return {
      ...s,
      contributorName: name,
      contributorTitle: title,
      contributorCountry: u?.contributorProfile?.country ?? null,
      focus: s.agenda ?? "Peer mentorship",
      externalLink: s.meetingLink,
      durationMin: s.durationMinutes,
    };
  });
}

export async function enrichSession(
  tx: Tx,
  session: SessionDetail,
): Promise<SessionDetailEnriched> {
  const [enriched] = await enrichSessions(tx, [session]);
  return enriched!;
}
