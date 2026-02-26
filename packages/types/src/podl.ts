export interface PoDL {
  id: string
  contributorId: string
  taskId: string
  projectId: string
  issuedAt: string
  title: string
  description: string
  skillsDemonstrated: string[]
  evidenceHash: string
  verifiedByMentorId: string
  organizationName: string
  isRevoked: boolean
}

export interface PoDLCredential extends PoDL {
  exportUrl?: string
  pdfGeneratedAt?: string
}
