'use client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PageHeader, Spinner, Button, Badge } from '@glimmora/ui'
import type { Blueprint, SOWIntelligence } from '@glimmora/types'
import { EditorLayout } from '@/components/sow/blueprint-editor'
import { useEditorStore } from '@/store/editor-store'

interface BlueprintResponse {
  blueprint: Blueprint
  intelligence: SOWIntelligence
}

export default function BlueprintEditorPage() {
  const params = useParams<{ sowId: string }>()
  const router = useRouter()
  const blueprintDirty = useEditorStore((s) => s.blueprintDirty)
  const markClean = useEditorStore((s) => s.markClean)

  const { data, isLoading, error } = useQuery<BlueprintResponse>({
    queryKey: ['blueprint', params.sowId],
    queryFn: async () => {
      const res = await fetch(`/api/enterprise/blueprint/${params.sowId}`)
      if (!res.ok) throw new Error('Failed to fetch blueprint')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/enterprise/blueprint/${params.sowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data?.blueprint),
      })
      if (!res.ok) throw new Error('Failed to save blueprint')
      return res.json()
    },
    onSuccess: () => {
      markClean()
    },
  })

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PageHeader
            title="Blueprint Editor"
            subtitle="Review and customize the APG-decomposed project blueprint"
          />
          {data && (
            <Badge status={data.blueprint.status === 'draft' ? 'normal' : 'done'}>
              {data.blueprint.status}
            </Badge>
          )}
          {blueprintDirty && (
            <span className="text-xs font-body text-status-warning">Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => saveMutation.mutate()}
            disabled={!blueprintDirty || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button
            onClick={() => router.push(`/sow/${params.sowId}/approve`)}
            disabled={blueprintDirty}
          >
            Proceed to Approval
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {error && (
        <div className="p-4 text-status-urgent text-sm">
          Failed to load blueprint. Please try again.
        </div>
      )}

      {data && (
        <EditorLayout
          blueprint={data.blueprint}
          intelligence={data.intelligence}
        />
      )}
    </div>
  )
}
