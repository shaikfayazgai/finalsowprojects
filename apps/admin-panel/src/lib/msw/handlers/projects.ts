import { http, HttpResponse } from 'msw'
import type { InterventionType } from '@glimmora/types'
import {
  createMockAdminProjectList,
  createMockAdminProjectDetail,
  createMockAPGActivity,
  createMockInterventions,
  createMockFreezeHistory,
  createMockProjectTimeline,
  createMockProjectTeam,
  createMockProjectEvidence,
  createMockProjectReworks,
  createMockProjectEscalations,
  createMockProjectPayments,
  getOrganizationName,
} from '../factories/project'
import { randomId, isoNow } from '../factories/common'

let interventions = createMockInterventions('proj-001')
let freezeHistory = createMockFreezeHistory('proj-001')

export const projectHandlers = [
  // Project list with org names embedded
  http.get('/api/admin/projects', () => {
    const projects = createMockAdminProjectList().map((p) => ({
      ...p,
      organizationName: getOrganizationName(p.organizationId),
    }))
    return HttpResponse.json(projects)
  }),

  // Project detail
  http.get('/api/admin/projects/:id', ({ params }) => {
    const project = createMockAdminProjectDetail(params.id as string)
    return HttpResponse.json({
      ...project,
      organizationName: getOrganizationName(project.organizationId),
    })
  }),

  // APG Activity
  http.get('/api/admin/projects/:id/apg-activity', ({ params }) => {
    return HttpResponse.json(createMockAPGActivity(params.id as string))
  }),

  // Interventions
  http.get('/api/admin/projects/:id/interventions', () => {
    return HttpResponse.json(interventions)
  }),

  http.post('/api/admin/projects/:id/interventions', async ({ request, params }) => {
    const body = (await request.json()) as {
      interventionType: InterventionType
      reason: string
      details?: string
    }
    const newIntervention = {
      id: randomId('intv'),
      projectId: params.id as string,
      interventionType: body.interventionType,
      reason: body.reason,
      details: body.details,
      performedBy: 'Platform Admin',
      performedAt: isoNow(),
      isImmutable: true as const,
    }
    interventions = [newIntervention, ...interventions]
    return HttpResponse.json(newIntervention, { status: 201 })
  }),

  // Freeze history
  http.get('/api/admin/projects/:id/freeze-history', () => {
    return HttpResponse.json(freezeHistory)
  }),

  // Freeze project
  http.post('/api/admin/projects/:id/freeze', async ({ request, params }) => {
    const body = (await request.json()) as { reason: string }
    const entry = {
      id: randomId('fh'),
      action: 'freeze' as const,
      reason: body.reason,
      performedBy: 'Platform Admin',
      performedAt: isoNow(),
    }
    freezeHistory = [entry, ...freezeHistory]

    // Also add intervention
    interventions = [
      {
        id: randomId('intv'),
        projectId: params.id as string,
        interventionType: 'project_freeze' as const,
        reason: body.reason,
        performedBy: 'Platform Admin',
        performedAt: isoNow(),
        isImmutable: true as const,
      },
      ...interventions,
    ]

    return HttpResponse.json({ success: true, frozen: true })
  }),

  // Unfreeze project
  http.post('/api/admin/projects/:id/unfreeze', async ({ request, params }) => {
    const body = (await request.json()) as { reason: string }
    const entry = {
      id: randomId('fh'),
      action: 'unfreeze' as const,
      reason: body.reason,
      performedBy: 'Platform Admin',
      performedAt: isoNow(),
    }
    freezeHistory = [entry, ...freezeHistory]

    // Also add intervention
    interventions = [
      {
        id: randomId('intv'),
        projectId: params.id as string,
        interventionType: 'project_unfreeze' as const,
        reason: body.reason,
        performedBy: 'Platform Admin',
        performedAt: isoNow(),
        isImmutable: true as const,
      },
      ...interventions,
    ]

    return HttpResponse.json({ success: true, frozen: false })
  }),

  // Timeline
  http.get('/api/admin/projects/:id/timeline', ({ params }) => {
    return HttpResponse.json(createMockProjectTimeline(params.id as string))
  }),

  // Team
  http.get('/api/admin/projects/:id/team', () => {
    return HttpResponse.json(createMockProjectTeam())
  }),

  // Evidence
  http.get('/api/admin/projects/:id/evidence', ({ params }) => {
    return HttpResponse.json(createMockProjectEvidence(params.id as string))
  }),

  // Reworks
  http.get('/api/admin/projects/:id/reworks', ({ params }) => {
    return HttpResponse.json(createMockProjectReworks(params.id as string))
  }),

  // Escalations
  http.get('/api/admin/projects/:id/escalations', ({ params }) => {
    return HttpResponse.json(createMockProjectEscalations(params.id as string))
  }),

  // Payments
  http.get('/api/admin/projects/:id/payments', ({ params }) => {
    return HttpResponse.json(createMockProjectPayments(params.id as string))
  }),
]
