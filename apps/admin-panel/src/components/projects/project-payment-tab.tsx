'use client'

import { Card, CardContent } from '@glimmora/ui'

interface ProjectPaymentTabProps {
  projectId: string
}

export function ProjectPaymentTab({ projectId }: ProjectPaymentTabProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-text-caption text-sm font-body">
        Payment release for project {projectId} -- full implementation in 06-03.
      </CardContent>
    </Card>
  )
}
