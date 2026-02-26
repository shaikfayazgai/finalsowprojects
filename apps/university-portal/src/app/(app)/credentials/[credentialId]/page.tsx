'use client'
import { use } from 'react'
import { PoDLCredentialDetail } from '@/components/credentials'
import { PageHeader } from '@glimmora/ui'
import Link from 'next/link'

export default function CredentialDetailPage({
  params,
}: {
  params: Promise<{ credentialId: string }>
}) {
  const { credentialId } = use(params)
  return (
    <div className="p-6">
      <PageHeader
        title="Credential Details"
        breadcrumb={
          <Link href="/credentials" className="hover:text-brand-primary transition-colors">
            Credentials
          </Link>
        }
      />
      <PoDLCredentialDetail credentialId={credentialId} />
    </div>
  )
}
