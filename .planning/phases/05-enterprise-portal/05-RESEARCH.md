# Phase 5: Enterprise Portal - Research

**Researched:** 2026-02-26
**Domain:** 4-panel synchronized Blueprint Editor, Gantt timeline, SOW file upload with mock APG processing, OTP confirmation, bulk payment release, PDF export (PoDL + ESG), enterprise onboarding, MSW mock layer
**Confidence:** HIGH

## Summary

Phase 5 builds the Enterprise Portal (port 3003) with 26 requirements (EP-01..EP-26). The portal is the most feature-rich of all GlimmoraTeam portals: SOW upload with simulated APG intelligence, a 4-panel Blueprint Editor, project dashboards with Gantt timelines, evidence review with payment release, and compliance report export. The enterprise-portal app already exists with canary page, MSW setup, Zustand store, and providers -- all established Phase 1-3 patterns.

The six key technical challenges are: (1) the 4-panel Blueprint Editor with synchronized clause-selection state across panels (not synchronized scroll, but synchronized *focus*: selecting a SOW clause highlights the related task in the tree, shows related team matches, and updates project settings), (2) Gantt timeline with horizontal bars, health indicators, and list-view toggle, (3) OTP confirmation for blueprint approval and payment release, (4) file upload for SOW documents with simulated processing, (5) bulk payment release using DataTable row selection, and (6) PoDL and ESG compliance PDF export.

All six are solvable with existing stack + minimal new additions. The project already has `react-resizable-panels` v4 in `@glimmora/ui`, `Recharts` 2.15 for charting, `@react-pdf/renderer` in university-portal (pattern exists), `DataTable<T>` with `enableSelection`, `FileUpload` component, and Radix OTP primitive (`unstable_OneTimePasswordField`) available via the installed `radix-ui@1.4.3` package.

**Primary recommendation:** Build the Blueprint Editor as a 4-panel resizable layout using the existing `ResizablePanelGroup` wrapper, with a shared Zustand store (`useEditorStore`) holding `selectedClauseId` to synchronize panel focus/highlight. For Gantt, build a custom horizontal bar chart using Recharts `BarChart` in `layout="vertical"` mode with `XAxis type="number"` for dates -- this avoids adding any new Gantt library and stays consistent with the existing charting stack. For OTP, wrap the Radix `unstable_OneTimePasswordField` in an `OTPInput` component in `@glimmora/ui`. For PDF export, follow the university-portal pattern with `@react-pdf/renderer` dynamic imports.

## Standard Stack

### Core (Already Installed in enterprise-portal)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @glimmora/ui | workspace:* | All design system components (ResizablePanelGroup, DataTable, GradientCard, APGFeed, EvidenceViewer, FileUpload, TimelineBar, etc.) | Installed |
| @glimmora/types | workspace:* | Shared TypeScript contracts (SOW, Project, Evidence, EvidencePack, Task, PoDL, etc.) | Installed |
| @tanstack/react-query | ^5.90.21 | Server state / data fetching from MSW | Installed |
| zustand | ^5.0.11 | Client state (auth, sidebar, editor state, draft state) | Installed |
| msw | ^2.12.10 | Mock API layer | Installed |
| next | ^15.3.3 | App Router framework | Installed |
| react | ^19.1.0 | UI framework | Installed |

### Available in @glimmora/ui (No Install Needed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| react-resizable-panels | ^4.6.5 | 4-panel Blueprint Editor layout | Already wrapped as ResizablePanelGroup/ResizablePanel/ResizableHandle |
| recharts | ^2.15.4 | Gantt chart (custom horizontal bars), KPI charts | Already used by BarChart, Sparkline components |
| radix-ui | ^1.4.3 | OTP input (unstable_OneTimePasswordField), all form primitives | Installed but OTP not yet wrapped |
| prism-react-renderer | ^2.4.1 | Code highlighting in EvidenceViewer | Already used |
| lucide-react | ^0.475.0 | Icons | Already in @glimmora/ui |

### New Dependencies (To Install)
| Library | Version | Purpose | Confidence | Install Target |
|---------|---------|---------|------------|----------------|
| @react-pdf/renderer | ^4.3.2 | PoDL audit report PDF + ESG compliance report PDF | HIGH -- already used in university-portal, React 19 compatible | enterprise-portal |
| date-fns | ^4.1.0 | Gantt chart date calculations, timeline formatting | HIGH -- lightweight, tree-shakeable, no extra locale bloat | enterprise-portal |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Recharts Gantt | SVAR React Gantt (@svar-ui/react-gantt v2.3) | SVAR is a full Gantt library with React 19 support and drag/drop. But it adds ~150KB+ bundled, has its own styling system that conflicts with Tailwind v4, and the Gantt here is read-only display (no drag to reschedule). Recharts is already in the bundle. |
| Custom Recharts Gantt | Kibo UI Gantt (npx kibo-ui add gantt) | Kibo UI is shadcn-style copy-paste, but depends on @dnd-kit, jotai, lodash -- three new deps that conflict with Zustand and add bundle weight. Our Gantt is read-only. |
| Custom Recharts Gantt | gantt-task-react | Abandoned (last updated 4 years ago), not React 19 compatible |
| Radix OTP (unstable) | input-otp (guilhermerodz) | input-otp is stable, 1.4M weekly downloads, but would add a new dependency. The Radix unstable_OneTimePasswordField is already installed via radix-ui@1.4.3, works for numeric validation, and our use case is simple (6-digit OTP confirmation). The "unstable" status is about API stability, not quality -- it functions correctly for numeric OTP. |
| Zustand for editor sync | React Context | Context would trigger full-subtree re-renders when selectedClauseId changes. Zustand with selectors only re-renders the subscribing panel. With 4 panels, this matters. |

**Installation:**
```bash
pnpm add @react-pdf/renderer --filter @glimmora/enterprise-portal
pnpm add date-fns --filter @glimmora/enterprise-portal
```

## Architecture Patterns

### Recommended Project Structure -- Enterprise Portal

```
apps/enterprise-portal/src/
├── app/
│   ├── layout.tsx                      # Root layout (exists)
│   ├── globals.css                     # Tailwind theme import (exists)
│   ├── (pre-auth)/                     # Route group: NO AppShell
│   │   ├── page.tsx                    # Enterprise landing / login (EP login)
│   │   ├── login/page.tsx              # Login page
│   │   └── onboarding/
│   │       ├── layout.tsx              # Stepper layout wrapper
│   │       ├── company/page.tsx        # Step 1: Company Verification
│   │       ├── billing/page.tsx        # Step 2: Billing & Legal
│   │       ├── team/page.tsx           # Step 3: Team Setup
│   │       └── first-sow/page.tsx      # Step 4: Upload First SOW
│   └── (app)/                          # Route group: AppShell + Sidebar
│       ├── layout.tsx                  # AppShell layout with enterprise sidebar
│       ├── dashboard/page.tsx          # Dashboard (EP-06, EP-07)
│       ├── sow/
│       │   ├── upload/page.tsx         # SOW upload (EP-01)
│       │   ├── [sowId]/
│       │   │   ├── intelligence/page.tsx  # APG intelligence output
│       │   │   ├── editor/page.tsx     # 4-panel Blueprint Editor (EP-02)
│       │   │   ├── approve/page.tsx    # Blueprint approval + OTP (EP-03)
│       │   │   └── versions/page.tsx   # Version history (EP-04)
│       │   └── archive/page.tsx        # All SOWs archive (EP-05)
│       ├── projects/
│       │   ├── page.tsx                # Active projects list
│       │   ├── [projectId]/
│       │   │   ├── page.tsx            # Project detail - Overview (EP-08)
│       │   │   ├── timeline/page.tsx   # Gantt + List toggle (EP-09, EP-10, EP-11)
│       │   │   ├── evidence/page.tsx   # Evidence packs (EP-12..EP-15)
│       │   │   ├── rework/page.tsx     # Rework requests (EP-14)
│       │   │   ├── escalation/page.tsx # Escalation centre (EP-15)
│       │   │   ├── payments/page.tsx   # Payment release (EP-16..EP-19)
│       │   │   └── team/page.tsx       # Team summary anonymized (EP-08)
│       │   └── completed/page.tsx      # Completed projects (EP-22)
│       ├── compliance/
│       │   ├── page.tsx                # Evidence & Compliance hub
│       │   ├── podl/page.tsx           # PoDL export (EP-20)
│       │   └── esg/page.tsx            # ESG compliance export (EP-21)
│       ├── payments/
│       │   ├── page.tsx                # Payments hub: pending, history, invoices
│       │   └── settings/page.tsx       # Payment preferences (EP-25)
│       └── settings/
│           ├── page.tsx                # Settings hub
│           ├── organization/page.tsx   # Organization profile (EP-23)
│           ├── team/page.tsx           # Team access management (EP-24)
│           └── notifications/page.tsx  # Notification preferences (EP-26)
├── components/
│   ├── providers/                      # Existing (MSWProvider, QueryProvider, Providers)
│   ├── onboarding/                     # Onboarding step components
│   │   ├── company-verification-step.tsx
│   │   ├── billing-legal-step.tsx
│   │   ├── team-setup-step.tsx
│   │   ├── first-sow-step.tsx
│   │   └── index.ts
│   ├── sow/                            # SOW management components
│   │   ├── sow-upload-form.tsx         # FileUpload + processing animation
│   │   ├── intelligence-display.tsx    # APG extraction results
│   │   ├── blueprint-editor/           # 4-panel editor complex
│   │   │   ├── editor-layout.tsx       # ResizablePanelGroup 4-panel
│   │   │   ├── sow-context-panel.tsx   # Panel 1: SOW with clause highlights
│   │   │   ├── task-tree-panel.tsx     # Panel 2: Editable task tree
│   │   │   ├── team-pool-panel.tsx     # Panel 3: Anonymized team preview
│   │   │   ├── project-settings-panel.tsx # Panel 4: Project settings
│   │   │   └── index.ts
│   │   ├── blueprint-approval.tsx      # Checklist + OTP confirmation
│   │   ├── version-history-list.tsx
│   │   ├── sow-archive-table.tsx
│   │   └── index.ts
│   ├── dashboard/                      # Dashboard widgets
│   │   ├── active-projects-widget.tsx
│   │   ├── pending-actions-widget.tsx
│   │   ├── budget-widget.tsx
│   │   ├── health-metrics-widget.tsx
│   │   └── index.ts
│   ├── projects/                       # Project detail components
│   │   ├── project-card.tsx
│   │   ├── project-detail-tabs.tsx     # 7-tab layout
│   │   ├── project-overview.tsx
│   │   ├── gantt-timeline.tsx          # Recharts horizontal Gantt
│   │   ├── milestone-list-view.tsx     # List view alternative
│   │   ├── evidence-pack-review.tsx    # Enterprise evidence review
│   │   ├── rework-request-form.tsx     # Structured rework feedback
│   │   ├── escalation-form.tsx
│   │   ├── payment-release-card.tsx    # Single payment release
│   │   ├── bulk-payment-release.tsx    # Multi-select + bulk action
│   │   ├── team-summary-grid.tsx       # Anonymized team cards
│   │   └── index.ts
│   ├── compliance/                     # Report export components
│   │   ├── podl-report-pdf.tsx         # @react-pdf/renderer document
│   │   ├── esg-report-pdf.tsx          # @react-pdf/renderer document
│   │   ├── podl-export-form.tsx        # Project/scope selector
│   │   ├── esg-export-form.tsx         # Date range selector
│   │   └── index.ts
│   ├── payments/                       # Payment management
│   │   ├── payment-history-table.tsx
│   │   ├── pending-approvals-table.tsx
│   │   ├── payment-settings-form.tsx
│   │   └── index.ts
│   └── shared/                         # Enterprise-specific shared
│       ├── otp-confirmation-dialog.tsx # OTP dialog (reused in approval + payment)
│       └── index.ts
├── store/
│   ├── app-store.ts                    # Sidebar state (exists)
│   ├── auth-store.ts                   # Enterprise auth state (new)
│   └── editor-store.ts                 # Blueprint Editor synchronized state (new)
└── lib/
    └── msw/
        ├── handlers/                   # Domain-specific handlers
        │   ├── auth.ts
        │   ├── onboarding.ts
        │   ├── sow.ts                  # SOW upload + intelligence + versions
        │   ├── blueprint.ts            # Blueprint editor + approval
        │   ├── projects.ts             # Project list + detail + timeline
        │   ├── evidence.ts             # Evidence packs review
        │   ├── payments.ts             # Payment release + history
        │   ├── compliance.ts           # PoDL + ESG export
        │   ├── settings.ts             # Org profile + team + notifications
        │   ├── dashboard.ts            # Dashboard stats
        │   └── index.ts                # Barrel export
        ├── factories/                  # Mock data factories
        │   ├── common.ts               # randomId, isoNow
        │   ├── sow.ts                  # SOW, SOWDecomposition
        │   ├── project.ts              # Project, ProjectMilestone
        │   ├── evidence.ts             # EvidencePack for enterprise review
        │   ├── payment.ts              # Payment records
        │   └── team.ts                 # Anonymized team members
        ├── browser.ts                  # Existing
        └── server.ts                   # Existing
```

### Pattern 1: 4-Panel Blueprint Editor with Synchronized State

**What:** A 4-panel resizable layout where selecting a SOW clause in Panel 1 highlights the corresponding task in the tree (Panel 2), shows matched team members (Panel 3), and updates relevant project settings (Panel 4). This is NOT synchronized scroll -- it is synchronized *focus/selection state*.

**Why this approach:** The phase blocker note said "4-panel synchronized scroll has no library equivalent -- needs spike." However, reviewing the UX flow (Flow 09-F), the requirement is actually synchronized *context*, not scroll. When the user selects a clause in the SOW, the other panels update their view to show related content. This is a standard shared-state pattern, not a scroll-sync problem.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Blueprint Status Bar (completion %, issues)              │
├──────────┬──────────┬──────────────┬────────────────────┤
│ Panel 1  │ Panel 2  │ Panel 3      │ Panel 4            │
│ SOW      │ Task     │ Team Pool    │ Project            │
│ Context  │ Tree     │ Preview      │ Settings           │
│ (~25%)   │ (~30%)   │ (~22%)       │ (~23%)             │
│          │          │              │                    │
│ Clauses  │ Phases → │ Matched      │ Budget, Timeline   │
│ with     │ MS → T   │ contributors │ Payment triggers   │
│ highlight│          │ (anonymized) │                    │
└──────────┴──────────┴──────────────┴────────────────────┘
```

**Synchronized state via Zustand store:**

```typescript
// apps/enterprise-portal/src/store/editor-store.ts
'use client'
import { create } from 'zustand'

interface BlueprintEditorState {
  // Selection state -- the synchronization mechanism
  selectedClauseId: string | null
  selectedTaskId: string | null
  selectedMilestoneId: string | null

  // Actions
  selectClause: (clauseId: string | null) => void
  selectTask: (taskId: string | null) => void
  selectMilestone: (milestoneId: string | null) => void

  // Blueprint data (loaded from API, editable)
  blueprintDirty: boolean
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
```

**Panel synchronization flow:**
1. User clicks a SOW clause in Panel 1 -> `selectClause('clause-3')`
2. Panel 2 subscribes via `useEditorStore(s => s.selectedClauseId)` -> scrolls to and highlights matching task(s)
3. Panel 3 subscribes -> filters team pool to show skill-matched contributors for that clause's tasks
4. Panel 4 subscribes -> shows budget/timeline relevant to the selected clause's milestone

**Each panel uses Zustand selectors** (not full store subscription) to avoid unnecessary re-renders:

```typescript
// In Panel 2 (Task Tree):
const selectedClauseId = useEditorStore((s) => s.selectedClauseId)
// Only re-renders when selectedClauseId changes, not when other state changes
```

**Scrolling within panels:** Use `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on the highlighted element when selection changes, via a `useEffect` with a ref:

```typescript
const highlightRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  if (selectedClauseId && highlightRef.current) {
    highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}, [selectedClauseId])
```

**Confidence:** HIGH -- this is standard Zustand selector pattern + scrollIntoView, both well-documented. No library equivalent needed because it is NOT a scroll-sync problem.

### Pattern 2: Custom Gantt Chart with Recharts

**What:** A horizontal Gantt timeline showing milestones as colored bars on a time axis, with health status indicators, date ruler, and today marker.

**Approach:** Use Recharts `BarChart` in `layout="vertical"` mode. Each milestone is a data row. The X-axis represents dates (as numbers -- epoch timestamps). Each bar spans from `startDate` to `endDate` using a stacked bar trick:

```typescript
// Convert milestones to Recharts data format
const ganttData = milestones.map((m) => ({
  name: m.name,
  // Invisible offset bar (from 0 to startDate)
  offset: new Date(m.targetDate).getTime() - projectStartTimestamp,
  // Visible duration bar (startDate to endDate)
  duration: new Date(m.completedDate ?? m.targetDate).getTime() -
            new Date(m.targetDate).getTime(),
  health: m.status, // for color coding
}))
```

**Bar colors via health status:**
- `completed` -> gradient green (`var(--color-status-success)`)
- `in-progress` -> gradient blue (`var(--color-brand-primary)`)
- `pending` -> grey (`var(--color-border)`)
- `overdue` -> red (`var(--color-status-urgent)`)

**Today indicator:** A `ReferenceLine` at `x={Date.now() - projectStartTimestamp}` with dashed stroke.

**Date ruler:** Custom `XAxis` tick formatter converting timestamps to readable dates using `date-fns format()`.

**Toggle to list view:** Controlled by a local `useState<'gantt' | 'list'>` -- list view renders a `DataTable<ProjectMilestone>` with standard columns.

**Why Recharts over a Gantt library:**
1. Recharts is already in the bundle (0 KB additional)
2. The Gantt is read-only (no drag to reschedule, no dependency arrows)
3. Consistent styling with other charts via `var(--color-*)` CSS variables
4. The "stacked bar in vertical layout" Gantt pattern is well-documented in Recharts community

**Confidence:** MEDIUM -- The approach is architecturally sound and community-proven, but the exact `BarChart layout="vertical"` stacked approach needs careful implementation of the offset/duration math. If Recharts proves awkward for the date axis, fallback to a custom SVG component (still doable since the TimelineBar component already uses custom SVG-like positioning).

### Pattern 3: OTP Confirmation Dialog (Radix Primitive)

**What:** A reusable OTP confirmation dialog for blueprint approval (EP-03) and payment release (EP-16).

**Approach:** Wrap Radix `unstable_OneTimePasswordField` in a `@glimmora/ui`-style `OTPInput` component, then compose it into a `Dialog` for the confirmation flow.

```typescript
// packages/ui/src/components/otp-input/otp-input.tsx
'use client'
import { unstable_OneTimePasswordField as OneTimePasswordField } from 'radix-ui'
import { cn } from '../../lib/utils'

interface OTPInputProps {
  length?: number
  onComplete?: (value: string) => void
  className?: string
}

export function OTPInput({ length = 6, onComplete, className }: OTPInputProps) {
  return (
    <OneTimePasswordField.Root
      validationType="numeric"
      onValueChange={(value) => {
        if (value.length === length) {
          onComplete?.(value)
        }
      }}
      className={cn('flex gap-2', className)}
    >
      {Array.from({ length }).map((_, i) => (
        <OneTimePasswordField.Input
          key={i}
          className={cn(
            'h-12 w-10 rounded-inner border border-border bg-bg-card text-center',
            'text-lg font-mono text-text-heading',
            'focus:border-brand-primary focus:ring-1 focus:ring-brand-primary',
            'outline-none transition-colors'
          )}
        />
      ))}
      <OneTimePasswordField.HiddenInput />
    </OneTimePasswordField.Root>
  )
}
```

**Confirmation Dialog pattern (enterprise-portal):**

```typescript
// apps/enterprise-portal/src/components/shared/otp-confirmation-dialog.tsx
'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@glimmora/ui'
import { OTPInput } from '@glimmora/ui'

interface OTPConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: (otp: string) => Promise<void>
}

export function OTPConfirmationDialog({
  open, onOpenChange, title, description, onConfirm,
}: OTPConfirmationDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleComplete(otp: string) {
    setLoading(true)
    setError(null)
    try {
      await onConfirm(otp)
      onOpenChange(false)
    } catch {
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <OTPInput length={6} onComplete={handleComplete} />
          {error && <p className="text-sm text-status-urgent">{error}</p>}
          {loading && <p className="text-sm text-text-caption">Verifying...</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**MSW mock for OTP:** Accept any 6-digit value as valid. The mock handler simply checks `otp.length === 6`.

**Confidence:** MEDIUM -- The Radix `unstable_OneTimePasswordField` is functional (installed, v0.1.8) but marked unstable. There are known issues (Oct 2025) with values not persisting in some cases. If issues arise during implementation, fallback to `input-otp` (guilhermerodz) which is stable and has 1.4M weekly downloads. The fallback adds ~5KB.

### Pattern 4: SOW Upload with Mock APG Processing

**What:** User uploads a PDF/DOCX file, sees a processing animation, then gets redirected to the APG intelligence output page.

**Existing components:** `FileUpload` (DS-24) already handles drag-drop, file validation, and file list display. The enterprise portal just needs to:
1. Configure `accept=".pdf,.docx"` and `maxSizeMB={50}`
2. On upload success, POST to `/api/enterprise/sow/upload` (MSW handler)
3. Show processing animation (Spinner + status text)
4. MSW handler returns after a simulated delay (1-3 seconds)
5. Redirect to intelligence output page

**MSW simulation pattern:**

```typescript
// apps/enterprise-portal/src/lib/msw/handlers/sow.ts
import { http, HttpResponse, delay } from 'msw'

export const sowHandlers = [
  http.post('/api/enterprise/sow/upload', async () => {
    // Simulate APG processing time
    await delay(2000)

    return HttpResponse.json({
      data: {
        sowId: 'sow-001',
        status: 'parsed',
        extractedTasks: 12,
        extractedSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        estimatedTimeline: '12 weeks',
        estimatedBudget: 250000,
        confidenceScore: 0.87,
      }
    })
  }),
]
```

**Confidence:** HIGH -- FileUpload component exists, MSW delay() is documented, the pattern is straightforward.

### Pattern 5: Bulk Payment Release with DataTable Selection

**What:** Enterprise user selects multiple evidence packs in a DataTable, clicks "Release All", confirms with OTP.

**Existing component:** `DataTable<T>` already supports `enableSelection={true}` with header-level "select all" and per-row checkboxes (confirmed in source code review). It exposes `RowSelectionState` via TanStack Table.

**Enhancement needed:** The current `DataTable` does not expose a callback for `onRowSelectionChange` or provide a way to get selected rows externally. We need to add a controlled selection pattern:

```typescript
// Enhancement to DataTable or a wrapper:
interface DataTableProps<T> {
  // ... existing props
  onSelectionChange?: (selectedRows: T[]) => void
}
```

**Alternatively**, compose at the page level:

```typescript
// apps/enterprise-portal/src/components/projects/bulk-payment-release.tsx
'use client'
import { useState } from 'react'
import { DataTable, Button } from '@glimmora/ui'
import { OTPConfirmationDialog } from '../shared/otp-confirmation-dialog'
import type { ColumnDef } from '@tanstack/react-table'

// Use DataTable with enableSelection, then access selected rows
// via table instance. Since DataTable encapsulates the table,
// the bulk action bar checks selection count from local state.
```

**Pattern:** Render a "Bulk Actions" toolbar above the DataTable that shows when `selectedRowCount > 0`. The toolbar has "Release Selected ({count})" button that opens the OTP confirmation dialog.

**Confidence:** HIGH -- DataTable already has selection. The composition pattern is standard.

### Pattern 6: PDF Export (PoDL Audit + ESG Compliance)

**What:** Generate downloadable PDF reports for PoDL audit trail and ESG compliance data.

**Established pattern:** University-portal already implements PDF export using `@react-pdf/renderer` with dynamic imports:

```typescript
// Dynamic import to avoid SSR issues:
const { pdf } = await import('@react-pdf/renderer')
const { PoDLReportPDF } = await import('./podl-report-pdf')
const blob = await pdf(<PoDLReportPDF data={reportData} />).toBlob()
// Trigger download via a.click()
```

**PoDL Audit Report fields (per UX flow 09-S):**
- Project name, SOW version, completion date
- Per-milestone: deliverables verified, skills demonstrated, quality scores
- Payment records (amounts, dates, transaction IDs)
- All anonymized (no contributor names)
- Verification hashes
- Cryptographic signature indicator

**ESG Compliance Report fields (per UX flow 09-S + GRI framework):**
- Reporting period (date range)
- Women contributor hours (total, % of workforce)
- Student contributor hours (total, % of workforce)
- % of workforce from underrepresented groups
- Skills development: PoDL credentials issued
- Fair payment: total payments released, on-time payment rate
- Quality metrics: on-time delivery rate, rework rate
- Platform governance: evidence review rate, mentor involvement

These map to GRI Social Standards (GRI 401: Employment, GRI 404: Training and Education, GRI 405: Diversity and Equal Opportunity).

**Confidence:** HIGH -- exact same pattern as university-portal PoDL export. The ESG fields are derived from UX flow documentation + GRI framework standards.

### Anti-Patterns to Avoid

- **Don't use synchronized scroll libraries (e.g., scroll-sync, react-scroll-sync).** The Blueprint Editor needs synchronized *selection state*, not scroll position. Scroll-sync libraries add complexity and don't solve the actual problem.
- **Don't install a full Gantt library (SVAR, DHTMLX, Bryntum) for a read-only timeline.** These are 100KB+ bundles designed for interactive scheduling with drag/drop, dependency arrows, and resource allocation. Our timeline is view-only.
- **Don't put the OTP component directly in enterprise-portal.** Add `OTPInput` to `@glimmora/ui` -- it will be reusable in admin-panel and potentially other portals.
- **Don't use `suppressHydrationWarning` for time-based displays.** Use the `mounted` state pattern (same as mentor-portal SLA countdown).
- **Don't create separate routes for each project detail tab.** Use a single `[projectId]/page.tsx` with client-side `Tabs` for the 7 tabs. Tab state can be in the URL hash (`#timeline`, `#evidence`) for bookmarkability without requiring separate server routes for what is essentially one page with different tab contents.
- **Don't render the Gantt on the server.** The Recharts `ResponsiveContainer` needs browser DOM. Wrap in `'use client'` and lazy-load.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-panel resizable layout | Custom CSS grid with resize handles | `ResizablePanelGroup` from @glimmora/ui (react-resizable-panels v4) | Keyboard a11y, touch, persistence, SSR, all tested |
| OTP input | 6 separate `<input>` elements with manual focus management | Radix `unstable_OneTimePasswordField` (or `OTPInput` wrapper) | Paste handling, keyboard navigation, screen reader support, validation types |
| Data table with selection | Custom table with checkbox column | `DataTable<T>` from @glimmora/ui with `enableSelection={true}` | TanStack Table headless, pagination, sorting, all built |
| File upload with drag-drop | Custom file input + event handlers | `FileUpload` from @glimmora/ui (DS-24) | Validation, drag state, file list, error display, all built |
| PDF generation | Canvas-to-PDF or HTML-to-PDF approaches | `@react-pdf/renderer` | React component model, server-safe, layout engine, tested in university-portal |
| Chart date formatting | Manual string manipulation | `date-fns format()` | Locale-aware, tree-shakeable, immutable dates |
| Timeline bar with milestones | Custom positioned divs | `TimelineBar` from @glimmora/ui for simple views; Recharts for full Gantt | Milestone markers, gradient fill, hover tooltips, all built |

**Key insight:** The Enterprise Portal is the heaviest composition exercise. It reuses more @glimmora/ui components than any other portal (GradientCard, DataTable, EvidenceViewer, APGFeed, PoDLCard, AnonymizedTeamCard, TimelineBar, FileUpload, Tabs, SlideOutPanel, ResizablePanelGroup). The new work is: (a) the Blueprint Editor 4-panel composition + Zustand sync store, (b) the Recharts Gantt adapter, (c) the OTPInput wrapper, (d) enterprise-specific page compositions, and (e) the large MSW mock data layer (~35 endpoints).

## Common Pitfalls

### Pitfall 1: Confusing "Synchronized Scroll" with "Synchronized Selection"

**What goes wrong:** Building a scroll-sync solution that locks all 4 panels' scroll positions together, making them all scroll in unison.
**Why it happens:** The blocker note says "synchronized scroll" but the UX flow describes synchronized *context* -- clicking a clause updates what other panels show.
**How to avoid:** Use Zustand store with `selectedClauseId`. Each panel subscribes to this state and scrolls to / highlights its relevant content independently. Panels scroll independently otherwise.
**Warning signs:** Users can't scroll Panel 2 without Panel 1 also scrolling.

### Pitfall 2: Recharts BarChart Vertical Layout Date Axis

**What goes wrong:** Recharts `layout="vertical"` puts categories on Y-axis and values on X-axis. If the X-axis is dates represented as timestamps, the tick labels show epoch numbers instead of readable dates.
**Why it happens:** Recharts treats numeric X-axis values literally.
**How to avoid:** Use `XAxis type="number" domain={[minDate, maxDate]} tickFormatter={(ts) => format(new Date(ts), 'MMM d')}` from date-fns. Ensure the domain is calculated from the project's start and end dates.
**Warning signs:** X-axis shows numbers like "1740000000000" instead of "Feb 20".

### Pitfall 3: react-resizable-panels 4-Panel Layout Sizing

**What goes wrong:** With 4 panels + 3 handles, percentages must add up to 100%. If any panel's minSize prevents this, panels collapse or overflow.
**Why it happens:** 4 panels is less common than 2-3 panels. The sum of all `minSize` values must be <= 100%.
**How to avoid:** Use minSize values that sum to well under 100%: Panel 1 (min 15%), Panel 2 (min 20%), Panel 3 (min 15%), Panel 4 (min 15%) = 65% minimum, leaving 35% for flexibility. Default sizes: 25/30/22/23 = 100%.
**Warning signs:** Panels won't resize, or one panel collapses to 0 width.

### Pitfall 4: @react-pdf/renderer SSR Crash

**What goes wrong:** Importing `@react-pdf/renderer` at the top level causes Next.js SSR to crash because it accesses browser APIs.
**Why it happens:** `@react-pdf/renderer` uses browser-specific APIs internally.
**How to avoid:** Always use dynamic imports: `const { pdf } = await import('@react-pdf/renderer')`. Never import at module top level. The PDF document component files can use top-level imports from `@react-pdf/renderer` since they are only ever imported dynamically.
**Warning signs:** "window is not defined" or "document is not defined" errors during build or SSR.

### Pitfall 5: GradientCard vs KPIStatCard for Dashboard Metrics

**What goes wrong:** Using `KPIStatCard` for the gradient metric cards on the enterprise dashboard.
**Why it happens:** Both display metrics, but `KPIStatCard` has a white background. The UX spec says "gradient KPI cards."
**How to avoid:** Use `GradientCard` (DS-29) for the 4 main KPI metrics. `GradientCard` has two variants: `primary` (brand-primary to brand-gold) and `nature` (brand-forest to brand-teal). For the 3rd card (per prior decision [03-gap]), use inline style gradient.
**Warning signs:** Dashboard metrics look flat/white instead of having gradient backgrounds.

### Pitfall 6: EvidencePack vs Evidence Type Confusion

**What goes wrong:** The enterprise reviewer views `EvidencePack` (a collection per milestone) but the `EvidenceViewer` component accepts `Evidence[]` (individual items).
**Why it happens:** Two levels of nesting: `EvidencePack` contains `evidenceItems: Evidence[]`. The enterprise portal navigates at the pack level but renders at the item level.
**How to avoid:** When rendering the `EvidenceViewer`, pass `evidencePack.evidenceItems` mapped through the evidence-mapper function (same pattern as mentor-portal). The evidence-mapper strips `contributorId` -- enterprise users see evidence but not who submitted it.
**Warning signs:** TypeScript error passing `EvidencePack` directly to `EvidenceViewer`.

### Pitfall 7: Radix OTP `unstable_` Import Path

**What goes wrong:** Importing `OneTimePasswordField` without the `unstable_` prefix.
**Why it happens:** The component is not yet in stable API.
**How to avoid:** Import as: `import { unstable_OneTimePasswordField as OneTimePasswordField } from 'radix-ui'`. The `@glimmora/ui` wrapper abstracts this -- consumers import `OTPInput` from `@glimmora/ui`, never from `radix-ui` directly.
**Warning signs:** "export not found" TypeScript error.

## Code Examples

### Blueprint Editor Layout (4-Panel Resizable)

```typescript
// apps/enterprise-portal/src/components/sow/blueprint-editor/editor-layout.tsx
'use client'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@glimmora/ui'
import { SOWContextPanel } from './sow-context-panel'
import { TaskTreePanel } from './task-tree-panel'
import { TeamPoolPanel } from './team-pool-panel'
import { ProjectSettingsPanel } from './project-settings-panel'

export function EditorLayout({ sowId }: { sowId: string }) {
  return (
    <div className="h-[calc(100vh-64px)]">
      <ResizablePanelGroup orientation="horizontal" autoSaveId="blueprint-editor">
        <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
          <div className="h-full overflow-y-auto p-4">
            <SOWContextPanel sowId={sowId} />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full overflow-y-auto p-4">
            <TaskTreePanel sowId={sowId} />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={22} minSize={15} maxSize={30}>
          <div className="h-full overflow-y-auto p-4">
            <TeamPoolPanel sowId={sowId} />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={23} minSize={15} maxSize={30}>
          <div className="h-full overflow-y-auto p-4">
            <ProjectSettingsPanel sowId={sowId} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
```

### Recharts Gantt Timeline

```typescript
// apps/enterprise-portal/src/components/projects/gantt-timeline.tsx
'use client'
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts'
import { format } from 'date-fns'
import type { ProjectMilestone } from '@glimmora/types'

interface GanttTimelineProps {
  milestones: ProjectMilestone[]
  projectStartDate: string
  projectEndDate: string
  className?: string
}

const healthColors: Record<string, string> = {
  completed: 'var(--color-status-success)',
  'in-progress': 'var(--color-brand-primary)',
  pending: 'var(--color-border)',
  overdue: 'var(--color-status-urgent)',
}

export function GanttTimeline({
  milestones, projectStartDate, projectEndDate, className,
}: GanttTimelineProps) {
  const startTs = new Date(projectStartDate).getTime()
  const endTs = new Date(projectEndDate).getTime()
  const nowTs = Date.now()

  const data = useMemo(() =>
    milestones.map((m) => {
      const mStart = new Date(m.targetDate).getTime()
      const mEnd = m.completedDate
        ? new Date(m.completedDate).getTime()
        : mStart + 7 * 24 * 3600 * 1000 // Default 1-week duration
      return {
        name: m.name,
        offset: mStart - startTs,
        duration: mEnd - mStart,
        status: m.status,
      }
    }),
    [milestones, startTs]
  )

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={Math.max(200, milestones.length * 48 + 60)}>
        <BarChart data={data} layout="vertical" barSize={20}>
          <XAxis
            type="number"
            domain={[0, endTs - startTs]}
            tickFormatter={(val) => format(new Date(startTs + val), 'MMM d')}
            tick={{ fontSize: 11, fill: 'var(--color-text-caption)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 12, fill: 'var(--color-text-body)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-inner)',
              fontSize: 13,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'offset') return null
              return [
                `${Math.ceil(value / (24 * 3600 * 1000))} days`,
                'Duration',
              ]
            }}
          />
          {/* Invisible offset bar */}
          <Bar dataKey="offset" stackId="gantt" fill="transparent" />
          {/* Visible duration bar with health colors */}
          <Bar dataKey="duration" stackId="gantt" radius={[4, 4, 4, 4]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={healthColors[entry.status] ?? 'var(--color-border)'}
              />
            ))}
          </Bar>
          {/* Today marker */}
          {nowTs >= startTs && nowTs <= endTs && (
            <ReferenceLine
              x={nowTs - startTs}
              stroke="var(--color-status-warning)"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ value: 'Today', position: 'top', fontSize: 10 }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### SOW Upload with Processing Animation

```typescript
// apps/enterprise-portal/src/components/sow/sow-upload-form.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { FileUpload, Button, Spinner } from '@glimmora/ui'

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

export function SOWUploadForm() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<ProcessingStatus>('idle')

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setStatus('uploading')
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/enterprise/sow/upload', {
        method: 'POST',
        body: formData,
      })
      setStatus('processing')
      return res.json()
    },
    onSuccess: (data) => {
      setStatus('complete')
      // Navigate to intelligence output
      router.push(`/sow/${data.data.sowId}/intelligence`)
    },
    onError: () => setStatus('error'),
  })

  return (
    <div className="space-y-6">
      {status === 'idle' && (
        <>
          <FileUpload
            accept=".pdf,.docx"
            maxFiles={1}
            maxSizeMB={50}
            onFilesChange={setFiles}
          />
          <Button
            variant="primary"
            disabled={files.length === 0}
            onClick={() => files[0] && uploadMutation.mutate(files[0])}
          >
            Upload & Analyze SOW
          </Button>
        </>
      )}

      {(status === 'uploading' || status === 'processing') && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Spinner className="h-8 w-8" />
          <p className="text-sm font-body text-text-body">
            {status === 'uploading'
              ? 'Uploading document...'
              : 'APG is analyzing your SOW — extracting tasks, skills, and timeline...'}
          </p>
        </div>
      )}
    </div>
  )
}
```

### ESG Compliance Report PDF

```typescript
// apps/enterprise-portal/src/components/compliance/esg-report-pdf.tsx
'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, color: '#A0614A', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#6B4C3B', marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, color: '#2C1F1A', fontWeight: 'bold', marginBottom: 8 },
  label: { fontSize: 10, color: '#6B4C3B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  value: { fontSize: 13, color: '#2C1F1A', marginBottom: 6 },
  divider: { height: 1, backgroundColor: '#EAD9CC', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40 },
  footerText: { fontSize: 8, color: '#6B4C3B', textAlign: 'center' },
  brandBar: { height: 4, backgroundColor: '#A0614A', marginBottom: 20, borderRadius: 2 },
})

interface ESGReportData {
  organizationName: string
  reportPeriod: string
  generatedDate: string
  // GRI 401: Employment
  womenContributorHours: number
  studentContributorHours: number
  totalContributorHours: number
  womenWorkforcePercentage: number
  studentWorkforcePercentage: number
  // GRI 404: Training
  podlCredentialsIssued: number
  skillsDeveloped: string[]
  // GRI 405: Diversity
  underrepresentedGroupPercentage: number
  // Payment fairness
  totalPaymentsReleased: number
  onTimePaymentRate: number
  currency: string
  // Quality
  onTimeDeliveryRate: number
  reworkRate: number
  mentorReviewRate: number
}

export function ESGReportPDF({ data }: { data: ESGReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBar} />
        <Text style={styles.header}>ESG Compliance Report</Text>
        <Text style={styles.subtitle}>
          {data.organizationName} — {data.reportPeriod}
        </Text>

        {/* Social: Workforce Diversity (GRI 405) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workforce Diversity & Inclusion</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Women Contributor Hours</Text>
            <Text style={styles.value}>{data.womenContributorHours.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Student Contributor Hours</Text>
            <Text style={styles.value}>{data.studentContributorHours.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Women % of Workforce</Text>
            <Text style={styles.value}>{(data.womenWorkforcePercentage * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Underrepresented Groups %</Text>
            <Text style={styles.value}>{(data.underrepresentedGroupPercentage * 100).toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Social: Skills Development (GRI 404) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills Development & Training</Text>
          <View style={styles.row}>
            <Text style={styles.label}>PoDL Credentials Issued</Text>
            <Text style={styles.value}>{data.podlCredentialsIssued}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Skills Developed</Text>
            <Text style={styles.value}>{data.skillsDeveloped.join(', ')}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Governance: Fair Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fair Payment & Governance</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Payments Released</Text>
            <Text style={styles.value}>{data.currency} {data.totalPaymentsReleased.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>On-Time Payment Rate</Text>
            <Text style={styles.value}>{(data.onTimePaymentRate * 100).toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Quality Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Quality</Text>
          <View style={styles.row}>
            <Text style={styles.label}>On-Time Delivery Rate</Text>
            <Text style={styles.value}>{(data.onTimeDeliveryRate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rework Rate</Text>
            <Text style={styles.value}>{(data.reworkRate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mentor Review Coverage</Text>
            <Text style={styles.value}>{(data.mentorReviewRate * 100).toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated {data.generatedDate} by GlimmoraTeam™ — Baarez Technology Solutions
          </Text>
          <Text style={styles.footerText}>
            Aligned with GRI Standards (GRI 401, 404, 405)
          </Text>
        </View>
      </Page>
    </Document>
  )
}
```

## New @glimmora/types Needed

The Enterprise Portal needs several new types for enterprise-specific domain concepts.

### enterprise.ts (new file)

```typescript
// packages/types/src/enterprise.ts

export type EnterpriseOnboardingStepId = 'company' | 'billing' | 'team' | 'first-sow'

export interface EnterpriseOnboardingProgress {
  currentStep: EnterpriseOnboardingStepId
  completedSteps: EnterpriseOnboardingStepId[]
  companyVerified: boolean
}

export type TeamMemberRole = 'admin' | 'project-manager' | 'finance-approver' | 'viewer'

export interface TeamMember {
  id: string
  email: string
  name: string
  role: TeamMemberRole
  invitedAt: string
  acceptedAt?: string
  isActive: boolean
}

export interface OrganizationProfile {
  id: string
  name: string
  logoUrl?: string
  industry: string
  size: '1-50' | '51-200' | '201-1000' | '1000+'
  headquarters: string
  website?: string
  primaryContactEmail: string
  taxId: string
  billingCurrency: string
  billingContactEmail: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
}

export type PaymentReleaseMode = 'manual' | 'auto-on-approval' | 'apg-silent'

export interface PaymentPreferences {
  defaultMode: PaymentReleaseMode
  apgSilentThresholdAmount?: number
  autoReleaseDelayDays?: number
}

export interface PaymentRecord {
  id: string
  projectId: string
  milestoneId: string
  evidencePackId: string
  amount: number
  platformFee: number
  netToContributor: number
  currency: string
  status: 'pending' | 'released' | 'held' | 'disputed'
  releaseMode: PaymentReleaseMode
  releasedAt?: string
  transactionId?: string
  holdReason?: string
  holdExpiresAt?: string
}

export interface BlueprintTask {
  id: string
  title: string
  description: string
  skillRequirements: string[]
  estimatedHours: number
  evidenceTypeExpected: string
  acceptanceCriteria: string
  dependsOn: string[]
  clauseIds: string[] // Links to SOW clauses
}

export interface BlueprintMilestone {
  id: string
  name: string
  description: string
  successCriteria: string
  taskIds: string[]
  budgetAllocation: number
  targetWeek: number
  paymentTrigger: PaymentReleaseMode
}

export interface BlueprintPhase {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  milestoneIds: string[]
}

export interface Blueprint {
  id: string
  sowId: string
  projectName: string
  phases: BlueprintPhase[]
  milestones: BlueprintMilestone[]
  tasks: BlueprintTask[]
  totalBudget: number
  timeline: { startDate: string; endDate: string }
  completionPercentage: number
  issues: string[]
  status: 'draft' | 'review' | 'approved'
}

export interface SOWClause {
  id: string
  text: string
  type: 'objective' | 'deliverable' | 'timeline' | 'budget' | 'compliance' | 'general'
  confidence: number
  linkedTaskIds: string[]
}

export interface SOWIntelligence {
  sowId: string
  projectObjective: string
  clauses: SOWClause[]
  deliverables: Array<{ text: string; included: boolean }>
  timelineEstimates: Array<{ milestone: string; date: string }>
  budgetRange: { min: number; max: number; currency: string }
  complianceFlags: Array<{ item: string; severity: 'mandatory' | 'preferred' | 'note' }>
  confidenceScore: number
  ambiguities: Array<{ section: string; issue: string }>
}

export interface ESGReportData {
  organizationName: string
  reportPeriod: string
  generatedDate: string
  womenContributorHours: number
  studentContributorHours: number
  totalContributorHours: number
  womenWorkforcePercentage: number
  studentWorkforcePercentage: number
  underrepresentedGroupPercentage: number
  podlCredentialsIssued: number
  skillsDeveloped: string[]
  totalPaymentsReleased: number
  onTimePaymentRate: number
  currency: string
  onTimeDeliveryRate: number
  reworkRate: number
  mentorReviewRate: number
}
```

### index.ts updates

```typescript
// Add to packages/types/src/index.ts
export type {
  EnterpriseOnboardingStepId, EnterpriseOnboardingProgress,
  TeamMemberRole, TeamMember, OrganizationProfile,
  PaymentReleaseMode, PaymentPreferences, PaymentRecord,
  BlueprintTask, BlueprintMilestone, BlueprintPhase, Blueprint,
  SOWClause, SOWIntelligence, ESGReportData,
} from './enterprise'
```

## MSW Endpoint Inventory

### Auth & Onboarding
| Method | Endpoint | Purpose | Handler File |
|--------|----------|---------|--------------|
| POST | /api/enterprise/auth/login | Enterprise login | auth.ts |
| GET | /api/enterprise/onboarding | Get onboarding progress | onboarding.ts |
| PATCH | /api/enterprise/onboarding/:step | Complete onboarding step | onboarding.ts |

### SOW Management
| Method | Endpoint | Purpose | Handler File |
|--------|----------|---------|--------------|
| POST | /api/enterprise/sow/upload | Upload SOW file (EP-01) | sow.ts |
| GET | /api/enterprise/sow/:sowId/intelligence | Get APG intelligence output (EP-01) | sow.ts |
| GET | /api/enterprise/sow/:sowId/versions | Get version history (EP-04) | sow.ts |
| GET | /api/enterprise/sow/archive | List all SOWs (EP-05) | sow.ts |
| DELETE | /api/enterprise/sow/:sowId | Archive a SOW (EP-05) | sow.ts |

### Blueprint Editor
| Method | Endpoint | Purpose | Handler File |
|--------|----------|---------|--------------|
| GET | /api/enterprise/blueprint/:sowId | Get blueprint data (EP-02) | blueprint.ts |
| PATCH | /api/enterprise/blueprint/:sowId | Save blueprint edits (EP-02) | blueprint.ts |
| POST | /api/enterprise/blueprint/:sowId/approve | Approve blueprint + OTP (EP-03) | blueprint.ts |

### Projects
| Method | Endpoint | Purpose | Handler File |
|--------|----------|---------|--------------|
| GET | /api/enterprise/projects | List active projects | projects.ts |
| GET | /api/enterprise/projects/:id | Get project detail (EP-06, EP-08) | projects.ts |
| GET | /api/enterprise/projects/:id/timeline | Get milestones for Gantt (EP-09..EP-11) | projects.ts |
| GET | /api/enterprise/projects/:id/apg-activity | Get APG feed (EP-07) | projects.ts |
| GET | /api/enterprise/projects/:id/team | Get anonymized team (EP-08) | projects.ts |
| PATCH | /api/enterprise/projects/:id/hold | Put project on hold | projects.ts |
| GET | /api/enterprise/projects/completed | List completed projects (EP-22) | projects.ts |

### Evidence & Review
| Method | Endpoint | Purpose | Handler File |
|--------|----------|---------|--------------|
| GET | /api/enterprise/projects/:id/evidence | List evidence packs (EP-12) | evidence.ts |
| GET | /api/enterprise/evidence/:packId | Get evidence pack detail (EP-12) | evidence.ts |
| POST | /api/enterprise/evidence/:packId/approve | Approve evidence pack (EP-13) | evidence.ts |
| POST | /api/enterprise/evidence/:packId/rework | Request rework (EP-14) | evidence.ts |
| POST | /api/enterprise/evidence/:packId/escalate | Escalate to mentor (EP-15) | evidence.ts |
| GET | /api/enterprise/projects/:id/rework | List rework requests | evidence.ts |
| GET | /api/enterprise/projects/:id/escalations | List escalations | evidence.ts |

### Payments
| Method | Endpoint | Purpose | Handler File |
|--------|----------|---------|--------------|
| GET | /api/enterprise/projects/:id/payments | List payments for project (EP-16..EP-19) | payments.ts |
| POST | /api/enterprise/payments/:id/release | Release single payment (EP-16) | payments.ts |
| POST | /api/enterprise/payments/bulk-release | Release multiple payments (EP-19) | payments.ts |
| GET | /api/enterprise/payments/:id/auto-settings | Get auto-payment config (EP-17) | payments.ts |
| PATCH | /api/enterprise/payments/preferences | Update payment preferences (EP-25) | payments.ts |
| GET | /api/enterprise/payments/silent-approvals | APG silent approvals log (EP-18) | payments.ts |
| GET | /api/enterprise/payments/history | Full payment history | payments.ts |

### Compliance & Reports
| Method | Endpoint | Purpose | Handler File |
|--------|----------|---------|--------------|
| GET | /api/enterprise/compliance/podl/:projectId | Get PoDL report data (EP-20) | compliance.ts |
| GET | /api/enterprise/compliance/esg | Get ESG report data (EP-21) | compliance.ts |

### Dashboard & Settings
| Method | Endpoint | Purpose | Handler File |
|--------|----------|---------|--------------|
| GET | /api/enterprise/dashboard | Dashboard summary stats | dashboard.ts |
| GET | /api/enterprise/organization | Get org profile (EP-23) | settings.ts |
| PATCH | /api/enterprise/organization | Update org profile (EP-23) | settings.ts |
| GET | /api/enterprise/team | List team members (EP-24) | settings.ts |
| POST | /api/enterprise/team/invite | Invite team member (EP-24) | settings.ts |
| PATCH | /api/enterprise/team/:id | Update team member role (EP-24) | settings.ts |
| DELETE | /api/enterprise/team/:id | Remove team member (EP-24) | settings.ts |
| GET | /api/enterprise/notifications/preferences | Get notification prefs (EP-26) | settings.ts |
| PATCH | /api/enterprise/notifications/preferences | Update notification prefs (EP-26) | settings.ts |

**Total: ~35 endpoints across 9 handler files.**

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-resizable-panels v2 (PanelGroup, direction) | v4 (Group, Panel, Separator, orientation) | 2024 Q4 | Already handled in @glimmora/ui wrapper |
| Radix OTP not available | unstable_OneTimePasswordField in radix-ui@1.4 | 2025 Q3 | Can wrap for OTP needs; unstable API may change |
| Full Gantt library required | Recharts vertical bar + stacked offset pattern | N/A (community pattern) | No new dependency for read-only Gantt |
| @react-pdf/renderer v3 | v4.3 (React 19 compatible) | 2024 Q4 | Already proven in university-portal |

**Deprecated/outdated:**
- The `gantt-task-react` library (0.3.9) has not been updated in 4 years and does not support React 19. Do not use.
- The `input-otp` library (1.4.2) is stable but not needed -- Radix OTP is already installed.

## Open Questions

1. **Radix OTP stability for production**
   - What we know: The component is marked `unstable_` (v0.1.8). There are reported issues with values not persisting (Oct 2025 GitHub issue #3709).
   - What's unclear: Whether these issues are fixed in newer radix-ui versions, or if they affect our specific numeric-only use case.
   - Recommendation: Start with Radix OTP. If issues arise during implementation, switch to `input-otp` (guilhermerodz) -- 5-minute swap since both are wrapped behind `OTPInput` in `@glimmora/ui`.

2. **Recharts Gantt date axis precision**
   - What we know: Recharts `BarChart layout="vertical"` with `XAxis type="number"` works for numeric ranges. Using timestamps as the domain is common in the Recharts community.
   - What's unclear: Whether the built-in tooltip and tick formatting handle large timestamp numbers gracefully, or if we need custom formatters.
   - Recommendation: Implement with date-fns formatters for ticks and tooltips. If the stacked-bar approach proves too complex, fallback to the simpler custom SVG approach (the existing `TimelineBar` component already demonstrates SVG-like milestone positioning with Tailwind).

3. **Blueprint Editor responsive collapse**
   - What we know: Desktop is the primary platform for enterprise users (UX flow says "desktop-first, tablet-responsive").
   - What's unclear: How the 4-panel editor should look on tablets. Four panels won't fit on a 768px screen.
   - Recommendation: Below `lg:` (1024px), stack panels vertically in accordion style (SOW context as collapsible header, task tree full width, team pool as collapsible, settings as collapsible). This is a page-level concern, not a library concern. Desktop is the primary UX target.

4. **DataTable bulk selection callback**
   - What we know: DataTable already has `enableSelection` and `RowSelectionState`. But it does not expose a callback to get selected row data to the parent.
   - What's unclear: Whether to enhance DataTable generically or build a wrapper in the enterprise portal.
   - Recommendation: Build a `BulkPaymentTable` wrapper in enterprise-portal that uses TanStack Table directly (not DataTable) for full control. Or, enhance DataTable with an `onSelectionChange` callback -- simpler and benefits all portals.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `@glimmora/ui` ResizablePanelGroup wrapper at `packages/ui/src/components/resizable-panels/resizable-panels.tsx` -- confirmed 4-panel support
- Existing codebase: `@glimmora/ui` DataTable at `packages/ui/src/components/data-table/data-table.tsx` -- confirmed enableSelection with header "select all"
- Existing codebase: `@glimmora/ui` GradientCard at `packages/ui/src/components/gradient-card/gradient-card.tsx` -- confirmed two gradient variants
- Existing codebase: `@glimmora/ui` EvidenceViewer at `packages/ui/src/components/evidence-viewer/evidence-viewer.tsx` -- confirmed Evidence union type
- Existing codebase: `@glimmora/ui` APGFeed at `packages/ui/src/components/apg-feed/apg-feed.tsx` -- confirmed action types include `payment_triggered`
- Existing codebase: `@glimmora/ui` FileUpload at `packages/ui/src/components/file-upload/file-upload.tsx` -- confirmed accept/maxFiles/maxSizeMB props
- Existing codebase: `@glimmora/types` SOW, SOWDecomposition types at `packages/types/src/sow.ts`
- Existing codebase: `@glimmora/types` Project, ProjectMilestone types at `packages/types/src/project.ts`
- Existing codebase: `@glimmora/types` Evidence, EvidencePack types at `packages/types/src/evidence.ts`
- Existing codebase: University-portal PoDL PDF export at `apps/university-portal/src/components/credentials/podl-pdf-document.tsx` -- confirmed @react-pdf/renderer pattern
- UX research: Flow 09 at `ux-research/flows/09-flow-enterprise-requester.md` -- full navigation map + 20 flows
- [Radix OneTimePasswordField docs](https://www.radix-ui.com/primitives/docs/components/one-time-password-field) -- confirmed API: Root, Input, HiddenInput; validationType="numeric"; unstable_ prefix
- [npm: react-resizable-panels](https://www.npmjs.com/package/react-resizable-panels) -- v4.6.5, Group/Panel/Separator API confirmed
- Installed radix-ui@1.4.3 includes @radix-ui/react-one-time-password-field@0.1.8 (verified in node_modules)

### Secondary (MEDIUM confidence)
- [SVAR React Gantt v2.3](https://svar.dev/react/gantt/) -- React 19 compatible, MIT licensed, but introduces conflicting styling system and deps (date-fns, jotai, @dnd-kit)
- [Kibo UI Gantt](https://www.kibo-ui.com/components/gantt) -- shadcn-style, but adds jotai, @dnd-kit, lodash dependencies
- [Recharts community Gantt pattern](https://github.com/rudrodip/recharts-gantt-chart) -- demonstrates BarChart vertical layout for Gantt; small project (28 stars) but validates the Recharts approach
- [GRI Standards 2025](https://www.globalreporting.org/standards/) -- ESG field guidance (GRI 401, 404, 405 for social/workforce reporting)

### Tertiary (LOW confidence)
- [Radix OTP Issue #3709](https://github.com/radix-ui/primitives/issues/3709) -- reports of values not persisting (Oct 2025); unclear if fixed in latest radix-ui
- [Radix OTP stability timeline #3663](https://github.com/radix-ui/primitives/issues/3663) -- no confirmed timeline for stable release

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified in node_modules, versions confirmed, no new core deps needed
- Architecture (Blueprint Editor): HIGH -- Zustand selector pattern is standard; ResizablePanelGroup already proven with 3 panels in mentor-portal
- Architecture (Gantt): MEDIUM -- Recharts vertical bar approach is community-proven but implementation details need validation
- Architecture (OTP): MEDIUM -- Radix OTP works but is unstable; fallback (input-otp) is readily available
- Architecture (PDF export): HIGH -- identical pattern to university-portal, proven with @react-pdf/renderer v4.3
- Types: HIGH -- derived from UX flow 09 (every screen detailed) + existing @glimmora/types patterns
- MSW endpoints: HIGH -- systematically mapped from 26 requirements to REST endpoints
- Pitfalls: HIGH -- all derived from verified codebase analysis and prior phase lessons

**Research date:** 2026-02-26
**Valid until:** 2026-03-26 (30 days -- stable libraries, no fast-moving concerns)
