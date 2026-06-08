/**
 * Mentorship domain types (M21).
 *
 * Sessions are scheduled mentor↔contributor meetings. Notes are
 * coaching write-ups attached to a session (or standalone on the
 * contributor's profile). Visibility controls who sees a note:
 *
 *   private  — mentor-only working notes
 *   shared   — visible to the contributor (their mentorship history)
 *   public   — visible on the contributor's public profile / credentials
 */

export type SessionStatus = "scheduled" | "held" | "no_show" | "cancelled";
export type NoteVisibility = "private" | "shared" | "public";

export interface SessionDetail {
  id: string;
  mentorId: string;
  contributorId: string;
  tenantId: string | null;
  scheduledAt: string;
  durationMinutes: number;
  agenda: string | null;
  meetingLink: string | null;
  timezone: string | null;
  status: SessionStatus;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  noShowAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDetail {
  id: string;
  sessionId: string | null;
  mentorId: string;
  contributorId: string;
  tenantId: string | null;
  body: string;
  visibility: NoteVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSessionInput {
  mentorId: string;
  contributorId: string;
  tenantId?: string | null;
  scheduledAt: string; // ISO
  durationMinutes?: number;
  agenda?: string;
  meetingLink?: string;
  timezone?: string;
}

export interface WriteNoteInput {
  /** Optional — attach to a session. */
  sessionId?: string;
  /** Required when sessionId omitted. */
  contributorId?: string;
  body: string;
  visibility: NoteVisibility;
  tenantId?: string | null;
}
