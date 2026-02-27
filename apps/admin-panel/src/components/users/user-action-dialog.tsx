'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Textarea,
  Button,
} from '@glimmora/ui'

interface UserActionDialogProps {
  actionLabel: string
  actionDescription: string
  onConfirm: (reason: string) => Promise<void>
  trigger: React.ReactNode
  destructive?: boolean
}

export function UserActionDialog({
  actionLabel,
  actionDescription,
  onConfirm,
  trigger,
  destructive = false,
}: UserActionDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleConfirm() {
    if (!reason.trim()) return
    setIsSubmitting(true)
    try {
      await onConfirm(reason.trim())
      setReason('')
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-display font-semibold text-text-heading">
            {actionLabel}
          </DialogTitle>
          <DialogDescription className="text-sm font-body text-text-caption">
            {actionDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-heading font-body">
            Reason <span className="text-status-urgent">*</span>
          </label>
          <Textarea
            placeholder="Provide a reason for this action (required for audit trail)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          {reason.trim() === '' && (
            <p className="text-xs text-text-caption font-body">
              A reason is required and will be recorded in the audit log.
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
