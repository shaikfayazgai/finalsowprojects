'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import type { AdminUserListItem, AdminUserType, UserAccountStatus } from '@glimmora/types'
import {
  PageHeader,
  Spinner,
  Button,
  Badge,
  TextInput,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@glimmora/ui'
import { ShieldCheck } from 'lucide-react'
import { UserListTable } from '@/components/users'

const USER_TYPE_OPTIONS: Array<{ value: AdminUserType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'woman-contributor', label: 'Woman Contributor' },
  { value: 'community-support-lead', label: 'Community Support Lead' },
  { value: 'student-contributor', label: 'Student' },
  { value: 'alumni-contributor', label: 'Alumni' },
  { value: 'enterprise-requester', label: 'Enterprise Requester' },
  { value: 'mentor-reviewer', label: 'Mentor' },
]

const STATUS_OPTIONS: Array<{ value: UserAccountStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'deactivated', label: 'Deactivated' },
]

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<AdminUserType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<UserAccountStatus | 'all'>('all')

  const { data, isLoading, error } = useQuery<AdminUserListItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  const filteredUsers = useMemo(() => {
    if (!data) return []
    return data.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'all' || u.userType === typeFilter
      const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [data, searchQuery, typeFilter, statusFilter])

  const pendingCount = useMemo(
    () => data?.filter((u) => u.accountStatus === 'pending_verification').length ?? 0,
    [data]
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="User Management" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading users..." />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <PageHeader title="User Management" />
        <div className="p-4 text-status-urgent text-sm">
          Failed to load users. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="User Management"
        subtitle={`${data.length} total users across all types`}
        actions={
          <Link href="/users/verification-queue">
            <Button variant="secondary" size="sm">
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Verification Queue
              {pendingCount > 0 && (
                <Badge status="atrisk" className="ml-2">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex-1 min-w-[200px] max-w-[320px]">
          <TextInput
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-[200px]">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as AdminUserType | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {USER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[200px]">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserAccountStatus | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User table */}
      <UserListTable users={filteredUsers} />
    </div>
  )
}
