import type { Invoice, EscrowAccount } from "@/types/enterprise";

export const mockInvoices: Invoice[] = [];

export const mockEscrowAccounts: EscrowAccount[] = [];

export const billingStats = {
  totalSpent: 0,
  pendingPayments: 0,
  escrowHeld: 0,
  averagePaymentTime: 0,
  monthlySpend: [] as { month: string; amount: number }[],
};
