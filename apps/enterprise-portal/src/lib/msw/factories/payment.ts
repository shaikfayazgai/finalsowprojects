import type { PaymentRecord, PaymentPreferences, PaymentReleaseMode } from '@glimmora/types'
import { randomId } from './common'

export function createMockPayments(projectId: string): PaymentRecord[] {
  const milestones = [
    { id: 'ms-001', name: 'Project Kickoff & Architecture' },
    { id: 'ms-002', name: 'Core Platform MVP' },
    { id: 'ms-003', name: 'Analytics & Personalization' },
    { id: 'ms-004', name: 'Multi-channel Communication' },
    { id: 'ms-005', name: 'UAT & Launch' },
  ]

  const records: PaymentRecord[] = [
    // 3 released
    {
      id: randomId('pay'),
      projectId,
      milestoneId: milestones[0].id,
      evidencePackId: 'pack-001',
      amount: 28000,
      platformFee: 2800,
      netToContributor: 25200,
      currency: 'USD',
      status: 'released',
      releaseMode: 'manual',
      releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      transactionId: 'TXN-2026-0812',
    },
    {
      id: randomId('pay'),
      projectId,
      milestoneId: milestones[1].id,
      evidencePackId: 'pack-002',
      amount: 42000,
      platformFee: 4200,
      netToContributor: 37800,
      currency: 'USD',
      status: 'released',
      releaseMode: 'auto-on-approval',
      releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      transactionId: 'TXN-2026-0825',
    },
    {
      id: randomId('pay'),
      projectId,
      milestoneId: milestones[1].id,
      evidencePackId: 'pack-003',
      amount: 15000,
      platformFee: 1500,
      netToContributor: 13500,
      currency: 'USD',
      status: 'released',
      releaseMode: 'apg-silent',
      releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      transactionId: 'TXN-2026-0901',
    },
    // 3 pending
    {
      id: randomId('pay'),
      projectId,
      milestoneId: milestones[2].id,
      evidencePackId: 'pack-004',
      amount: 35000,
      platformFee: 3500,
      netToContributor: 31500,
      currency: 'USD',
      status: 'pending',
      releaseMode: 'manual',
    },
    {
      id: randomId('pay'),
      projectId,
      milestoneId: milestones[2].id,
      evidencePackId: 'pack-005',
      amount: 18000,
      platformFee: 1800,
      netToContributor: 16200,
      currency: 'USD',
      status: 'pending',
      releaseMode: 'manual',
    },
    {
      id: randomId('pay'),
      projectId,
      milestoneId: milestones[3].id,
      evidencePackId: 'pack-006',
      amount: 22000,
      platformFee: 2200,
      netToContributor: 19800,
      currency: 'USD',
      status: 'pending',
      releaseMode: 'manual',
    },
    // 1 held
    {
      id: randomId('pay'),
      projectId,
      milestoneId: milestones[3].id,
      evidencePackId: 'pack-007',
      amount: 12000,
      platformFee: 1200,
      netToContributor: 10800,
      currency: 'USD',
      status: 'held',
      releaseMode: 'manual',
      holdReason: 'Evidence under escalation review by mentor panel',
      holdExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    },
    // 1 disputed
    {
      id: randomId('pay'),
      projectId,
      milestoneId: milestones[4].id,
      evidencePackId: 'pack-008',
      amount: 8000,
      platformFee: 800,
      netToContributor: 7200,
      currency: 'USD',
      status: 'disputed',
      releaseMode: 'manual',
      holdReason: 'Quality concern raised by enterprise reviewer',
    },
  ]

  return records
}

export function createMockPaymentPreferences(): PaymentPreferences {
  return {
    defaultMode: 'manual',
    apgSilentThresholdAmount: 20000,
    autoReleaseDelayDays: 3,
  }
}

export interface MockSilentApproval {
  id: string
  milestoneId: string
  milestoneName: string
  amount: number
  currency: string
  threshold: number
  approvedAt: string
  transactionId: string
}

export function createMockSilentApprovals(): MockSilentApproval[] {
  return [
    {
      id: randomId('sa'),
      milestoneId: 'ms-002',
      milestoneName: 'Core Platform MVP - Sub-task B',
      amount: 15000,
      currency: 'USD',
      threshold: 20000,
      approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      transactionId: 'TXN-2026-0901',
    },
    {
      id: randomId('sa'),
      milestoneId: 'ms-001',
      milestoneName: 'Project Kickoff - Documentation',
      amount: 8500,
      currency: 'USD',
      threshold: 20000,
      approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
      transactionId: 'TXN-2026-0815',
    },
    {
      id: randomId('sa'),
      milestoneId: 'ms-001',
      milestoneName: 'Project Kickoff - Environment Setup',
      amount: 5000,
      currency: 'USD',
      threshold: 20000,
      approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
      transactionId: 'TXN-2026-0808',
    },
  ]
}
