'use client'
import type { Blueprint } from '@glimmora/types'
import { useEditorStore } from '@/store/editor-store'

interface ProjectSettingsPanelProps {
  blueprint: Blueprint
}

export function ProjectSettingsPanel({ blueprint }: ProjectSettingsPanelProps) {
  const selectedMilestoneId = useEditorStore((s) => s.selectedMilestoneId)

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-heading font-semibold text-text-heading mb-4">
        Project Settings
      </h2>
      <p className="text-sm font-body text-text-body">
        {blueprint.projectName} - ${blueprint.totalBudget.toLocaleString()}
      </p>
      {selectedMilestoneId && (
        <p className="text-sm font-body text-text-caption mt-2">
          Milestone selected: {selectedMilestoneId}
        </p>
      )}
    </div>
  )
}
