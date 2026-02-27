'use client'

import { Card, CardContent } from '@glimmora/ui'

interface ProjectReworkTabProps {
  projectId: string
}

export function ProjectReworkTab({ projectId }: ProjectReworkTabProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-text-caption text-sm font-body">
        Rework requests for project {projectId} -- full implementation in 06-03.
      </CardContent>
    </Card>
  )
}
