'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { PoDLCard, Button, Tag } from '@glimmora/ui'
import { Download, ExternalLink } from 'lucide-react'
import type { PoDLCredential } from '@glimmora/types'

interface PoDLCredentialDetailProps {
  credentialId: string
}

export function PoDLCredentialDetail({ credentialId }: PoDLCredentialDetailProps) {
  const t = useTranslations('credentials')
  const [isExporting, setIsExporting] = useState(false)

  const { data } = useQuery<{ data: PoDLCredential }>({
    queryKey: ['credential', credentialId],
    queryFn: () => fetch(`/api/credentials/${credentialId}`).then((r) => r.json()),
  })

  const credential = data?.data
  if (!credential) return null

  async function handleExportPDF() {
    if (!credential) return
    setIsExporting(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { PoDLPDFDocument } = await import('./podl-pdf-document')
      const blob = await pdf(<PoDLPDFDocument credential={credential} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `podl-${credential.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  async function handleShare() {
    await fetch(`/api/credentials/${credentialId}/share`, { method: 'POST' })
    await navigator.clipboard.writeText(
      `${window.location.origin}/credentials/${credentialId}`
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PoDLCard
        title={credential.title}
        projectName={credential.organizationName}
        completedDate={new Date(credential.issuedAt).toLocaleDateString()}
        skills={credential.skillsDemonstrated}
        verificationHash={credential.evidenceHash}
        chainVerified={!credential.isRevoked}
        onShare={handleShare}
        onExport={handleExportPDF}
      />

      {/* Full Details */}
      <div className="bg-bg-card rounded-card shadow-card p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-text-heading">
          {t('details')}
        </h2>

        <div>
          <p className="text-xs font-body text-text-caption uppercase tracking-wider mb-1">
            {t('description')}
          </p>
          <p className="text-sm font-body text-text-body">{credential.description}</p>
        </div>

        <div>
          <p className="text-xs font-body text-text-caption uppercase tracking-wider mb-1">
            {t('organization')}
          </p>
          <p className="text-sm font-body text-text-heading font-medium">
            {credential.organizationName}
          </p>
        </div>

        <div>
          <p className="text-xs font-body text-text-caption uppercase tracking-wider mb-1">
            {t('skills')}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {credential.skillsDemonstrated.map((skill) => (
              <Tag key={skill} variant="skill">
                {skill}
              </Tag>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-body text-text-caption uppercase tracking-wider mb-1">
            {t('issued')}
          </p>
          <p className="text-sm font-body text-text-body">
            {new Date(credential.issuedAt).toLocaleDateString()}
          </p>
        </div>

        <div>
          <p className="text-xs font-body text-text-caption uppercase tracking-wider mb-1">
            {t('verificationHash')}
          </p>
          <p className="text-xs font-mono text-text-caption break-all">
            {credential.evidenceHash}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="primary" onClick={handleExportPDF} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Generating...' : t('exportPdf')}
        </Button>
        <Button variant="secondary" onClick={handleShare}>
          <ExternalLink className="h-4 w-4 mr-2" />
          {t('shareLink')}
        </Button>
      </div>
    </div>
  )
}
