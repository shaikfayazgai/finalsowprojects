"use client";

/**
 * Governance case modals — Meridian Modal shell.
 */

import * as React from "react";
import { UserCog } from "lucide-react";
import { Modal, Select } from "@/components/meridian";
import {
  GOV_ASSIGNEES,
  reassignGovCase,
} from "@/lib/admin/mocks/governance-service";
import type { MockGovCase } from "@/mocks/admin/governance";
import { cn } from "@/lib/utils/cn";

type ModalKind = "reassign" | "session" | null;

export function GovernanceActionModals({
  govCase,
  open,
  onClose,
  onSuccess,
}: {
  govCase: MockGovCase;
  open: ModalKind;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [assignee, setAssignee] = React.useState<(typeof GOV_ASSIGNEES)[number]>(
    GOV_ASSIGNEES[0],
  );

  React.useEffect(() => {
    if (open === "reassign") {
      setAssignee(govCase.assignedTo && GOV_ASSIGNEES.includes(govCase.assignedTo as typeof GOV_ASSIGNEES[number])
        ? (govCase.assignedTo as typeof GOV_ASSIGNEES[number])
        : GOV_ASSIGNEES[0]);
    }
  }, [open, govCase.assignedTo]);

  function confirmReassign() {
    const updated = reassignGovCase(govCase.id, assignee);
    if (updated) {
      onSuccess(`Case reassigned to ${assignee}.`);
      onClose();
    }
  }

  const ctx = govCase.context;

  return (
    <>
      <Modal
        open={open === "reassign"}
        onClose={onClose}
        title="Reassign case"
        description="Assign to a Trust & Safety operator"
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button type="button" onClick={confirmReassign} className={primaryBtnCls}>
              <UserCog className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Reassign
            </button>
          </>
        }
      >
        <ContextStrip label="Case" value={govCase.id} mono />
        <div className="mt-4">
          <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
            Assignee
          </span>
          <Select
            variant="outline"
            size="sm"
            value={assignee}
            onChange={(e) =>
              setAssignee(e.target.value as (typeof GOV_ASSIGNEES)[number])
            }
          >
            {GOV_ASSIGNEES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>
      </Modal>

      <Modal
        open={open === "session"}
        onClose={onClose}
        title="Session record"
        description="Auto-populated context from platform audit"
        footer={
          <button type="button" onClick={onClose} className={primaryBtnCls}>
            Close
          </button>
        }
      >
        <ContextStrip label="Session ID" value={ctx.relatedSessionId ?? "—"} mono />
        <dl className="mt-4 space-y-3">
          {ctx.sessionAt && (
            <ProfileField label="When" value={new Date(ctx.sessionAt).toLocaleString()} />
          )}
          {ctx.sessionDurationMin != null && (
            <ProfileField label="Duration" value={`${ctx.sessionDurationMin} min`} />
          )}
          {ctx.mentorName && <ProfileField label="Mentor" value={ctx.mentorName} />}
          {ctx.enterpriseName && <ProfileField label="Enterprise" value={ctx.enterpriseName} />}
        </dl>
      </Modal>
    </>
  );
}

function ContextStrip({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2">
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-body text-[13px] font-medium text-foreground",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-1 font-body text-[13px] text-foreground">{value}</dd>
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
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);
