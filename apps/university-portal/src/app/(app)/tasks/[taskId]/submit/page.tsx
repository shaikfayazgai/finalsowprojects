'use client'
import { use } from 'react'
import { EvidenceSubmissionForm } from '@/components/tasks'
import { PageHeader } from '@glimmora/ui'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function SubmitEvidencePage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = use(params)
  const t = useTranslations('evidence')
  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title={t('title')}
        breadcrumb={
          <Link
            href={`/tasks/${taskId}`}
            className="hover:text-brand-primary transition-colors"
          >
            Task Detail
          </Link>
        }
      />
      <EvidenceSubmissionForm taskId={taskId} />
    </div>
  )
}
