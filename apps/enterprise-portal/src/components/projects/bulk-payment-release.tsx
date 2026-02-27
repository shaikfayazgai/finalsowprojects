'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@glimmora/ui'
import type { PaymentRecord, PaymentPreferences, PaymentReleaseMode } from '@glimmora/types'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { OTPConfirmationDialog } from '../shared/otp-confirmation-dialog'
import type { MockSilentApproval } from '../../lib/msw/factories/payment'

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function statusToBadge(status: PaymentRecord['status']): { label: string; variant: 'done' | 'normal' | 'atrisk' | 'inprogress' } {
  switch (status) {
    case 'released':
      return { label: 'Released', variant: 'done' }
    case 'pending':
      return { label: 'Pending', variant: 'normal' }
    case 'held':
      return { label: 'Held', variant: 'inprogress' }
    case 'disputed':
      return { label: 'Disputed', variant: 'atrisk' }
  }
}

/* Styled checkbox for row selection (matching DataTable pattern) */
function SelectCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (event: unknown) => void
}) {
  return (
    <button
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={onChange}
      className={`h-4 w-4 rounded-sm border border-border flex items-center justify-center transition-colors ${
        checked || indeterminate ? 'bg-brand-primary border-brand-primary text-white' : ''
      }`}
    >
      {checked && <Check className="h-3 w-3" />}
      {indeterminate && !checked && <div className="h-0.5 w-2.5 bg-white rounded-full" />}
    </button>
  )
}

const paymentColumns: ColumnDef<PaymentRecord, unknown>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <SelectCheckbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <SelectCheckbox
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    size: 40,
    enableSorting: false,
  },
  {
    accessorKey: 'milestoneId',
    header: 'Milestone',
    cell: ({ getValue }) => (
      <span className="text-sm font-body">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="text-sm font-body font-medium">
        {formatCurrency(row.original.amount, row.original.currency)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const { label, variant } = statusToBadge(getValue<PaymentRecord['status']>())
      return <Badge status={variant}>{label}</Badge>
    },
  },
  {
    accessorKey: 'releaseMode',
    header: 'Release Mode',
    cell: ({ getValue }) => (
      <span className="text-xs font-body text-text-caption capitalize">
        {(getValue<string>() || '').replace(/-/g, ' ')}
      </span>
    ),
  },
  {
    accessorKey: 'releasedAt',
    header: 'Released Date',
    cell: ({ getValue }) => {
      const v = getValue<string | undefined>()
      return (
        <span className="text-xs font-body text-text-caption">
          {v ? new Date(v).toLocaleDateString() : '--'}
        </span>
      )
    },
  },
]

const silentApprovalColumns: ColumnDef<MockSilentApproval, unknown>[] = [
  {
    accessorKey: 'milestoneName',
    header: 'Milestone',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => formatCurrency(row.original.amount, row.original.currency),
  },
  {
    accessorKey: 'threshold',
    header: 'Threshold',
    cell: ({ row }) => formatCurrency(row.original.threshold, row.original.currency),
  },
  {
    accessorKey: 'approvedAt',
    header: 'Auto-Approved',
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
  },
  {
    accessorKey: 'transactionId',
    header: 'Transaction',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{getValue<string>()}</span>
    ),
  },
]

interface BulkPaymentReleaseProps {
  projectId: string
}

export function BulkPaymentRelease({ projectId }: BulkPaymentReleaseProps) {
  const queryClient = useQueryClient()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [otpOpen, setOtpOpen] = useState(false)

  // Payments table data
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentRecord[]>({
    queryKey: ['payments', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/enterprise/projects/${projectId}/payments`)
      if (!res.ok) throw new Error('Failed to fetch payments')
      return res.json()
    },
  })

  // Payment preferences
  const { data: preferences } = useQuery<PaymentPreferences>({
    queryKey: ['payment-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/payments/preferences')
      if (!res.ok) throw new Error('Failed to fetch preferences')
      return res.json()
    },
  })

  // Silent approvals
  const { data: silentApprovals = [] } = useQuery<MockSilentApproval[]>({
    queryKey: ['silent-approvals'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/payments/silent-approvals')
      if (!res.ok) throw new Error('Failed to fetch silent approvals')
      return res.json()
    },
  })

  // Preferences mutation
  const prefsMutation = useMutation({
    mutationFn: async (prefs: Partial<PaymentPreferences>) => {
      const res = await fetch('/api/enterprise/payments/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error('Failed to update preferences')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-preferences'] })
    },
  })

  // Bulk release mutation
  const bulkReleaseMutation = useMutation({
    mutationFn: async (otp: string) => {
      const selectedPayments = table.getSelectedRowModel().rows.map((r) => r.original)
      const res = await fetch('/api/enterprise/payments/bulk-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIds: selectedPayments.map((p) => p.id),
          otp,
        }),
      })
      if (!res.ok) throw new Error('Failed to bulk release')
      return res.json()
    },
    onSuccess: () => {
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })

  // TanStack useReactTable directly (DataTable from @glimmora/ui does NOT expose rowSelection externally)
  const table = useReactTable({
    data: payments,
    columns: paymentColumns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: (row) => row.original.status === 'pending',
    initialState: { pagination: { pageSize: 10 } },
  })

  const selectedPayments = table.getSelectedRowModel().rows.map((r) => r.original)
  const selectedCount = selectedPayments.length
  const totalAmount = selectedPayments.reduce((sum, p) => sum + p.amount, 0)

  const pageIndex = table.getState().pagination.pageIndex
  const totalPages = table.getPageCount()
  const totalRows = payments.length
  const pageSize = table.getState().pagination.pageSize
  const startRow = pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  const [prefsMode, setPrefsMode] = useState<PaymentReleaseMode>(preferences?.defaultMode || 'manual')
  const [prefsThreshold, setPrefsThreshold] = useState<string>(String(preferences?.apgSilentThresholdAmount || 20000))

  if (paymentsLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-body text-text-caption">Loading payments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold text-text-heading">Payment Release</h3>
        <p className="text-sm font-body text-text-caption mt-0.5">
          Manage payment releases for completed milestones. Select pending payments for bulk release.
        </p>
      </div>

      {/* Bulk action toolbar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-card bg-brand-primary/5 border border-brand-primary/20">
          <span className="text-sm font-body text-text-heading">
            {selectedCount} payment(s) selected
          </span>
          <span className="text-sm font-body text-text-caption">
            Total: {formatCurrency(totalAmount, 'USD')}
          </span>
          <Button onClick={() => setOtpOpen(true)} className="ml-auto">
            Release Selected ({formatCurrency(totalAmount, 'USD')})
          </Button>
        </div>
      )}

      {/* Payments table with useReactTable directly */}
      <div className="rounded-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-bg-dashboard">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-body font-medium text-text-caption uppercase tracking-wider"
                      style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-t border-border hover:bg-hover transition-colors ${
                    row.getIsSelected() ? 'bg-hover' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm font-body text-text-body">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-dashboard">
          <p className="text-sm font-body text-text-caption">
            Showing {startRow} to {endRow} of {totalRows}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-body text-text-body border border-border rounded-inner hover:bg-hover disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm font-body text-text-caption">
              Page {pageIndex + 1} of {totalPages}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-body text-text-body border border-border rounded-inner hover:bg-hover disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="payment-mode" className="block text-sm font-body font-medium text-text-heading mb-1">
              Default Payment Release Mode
            </label>
            <Select value={prefsMode} onValueChange={(v) => setPrefsMode(v as PaymentReleaseMode)}>
              <SelectTrigger id="payment-mode" className="w-full">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (OTP required)</SelectItem>
                <SelectItem value="auto-on-approval">Auto on Approval</SelectItem>
                <SelectItem value="apg-silent">APG Silent</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs font-body text-text-caption">
              {prefsMode === 'manual' && 'Payments require manual release with OTP confirmation.'}
              {prefsMode === 'auto-on-approval' && 'Payments are automatically released when evidence is approved.'}
              {prefsMode === 'apg-silent' && 'APG automatically approves and releases payments below the threshold amount.'}
            </p>
          </div>

          {prefsMode === 'apg-silent' && (
            <div>
              <label htmlFor="apg-threshold" className="block text-sm font-body font-medium text-text-heading mb-1">
                APG Silent Threshold Amount (USD)
              </label>
              <input
                id="apg-threshold"
                type="number"
                value={prefsThreshold}
                onChange={(e) => setPrefsThreshold(e.target.value)}
                className="w-full rounded-inner border border-border bg-bg-card px-3 py-2 text-sm font-body text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
              />
              <p className="mt-1 text-xs font-body text-text-caption">
                Payments at or below this amount will be auto-approved by APG without manual review.
              </p>
            </div>
          )}

          <Button
            onClick={() =>
              prefsMutation.mutate({
                defaultMode: prefsMode,
                apgSilentThresholdAmount: Number(prefsThreshold),
              })
            }
            disabled={prefsMutation.isPending}
          >
            {prefsMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>

      {/* APG-Silent Approvals Log */}
      <Card>
        <CardHeader>
          <CardTitle>APG-Silent Approvals Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-body text-text-caption mb-3">
            Payments automatically approved and released by APG when below the configured threshold.
          </p>
          <DataTable
            columns={silentApprovalColumns}
            data={silentApprovals}
            enableSorting
          />
        </CardContent>
      </Card>

      {/* OTP Dialog for bulk release */}
      <OTPConfirmationDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        title="Bulk Payment Release"
        description={`Release ${selectedCount} payment(s) totaling ${formatCurrency(totalAmount, 'USD')}? Enter the 6-digit code sent to your email.`}
        onConfirm={async (otp) => {
          await bulkReleaseMutation.mutateAsync(otp)
        }}
      />
    </div>
  )
}
