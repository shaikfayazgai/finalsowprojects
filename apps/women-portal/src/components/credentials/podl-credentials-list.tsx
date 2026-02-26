'use client'
import { PoDLCard, PageHeader } from '@glimmora/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import type { PoDLCredential } from '@glimmora/types'

export function PoDLCredentialsList() {
  const t = useTranslations('credentials')
  const { data } = useQuery<{ data: PoDLCredential[] }>({
    queryKey: ['credentials'],
    queryFn: () => fetch('/api/credentials').then(r => r.json()),
  })

  const credentials = data?.data || []

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('title')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {credentials.map((cred) => (
          <PoDLCard
            key={cred.id}
            title={cred.title}
            projectName={cred.organizationName}
            completedDate={new Date(cred.issuedAt).toLocaleDateString()}
            skills={cred.skillsDemonstrated}
            verificationHash={cred.evidenceHash}
            chainVerified={!cred.isRevoked}
            onExport={cred.exportUrl ? () => window.open(cred.exportUrl) : undefined}
          />
        ))}
        {credentials.length === 0 && (
          <p className="text-center text-sm font-body text-text-caption py-8 col-span-2">{t('empty')}</p>
        )}
      </div>
    </div>
  )
}
