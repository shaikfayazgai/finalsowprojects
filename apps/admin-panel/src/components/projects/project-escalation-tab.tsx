'use client'

import { Card, CardContent } from '@glimmora/ui'

interface ProjectEscalationTabProps {
  projectId: string
}

export function ProjectEscalationTab({ projectId }: ProjectEscalationTabProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-text-caption text-sm font-body">
        Escalation centre for project {projectId} -- full implementation in 06-03.
      </CardContent>
    </Card>
  )
}
