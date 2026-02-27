'use client'

import { use } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Badge, Button, Spinner } from '@glimmora/ui'
import { ArrowLeft, Ban, RefreshCw } from 'lucide-react'
import type { AdminUserType, UserAccountStatus } from '@glimmora/types'
import type { UserDetailData } from '@/lib/msw/factories/user'
import { UserDetailTabs, UserActionDialog } from '@/components/users'

const userTypeLabel: Record<AdminUserType, string> = {
  'woman-contributor': 'Woman Contributor',
  'community-support-lead': 'Community Support Lead',
  'student-contributor': 'Student',
  'alumni-contributor': 'Alumni',
  'enterprise-requester': 'Enterprise Requester',
  'mentor-reviewer': 'Mentor',
}

const userTypeVariant: Record<AdminUserType, 'normal' | 'done' | 'inprogress' | 'atrisk'> = {
  'woman-contributor': 'inprogress',
  'community-support-lead': 'done',
  'student-contributor': 'normal',
  'alumni-contributor': 'normal',
  'enterprise-requester': 'atrisk',
  'mentor-reviewer': 'done',
}

const accountStatusVariant: Record<UserAccountStatus, 'done' | 'urgent' | 'inprogress' | 'normal'> = {
  active: 'done',
  suspended: 'urgent',
  pending_verification: 'inprogress',
  deactivated: 'normal',
}

const accountStatusLabel: Record<UserAccountStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  pending_verification: 'Pending Verification',
  deactivated: 'Deactivated',
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useQuery<UserDetailData>({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch user detail')
      return res.json()
    },
  })

  const suspendMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Failed to suspend user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Failed to reactivate user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="User Detail" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading user..." />
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <PageHeader title="User Detail" />
        <div className="p-4 text-status-urgent text-sm">
          Failed to load user details. Please try again.
        </div>
      </div>
    )
  }

  const isActive = user.accountStatus === 'active'
  const isSuspended = user.accountStatus === 'suspended'

  return (
    <div className="p-6">
      <PageHeader
        title={user.displayName}
        subtitle={user.email}
        breadcrumb={
          <Link href="/users" className="inline-flex items-center gap-1 hover:text-brand-primary transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Users
          </Link>
        }
        actions={
          <div className="flex items-center gap-3">
            <Badge status={userTypeVariant[user.userType]}>
              {userTypeLabel[user.userType]}
            </Badge>
            <Badge status={accountStatusVariant[user.accountStatus]}>
              {accountStatusLabel[user.accountStatus]}
            </Badge>

            {isActive && (
              <UserActionDialog
                actionLabel="Suspend User"
                actionDescription={`Suspend ${user.displayName}'s account. The user will lose access to all platform features until reactivated.`}
                onConfirm={async (reason) => {
                  await suspendMutation.mutateAsync(reason)
                }}
                trigger={
                  <Button variant="destructive" size="sm">
                    <Ban className="h-4 w-4 mr-1.5" />
                    Suspend
                  </Button>
                }
                destructive
              />
            )}

            {isSuspended && (
              <UserActionDialog
                actionLabel="Reactivate User"
                actionDescription={`Reactivate ${user.displayName}'s account. The user will regain access to all platform features.`}
                onConfirm={async (reason) => {
                  await reactivateMutation.mutateAsync(reason)
                }}
                trigger={
                  <Button variant="primary" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Reactivate
                  </Button>
                }
              />
            )}
          </div>
        }
      />

      <UserDetailTabs userId={userId} userType={user.userType} />
    </div>
  )
}
