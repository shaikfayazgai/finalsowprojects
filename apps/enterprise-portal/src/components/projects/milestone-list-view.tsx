'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, Badge } from '@glimmora/ui'
import { format } from 'date-fns'
import type { ProjectMilestone } from '@glimmora/types'

interface MilestoneListViewProps {
  milestones: ProjectMilestone[]
}

const statusBadgeMap: Record<
  ProjectMilestone['status'],
  'done' | 'normal' | 'inprogress' | 'atrisk'
> = {
  completed: 'done',
  'in-progress': 'inprogress',
  pending: 'normal',
  overdue: 'atrisk',
}

const healthConfig: Record<
  string,
  { label: string; dotClass: string; textClass: string }
> = {
  completed: {
    label: 'On Track',
    dotClass: 'bg-status-success',
    textClass: 'text-status-success',
  },
  'in-progress': {
    label: 'On Track',
    dotClass: 'bg-status-success',
    textClass: 'text-status-success',
  },
  pending: {
    label: 'Pending',
    dotClass: 'bg-border',
    textClass: 'text-text-caption',
  },
  overdue: {
    label: 'Delayed',
    dotClass: 'bg-status-urgent',
    textClass: 'text-status-urgent',
  },
}

const columns: ColumnDef<ProjectMilestone, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium text-text-heading">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge status={statusBadgeMap[status]}>
          {status.replace('-', ' ')}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'targetDate',
    header: 'Target Date',
    cell: ({ row }) =>
      format(new Date(row.original.targetDate), 'MMM d, yyyy'),
  },
  {
    id: 'completedDate',
    header: 'Completed Date',
    cell: ({ row }) =>
      row.original.completedDate
        ? format(new Date(row.original.completedDate), 'MMM d, yyyy')
        : '--',
  },
  {
    id: 'health',
    header: 'Health',
    cell: ({ row }) => {
      const cfg = healthConfig[row.original.status] ?? healthConfig.pending
      return (
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${cfg.dotClass}`}
          />
          <span className={`text-sm font-body ${cfg.textClass}`}>
            {cfg.label}
          </span>
        </div>
      )
    },
  },
  {
    id: 'taskCount',
    header: 'Tasks',
    cell: ({ row }) => row.original.taskIds.length,
  },
]

export function MilestoneListView({ milestones }: MilestoneListViewProps) {
  return (
    <DataTable<ProjectMilestone>
      columns={columns}
      data={milestones}
      pageSize={10}
      enableSorting
    />
  )
}
