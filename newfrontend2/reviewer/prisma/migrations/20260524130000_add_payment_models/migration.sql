-- PaymentOrder: persisted order intent linked to the task being paid for
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "initiatedById" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'created',
    "receipt" TEXT,
    "notes" JSONB,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentOrder_razorpayOrderId_key" ON "PaymentOrder"("razorpayOrderId");
CREATE INDEX "PaymentOrder_taskId_idx" ON "PaymentOrder"("taskId");
CREATE INDEX "PaymentOrder_status_idx" ON "PaymentOrder"("status");
CREATE INDEX "PaymentOrder_initiatedById_idx" ON "PaymentOrder"("initiatedById");

-- PaymentEvent: idempotent webhook audit log
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "razorpayEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "rawPayload" JSONB NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentEvent_razorpayEventId_key" ON "PaymentEvent"("razorpayEventId");
CREATE INDEX "PaymentEvent_razorpayOrderId_idx" ON "PaymentEvent"("razorpayOrderId");
CREATE INDEX "PaymentEvent_eventType_receivedAt_idx" ON "PaymentEvent"("eventType", "receivedAt");
