import type { SOW, SOWIntelligence } from '@glimmora/types'
import { randomId, isoNow } from './common'

export function createMockSOW(overrides?: Partial<SOW>): SOW {
  const id = randomId('sow')
  return {
    id,
    organizationId: 'org-001',
    fileName: 'Enterprise-Platform-SOW-2026.pdf',
    fileUrl: `/mock-files/${id}.pdf`,
    fileSize: 2_450_000,
    status: 'parsed',
    uploadedAt: isoNow(),
    parsedAt: isoNow(),
    extractedTasks: 24,
    extractedSkills: ['react', 'typescript', 'node.js', 'postgresql', 'ui-design'],
    estimatedTimeline: '12 weeks',
    estimatedBudget: 185000,
    versionNumber: 1,
    ...overrides,
  }
}

export function createMockSOWIntelligence(sowId: string): SOWIntelligence {
  return {
    sowId,
    projectObjective:
      'Build and deploy a cloud-native customer engagement platform with real-time analytics, AI-powered personalization, and multi-channel communication capabilities for enterprise customers.',
    clauses: [
      {
        id: randomId('clause'),
        text: 'The platform shall provide real-time analytics dashboards with sub-second refresh rates for key business metrics.',
        type: 'objective',
        confidence: 0.94,
        linkedTaskIds: ['task-001', 'task-002'],
      },
      {
        id: randomId('clause'),
        text: 'All customer data must be encrypted at rest (AES-256) and in transit (TLS 1.3) per SOC 2 Type II requirements.',
        type: 'compliance',
        confidence: 0.98,
        linkedTaskIds: ['task-003'],
      },
      {
        id: randomId('clause'),
        text: 'Deliver a responsive web application, iOS native app, and Android native app with feature parity.',
        type: 'deliverable',
        confidence: 0.91,
        linkedTaskIds: ['task-004', 'task-005', 'task-006'],
      },
      {
        id: randomId('clause'),
        text: 'Phase 1 deliverables due within 8 weeks of project kickoff; Phase 2 within 16 weeks.',
        type: 'timeline',
        confidence: 0.89,
        linkedTaskIds: [],
      },
      {
        id: randomId('clause'),
        text: 'Total project budget not to exceed $200,000 USD inclusive of all development, testing, and deployment costs.',
        type: 'budget',
        confidence: 0.96,
        linkedTaskIds: [],
      },
      {
        id: randomId('clause'),
        text: 'The vendor shall provide 12 months of post-launch support including bug fixes and minor feature enhancements.',
        type: 'general',
        confidence: 0.85,
        linkedTaskIds: [],
      },
    ],
    deliverables: [
      { text: 'Web application with analytics dashboard', included: true },
      { text: 'iOS native mobile application', included: true },
      { text: 'Android native mobile application', included: true },
      { text: 'API documentation and integration guide', included: true },
      { text: 'Load testing and performance report', included: false },
    ],
    timelineEstimates: [
      { milestone: 'Project Kickoff & Architecture', date: '2026-03-15' },
      { milestone: 'Phase 1: Core Platform MVP', date: '2026-05-10' },
      { milestone: 'Phase 2: Mobile Apps & Analytics', date: '2026-07-05' },
      { milestone: 'UAT & Launch Preparation', date: '2026-07-26' },
    ],
    budgetRange: { min: 165000, max: 200000, currency: 'USD' },
    complianceFlags: [
      { item: 'SOC 2 Type II certification required for data handling', severity: 'mandatory' },
      { item: 'GDPR compliance for EU customer data processing', severity: 'mandatory' },
    ],
    confidenceScore: 0.87,
    ambiguities: [
      {
        section: 'Post-launch Support',
        issue: 'Scope of "minor feature enhancements" is not quantified -- could lead to scope creep disputes.',
      },
    ],
  }
}

export function createMockSOWVersions(sowId: string): SOW[] {
  return [
    createMockSOW({
      id: sowId,
      fileName: 'Enterprise-Platform-SOW-v3.pdf',
      versionNumber: 3,
      status: 'parsed',
      fileSize: 2_680_000,
      uploadedAt: '2026-02-25T14:00:00Z',
      parsedAt: '2026-02-25T14:02:00Z',
    }),
    createMockSOW({
      id: `${sowId}-v2`,
      parentSowId: sowId,
      fileName: 'Enterprise-Platform-SOW-v2.pdf',
      versionNumber: 2,
      status: 'approved',
      fileSize: 2_520_000,
      uploadedAt: '2026-02-18T10:00:00Z',
      parsedAt: '2026-02-18T10:01:30Z',
    }),
    createMockSOW({
      id: `${sowId}-v1`,
      parentSowId: sowId,
      fileName: 'Enterprise-Platform-SOW-v1.pdf',
      versionNumber: 1,
      status: 'approved',
      fileSize: 2_340_000,
      uploadedAt: '2026-02-10T09:00:00Z',
      parsedAt: '2026-02-10T09:01:00Z',
    }),
  ]
}

export function createMockSOWArchive(): SOW[] {
  return [
    createMockSOW({
      fileName: 'Customer-Engagement-Platform-SOW.pdf',
      status: 'approved',
      versionNumber: 3,
      extractedTasks: 24,
    }),
    createMockSOW({
      fileName: 'Mobile-Banking-App-SOW.pdf',
      status: 'blueprint-ready',
      versionNumber: 1,
      extractedTasks: 18,
    }),
    createMockSOW({
      fileName: 'Data-Analytics-Dashboard-SOW.docx',
      status: 'parsed',
      versionNumber: 2,
      extractedTasks: 15,
    }),
    createMockSOW({
      fileName: 'E-commerce-Migration-SOW.pdf',
      status: 'decomposed',
      versionNumber: 1,
      extractedTasks: 32,
    }),
    createMockSOW({
      fileName: 'HR-Portal-Redesign-SOW.pdf',
      status: 'uploaded',
      versionNumber: 1,
      extractedTasks: 0,
    }),
  ]
}
