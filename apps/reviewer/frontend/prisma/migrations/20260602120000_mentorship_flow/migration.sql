-- Mentorship flow: permissions, contributor opt-in, session tables (if missing)

-- Contributor opt-in fields
ALTER TABLE "ContributorProfile"
  ADD COLUMN IF NOT EXISTS "mentorshipOptInAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mentorshipFocus" TEXT;

-- Session + note tables (idempotent for dev DBs that already pushed schema)
CREATE TABLE IF NOT EXISTS "MentorshipSession" (
  "id" TEXT NOT NULL,
  "mentorId" TEXT NOT NULL,
  "contributorId" TEXT NOT NULL,
  "tenantId" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL DEFAULT 45,
  "agenda" TEXT,
  "meetingLink" TEXT,
  "timezone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancelledBy" TEXT,
  "cancellationReason" TEXT,
  "noShowAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MentorshipSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MentorshipNote" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT,
  "mentorId" TEXT NOT NULL,
  "contributorId" TEXT NOT NULL,
  "tenantId" TEXT,
  "body" TEXT NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'private',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MentorshipNote_pkey" PRIMARY KEY ("id")
);

-- Permissions
INSERT INTO "Permission" ("code", "resource", "action", "description") VALUES
  ('read.mentorship_session', 'mentorship_session', 'read', 'List and read mentorship sessions'),
  ('schedule.mentorship_session', 'mentorship_session', 'schedule', 'Schedule a mentorship session'),
  ('hold.mentorship_session', 'mentorship_session', 'hold', 'Mark session held, no-show, or cancel'),
  ('write.coaching_note', 'coaching_note', 'write', 'Write coaching notes for contributors'),
  ('request.mentorship', 'mentorship', 'request', 'Opt in to mentorship matching')
ON CONFLICT ("code") DO NOTHING;

-- Mentor roles
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('mentor', 'read.mentorship_session'),
  ('mentor', 'schedule.mentorship_session'),
  ('mentor', 'hold.mentorship_session'),
  ('mentor', 'write.coaching_note'),
  ('mentor.senior', 'read.mentorship_session'),
  ('mentor.senior', 'schedule.mentorship_session'),
  ('mentor.senior', 'hold.mentorship_session'),
  ('mentor.senior', 'write.coaching_note'),
  ('mentor.lead', 'read.mentorship_session'),
  ('mentor.lead', 'schedule.mentorship_session'),
  ('mentor.lead', 'hold.mentorship_session'),
  ('mentor.lead', 'write.coaching_note'),
  ('contributor', 'request.mentorship')
ON CONFLICT ("roleCode", "permissionCode") DO NOTHING;
