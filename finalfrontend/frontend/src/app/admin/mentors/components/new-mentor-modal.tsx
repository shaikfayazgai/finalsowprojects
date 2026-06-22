"use client";

/**
 * Invite mentor — modal on the registry page (no separate route).
 * Essentials only: contact, country, role tier.
 *
 * Solid modal: white card (stroke + soft shadow), tone-tinted header chip,
 * solid fields, gradient on the primary action.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Mail, UserPlus, X } from "lucide-react";
import { Modal } from "@/components/meridian";
import { inviteAdminMentor } from "@/lib/admin/mocks/mentors-service";
import type { MockAdminMentor } from "@/mocks/admin/mentors";
import { cn } from "@/lib/utils/cn";
import {
  GLASS_MODAL_CLASS,
  GLASS_MODAL_FOOT,
  GLASS_MODAL_OVERLAY,
  TONE,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

const COUNTRIES = ["India", "USA", "Singapore", "UK", "Germany", "Italy", "Spain"] as const;

type RoleTier = "mentor" | "mentor.senior" | "mentor.lead";

const ROLE_OPTIONS: Array<{ value: RoleTier; label: string }> = [
  { value: "mentor", label: "Mentor" },
  { value: "mentor.senior", label: "Senior" },
  { value: "mentor.lead", label: "Lead" },
];

const FIELD =
  "w-full h-10 px-3 rounded-lg border border-stroke-subtle bg-surface font-body text-[13.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";

const SELECT = cn(FIELD, "appearance-none pr-10 cursor-pointer");

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg shrink-0",
  "border border-stroke-subtle bg-surface font-body text-[13.5px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors disabled:opacity-55",
);

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
      {children}
      {required && <span style={{ color: TONE.error.text }}> *</span>}
    </label>
  );
}

function SelectField({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={onChange} className={SELECT}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}

interface NewMentorModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewMentorModal({ open, onClose }: NewMentorModalProps) {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [country, setCountry] = React.useState<string>("India");
  const [role, setRole] = React.useState<RoleTier>("mentor");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setCountry("India");
      setRole("mentor");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const roles: MockAdminMentor["roles"] = React.useMemo(() => [role], [role]);
  const canSubmit = name.trim().length > 1 && email.includes("@") && !submitting;

  function handleClose() {
    if (!submitting) onClose();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    void (async () => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/mentors/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            mentorRoles: roles,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
        if (!res.ok) throw new Error(body.message ?? "Could not send invite.");

        const created = inviteAdminMentor({
          name: name.trim(),
          email: email.trim(),
          country,
          roles,
        });

        onClose();
        const qs = new URLSearchParams({ invited: "1" });
        if (body.code) qs.set("code", body.code);
        router.push(`/admin/mentors/${created.id}?${qs.toString()}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not send invite.");
        setSubmitting(false);
      }
    })();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      hideCloseButton
      className={GLASS_MODAL_CLASS}
      overlayClassName={GLASS_MODAL_OVERLAY}
      bodyClassName="p-0"
      footerClassName={GLASS_MODAL_FOOT}
      footer={
        <>
          <button type="button" onClick={handleClose} disabled={submitting} className={BTN_SECONDARY}>
            Cancel
          </button>
          <button type="submit" form="new-mentor-form" disabled={!canSubmit} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
            <Mail className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {submitting ? "Sending…" : "Send invite"}
          </button>
        </>
      }
    >
      <header className="flex items-start gap-3.5 px-5 sm:px-6 pt-5 pb-4">
        <span
          className="grid place-items-center h-10 w-10 shrink-0 rounded-lg border"
          style={{ background: TONE.ai.soft, borderColor: TONE.ai.border, color: TONE.ai.text }}
          aria-hidden
        >
          <UserPlus className="h-5 w-5" strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="font-display text-[16.5px] font-bold tracking-[-0.01em] text-foreground leading-tight">Invite mentor</h2>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            They receive a welcome email and appear as Pending until first sign-in. Add competency from their profile next.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="grid place-items-center h-8 w-8 shrink-0 rounded-lg text-text-tertiary hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <X className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </header>

      <form id="new-mentor-form" onSubmit={onSubmit} className="px-5 sm:px-6 pb-5 space-y-4">
        <div>
          <Label htmlFor="mentor-name" required>
            Full name
          </Label>
          <input
            id="mentor-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Divya Krishnan"
            autoComplete="name"
            required
            className={FIELD}
          />
        </div>

        <div>
          <Label htmlFor="mentor-email" required>
            Work email
          </Label>
          <input
            id="mentor-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="e.g. mentor@glimmora.team"
            autoComplete="email"
            required
            className={FIELD}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mentor-country">Country</Label>
            <SelectField id="mentor-country" value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <Label htmlFor="mentor-role">Role tier</Label>
            <SelectField id="mentor-role" value={role} onChange={(e) => setRole(e.target.value as RoleTier)}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border px-3 py-2 font-body text-[12px]"
            style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
          >
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
