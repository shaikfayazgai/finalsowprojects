'use client'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@glimmora/ui'
import type { Blueprint, SOWIntelligence } from '@glimmora/types'
import { SOWContextPanel } from './sow-context-panel'
import { TaskTreePanel } from './task-tree-panel'
import { TeamPoolPanel } from './team-pool-panel'
import { ProjectSettingsPanel } from './project-settings-panel'

interface EditorLayoutProps {
  blueprint: Blueprint
  intelligence: SOWIntelligence
}

export function EditorLayout({ blueprint, intelligence }: EditorLayoutProps) {
  return (
    <>
      {/* Desktop: 4-panel resizable layout */}
      <div className="hidden lg:flex h-[calc(100vh-8rem)]">
        <ResizablePanelGroup orientation="horizontal" autoSaveId="blueprint-editor">
          <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
            <SOWContextPanel clauses={intelligence.clauses} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <TaskTreePanel blueprint={blueprint} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={22} minSize={15} maxSize={30}>
            <TeamPoolPanel blueprint={blueprint} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={23} minSize={15} maxSize={30}>
            <ProjectSettingsPanel blueprint={blueprint} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile/Tablet: Accordion-style stacked panels */}
      <div className="lg:hidden">
        <Accordion type="multiple" defaultValue={['sow', 'tasks']}>
          <AccordionItem value="sow">
            <AccordionTrigger>SOW Clauses ({intelligence.clauses.length})</AccordionTrigger>
            <AccordionContent>
              <SOWContextPanel clauses={intelligence.clauses} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="tasks">
            <AccordionTrigger>Task Tree ({blueprint.tasks.length} tasks)</AccordionTrigger>
            <AccordionContent>
              <TaskTreePanel blueprint={blueprint} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="team">
            <AccordionTrigger>Team Pool</AccordionTrigger>
            <AccordionContent>
              <TeamPoolPanel blueprint={blueprint} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="settings">
            <AccordionTrigger>Project Settings</AccordionTrigger>
            <AccordionContent>
              <ProjectSettingsPanel blueprint={blueprint} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  )
}
