'use client'
import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@glimmora/ui'
import type { Project } from '@glimmora/types'
import { ProjectOverview } from './project-overview'
import { TeamSummaryGrid } from './team-summary-grid'
import { TimelineView } from './timeline-view'

const TAB_CONFIG = [
  { value: 'overview', label: 'Overview' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'evidence', label: 'Evidence Packs' },
  { value: 'rework', label: 'Rework Requests' },
  { value: 'escalation', label: 'Escalation Centre' },
  { value: 'payments', label: 'Payment Release' },
  { value: 'team', label: 'Team Summary' },
] as const

type TabValue = (typeof TAB_CONFIG)[number]['value']

function getInitialTab(): TabValue {
  if (typeof window === 'undefined') return 'overview'
  const hash = window.location.hash.replace('#', '')
  const valid = TAB_CONFIG.some((t) => t.value === hash)
  return valid ? (hash as TabValue) : 'overview'
}

interface ProjectDetailTabsProps {
  project: Project
  projectId: string
}

export function ProjectDetailTabs({ project, projectId }: ProjectDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview')

  useEffect(() => {
    setActiveTab(getInitialTab())

    function onHashChange() {
      const hash = window.location.hash.replace('#', '')
      const valid = TAB_CONFIG.some((t) => t.value === hash)
      if (valid) setActiveTab(hash as TabValue)
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function handleTabChange(value: string) {
    setActiveTab(value as TabValue)
    window.location.hash = value
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full flex-wrap">
        {TAB_CONFIG.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview">
        <ProjectOverview projectId={projectId} project={project} />
      </TabsContent>

      <TabsContent value="timeline">
        <TimelineView
          projectId={projectId}
          projectStartDate={project.startDate}
          projectEndDate={project.targetEndDate}
        />
      </TabsContent>

      <TabsContent value="evidence">
        <div className="py-8 text-center">
          <p className="text-sm font-body text-text-caption">
            Evidence packs view will be added in a subsequent update.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="rework">
        <div className="py-8 text-center">
          <p className="text-sm font-body text-text-caption">
            Rework requests view will be added in a subsequent update.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="escalation">
        <div className="py-8 text-center">
          <p className="text-sm font-body text-text-caption">
            Escalation centre will be added in a subsequent update.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="payments">
        <div className="py-8 text-center">
          <p className="text-sm font-body text-text-caption">
            Payment release view will be added in a subsequent update.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="team">
        <TeamSummaryGrid projectId={projectId} />
      </TabsContent>
    </Tabs>
  )
}
