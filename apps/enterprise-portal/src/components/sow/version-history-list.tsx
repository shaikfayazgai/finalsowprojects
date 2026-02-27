'use client'
import { Badge, Body } from '@glimmora/ui'
import type { SOW, SOWStatus } from '@glimmora/types'
import { FileText, Download } from 'lucide-react'

interface VersionHistoryListProps {
  versions: SOW[]
}

function statusVariant(status: SOWStatus): 'done' | 'normal' | 'atrisk' {
  if (status === 'approved' || status === 'blueprint-ready') return 'done'
  if (status === 'failed') return 'atrisk'
  return 'normal'
}

function statusLabel(status: SOWStatus): string {
  const labels: Record<SOWStatus, string> = {
    uploaded: 'Uploaded',
    parsing: 'Parsing',
    parsed: 'Parsed',
    decomposed: 'Decomposed',
    'blueprint-ready': 'Blueprint Ready',
    approved: 'Approved',
    failed: 'Failed',
  }
  return labels[status] || status
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VersionHistoryList({ versions }: VersionHistoryListProps) {
  const sorted = [...versions].sort(
    (a, b) => (b.versionNumber ?? 1) - (a.versionNumber ?? 1)
  )

  return (
    <div className="space-y-3">
      {sorted.map((version, index) => (
        <div
          key={version.id}
          className={`p-4 bg-bg-card rounded-card border ${
            index === 0 ? 'border-brand-primary/30 ring-1 ring-brand-primary/10' : 'border-border'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-text-caption mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Body className="font-medium">
                    v{version.versionNumber ?? 1}
                  </Body>
                  {index === 0 && (
                    <Badge status="done">Latest</Badge>
                  )}
                  <Badge status={statusVariant(version.status)}>
                    {statusLabel(version.status)}
                  </Badge>
                </div>
                <Body className="text-sm text-text-caption">
                  {version.fileName} ({formatFileSize(version.fileSize)})
                </Body>
                <Body className="text-xs text-text-caption">
                  Uploaded {new Date(version.uploadedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Body>
              </div>
            </div>

            <a
              href={version.fileUrl}
              download
              className="flex items-center gap-1.5 text-sm text-brand-primary hover:underline shrink-0"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
