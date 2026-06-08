/**
 * Internal workforce cost accrual — payroll / cost-center path (Decision #24).
 *
 * Does NOT create PayoutRecord rows (no Razorpay / contributor wallet).
 * Accrues to tenant.usageCounters.internalCostAccrued for billing export.
 */

import { Prisma } from "@/generated/prisma/client";
import { computePayoutAmount } from "./service";

type Tx = Prisma.TransactionClient;

export interface InternalAccrualResult {
  amountMinor: number;
  currency: string;
  taskDefinitionId: string;
  submissionId: string;
}

export async function recordInternalCostAccrualOnAcceptance(
  tx: Tx,
  args: {
    submissionId: string;
    taskDefinitionId: string;
    tenantId: string;
    estimatedHours: number | null;
    agreedRatePerHour: number | null;
    agreedCurrency: string | null;
  },
): Promise<InternalAccrualResult | null> {
  if (args.estimatedHours == null || args.estimatedHours <= 0) {
    return null;
  }

  const { amountMinor, currency } = computePayoutAmount({
    estimatedHours: args.estimatedHours,
    agreedRatePerHour: args.agreedRatePerHour,
    agreedCurrency: args.agreedCurrency,
  });

  const tenant = await tx.tenant.findUnique({
    where: { id: args.tenantId },
    select: { usageCounters: true },
  });

  const counters =
    tenant?.usageCounters && typeof tenant.usageCounters === "object"
      ? (tenant.usageCounters as Record<string, unknown>)
      : {};

  const prev =
    counters.internalCostAccrued &&
    typeof counters.internalCostAccrued === "object"
      ? (counters.internalCostAccrued as { totalMinor?: number; count?: number })
      : { totalMinor: 0, count: 0 };

  const nextCounters = {
    ...counters,
    internalCostAccrued: {
      totalMinor: (prev.totalMinor ?? 0) + amountMinor,
      count: (prev.count ?? 0) + 1,
      currency,
      lastAccrualAt: new Date().toISOString(),
    },
  };

  await tx.tenant.update({
    where: { id: args.tenantId },
    data: { usageCounters: nextCounters as unknown as Prisma.InputJsonValue },
  });

  return {
    amountMinor,
    currency,
    taskDefinitionId: args.taskDefinitionId,
    submissionId: args.submissionId,
  };
}
