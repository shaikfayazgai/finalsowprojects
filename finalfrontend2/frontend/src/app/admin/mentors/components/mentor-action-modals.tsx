"use client";

/**
 * Mentor detail modals — pause / resume and role editing.
 *
 * Solid modal: white card (stroke + soft shadow), tone-tinted header chip,
 * solid inset blocks + fields, gradient on the primary action.
 */

import * as React from "react";
import { PauseCircle, PlayCircle, Shield, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/meridian";
import type { MockAdminMentor } from "@/mocks/admin/mentors";
// PATCH /api/superadmin/mentors/:id (status, roles) endpoints are not yet
// implemented on the backend. Mutations are no-ops until they exist.
import { cn } from "@/lib/utils/cn";
import {
  GLASS_MODAL_CLASS,
  GLASS_MODAL_FOOT,
  GLASS_MODAL_OVERLAY,
  TONE,
  type Tone,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

type ModalKind = "pause" | "roles" | null;

interface MentorActionModalsProps {
  mentor: MockAdminMentor;
  open: ModalKind;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const ROLE_OPTIONS = [
  { key: "mentor" as const, label: "Mentor", hint: "Standard review routing" },
  { key: "mentor.senior" as const, label: "Senior", hint: "Broader competency scope" },
  { key: "mentor.lead" as const, label: "Lead", hint: "Lead designation and escalation" },
];

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg shrink-0",
  "border border-stroke-subtle bg-surface font-body text-[13.5px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors disabled:opacity-55",
);

function ModalHead({
  icon: Icon,
  tone,
  title,
  description,
  onClose,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <header className="flex items-start gap-3.5 px-5 sm:px-6 pt-5 pb-4">
      <span
        className="grid place-items-center h-10 w-10 shrink-0 rounded-lg border"
        style={{ background: TONE[tone].soft, borderColor: TONE[tone].border, color: TONE[tone].text }}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h2 className="font-display text-[16.5px] font-bold tracking-[-0.01em] text-foreground leading-tight">{title}</h2>
        <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="grid place-items-center h-8 w-8 shrink-0 rounded-lg text-text-tertiary hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </header>
  );
}

export function MentorActionModals({ mentor, open, onClose, onSuccess }: MentorActionModalsProps) {
  const [roles, setRoles] = React.useState<MockAdminMentor["roles"]>(mentor.roles);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setRoles(mentor.roles);
      setError("");
    }
  }, [open, mentor]);

  function toggleRole(r: (typeof ROLE_OPTIONS)[number]["key"]) {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  function handlePause() {
    // TODO: PATCH /api/superadmin/mentors/:id {status} not yet implemented.
    if (mentor.status === "paused") {
      onSuccess(`${mentor.name} resumed. (Changes take effect once backend is wired.)`);
    } else {
      onSuccess(`${mentor.name} paused. (Changes take effect once backend is wired.)`);
    }
    onClose();
  }

  function handleRolesSave() {
    if (roles.length === 0) {
      setError("Select at least one role.");
      return;
    }
    // TODO: PATCH /api/superadmin/mentors/:id {roles} not yet implemented.
    onSuccess(`Roles updated for ${mentor.name}. (Changes take effect once backend is wired.)`);
    onClose();
  }

  const isPaused = mentor.status === "paused";

  return (
    <>
      <Modal
        open={open === "pause"}
        onClose={onClose}
        size="md"
        hideCloseButton
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        bodyClassName="p-0"
        footerClassName={GLASS_MODAL_FOOT}
        footer={
          <>
            <button type="button" onClick={onClose} className={BTN_SECONDARY}>
              Cancel
            </button>
            <button type="button" onClick={handlePause} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
              {isPaused ? (
                <PlayCircle className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              ) : (
                <PauseCircle className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              )}
              {isPaused ? "Resume mentor" : "Pause mentor"}
            </button>
          </>
        }
      >
        <ModalHead
          icon={isPaused ? PlayCircle : PauseCircle}
          tone={isPaused ? "success" : "warning"}
          title={isPaused ? "Resume mentor" : "Pause mentor"}
          description={
            isPaused
              ? "Restores routing of new review assignments."
              : "Paused mentors keep their profile but receive no new assignments."
          }
          onClose={onClose}
        />
        <div className="px-5 sm:px-6 pb-5">
          <ContextStrip label="Mentor" value={mentor.name} />
          <p className="mt-3 font-body text-[13px] text-text-secondary leading-relaxed">
            {isPaused
              ? "Pending invites stay pending until first sign-in."
              : "In-flight reviews already assigned are not reassigned automatically."}
          </p>
        </div>
      </Modal>

      <Modal
        open={open === "roles"}
        onClose={onClose}
        size="md"
        hideCloseButton
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        bodyClassName="p-0"
        footerClassName={GLASS_MODAL_FOOT}
        footer={
          <>
            <button type="button" onClick={onClose} className={BTN_SECONDARY}>
              Cancel
            </button>
            <button type="button" onClick={handleRolesSave} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
              Save roles
            </button>
          </>
        }
      >
        <ModalHead
          icon={Shield}
          tone="ai"
          title="Edit roles"
          description="Role tier affects review routing and lead designation."
          onClose={onClose}
        />
        <div className="px-5 sm:px-6 pb-5">
          <ContextStrip label="Mentor" value={mentor.name} />
          <ul className="mt-4 space-y-2">
            {ROLE_OPTIONS.map((r) => {
              const checked = roles.includes(r.key);
              return (
                <li key={r.key}>
                  <label
                    className={cn(
                      "flex items-start gap-3 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-colors",
                      checked
                        ? "border-[var(--c-violet-400)] bg-[rgba(124,92,246,0.06)]"
                        : "border-stroke-subtle bg-surface hover:bg-bg-subtle/60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(r.key)}
                      className="mt-0.5 h-4 w-4 rounded border-stroke accent-[var(--c-violet-500)]"
                    />
                    <span>
                      <span className="block font-body text-[13px] font-medium text-foreground">{r.label}</span>
                      <span className="block font-body text-[12px] text-text-tertiary mt-0.5">{r.hint}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-lg border px-3 py-2 font-body text-[12px]"
              style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
            >
              {error}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

export function MentorToast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-lg border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[13px] font-medium text-success-text"
    >
      {message}
    </div>
  );
}

function ContextStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3">
      <p className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">{label}</p>
      <p className="mt-0.5 font-body text-[14px] font-semibold text-foreground leading-snug">{value}</p>
    </div>
  );
}
