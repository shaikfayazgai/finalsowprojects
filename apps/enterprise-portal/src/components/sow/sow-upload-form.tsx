'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Body, FileUpload, Spinner } from '@glimmora/ui'
import { AlertCircle, CheckCircle } from 'lucide-react'

type UploadState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

export function SOWUploadForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const existingSOWId = searchParams.get('existingSOWId')

  const [files, setFiles] = useState<File[]>([])
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleUpload() {
    if (files.length === 0) return

    setUploadState('uploading')
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', files[0])
      if (existingSOWId) {
        formData.append('existingSOWId', existingSOWId)
      }

      setUploadState('processing')

      const res = await fetch('/api/enterprise/sow/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json() as { sowId: string }
      setUploadState('complete')

      // Brief delay to show completion state before redirect
      setTimeout(() => {
        router.push(`/sow/${data.sowId}/intelligence`)
      }, 500)
    } catch {
      setUploadState('error')
      setErrorMessage('Failed to upload SOW. Please try again.')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {existingSOWId && (
        <div className="flex items-center gap-3 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-card">
          <AlertCircle className="h-5 w-5 text-brand-primary shrink-0" />
          <Body className="text-sm text-brand-primary">
            Uploading as new version of existing SOW. The previous version will be archived.
          </Body>
        </div>
      )}

      {uploadState === 'idle' && (
        <>
          <FileUpload
            accept=".pdf,.docx"
            maxFiles={1}
            maxSizeMB={50}
            onFilesChange={setFiles}
          />

          {files.length > 0 && (
            <Button size="lg" className="w-full" onClick={handleUpload}>
              {existingSOWId ? 'Upload New Version' : 'Upload & Analyze SOW'}
            </Button>
          )}
        </>
      )}

      {uploadState === 'uploading' && (
        <div className="flex items-center gap-3 p-6 bg-bg-card rounded-card border border-border">
          <Spinner className="h-5 w-5" />
          <Body>Uploading document...</Body>
        </div>
      )}

      {uploadState === 'processing' && (
        <div className="p-6 bg-bg-card rounded-card border border-border space-y-4">
          <div className="flex items-center gap-3">
            <Spinner className="h-5 w-5" />
            <Body className="font-medium">APG is analyzing your SOW</Body>
          </div>
          <Body className="text-sm text-text-caption">
            Extracting tasks, skills, and timeline estimates. This usually takes 10-30 seconds...
          </Body>
          <div className="space-y-2">
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-gold animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}

      {uploadState === 'complete' && (
        <div className="flex items-center gap-3 p-6 bg-brand-forest/5 border border-brand-forest/20 rounded-card">
          <CheckCircle className="h-5 w-5 text-brand-forest shrink-0" />
          <Body className="text-brand-forest">
            SOW analyzed successfully. Redirecting to intelligence report...
          </Body>
        </div>
      )}

      {uploadState === 'error' && (
        <div className="p-6 bg-bg-card rounded-card border border-status-urgent/20 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-status-urgent" />
            <Body className="text-status-urgent">{errorMessage}</Body>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setUploadState('idle')
              setFiles([])
            }}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
