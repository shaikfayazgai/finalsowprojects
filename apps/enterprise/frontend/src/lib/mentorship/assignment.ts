/**
 * System assignment: contributor opt-in → pick mentor → schedule session.
 */

import type { Prisma } from "@/generated/prisma/client";
import {
  MentorshipServiceError,
  getSessionDetail,
  scheduleSession,
} from "./service";
import type { SessionDetail } from "./types";

type Tx = Prisma.TransactionClient;

const DEFAULT_MEETING_LINK = "https://meet.google.com/glimmora-mentorship";
const PREFERRED_MENTOR_EMAIL = "priya@glimmora.team";

function nextSessionSlot(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(14, 0, 0, 0);
  return d;
}

/** Pick an active mentor willing to take sessions. */
export async function findBestMentorForContributor(
  tx: Tx,
  contributorUserId: string,
): Promise<string | null> {
  const profile = await tx.contributorProfile.findUnique({
    where: { userId: contributorUserId },
    select: { primarySkills: true },
  });
  const skills = new Set((profile?.primarySkills ?? []).map((s) => s.toLowerCase()));

  const mentors = await tx.mentor.findMany({
    where: { status: "active", acceptsMentorshipSessions: true },
    include: {
      user: { select: { id: true, email: true } },
      skills: { include: { skill: { select: { name: true } } } },
    },
  });

  if (mentors.length === 0) return null;

  const preferred = mentors.find((m) => m.user.email === PREFERRED_MENTOR_EMAIL);
  if (preferred) return preferred.userId;

  let bestId = mentors[0]!.userId;
  let bestScore = -1;
  for (const m of mentors) {
    const mentorSkills = m.skills.map((s) => s.skill.name.toLowerCase());
    const overlap = mentorSkills.filter((s) => skills.has(s)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestId = m.userId;
    }
  }
  return bestId;
}

export async function assignMentorshipSession(
  tx: Tx,
  args: {
    contributorUserId: string;
    focus?: string | null;
    createdBy: string;
  },
): Promise<SessionDetail> {
  const existing = await tx.mentorshipSession.findFirst({
    where: {
      contributorId: args.contributorUserId,
      status: "scheduled",
      deletedAt: null,
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
  });
  if (existing) {
    const detail = await getSessionDetail(tx, existing.id);
    if (detail) return detail;
  }

  const mentorUserId = await findBestMentorForContributor(tx, args.contributorUserId);
  if (!mentorUserId) {
    throw new MentorshipServiceError(
      "No mentors available for assignment",
      "conflict",
    );
  }

  const mentor = await tx.mentor.findUnique({
    where: { userId: mentorUserId },
    select: { timezone: true },
  });

  return scheduleSession(tx, {
    createdBy: args.createdBy,
    input: {
      mentorId: mentorUserId,
      contributorId: args.contributorUserId,
      scheduledAt: nextSessionSlot().toISOString(),
      durationMinutes: 45,
      agenda: args.focus?.trim() || "Peer mentorship — skills growth and submission quality",
      meetingLink: DEFAULT_MEETING_LINK,
      timezone: mentor?.timezone ?? "Asia/Kolkata",
    },
  });
}
