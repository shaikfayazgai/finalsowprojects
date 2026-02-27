'use client'

import type { Project } from '@glimmora/types'
import { Card, CardContent } from '@glimmora/ui'

interface ProjectOverviewTabProps {
  projectId: string
  project: Project
}

export function ProjectOverviewTab({ projectId, project }: ProjectOverviewTabProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-text-caption text-sm font-body">
        Project overview for {project.name ?? projectId} -- full implementation in 06-03.
      </CardContent>
    </Card>
  )
}
