'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Heading, Body, FileUpload, Stepper, Spinner } from '@glimmora/ui'
import { useAuthStore } from '@/store/auth-store'

const ONBOARDING_STEPS = [
  { label: 'Company' },
  { label: 'Billing' },
  { label: 'Team' },
  { label: 'First SOW' },
]

export function FirstSOWStep() {
  const router = useRouter()
  const { completeOnboarding } = useAuthStore()
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  async function handleUpload() {
    if (files.length === 0) return
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', files[0])

      await fetch('/api/enterprise/sow/upload', {
        method: 'POST',
        body: formData,
      })

      completeOnboarding()
      router.push('/dashboard')
    } catch {
      // Let user retry
    } finally {
      setIsUploading(false)
    }
  }

  function handleSkip() {
    completeOnboarding()
    router.push('/dashboard')
  }

  return (
    <div className="space-y-6">
      <Stepper steps={ONBOARDING_STEPS} currentStep={3} />

      <div>
        <Heading level="h2">Upload Your First SOW</Heading>
        <Body className="mt-1 text-text-caption">
          Upload a Statement of Work and our APG will analyze it, extracting tasks, skills,
          and timeline estimates. You can also skip this and upload later.
        </Body>
      </div>

      <FileUpload
        accept=".pdf,.docx"
        maxFiles={1}
        maxSizeMB={50}
        onFilesChange={setFiles}
      />

      {isUploading && (
        <div className="flex items-center gap-3 p-4 bg-bg-card rounded-card border border-border">
          <Spinner className="h-5 w-5" />
          <Body className="text-sm">Uploading your SOW...</Body>
        </div>
      )}

      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full"
          disabled={files.length === 0 || isUploading}
          onClick={handleUpload}
        >
          {isUploading ? 'Uploading...' : 'Upload & Complete Setup'}
        </Button>

        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-center text-sm text-text-caption hover:text-text-body transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
