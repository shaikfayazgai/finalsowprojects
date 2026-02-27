'use client'
import { create } from 'zustand'

interface BlueprintEditorState {
  selectedClauseId: string | null
  selectedTaskId: string | null
  selectedMilestoneId: string | null
  blueprintDirty: boolean
  selectClause: (clauseId: string | null) => void
  selectTask: (taskId: string | null) => void
  selectMilestone: (milestoneId: string | null) => void
  markDirty: () => void
  markClean: () => void
}

export const useEditorStore = create<BlueprintEditorState>()((set) => ({
  selectedClauseId: null,
  selectedTaskId: null,
  selectedMilestoneId: null,
  blueprintDirty: false,
  selectClause: (clauseId) => set({ selectedClauseId: clauseId }),
  selectTask: (taskId) => set({ selectedTaskId: taskId }),
  selectMilestone: (milestoneId) => set({ selectedMilestoneId: milestoneId }),
  markDirty: () => set({ blueprintDirty: true }),
  markClean: () => set({ blueprintDirty: false }),
}))
