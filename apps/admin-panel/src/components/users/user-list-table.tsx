'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import type { AdminUserListItem, AdminUserType, UserAccountStatus } from '@glimmora/types'
import {
  DataTable,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@glimmora/ui'
import { MoreHorizontal, Eye, Ban, RefreshCw } from 'lucide-react'
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

const accountStatusVariant: Record<UserAccountStatus, 'done' | 'urgent' | 'inprogress' | 'normal'> = {
  active: 'done',
  suspended: 'urgent',
  pending_verification: 'inprogress',
  deactivated: 'normal',
}

const accountStatusLabel: Record<UserAccountStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  pending_verification: 'Pending',
  deactivated: 'Deactivated',
}

interface UserListTableProps {
  users: AdminUserListItem[]
}

export function UserListTable({ users }: UserListTableProps) {
  const queryClient = useQueryClient()

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Failed to suspend user')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const reactivateMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Failed to reactivate user')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const columns = useMemo<ColumnDef<AdminUserListItem, unknown>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`/users/${row.original.id}`}
            className="font-medium text-text-heading hover:text-brand-primary transition-colors"
          >
            {row.original.displayName}
          </Link>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-text-caption">{row.original.email}</span>
        ),
      },
      {
        id: 'userType',
        header: 'Type',
        cell: ({ row }) => (
          <Badge status={userTypeVariant[row.original.userType]}>
            {userTypeLabel[row.original.userType]}
          </Badge>
        ),
      },
      {
        id: 'accountStatus',
        header: 'Status',
        cell: ({ row }) => (
          <Badge status={accountStatusVariant[row.original.accountStatus]}>
            {accountStatusLabel[row.original.accountStatus]}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-text-caption">
            {format(new Date(row.original.createdAt), 'MMM d, yyyy')}
          </span>
        ),
      },
      {
        accessorKey: 'lastActiveAt',
        header: 'Last Active',
        cell: ({ row }) => (
          <span className="text-text-caption">
            {formatDistanceToNow(new Date(row.original.lastActiveAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        accessorKey: 'projectCount',
        header: 'Projects',
        cell: ({ row }) => (
          <span className="text-text-body">{row.original.projectCount}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original
          const isActive = user.accountStatus === 'active'
          const isSuspended = user.accountStatus === 'suspended'

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/users/${user.id}`} className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isActive && (
                  <UserActionDialog
                    actionLabel="Suspend User"
                    actionDescription={`Suspend ${user.displayName}'s account. The user will lose access to all platform features until reactivated.`}
                    onConfirm={async (reason) => {
                      await suspendMutation.mutateAsync({ userId: user.id, reason })
                    }}
                    trigger={
                      <button className="relative flex w-full cursor-pointer select-none items-center rounded-inner px-3 py-2 text-sm font-body text-status-urgent hover:bg-hover focus:bg-hover outline-none">
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend User
                      </button>
                    }
                    destructive
                  />
                )}
                {isSuspended && (
                  <UserActionDialog
                    actionLabel="Reactivate User"
                    actionDescription={`Reactivate ${user.displayName}'s account. The user will regain access to all platform features.`}
                    onConfirm={async (reason) => {
                      await reactivateMutation.mutateAsync({ userId: user.id, reason })
                    }}
                    trigger={
                      <button className="relative flex w-full cursor-pointer select-none items-center rounded-inner px-3 py-2 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reactivate User
                      </button>
                    }
                  />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [suspendMutation, reactivateMutation]
  )

  return <DataTable columns={columns} data={users} pageSize={10} />
}
