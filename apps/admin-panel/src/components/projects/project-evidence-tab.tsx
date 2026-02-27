'use client'

import { Card, CardContent } from '@glimmora/ui'

interface ProjectEvidenceTabProps {
  projectId: string
}

export function ProjectEvidenceTab({ projectId }: ProjectEvidenceTabProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-text-caption text-sm font-body">
        Evidence packs for project {projectId} -- full implementation in 06-03.
      </CardContent>
    </Card>
  )
}
