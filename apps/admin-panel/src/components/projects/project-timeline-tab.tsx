'use client'

import { Card, CardContent } from '@glimmora/ui'

interface ProjectTimelineTabProps {
  projectId: string
}

export function ProjectTimelineTab({ projectId }: ProjectTimelineTabProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-text-caption text-sm font-body">
        Timeline for project {projectId} -- full implementation in 06-03.
      </CardContent>
    </Card>
  )
}
