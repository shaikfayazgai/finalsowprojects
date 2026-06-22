"use client";

/**
 * Invite member — AdminModal with role selection and SoD warnings.
 */

import * as React from "react";
import { AlertTriangle, CheckCircle2, Copy, UserPlus } from "lucide-react";
import {
  AdminModal,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
  AuroraInput,
  AuroraTextarea,
} from "@/app/admin/_shell/aurora-ui";
import { createReviewerInvite } from "@/lib/api/reviewer-invite";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";
import {
  ROLE_META,
  type EnterpriseRole,
  detectSodViolations,
} from "../tenant-roles";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { RoleCheckboxGrid } from "./role-checkbox-grid";
import { DASH_INNER } from "@/app/admin/_shell/aurora";

const solidInputCls =
  "w-full h-9 px-3 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";

function ModalSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{title}</p>
        {hint && <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function InviteMemberDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [selectedRoles, setSelectedRoles] = React.useState<Set<EnterpriseRole>>(new Set());
  const [note, setNote] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "success">("form");
  const [registerUrl, setRegisterUrl] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const { licensedRoles } = useEnterpriseAccess();

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setSelectedRoles(
        new Set(
          licensedRoles.includes("pmo")
            ? (["pmo"] as EnterpriseRole[])
            : licensedRoles.slice(0, 1),
        ),
      );
      setNote("");
      setSubmitError(null);
      setSubmitting(false);
      setStep("form");
      setRegisterUrl("");
      setCopied(false);
    }
  }, [open, licensedRoles]);

  const sodViolations = detectSodViolations(selectedRoles);
  const includesReviewer = selectedRoles.has("reviewer");

  const toggleRole = (role: EnterpriseRole) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const onSubmit = async () => {
    setSubmitError(null);
    if (!email.trim()) {
      setSubmitError("Email is required.");
      return;
    }
    if (selectedRoles.size === 0) {
      setSubmitError("Select at least one role.");
      return;
    }

    if (!includesReviewer) {
      toast.success("Invite sent", `An invitation was sent to ${email.trim()}.`);
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      const result = await createReviewerInvite({
        email: email.trim(),
        note: note.trim() || undefined,
      });
      setRegisterUrl(result.registerUrl);
      setStep("success");
      toast.success(
        "Reviewer invite created",
        result.emailSent
          ? `Signup link emailed to ${result.email}.`
          : `Copy the signup link and share it with ${result.email}.`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not send invite.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    if (!registerUrl) return;
    navigator.clipboard?.writeText(registerUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      icon={UserPlus}
      tone="info"
      size="md"
      title={step === "success" ? "Invite ready" : "Invite a member"}
      description={
        step === "success"
          ? "Share the signup link with your reviewer. They will choose their own password."
          : "Send a workspace invitation with role assignments. Changes apply when they accept."
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {step === "success" ? (
            <>
              <button type="button" onClick={onClose} className={secondaryBtnClass}>
                Done
              </button>
              <button type="button" onClick={copyLink} style={primaryStyle} className={primaryBtnClass}>
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Copy signup link
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className={secondaryBtnClass}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                style={primaryStyle}
                className={cn(primaryBtnClass, submitting && "opacity-60 pointer-events-none")}
              >
                <UserPlus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {submitting ? "Sending…" : "Send invite"}
              </button>
            </>
          )}
        </div>
      }
    >
      {step === "success" ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-success-border bg-success-subtle px-3 py-2.5 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[12.5px] text-foreground leading-relaxed">
              Reviewer invite for <strong>{email.trim()}</strong>. They must sign up with this
              email and pick a password — no temporary password is sent.
            </p>
          </div>
          <ModalSection title="Signup link" hint="Valid for 7 days">
            <p className={cn(DASH_INNER, "font-mono text-[11px] text-text-secondary break-all leading-relaxed px-3 py-2")}>
              {registerUrl}
            </p>
          </ModalSection>
          {selectedRoles.size > 1 && (
            <p className="font-body text-[12px] text-text-secondary">
              Other selected roles ({[...selectedRoles].filter((r) => r !== "reviewer").map((r) => ROLE_META[r].label).join(", ")})
              will be assigned separately after they join.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <ModalSection title="Contact" hint="Work email on your verified domain">
            <div>
              <label className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
                Email <span className="text-error-text">*</span>
              </label>
              <AuroraInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </div>
          </ModalSection>

          <ModalSection
            title="Roles"
            hint="Only roles licensed for your tenant (set when Glimmora provisioned the workspace)"
          >
            <RoleCheckboxGrid
              selected={selectedRoles}
              onToggle={toggleRole}
              licensedRoles={licensedRoles}
            />
          </ModalSection>

          {includesReviewer && (
            <p className="font-body text-[12px] text-text-secondary leading-relaxed rounded-lg border border-stroke-subtle bg-bg-subtle px-3 py-2">
              Reviewer invites include a signup link with two steps: confirm your invitation, then create your password at{" "}
              <span className="font-mono text-[11px]">/auth/register/reviewer</span>.
            </p>
          )}

          {sodViolations.length > 0 && (
            <div className="rounded-lg border border-warning-border bg-warning-subtle px-3 py-2.5">
              <p className="font-body text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning-text shrink-0" strokeWidth={2} aria-hidden />
                Segregation of duties
              </p>
              <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
                {sodViolations
                  .map(([a, b]) => `${ROLE_META[a].label} + ${ROLE_META[b].label}`)
                  .join("; ")}{" "}
                are typically assigned to different people.
              </p>
            </div>
          )}

          <ModalSection title="Personal note" hint="Optional — included in the invite email">
            <AuroraTextarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Welcome to the workspace — here is what you'll be working on…"
            />
          </ModalSection>

          {submitError && (
            <p className="font-body text-[12.5px] text-error-text">{submitError}</p>
          )}
        </div>
      )}
    </AdminModal>
  );
}
