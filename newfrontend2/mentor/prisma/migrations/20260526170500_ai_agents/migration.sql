-- Migration M6 · ai_agents
-- Phase 1 foundations · doc 05 §5 + SOW §3.1.MVP.7
--
-- Adds Agent + PromptTemplate + PromptVersion + AgentInvocation.
-- Seeds the 4 MVP agents with their initial prompts.
--
-- Seed order matters (chicken/egg between Agent.activePromptId ↔
-- PromptVersion.id):
--   1. INSERT Agent (activePromptId = NULL)
--   2. INSERT PromptTemplate
--   3. INSERT PromptVersion
--   4. UPDATE Agent SET activePromptId = <version id>

-- ─────────────────────────────────────────────────────────────────────
-- Agent
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "modelId" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "activePromptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────────────
-- PromptTemplate
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromptTemplate_agentId_name_key"
  ON "PromptTemplate"("agentId", "name");
CREATE INDEX "PromptTemplate_agentId_idx" ON "PromptTemplate"("agentId");

ALTER TABLE "PromptTemplate"
  ADD CONSTRAINT "PromptTemplate_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────
-- PromptVersion
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "promptTemplateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "expectedSchema" JSONB,
    "variables" TEXT[] NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromptVersion_promptTemplateId_version_key"
  ON "PromptVersion"("promptTemplateId", "version");
CREATE INDEX "PromptVersion_promptTemplateId_idx"
  ON "PromptVersion"("promptTemplateId");

ALTER TABLE "PromptVersion"
  ADD CONSTRAINT "PromptVersion_promptTemplateId_fkey"
  FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Agent.activePromptId FK (added after PromptVersion table exists)
ALTER TABLE "Agent"
  ADD CONSTRAINT "Agent_activePromptId_fkey"
  FOREIGN KEY ("activePromptId") REFERENCES "PromptVersion"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────
-- AgentInvocation
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE "AgentInvocation" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "promptVersionId" TEXT,
    "modelId" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "confidence" DOUBLE PRECISION,
    "latencyMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "costCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentInvocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentInvocation_requestId_key" ON "AgentInvocation"("requestId");
CREATE INDEX "AgentInvocation_agentId_createdAt_idx"
  ON "AgentInvocation"("agentId", "createdAt" DESC);
CREATE INDEX "AgentInvocation_tenantId_createdAt_idx"
  ON "AgentInvocation"("tenantId", "createdAt" DESC);
CREATE INDEX "AgentInvocation_actorUserId_createdAt_idx"
  ON "AgentInvocation"("actorUserId", "createdAt" DESC);
CREATE INDEX "AgentInvocation_status_idx" ON "AgentInvocation"("status");

ALTER TABLE "AgentInvocation"
  ADD CONSTRAINT "AgentInvocation_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgentInvocation"
  ADD CONSTRAINT "AgentInvocation_promptVersionId_fkey"
  FOREIGN KEY ("promptVersionId") REFERENCES "PromptVersion"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgentInvocation"
  ADD CONSTRAINT "AgentInvocation_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ═════════════════════════════════════════════════════════════════════
-- SEED: 4 MVP agents + their initial prompts
-- ═════════════════════════════════════════════════════════════════════

-- ─── Step 1: Agents ───
INSERT INTO "Agent" ("id", "name", "description", "isEnabled", "modelId", "updatedAt") VALUES
  ('sow-intake', 'SOW Intake Assistant',
   'Extracts SOW metadata (title, dates, stakeholders, deliverables), tags clauses (dependencies, assumptions, constraints), and flags hallucination risk',
   true, 'claude-haiku-4-5', CURRENT_TIMESTAMP),
  ('decomposition', 'Decomposition Assistant',
   'Suggests milestones and tasks for an approved SOW; tags skill requirements and dependencies; flags missing tasks',
   true, 'claude-sonnet-4-6', CURRENT_TIMESTAMP),
  ('contributor-support', 'Contributor Support Assistant',
   'Workroom AI signals — surfaces criteria progress, readiness score factors, and quiet observations',
   true, 'claude-haiku-4-5', CURRENT_TIMESTAMP),
  ('review-assistant', 'Review Assistant',
   'Pre-fills mentor rubric scores from evidence; computes confidence per criterion; identifies coverage gaps',
   true, 'claude-sonnet-4-6', CURRENT_TIMESTAMP);

-- ─── Step 2: Prompt templates (one per agent for the primary action) ───
INSERT INTO "PromptTemplate" ("id", "agentId", "name", "description", "updatedAt") VALUES
  ('pt-sow-intake-extract',  'sow-intake',          'extract',      'Primary extraction prompt for SOW intake',                CURRENT_TIMESTAMP),
  ('pt-decomp-suggest',      'decomposition',       'suggest',      'Primary task-suggestion prompt for decomposition',        CURRENT_TIMESTAMP),
  ('pt-contrib-signals',     'contributor-support', 'signals',      'Workroom AI signals prompt',                              CURRENT_TIMESTAMP),
  ('pt-review-score-rubric', 'review-assistant',    'score-rubric', 'Primary rubric pre-fill prompt for mentor review',        CURRENT_TIMESTAMP);

-- ─── Step 3: Initial prompt versions (v1 each) ───
INSERT INTO "PromptVersion" (
  "id", "promptTemplateId", "version", "body", "variables", "notes"
) VALUES
  ('pv-sow-intake-v1', 'pt-sow-intake-extract', 1,
   'You are a SOW intake assistant. Extract structured metadata from the uploaded SOW document. Return JSON with: title, dates, sponsor, stakeholders, deliverables, clauses (dependencies/assumptions/constraints), risk flags.',
   '{sowDocText}',
   'Initial v1 — Phase 1 baseline'),
  ('pv-decomp-v1', 'pt-decomp-suggest', 1,
   'You are a decomposition assistant. Given an approved SOW, suggest a milestone + task graph. For each task: name, brief, acceptance criteria, skill tags, effort estimate (hours), dependencies. Flag missing tasks the SOW implies but doesn''t list.',
   '{sowSummary}',
   'Initial v1 — Phase 1 baseline. sponsorConstraints is accepted but optional.'),
  ('pv-contrib-signals-v1', 'pt-contrib-signals', 1,
   'You are a contributor support assistant. Given the current workroom state (task, criteria addressed, evidence uploaded), produce up to 3 quiet observations the contributor should consider. Each observation must be actionable and non-alarming.',
   '{taskState,criteria,evidence}',
   'Initial v1 — Phase 1 baseline'),
  ('pv-review-score-v1', 'pt-review-score-rubric', 1,
   'You are a review assistant. Pre-fill rubric scores (1-5) for each criterion based on the submission evidence. For each criterion: criterionId, suggested score, confidence (0-1), sources (which evidence informed the score), coverage gaps (what couldn''t be checked automatically).',
   '{taskBrief,criteria,evidence}',
   'Initial v1 — Phase 1 baseline. contributorDigitalTwin is accepted but optional.');

-- ─── Step 4: Activate the v1 prompts on each agent ───
UPDATE "Agent" SET "activePromptId" = 'pv-sow-intake-v1'       WHERE "id" = 'sow-intake';
UPDATE "Agent" SET "activePromptId" = 'pv-decomp-v1'           WHERE "id" = 'decomposition';
UPDATE "Agent" SET "activePromptId" = 'pv-contrib-signals-v1'  WHERE "id" = 'contributor-support';
UPDATE "Agent" SET "activePromptId" = 'pv-review-score-v1'     WHERE "id" = 'review-assistant';
