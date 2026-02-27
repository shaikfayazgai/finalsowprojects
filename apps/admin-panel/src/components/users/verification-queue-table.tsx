'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import type { VerificationQueueItem, AdminUserType } from '@glimmora/types'
import { DataTable, Badge, Button } from '@glimmora/ui'
import { CheckCircle, XCircle } from 'lucide-react'
import { UserActionDialog } from './user-action-dialog'

const userTypeLabel: Record<AdminUserType, string> = {
  'woman-contributor': 'Woman Contributor',
  'community-support-lead': 'Community Support',
  'student-contributor': 'Student',
  'alumni-contributor': 'Alumni',
  'enterprise-requester': 'Enterprise',
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

const verificationTypeLabel: Record<VerificationQueueItem['verificationType'], string> = {
  identity: 'Identity',
  organization: 'Organization',
  university: 'University',
  mentor_credentials: 'Mentor Credentials',
}

interface VerificationQueueTableProps {
  items: VerificationQueueItem[]
}

export function VerificationQueueTable({ items }: VerificationQueueTableProps) {
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: async ({ itemId, reason }: { itemId: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/verification/${itemId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Failed to approve verification')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification-queue'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ itemId, reason }: { itemId: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/verification/${itemId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Failed to reject verification')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification-queue'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const columns = useMemo<ColumnDef<VerificationQueueItem, unknown>[]>(
    () => [
      {
        accessorKey: 'userName',
        header: 'User Name',
        cell: ({ row }) => (
          <Link
            href={`/users/${row.original.userId}`}
            className="font-medium text-text-heading hover:text-brand-primary transition-colors"
          >
            {row.original.userName}
          </Link>
        ),
      },
      {
        id: 'userType',
        header: 'User Type',
        cell: ({ row }) => (
          <Badge status={userTypeVariant[row.original.userType]}>
            {userTypeLabel[row.original.userType]}
          </Badge>
        ),
      },
      {
        id: 'verificationType',
        header: 'Verification Type',
        cell: ({ row }) => (
          <span className="text-text-body">
            {verificationTypeLabel[row.original.verificationType]}
          </span>
        ),
      },
      {
        accessorKey: 'documentsCount',
        header: 'Documents',
        cell: ({ row }) => (
          <span className="text-text-body">{row.original.documentsCount}</span>
        ),
      },
      {
        accessorKey: 'submittedAt',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-text-caption">
            {format(new Date(row.original.submittedAt), 'MMM d, yyyy')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center gap-2">
              <UserActionDialog
                actionLabel="Approve Verification"
                actionDescription={`Approve the ${verificationTypeLabel[item.verificationType]} verification for ${item.userName}. A reason is required even for approvals and will be stored in the audit trail.`}
                onConfirm={async (reason) => {
                  await approveMutation.mutateAsync({ itemId: item.id, reason })
                }}
                trigger={
                  <Button variant="ghost" size="sm" title="Approve">
                    <CheckCircle className="h-4 w-4 text-status-success" />
                  </Button>
                }
              />
              <UserActionDialog
                actionLabel="Reject Verification"
                actionDescription={`Reject the ${verificationTypeLabel[item.verificationType]} verification for ${item.userName}. The user will be notified and may resubmit.`}
                onConfirm={async (reason) => {
                  await rejectMutation.mutateAsync({ itemId: item.id, reason })
                }}
                trigger={
                  <Button variant="ghost" size="sm" title="Reject">
                    <XCircle className="h-4 w-4 text-status-urgent" />
                  </Button>
                }
                destructive
              />
            </div>
          )
        },
      },
    ],
    [approveMutation, rejectMutation]
  )

  return <DataTable columns={columns} data={items} pageSize={10} />
}
