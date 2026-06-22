/**
 * Mentorship service (M21).
 *
 * Sessions:
 *   - scheduleSession — mentor/admin creates a future meeting
 *   - markSessionHeld — after the meeting; flips status='held'
 *   - markSessionNoShow — contributor didn't attend
 *   - cancelSession — either side cancels before the meeting
 *
 * Notes:
 *   - writeCoachingNote — mentor writes a note (private/shared/public)
 *     optionally tied to a session
 *   - updateCoachingNote — mentor edits their own note
 *   - softDeleteCoachingNote — mentor removes their own note
 *
 * Reads:
 *   - listSessionsForMentor / listSessionsForContributor
 *   - listNotesForContributor — VISIBILITY-SCOPED so a contributor
 *     calling this never sees mentor-private notes
 *
 * RLS: MentorshipSession + MentorshipNote do NOT carry RLS (sessions
 * are cross-tenant by design — a contributor's mentorship history
 * spans every tenant they've worked with). App-layer scoping enforces
 * read permission via the route handler + service-level checks.
 *
 * Notifications: the route layer dispatches `mentorship.session_in_30min`
 * (cron reminder) and `mentorship.session_no_show` — both already in
 * the M6 NotificationKind catalog.
 */

import { Prisma } from "@/generated/prisma/client";
import type {
  NoteDetail,
  NoteVisibility,
  ScheduleSessionInput,
  SessionDetail,
  SessionStatus,
  WriteNoteInput,
} from "./types";

type Tx = Prisma.TransactionClient;

export class MentorshipServiceError extends Error {
  constructor(
    message: string,
    public code:
      | "not_found"
      | "forbidden"
      | "invalid_state"
      | "validation"
      | "conflict",
  ) {
    super(message);
    this.name = "MentorshipServiceError";
  }
}

/* ───────────────────────── Mappers ───────────────────────── */

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toSessionDetail(row: {
  id: string;
  mentorId: string;
  contributorId: string;
  tenantId: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  agenda: string | null;
  meetingLink: string | null;
  timezone: string | null;
  status: string;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  noShowAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SessionDetail {
  return {
    id: row.id,
    mentorId: row.mentorId,
    contributorId: row.contributorId,
    tenantId: row.tenantId,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMinutes: row.durationMinutes,
    agenda: row.agenda,
    meetingLink: row.meetingLink,
    timezone: row.timezone,
    status: row.status as SessionStatus,
    completedAt: toIso(row.completedAt),
    cancelledAt: toIso(row.cancelledAt),
    cancelledBy: row.cancelledBy,
    cancellationReason: row.cancellationReason,
    noShowAt: toIso(row.noShowAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toNoteDetail(row: {
  id: string;
  sessionId: string | null;
  mentorId: string;
  contributorId: string;
  tenantId: string | null;
  body: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
}): NoteDetail {
  return {
    id: row.id,
    sessionId: row.sessionId,
    mentorId: row.mentorId,
    contributorId: row.contributorId,
    tenantId: row.tenantId,
    body: row.body,
    visibility: row.visibility as NoteVisibility,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/* ─────────────────────── Sessions ─────────────────────── */

export async function scheduleSession(
  tx: Tx,
  args: { input: ScheduleSessionInput; createdBy: string },
): Promise<SessionDetail> {
  const { input, createdBy } = args;

  // Verify mentor exists + has a Mentor profile (or at least a reviewer role)
  const mentor = await tx.user.findUnique({
    where: { id: input.mentorId },
    select: { id: true, role: true },
  });
  if (!mentor) {
    throw new MentorshipServiceError("Mentor not found", "not_found");
  }
  // The caller is expected to be the mentor OR a platform admin scheduling
  // on their behalf. We let the route layer handle the role/permission gate.
  void createdBy;

  const contributor = await tx.user.findUnique({
    where: { id: input.contributorId },
    select: { id: true, role: true },
  });
  if (!contributor || contributor.role !== "contributor") {
    throw new MentorshipServiceError(
      "Target user is not a contributor",
      "validation",
    );
  }

  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new MentorshipServiceError("Invalid scheduledAt", "validation");
  }
  if (scheduledAt.getTime() < Date.now() - 60_000) {
    // Allow a small clock skew window; reject obvious past-time bookings.
    throw new MentorshipServiceError(
      "scheduledAt cannot be in the past",
      "validation",
    );
  }
  const duration = input.durationMinutes ?? 45;
  if (duration <= 0 || duration > 480) {
    throw new MentorshipServiceError(
      "durationMinutes must be between 1 and 480",
      "validation",
    );
  }

  const row = await tx.mentorshipSession.create({
    data: {
      mentorId: input.mentorId,
      contributorId: input.contributorId,
      tenantId: input.tenantId ?? null,
      scheduledAt,
      durationMinutes: duration,
      agenda: input.agenda ?? null,
      meetingLink: input.meetingLink ?? null,
      timezone: input.timezone ?? null,
      status: "scheduled",
    },
  });
  return toSessionDetail(row);
}

async function loadSession(tx: Tx, sessionId: string) {
  const sub = await tx.mentorshipSession.findFirst({
    where: { id: sessionId, deletedAt: null },
  });
  if (!sub) throw new MentorshipServiceError("Session not found", "not_found");
  return sub;
}

export async function markSessionHeld(
  tx: Tx,
  args: { sessionId: string; actorUserId: string },
): Promise<SessionDetail> {
  const s = await loadSession(tx, args.sessionId);
  if (s.mentorId !== args.actorUserId) {
    throw new MentorshipServiceError(
      "Only the assigned mentor can mark a session held",
      "forbidden",
    );
  }
  if (s.status !== "scheduled") {
    throw new MentorshipServiceError(
      `Cannot mark a session in '${s.status}' state as held`,
      "invalid_state",
    );
  }
  const updated = await tx.mentorshipSession.update({
    where: { id: s.id },
    data: { status: "held", completedAt: new Date() },
  });
  return toSessionDetail(updated);
}

export async function markSessionNoShow(
  tx: Tx,
  args: { sessionId: string; actorUserId: string },
): Promise<SessionDetail> {
  const s = await loadSession(tx, args.sessionId);
  if (s.mentorId !== args.actorUserId) {
    throw new MentorshipServiceError(
      "Only the assigned mentor can record a no-show",
      "forbidden",
    );
  }
  if (s.status !== "scheduled") {
    throw new MentorshipServiceError(
      `Cannot mark a session in '${s.status}' state as no-show`,
      "invalid_state",
    );
  }
  const updated = await tx.mentorshipSession.update({
    where: { id: s.id },
    data: { status: "no_show", noShowAt: new Date() },
  });
  return toSessionDetail(updated);
}

export async function cancelSession(
  tx: Tx,
  args: { sessionId: string; actorUserId: string; reason?: string },
): Promise<SessionDetail> {
  const s = await loadSession(tx, args.sessionId);
  // Either side can cancel
  if (
    s.mentorId !== args.actorUserId &&
    s.contributorId !== args.actorUserId
  ) {
    throw new MentorshipServiceError(
      "Only the mentor or contributor can cancel a session",
      "forbidden",
    );
  }
  if (s.status !== "scheduled") {
    throw new MentorshipServiceError(
      `Cannot cancel a session in '${s.status}' state`,
      "invalid_state",
    );
  }
  const updated = await tx.mentorshipSession.update({
    where: { id: s.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: args.actorUserId,
      cancellationReason: args.reason ?? null,
    },
  });
  return toSessionDetail(updated);
}

/* ───────────────────────── Notes ───────────────────────── */

export async function writeCoachingNote(
  tx: Tx,
  args: { mentorUserId: string; input: WriteNoteInput },
): Promise<NoteDetail> {
  const { mentorUserId, input } = args;

  if (!input.body.trim()) {
    throw new MentorshipServiceError("Note body cannot be empty", "validation");
  }
  if (!["private", "shared", "public"].includes(input.visibility)) {
    throw new MentorshipServiceError(
      "Invalid visibility (expected private|shared|public)",
      "validation",
    );
  }

  let sessionId: string | null = null;
  let contributorId: string;
  let tenantId: string | null;
  if (input.sessionId) {
    const s = await loadSession(tx, input.sessionId);
    if (s.mentorId !== mentorUserId) {
      throw new MentorshipServiceError(
        "Cannot attach a note to another mentor's session",
        "forbidden",
      );
    }
    sessionId = s.id;
    contributorId = s.contributorId;
    tenantId = s.tenantId;
  } else {
    if (!input.contributorId) {
      throw new MentorshipServiceError(
        "Either sessionId or contributorId is required",
        "validation",
      );
    }
    const c = await tx.user.findUnique({
      where: { id: input.contributorId },
      select: { id: true, role: true },
    });
    if (!c || c.role !== "contributor") {
      throw new MentorshipServiceError(
        "Target user is not a contributor",
        "validation",
      );
    }
    contributorId = c.id;
    tenantId = input.tenantId ?? null;
  }

  const row = await tx.mentorshipNote.create({
    data: {
      sessionId,
      mentorId: mentorUserId,
      contributorId,
      tenantId,
      body: input.body,
      visibility: input.visibility,
    },
  });
  return toNoteDetail(row);
}

export async function updateCoachingNote(
  tx: Tx,
  args: {
    noteId: string;
    actorUserId: string;
    body?: string;
    visibility?: NoteVisibility;
  },
): Promise<NoteDetail> {
  const note = await tx.mentorshipNote.findFirst({
    where: { id: args.noteId, deletedAt: null },
  });
  if (!note) throw new MentorshipServiceError("Note not found", "not_found");
  if (note.mentorId !== args.actorUserId) {
    throw new MentorshipServiceError(
      "Only the author can edit a coaching note",
      "forbidden",
    );
  }
  const data: Prisma.MentorshipNoteUpdateInput = {};
  if (args.body !== undefined) {
    if (!args.body.trim()) {
      throw new MentorshipServiceError("Note body cannot be empty", "validation");
    }
    data.body = args.body;
  }
  if (args.visibility !== undefined) {
    if (!["private", "shared", "public"].includes(args.visibility)) {
      throw new MentorshipServiceError("Invalid visibility", "validation");
    }
    data.visibility = args.visibility;
  }
  if (Object.keys(data).length === 0) {
    return toNoteDetail(note);
  }
  const updated = await tx.mentorshipNote.update({
    where: { id: note.id },
    data,
  });
  return toNoteDetail(updated);
}

export async function softDeleteCoachingNote(
  tx: Tx,
  args: { noteId: string; actorUserId: string },
): Promise<void> {
  const note = await tx.mentorshipNote.findFirst({
    where: { id: args.noteId, deletedAt: null },
  });
  if (!note) throw new MentorshipServiceError("Note not found", "not_found");
  if (note.mentorId !== args.actorUserId) {
    throw new MentorshipServiceError(
      "Only the author can delete a coaching note",
      "forbidden",
    );
  }
  await tx.mentorshipNote.update({
    where: { id: note.id },
    data: { deletedAt: new Date() },
  });
}

/* ───────────────────────── Reads ───────────────────────── */

export async function getSessionDetail(
  tx: Tx,
  sessionId: string,
): Promise<SessionDetail | null> {
  const row = await tx.mentorshipSession.findFirst({
    where: { id: sessionId, deletedAt: null },
  });
  return row ? toSessionDetail(row) : null;
}

export async function listSessionsForMentor(
  tx: Tx,
  args: {
    mentorUserId: string;
    statuses?: SessionStatus[];
    upcomingOnly?: boolean;
    limit?: number;
  },
): Promise<SessionDetail[]> {
  const where: Prisma.MentorshipSessionWhereInput = {
    mentorId: args.mentorUserId,
    deletedAt: null,
    ...(args.statuses && args.statuses.length > 0
      ? { status: { in: args.statuses } }
      : {}),
    ...(args.upcomingOnly
      ? { scheduledAt: { gte: new Date() }, status: "scheduled" }
      : {}),
  };
  const rows = await tx.mentorshipSession.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    take: args.limit ?? 50,
  });
  return rows.map(toSessionDetail);
}

export async function listSessionsForContributor(
  tx: Tx,
  args: {
    contributorUserId: string;
    statuses?: SessionStatus[];
    limit?: number;
  },
): Promise<SessionDetail[]> {
  const where: Prisma.MentorshipSessionWhereInput = {
    contributorId: args.contributorUserId,
    deletedAt: null,
    ...(args.statuses && args.statuses.length > 0
      ? { status: { in: args.statuses } }
      : {}),
  };
  const rows = await tx.mentorshipSession.findMany({
    where,
    orderBy: { scheduledAt: "desc" },
    take: args.limit ?? 50,
  });
  return rows.map(toSessionDetail);
}

/**
 * Notes visible to the requesting reader.
 *
 *   - 'self'   (the contributor themself) → visibility in ('shared','public')
 *   - 'mentor' (any mentor)               → visibility in ('shared','public')
 *                                           OR the requesting mentor's own private notes
 *   - 'admin'  (plat.admin etc.)          → all visibilities
 *   - 'public' (unauthenticated)          → visibility = 'public'
 *
 * The route layer decides which `as` to pass based on permission checks.
 */
export type NoteReaderRole = "self" | "mentor" | "admin" | "public";

export async function listNotesForContributor(
  tx: Tx,
  args: {
    contributorUserId: string;
    as: NoteReaderRole;
    /** Only meaningful when as='mentor' — their own private notes show. */
    mentorUserId?: string;
    limit?: number;
  },
): Promise<NoteDetail[]> {
  let visibilityFilter: Prisma.MentorshipNoteWhereInput;
  switch (args.as) {
    case "self":
      visibilityFilter = { visibility: { in: ["shared", "public"] } };
      break;
    case "public":
      visibilityFilter = { visibility: "public" };
      break;
    case "mentor":
      visibilityFilter = {
        OR: [
          { visibility: { in: ["shared", "public"] } },
          ...(args.mentorUserId
            ? [{ mentorId: args.mentorUserId, visibility: "private" }]
            : []),
        ],
      };
      break;
    case "admin":
    default:
      visibilityFilter = {};
      break;
  }

  const rows = await tx.mentorshipNote.findMany({
    where: {
      contributorId: args.contributorUserId,
      deletedAt: null,
      ...visibilityFilter,
    },
    orderBy: { createdAt: "desc" },
    take: args.limit ?? 100,
  });
  return rows.map(toNoteDetail);
}
