'use client'
import type { Blueprint } from '@glimmora/types'
import { useEditorStore } from '@/store/editor-store'

interface TeamPoolPanelProps {
  blueprint: Blueprint
}

export function TeamPoolPanel({ blueprint }: TeamPoolPanelProps) {
  const selectedClauseId = useEditorStore((s) => s.selectedClauseId)

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-heading font-semibold text-text-heading mb-4">
        Team Pool
      </h2>
      {!selectedClauseId ? (
        <p className="text-sm font-body text-text-caption">
          Select a SOW clause to see matched contributors
        </p>
      ) : (
        <p className="text-sm font-body text-text-caption">
          Showing matches for selected clause ({blueprint.tasks.length} tasks in blueprint)
        </p>
      )}
    </div>
  )
}
