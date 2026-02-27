'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Spinner, Button } from '@glimmora/ui'
import { VersionHistoryList } from '@/components/sow'
import type { SOW } from '@glimmora/types'
import Link from 'next/link'
import { Upload } from 'lucide-react'

export default function VersionsPage() {
  const params = useParams<{ sowId: string }>()

  const { data, isLoading, error } = useQuery<SOW[]>({
    queryKey: ['sow-versions', params.sowId],
    queryFn: async () => {
      const res = await fetch(`/api/enterprise/sow/${params.sowId}/versions`)
      if (!res.ok) throw new Error('Failed to fetch versions')
      return res.json()
    },
  })

  return (
    <div className="p-6">
      <PageHeader
        title="SOW Version History"
        subtitle="Track all versions of this Statement of Work"
        actions={
          <Button asChild variant="secondary">
            <Link href={`/sow/upload?existingSOWId=${params.sowId}`}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New Version
            </Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {error && (
        <div className="p-4 text-status-urgent text-sm">
          Failed to load version history. Please try again.
        </div>
      )}

      {data && <VersionHistoryList versions={data} />}
    </div>
  )
}
