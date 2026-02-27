'use client'

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@glimmora/ui'
import { Shield } from 'lucide-react'
import { CaseContextPanel } from './case-context-panel'
import { EvidenceMessagesPanel } from './evidence-messages-panel'
import { DecisionFormPanel } from './decision-form-panel'
import { DisputeAuditTrail } from './dispute-audit-trail'
import type { SafetyCase } from '@glimmora/types'

interface SafetyCaseViewProps {
  safetyCase: SafetyCase & {
    assignedAdminName?: string
    slaDeadline?: string
    evidencePreservedAt?: string
  }
}

export function SafetyCaseView({ safetyCase }: SafetyCaseViewProps) {
  return (
    <div className="space-y-6">
      {/* Access restriction notice */}
      <div className="flex items-center gap-2 rounded-inner border border-status-urgent/20 bg-status-urgent/5 px-4 py-3">
        <Shield className="h-4 w-4 text-status-urgent shrink-0" />
        <p className="text-xs font-body text-status-urgent">
          Access to this case is restricted and all actions are logged
        </p>
      </div>

      {/* 3-panel layout (same as regular dispute but with safety modifications) */}
      {/* Desktop: 3-panel resizable */}
      <div className="hidden lg:flex h-[calc(100vh-20rem)]">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <CaseContextPanel dispute={safetyCase} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={45} minSize={30}>
            <EvidenceMessagesPanel disputeId={safetyCase.id} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <DecisionFormPanel
              disputeId={safetyCase.id}
              disputeType={safetyCase.type}
              isSafetyCase={true}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile/Tablet: stacked panels */}
      <div className="lg:hidden flex flex-col gap-4 p-4">
        <CaseContextPanel dispute={safetyCase} />
        <EvidenceMessagesPanel disputeId={safetyCase.id} />
        <DecisionFormPanel
          disputeId={safetyCase.id}
          disputeType={safetyCase.type}
          isSafetyCase={true}
        />
      </div>

      {/* Audit trail always visible for safety cases */}
      <div className="border-t border-border pt-6">
        <DisputeAuditTrail disputeId={safetyCase.id} />
      </div>
    </div>
  )
}
