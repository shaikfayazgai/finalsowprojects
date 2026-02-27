'use client'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Spinner,
} from '@glimmora/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { TeamMember, TeamMemberRole } from '@glimmora/types'

const roleOptions: Array<{ value: TeamMemberRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'project-manager', label: 'Project Manager' },
  { value: 'finance-approver', label: 'Finance Approver' },
  { value: 'viewer', label: 'Viewer' },
]

const roleBadge: Record<TeamMemberRole, string> = {
  'admin': 'Admin',
  'project-manager': 'Project Manager',
  'finance-approver': 'Finance',
  'viewer': 'Viewer',
}

export default function TeamSettingsPage() {
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamMemberRole>('viewer')

  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/team')
      if (!res.ok) throw new Error('Failed to fetch team')
      return res.json()
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: TeamMemberRole }) => {
      const res = await fetch('/api/enterprise/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Invite failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      setInviteOpen(false)
      setInviteEmail('')
      setInviteRole('viewer')
    },
  })

  const roleChangeMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: TeamMemberRole }) => {
      const res = await fetch(`/api/enterprise/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('Role change failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/enterprise/team/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Remove failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      setRemoveOpen(false)
      setSelectedMember(null)
    },
  })

  const columns = useMemo<ColumnDef<TeamMember>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-text-body">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        id: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge status="normal">{roleBadge[row.original.role]}</Badge>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge status={row.original.isActive ? 'done' : 'normal'}>
            {row.original.isActive ? 'Active' : 'Pending'}
          </Badge>
        ),
      },
      {
        accessorKey: 'invitedAt',
        header: 'Invited',
        cell: ({ row }) => new Date(row.original.invitedAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <select
              value={row.original.role}
              onChange={(e) =>
                roleChangeMutation.mutate({
                  id: row.original.id,
                  role: e.target.value as TeamMemberRole,
                })
              }
              className="rounded border border-border bg-bg-card px-2 py-1 text-xs text-text-body"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedMember(row.original)
                setRemoveOpen(true)
              }}
            >
              Remove
            </Button>
          </div>
        ),
      },
    ],
    [roleChangeMutation]
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Team Access" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading team..." />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Team Access"
          subtitle={`${members?.length ?? 0} team member${(members?.length ?? 0) !== 1 ? 's' : ''}`}
        />
        <Button onClick={() => setInviteOpen(true)}>Invite Member</Button>
      </div>

      <DataTable columns={columns} data={members ?? []} />

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization on GlimmoraTeam.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamMemberRole)}
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
              loading={inviteMutation.isPending}
              disabled={!inviteEmail}
            >
              Send Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.name} ({selectedMember?.email}) from
              your organization? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedMember && removeMutation.mutate(selectedMember.id)}
              loading={removeMutation.isPending}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
