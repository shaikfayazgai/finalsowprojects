'use client'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, PoDLCard } from '@glimmora/ui'
import Link from 'next/link'
import type { PoDLCredential } from '@glimmora/types'

export default function CredentialsPage() {
  const t = useTranslations('credentials')

  const { data } = useQuery<{ data: PoDLCredential[] }>({
    queryKey: ['credentials'],
    queryFn: () => fetch('/api/credentials').then((r) => r.json()),
  })

  const credentials = data?.data ?? []

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('title')} />
      {credentials.length === 0 ? (
        <p className="text-center text-sm font-body text-text-caption py-12">
          {t('noCredentials')}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((cred) => (
            <Link key={cred.id} href={`/credentials/${cred.id}`}>
              <PoDLCard
                title={cred.title}
                projectName={cred.organizationName}
                completedDate={new Date(cred.issuedAt).toLocaleDateString()}
                skills={cred.skillsDemonstrated}
                verificationHash={cred.evidenceHash}
                chainVerified={!cred.isRevoked}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
