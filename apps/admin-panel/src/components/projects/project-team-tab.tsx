'use client'

import { Card, CardContent } from '@glimmora/ui'

interface ProjectTeamTabProps {
  projectId: string
}

export function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-text-caption text-sm font-body">
        Team summary for project {projectId} -- full implementation in 06-03.
      </CardContent>
    </Card>
  )
}
