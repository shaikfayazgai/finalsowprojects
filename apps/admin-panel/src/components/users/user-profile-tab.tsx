'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, Badge, Spinner, Button } from '@glimmora/ui'
import { FileText, CheckCircle, XCircle } from 'lucide-react'
import type { UserDetailData } from '@/lib/msw/factories/user'
import { UserActionDialog } from './user-action-dialog'

interface UserProfileTabProps {
  userId: string
}

const verificationStatusVariant: Record<string, 'done' | 'normal' | 'inprogress'> = {
  verified: 'done',
  pending: 'inprogress',
  not_submitted: 'normal',
}

const verificationStatusLabel: Record<string, string> = {
  verified: 'Verified',
  pending: 'Pending Review',
  not_submitted: 'Not Submitted',
}

const docStatusVariant: Record<string, 'done' | 'normal' | 'urgent'> = {
  approved: 'done',
  pending: 'normal',
  rejected: 'urgent',
}

const docStatusLabel: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
}

export function UserProfileTab({ userId }: UserProfileTabProps) {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery<UserDetailData>({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch user detail')
      return res.json()
    },
  })

  const approveMutation = useMutation({
    mutationFn: async ({ docId, reason }: { docId: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/verification/${docId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Failed to approve verification')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] }),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ docId, reason }: { docId: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/verification/${docId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Failed to reject verification')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] }),
  })

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileField label="Display Name" value={user.displayName} />
            <ProfileField label="Email" value={user.email} />
            <ProfileField label="User Type" value={user.userType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
            <ProfileField label="Account Status" value={user.accountStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
            <ProfileField label="Joined" value={format(new Date(user.createdAt), 'MMMM d, yyyy')} />
            <ProfileField label="Last Active" value={format(new Date(user.lastActiveAt), 'MMMM d, yyyy')} />
            {user.phone && <ProfileField label="Phone" value={user.phone} />}
            {user.organizationName && <ProfileField label="Organization" value={user.organizationName} />}
            {user.universityName && <ProfileField label="University" value={user.universityName} />}
            {user.mentorTier && <ProfileField label="Mentor Tier" value={user.mentorTier.charAt(0).toUpperCase() + user.mentorTier.slice(1)} />}
          </div>
          {user.bio && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-text-caption font-body uppercase tracking-wider mb-1">Bio</p>
              <p className="text-sm font-body text-text-body">{user.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBlock label="Projects" value={user.projectCount} />
            <StatBlock label="PoDL Credentials" value={user.podlCount} />
          </div>
        </CardContent>
      </Card>

      {/* ID/Credential Verification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ID / Credential Verification</CardTitle>
            <Badge status={verificationStatusVariant[user.verificationStatus]}>
              {verificationStatusLabel[user.verificationStatus]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {user.verificationDocuments.length === 0 ? (
            <p className="text-sm font-body text-text-caption text-center py-4">
              No verification documents submitted.
            </p>
          ) : (
            <div className="space-y-3">
              {user.verificationDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border border-border rounded-inner"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-text-caption" />
                    <div>
                      <p className="text-sm font-medium text-text-heading font-body">{doc.type}</p>
                      <p className="text-xs text-text-caption font-body">
                        {doc.fileName} -- Submitted {format(new Date(doc.submittedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={docStatusVariant[doc.status]}>
                      {docStatusLabel[doc.status]}
                    </Badge>
                    {doc.status === 'pending' && (
                      <div className="flex items-center gap-1 ml-2">
                        <UserActionDialog
                          actionLabel="Approve Document"
                          actionDescription={`Approve the ${doc.type} document for ${user.displayName}. This will be recorded in the audit trail.`}
                          onConfirm={async (reason) => {
                            await approveMutation.mutateAsync({ docId: doc.id, reason })
                          }}
                          trigger={
                            <Button variant="ghost" size="sm" title="Approve">
                              <CheckCircle className="h-4 w-4 text-status-success" />
                            </Button>
                          }
                        />
                        <UserActionDialog
                          actionLabel="Reject Document"
                          actionDescription={`Reject the ${doc.type} document for ${user.displayName}. The user will be notified and may resubmit.`}
                          onConfirm={async (reason) => {
                            await rejectMutation.mutateAsync({ docId: doc.id, reason })
                          }}
                          trigger={
                            <Button variant="ghost" size="sm" title="Reject">
                              <XCircle className="h-4 w-4 text-status-urgent" />
                            </Button>
                          }
                          destructive
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-caption font-body uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-body text-text-body">{value}</p>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-bg-dashboard rounded-inner">
      <p className="text-2xl font-display font-semibold text-text-heading">{value}</p>
      <p className="text-xs font-body text-text-caption mt-0.5">{label}</p>
    </div>
  )
}
