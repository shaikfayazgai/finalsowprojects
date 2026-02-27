import { http, HttpResponse, delay } from 'msw'
import type { ESGReportData } from '@glimmora/types'

export const complianceHandlers = [
  http.get('/api/enterprise/compliance/podl/:projectId', async () => {
    await delay(500)
    return HttpResponse.json({
      data: {
        projectName: 'Customer Engagement Platform',
        sowVersion: 'v2.1',
        completionDate: '2025-12-10T16:30:00Z',
        totalMilestones: 5,
        totalTasks: 12,
        durationWeeks: 14,
        milestones: [
          {
            name: 'Project Kickoff & Architecture',
            deliverablesVerified: 3,
            skillsDemonstrated: ['System Design', 'Architecture Review', 'Tech Stack Evaluation'],
            qualityScore: 96,
          },
          {
            name: 'Core Platform MVP',
            deliverablesVerified: 4,
            skillsDemonstrated: ['React', 'TypeScript', 'NestJS', 'PostgreSQL', 'API Design'],
            qualityScore: 92,
          },
          {
            name: 'Analytics & Personalization',
            deliverablesVerified: 4,
            skillsDemonstrated: ['Data Visualization', 'Python', 'ML Pipeline', 'A/B Testing'],
            qualityScore: 94,
          },
          {
            name: 'Multi-channel Communication',
            deliverablesVerified: 3,
            skillsDemonstrated: ['Email Integration', 'SMS API', 'Push Notifications', 'Templating'],
            qualityScore: 91,
          },
          {
            name: 'UAT & Launch',
            deliverablesVerified: 2,
            skillsDemonstrated: ['Load Testing', 'Cypress E2E', 'Deployment', 'Monitoring'],
            qualityScore: 97,
          },
        ],
        payments: [
          { amount: 28000, currency: 'USD', date: '2025-10-15T10:00:00Z', transactionId: 'TXN-2025-0812', status: 'Released' },
          { amount: 42000, currency: 'USD', date: '2025-11-01T14:00:00Z', transactionId: 'TXN-2025-0825', status: 'Released' },
          { amount: 35000, currency: 'USD', date: '2025-11-20T09:00:00Z', transactionId: 'TXN-2025-0901', status: 'Released' },
          { amount: 22000, currency: 'USD', date: '2025-12-05T11:00:00Z', transactionId: 'TXN-2025-0918', status: 'Released' },
          { amount: 18000, currency: 'USD', date: '2025-12-10T16:00:00Z', transactionId: 'TXN-2025-0930', status: 'Released' },
        ],
        verificationHashes: [
          'sha256:a3f2c1d8e9b7f4a6c5d3e2f1a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
          'sha256:b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4',
          'sha256:c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5',
        ],
      },
    })
  }),

  http.get('/api/enterprise/compliance/esg', async () => {
    await delay(500)
    const data: { data: ESGReportData } = {
      data: {
        organizationName: 'TechVentures Global',
        reportPeriod: 'Q3 2025 - Q1 2026',
        generatedDate: new Date().toISOString().split('T')[0],
        womenContributorHours: 2400,
        studentContributorHours: 1800,
        totalContributorHours: 5700,
        womenWorkforcePercentage: 0.42,
        studentWorkforcePercentage: 0.32,
        underrepresentedGroupPercentage: 0.74,
        podlCredentialsIssued: 34,
        skillsDeveloped: [
          'React', 'TypeScript', 'NestJS', 'PostgreSQL', 'Python',
          'Data Visualization', 'System Design', 'API Design',
          'DevOps', 'Quality Assurance',
        ],
        totalPaymentsReleased: 145000,
        onTimePaymentRate: 0.96,
        currency: 'USD',
        onTimeDeliveryRate: 0.91,
        reworkRate: 0.08,
        mentorReviewRate: 0.94,
      },
    }
    return HttpResponse.json(data)
  }),
]
