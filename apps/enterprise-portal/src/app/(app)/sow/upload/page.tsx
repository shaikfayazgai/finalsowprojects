import { Suspense } from 'react'
import { PageHeader, Spinner } from '@glimmora/ui'
import { SOWUploadForm } from '@/components/sow'

export default function SOWUploadPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Upload Statement of Work"
        subtitle="Upload a PDF or DOCX file and APG will analyze it for tasks, skills, and timeline."
      />
      <Suspense fallback={<Spinner className="h-6 w-6" />}>
        <SOWUploadForm />
      </Suspense>
    </div>
  )
}
