'use client'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button, Heading, Body, Spinner, Badge } from '@glimmora/ui'
import { CheckCircle, Clock, XCircle, Shield } from 'lucide-react'
import type { MentorApplication } from '@glimmora/types'

export function ApplicationStatus() {
  const router = useRouter()

  const { data: application, isLoading } = useQuery<MentorApplication>({
    queryKey: ['mentor-application'],
    queryFn: async () => {
      const res = await fetch('/api/mentor/application')
      if (!res.ok) throw new Error('Failed to fetch application')
      return res.json()
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'pending' || status === 'under_review') return 5000
      return false
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Spinner size="lg" />
        <Body className="text-text-secondary">Loading application status...</Body>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center space-y-4">
        <Heading level="h3">No Application Found</Heading>
        <Body className="text-text-secondary">
          You haven&apos;t submitted an application yet.
        </Body>
        <Button onClick={() => router.push('/apply')}>Apply Now</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <StatusIcon status={application.status} />
        <Heading level="h2">Application Status</Heading>
      </div>

      <div className="p-6 bg-bg-card rounded-card shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <Body className="text-text-secondary text-sm">Status</Body>
          <StatusBadge status={application.status} />
        </div>

        <div className="flex items-center justify-between">
          <Body className="text-text-secondary text-sm">Submitted</Body>
          <Body className="text-sm">{new Date(application.submittedAt).toLocaleDateString()}</Body>
        </div>

        {application.reviewedAt && (
          <div className="flex items-center justify-between">
            <Body className="text-text-secondary text-sm">Reviewed</Body>
            <Body className="text-sm">{new Date(application.reviewedAt).toLocaleDateString()}</Body>
          </div>
        )}

        <div>
          <Body className="text-text-secondary text-sm mb-1">Expertise</Body>
          <div className="flex flex-wrap gap-1.5">
            {application.expertiseAreas.map((area) => (
              <span
                key={area}
                className="px-2.5 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Status-specific messaging */}
      {(application.status === 'pending' || application.status === 'under_review') && (
        <div className="p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-card space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-gold" />
            <Body className="font-medium text-sm">APG is Reviewing Your Application</Body>
          </div>
          <Body className="text-text-secondary text-sm">
            The Autonomous Project Governor is evaluating your expertise and credentials.
            This typically takes 24-48 hours. You will be notified when a decision is made.
          </Body>
        </div>
      )}

      {application.status === 'approved' && (
        <div className="space-y-3">
          <div className="p-4 bg-brand-forest/10 border border-brand-forest/20 rounded-card">
            <Body className="text-sm">
              Congratulations! Your application has been approved. Complete the onboarding
              process to start reviewing evidence and mentoring contributors.
            </Body>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push('/onboarding/profile')}
          >
            Proceed to Onboarding
          </Button>
        </div>
      )}

      {application.status === 'rejected' && (
        <div className="space-y-3">
          <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-card space-y-2">
            <Body className="font-medium text-sm">Application Not Approved</Body>
            {application.rejectionReason && (
              <Body className="text-text-secondary text-sm">{application.rejectionReason}</Body>
            )}
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push('/apply')}
          >
            Reapply
          </Button>
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: MentorApplication['status'] }) {
  switch (status) {
    case 'pending':
    case 'under_review':
      return (
        <div className="mx-auto w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center">
          <Clock className="w-6 h-6 text-brand-gold" />
        </div>
      )
    case 'approved':
      return (
        <div className="mx-auto w-12 h-12 rounded-full bg-brand-forest/10 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-brand-forest" />
        </div>
      )
    case 'rejected':
      return (
        <div className="mx-auto w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center">
          <XCircle className="w-6 h-6 text-status-error" />
        </div>
      )
  }
}

function StatusBadge({ status }: { status: MentorApplication['status'] }) {
  switch (status) {
    case 'pending':
      return <Badge status="normal">Pending</Badge>
    case 'under_review':
      return <Badge status="inprogress">Under Review</Badge>
    case 'approved':
      return <Badge status="done">Approved</Badge>
    case 'rejected':
      return <Badge status="urgent">Rejected</Badge>
  }
}
