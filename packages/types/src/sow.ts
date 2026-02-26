export type SOWStatus =
  | 'uploaded'
  | 'parsing'
  | 'parsed'
  | 'decomposed'
  | 'blueprint-ready'
  | 'approved'
  | 'failed'

export interface SOW {
  id: string
  organizationId: string
  fileName: string
  fileUrl: string
  fileSize: number
  status: SOWStatus
  uploadedAt: string
  parsedAt?: string
  extractedTasks: number
  extractedSkills: string[]
  estimatedTimeline?: string
  estimatedBudget?: number
}

export interface SOWDecomposition {
  sowId: string
  tasks: Array<{
    title: string
    type: string
    skillRequirements: string[]
    estimatedHours: number
    dependsOn: string[]
  }>
  suggestedMilestones: Array<{
    name: string
    taskIndices: number[]
    targetWeek: number
  }>
  confidenceScore: number
}
