-- AcceptanceDecision: audit log of enterprise acceptance/rework decisions
CREATE TABLE "AcceptanceDecision" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "note" TEXT,
    "deciderId" TEXT,
    "deciderInitials" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcceptanceDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AcceptanceDecision_taskId_decidedAt_idx" ON "AcceptanceDecision"("taskId", "decidedAt");
CREATE INDEX "AcceptanceDecision_deciderId_idx" ON "AcceptanceDecision"("deciderId");
