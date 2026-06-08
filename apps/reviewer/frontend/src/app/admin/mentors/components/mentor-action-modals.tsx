"use client";

/**
 * Mentor detail modals — Meridian Modal shell (matches tenant detail + billing patterns).
 */

import * as React from "react";
import { Edit3, Layers, PauseCircle, PlayCircle } from "lucide-react";
import { Modal } from "@/components/meridian";
import type { MockAdminMentor } from "@/mocks/admin/mentors";
import {
  pauseAdminMentor,
  resumeAdminMentor,
  updateAdminMentor,
} from "@/lib/admin/mocks/mentors-service";
import { useAdminPoolsList } from "@/lib/hooks/use-admin-mentors";
import { cn } from "@/lib/utils/cn";

type ModalKind = "pause" | "roles" | "pools" | null;

interface MentorActionModalsProps {
  mentor: MockAdminMentor;
  open: ModalKind;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const ROLE_OPTIONS = [
  { key: "mentor" as const, label: "Mentor", hint: "Standard review routing" },
  { key: "mentor.senior" as const, label: "Senior mentor", hint: "Cross-pool eligible" },
  { key: "mentor.lead" as const, label: "Lead mentor", hint: "Pool lead designation" },
];

export function MentorActionModals({
  mentor,
  open,
  onClose,
  onSuccess,
}: MentorActionModalsProps) {
  const pools = useAdminPoolsList();
  const [roles, setRoles] = React.useState<MockAdminMentor["roles"]>(mentor.roles);
  const [poolIds, setPoolIds] = React.useState<string[]>(mentor.pools);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setRoles(mentor.roles);
      setPoolIds(mentor.pools);
      setError("");
    }
  }, [open, mentor]);

  function toggleRole(r: (typeof ROLE_OPTIONS)[number]["key"]) {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  function togglePool(id: string) {
    setPoolIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function validatePools(): boolean {
    const cross = pools.find((p) => p.scope === "cross-tenant");
    if (cross && poolIds.includes(cross.id)) {
      const seniorPlus = roles.includes("mentor.senior") || roles.includes("mentor.lead");
      if (!seniorPlus) {
        setError("Cross-pool requires Senior or Lead role.");
        return false;
      }
    }
    return true;
  }

  function handlePause() {
    if (mentor.status === "paused") {
      resumeAdminMentor(mentor.id);
      onSuccess(`${mentor.name} resumed.`);
    } else {
      pauseAdminMentor(mentor.id);
      onSuccess(`${mentor.name} paused — no new assignments.`);
    }
    onClose();
  }

  function handleRolesSave() {
    if (roles.length === 0) {
      setError("At least one role is required.");
      return;
    }
    if (!validatePools()) return;
    updateAdminMentor(mentor.id, { roles, pools: poolIds });
    onSuccess(`Roles updated for ${mentor.name}.`);
    onClose();
  }

  function handlePoolsSave() {
    if (!validatePools()) return;
    updateAdminMentor(mentor.id, { pools: poolIds });
    onSuccess(`Pool assignment updated for ${mentor.name}.`);
    onClose();
  }

  const isPaused = mentor.status === "paused";

  return (
    <>
      <Modal
        open={open === "pause"}
        onClose={onClose}
        title={isPaused ? "Resume mentor" : "Pause mentor"}
        description={
          isPaused
            ? "Restore routing of new review assignments."
            : "Paused mentors keep their profile but receive no new assignments."
        }
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePause}
              className={isPaused ? primaryBtnCls : dangerBtnCls}
            >
              {isPaused ? (
                <>
                  <PlayCircle className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                  Resume mentor
                </>
              ) : (
                <>
                  <PauseCircle className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                  Pause mentor
                </>
              )}
            </button>
          </>
        }
      >
        <ContextStrip label="Mentor" value={mentor.name} />
        <p className="mt-3 font-body text-[12px] text-text-tertiary leading-relaxed">
          {isPaused
            ? "Active mentors resume at their prior status. Pending invites stay pending until first sign-in."
            : "In-flight reviews already assigned to this mentor are not reassigned automatically."}
        </p>
      </Modal>

      <Modal
        open={open === "roles"}
        onClose={onClose}
        title="Edit roles"
        description="Role tier affects cross-pool eligibility and lead designation."
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button type="button" onClick={handleRolesSave} className={primaryBtnCls}>
              <Edit3 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Save roles
            </button>
          </>
        }
      >
        <ContextStrip label="Mentor" value={mentor.name} />
        <ul className="mt-4 space-y-2">
          {ROLE_OPTIONS.map((r) => (
            <li key={r.key}>
              <label
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors duration-fast",
                  roles.includes(r.key)
                    ? "border-brand bg-brand-subtle/30"
                    : "border-stroke-subtle hover:bg-bg-subtle/60",
                )}
              >
                <input
                  type="checkbox"
                  checked={roles.includes(r.key)}
                  onChange={() => toggleRole(r.key)}
                  className="mt-0.5 h-4 w-4 rounded border-stroke text-brand"
                />
                <span>
                  <span className="block font-body text-[13px] font-medium text-foreground">
                    {r.label}
                  </span>
                  <span className="block font-body text-[11.5px] text-text-tertiary mt-0.5">
                    {r.hint}
                  </span>
                  <code className="font-mono text-[10px] text-text-tertiary mt-1 inline-block">
                    {r.key}
                  </code>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {error && <ErrorNote message={error} />}
      </Modal>

      <Modal
        open={open === "pools"}
        onClose={onClose}
        title="Change pools"
        description="Assign mentor to tenant-scoped or cross-tenant review pools."
        size="lg"
        footer={
          <>
            <button type="button" onClick={onClose} className={cancelBtnCls}>
              Cancel
            </button>
            <button type="button" onClick={handlePoolsSave} className={primaryBtnCls}>
              <Layers className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Save pools
            </button>
          </>
        }
      >
        <ContextStrip label="Mentor" value={mentor.name} />
        <ul className="mt-4 space-y-2 max-h-[40vh] overflow-auto">
          {pools.map((p) => (
            <li key={p.id}>
              <label
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors duration-fast",
                  poolIds.includes(p.id)
                    ? "border-brand bg-brand-subtle/30"
                    : "border-stroke-subtle hover:bg-bg-subtle/60",
                )}
              >
                <input
                  type="checkbox"
                  checked={poolIds.includes(p.id)}
                  onChange={() => togglePool(p.id)}
                  className="mt-0.5 h-4 w-4 rounded border-stroke text-brand"
                />
                <span className="min-w-0">
                  <span className="block font-body text-[13px] font-medium text-foreground">
                    {p.name}
                  </span>
                  <span className="block font-body text-[11.5px] text-text-tertiary mt-0.5">
                    {p.scope === "tenant" ? p.tenantName ?? "Tenant pool" : "Cross-tenant"}
                    {p.scope === "cross-tenant" && " · Senior+ required"}
                    {" · "}
                    {p.loadPct}% load
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {error && <ErrorNote message={error} />}
      </Modal>
    </>
  );
}

export function MentorActionButtons({
  mentor,
  onOpen,
}: {
  mentor: MockAdminMentor;
  onOpen: (kind: NonNullable<ModalKind>) => void;
}) {
  const isPaused = mentor.status === "paused";
  const canPause = mentor.status === "active" || mentor.status === "paused";

  if (!canPause) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen("pause")}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
        "bg-surface border border-stroke",
        "font-body text-[13px] font-semibold text-foreground",
        "hover:bg-bg-subtle transition-colors duration-fast",
      )}
    >
      {isPaused ? (
        <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      ) : (
        <PauseCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      )}
      {isPaused ? "Resume" : "Pause"}
    </button>
  );
}

export function MentorToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text"
    >
      {message}
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
);

const dangerBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-error-solid text-on-brand",
  "font-body text-[13px] font-semibold",
  "hover:bg-error transition-colors duration-fast",
);

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

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-3 rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text"
    >
      {message}
    </p>
  );
}
