export type EvidenceType = 'file' | 'url' | 'code' | 'video-url' | 'text'

export type EvidenceStatus =
  | 'submitted'
  | 'under-review'
  | 'approved'
  | 'rework-required'
  | 'rejected'

export interface Evidence {
  id: string
  taskId: string
  contributorId: string
  type: EvidenceType
  title: string
  description: string
  content: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  status: EvidenceStatus
  submittedAt: string
  reviewedAt?: string
  reviewerFeedback?: string
  reworkItems?: string[]
}

export interface EvidencePack {
  id: string
  taskId: string
  projectId: string
  evidenceItems: Evidence[]
  submittedAt: string
  status: EvidenceStatus
}
