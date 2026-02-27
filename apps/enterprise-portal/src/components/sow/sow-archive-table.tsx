'use client'
import { useRouter } from 'next/navigation'
import { DataTable, Badge, Button } from '@glimmora/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { SOW, SOWStatus } from '@glimmora/types'
import { Eye, Upload, Pencil } from 'lucide-react'

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

interface SOWArchiveTableProps {
  data: SOW[]
}

export function SOWArchiveTable({ data }: SOWArchiveTableProps) {
  const router = useRouter()

  const columns: ColumnDef<SOW, unknown>[] = [
    {
      accessorKey: 'fileName',
      header: 'SOW Name',
      cell: ({ row }) => (
        <span className="font-medium text-text-heading">{row.original.fileName}</span>
      ),
    },
    {
      accessorKey: 'versionNumber',
      header: 'Version',
      cell: ({ row }) => (
        <span className="text-sm text-text-body">v{row.original.versionNumber ?? 1}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge status={statusVariant(row.original.status)}>
          {statusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: 'uploadedAt',
      header: 'Upload Date',
      cell: ({ row }) => (
        <span className="text-sm text-text-caption">
          {new Date(row.original.uploadedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      accessorKey: 'extractedTasks',
      header: 'Tasks',
      cell: ({ row }) => (
        <span className="text-sm text-text-body">{row.original.extractedTasks}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/sow/${row.original.id}/intelligence`)}
            title="View Intelligence"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/new?sowId=${row.original.id}`)}
            title="Open Editor"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/sow/upload?existingSOWId=${row.original.id}`)}
            title="Upload New Version"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={data} pageSize={10} />
}
