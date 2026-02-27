'use client'

import { useQuery } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, Spinner } from '@glimmora/ui'
import {
  LogIn,
  Upload,
  FolderPlus,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Award,
  UserCog,
} from 'lucide-react'
import type { UserActivityEvent } from '@/lib/msw/factories/user'

interface UserActivityTabProps {
  userId: string
}

const actionIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="h-4 w-4" />,
  task_submitted: <Upload className="h-4 w-4" />,
  project_joined: <FolderPlus className="h-4 w-4" />,
  skill_updated: <TrendingUp className="h-4 w-4" />,
  task_completed: <CheckCircle className="h-4 w-4" />,
  payment_received: <DollarSign className="h-4 w-4" />,
  podl_earned: <Award className="h-4 w-4" />,
  profile_updated: <UserCog className="h-4 w-4" />,
}

export function UserActivityTab({ userId }: UserActivityTabProps) {
  const { data: activities, isLoading } = useQuery<UserActivityEvent[]>({
    queryKey: ['admin-user-activity', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/activity`)
      if (!res.ok) throw new Error('Failed to fetch user activity')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading activity..." />
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-text-caption text-sm font-body">
          No recent activity recorded.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 border-l-2 border-border space-y-6">
          {activities.map((event) => (
            <div key={event.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-bg-card border-2 border-border">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
              </div>

              {/* Event content */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-text-caption">
                    {actionIcons[event.action] ?? <CheckCircle className="h-4 w-4" />}
                  </span>
                  <p className="text-sm font-body font-medium text-text-heading">
                    {event.description}
                  </p>
                </div>
                <p className="text-xs font-body text-text-caption">
                  {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')} --{' '}
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
