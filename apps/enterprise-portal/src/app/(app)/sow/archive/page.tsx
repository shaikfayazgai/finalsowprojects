'use client'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Spinner, Button } from '@glimmora/ui'
import { SOWArchiveTable } from '@/components/sow'
import type { SOW } from '@glimmora/types'
import Link from 'next/link'
import { Upload } from 'lucide-react'

export default function SOWArchivePage() {
  const { data, isLoading, error } = useQuery<SOW[]>({
    queryKey: ['sow-archive'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/sow/archive')
      if (!res.ok) throw new Error('Failed to fetch archive')
      return res.json()
    },
  })

  return (
    <div className="p-6">
      <PageHeader
        title="SOW Archive"
        subtitle="All uploaded Statements of Work for your organization"
        actions={
          <Button asChild>
            <Link href="/sow/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload New SOW
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
          Failed to load SOW archive. Please try again.
        </div>
      )}

      {data && <SOWArchiveTable data={data} />}
    </div>
  )
}
