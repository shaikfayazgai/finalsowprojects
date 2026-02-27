'use client'

import { useQuery } from '@tanstack/react-query'
import { SkillGenomePanel, Spinner, Card, CardContent } from '@glimmora/ui'
import type { UserSkillEntry } from '@/lib/msw/factories/user'

interface UserSkillsTabProps {
  userId: string
}

export function UserSkillsTab({ userId }: UserSkillsTabProps) {
  const { data: skills, isLoading } = useQuery<UserSkillEntry[]>({
    queryKey: ['admin-user-skills', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/skills`)
      if (!res.ok) throw new Error('Failed to fetch user skills')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading skills..." />
      </div>
    )
  }

  if (!skills || skills.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-text-caption text-sm font-body">
          No skill genome data available for this user.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-inner border border-border bg-hover/50 px-4 py-2.5">
        <p className="text-xs font-body text-text-caption">
          Admin view -- This data is private to the contributor and is never shared publicly or used for ranking.
        </p>
      </div>
      <SkillGenomePanel
        skills={skills}
        privacyLabel="This data is private to the contributor"
      />
    </div>
  )
}
