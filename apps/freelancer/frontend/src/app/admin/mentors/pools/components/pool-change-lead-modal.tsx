"use client";

/**
 * Change pool lead — Meridian Modal (matches tenant detail modals).
 */

import * as React from "react";
import { UserCog } from "lucide-react";
import { Modal, Select } from "@/components/meridian";
import type { MockAdminMentor } from "@/mocks/admin/mentors";
import { cn } from "@/lib/utils/cn";

interface ChangePoolLeadModalProps {
  open: boolean;
  poolName: string;
  currentLeadId: string;
  candidates: MockAdminMentor[];
  onClose: () => void;
  onConfirm: (mentorId: string) => void;
}

export function ChangePoolLeadModal({
  open,
  poolName,
  currentLeadId,
  candidates,
  onClose,
  onConfirm,
}: ChangePoolLeadModalProps) {
  const [leadId, setLeadId] = React.useState(currentLeadId);

  React.useEffect(() => {
    if (open) setLeadId(currentLeadId);
  }, [open, currentLeadId]);

  const unchanged = leadId === currentLeadId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change pool lead"
      description="Lead mentors coordinate routing and escalation within the pool."
      footer={
        <>
          <button type="button" onClick={onClose} className={cancelBtnCls}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!leadId || unchanged}
            onClick={() => onConfirm(leadId)}
            className={primaryBtnCls}
          >
            <UserCog className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Save lead
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ContextStrip label="Pool" value={poolName} />

        <Field label="Lead mentor" required>
          <Select
            variant="outline"
            size="sm"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
          >
            {candidates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          {currentLeadId && (
            <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
              Current lead:{" "}
              <span className="font-medium text-foreground">
                {candidates.find((m) => m.id === currentLeadId)?.name ?? "—"}
              </span>
            </p>
          )}
        </Field>

        <p className="font-body text-[11px] text-text-tertiary leading-snug">
          Change is recorded in pool reassign history and cross-tenant audit.
        </p>
      </div>
    </Modal>
  );
}

function ContextStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2">
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </p>
      <p className="mt-0.5 font-body text-[13px] font-medium text-foreground leading-snug">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && (
          <span className="text-error-text normal-case tracking-normal"> *</span>
        )}
      </span>
      {children}
    </div>
  );
}

const cancelBtnCls = cn(
  "inline-flex items-center h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand",
  "font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);
