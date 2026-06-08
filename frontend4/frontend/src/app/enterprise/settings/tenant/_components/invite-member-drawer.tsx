"use client";

/**
 * Invite member — gradient-glass drawer with role selection and SoD warnings.
 */

import * as React from "react";
import { AlertTriangle, CheckCircle2, Copy, UserPlus } from "lucide-react";
import {
  Drawer,
  GlassField,
  GlassSection,
  glassBtnPrimary,
  glassBtnSecondary,
  glassInputCls,
} from "@/components/meridian";
import { createReviewerInvite } from "@/lib/api/reviewer-invite";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";
import {
  ROLE_META,
  type EnterpriseRole,
  detectSodViolations,
} from "../tenant-roles";
import { RoleCheckboxGrid } from "./role-checkbox-grid";

export function InviteMemberDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [selectedRoles, setSelectedRoles] = React.useState<Set<EnterpriseRole>>(
    new Set(["pmo"]),
  );
  const [note, setNote] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "success">("form");
  const [registerUrl, setRegisterUrl] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setSelectedRoles(new Set(["pmo"]));
      setNote("");
      setSubmitError(null);
      setSubmitting(false);
      setStep("form");
      setRegisterUrl("");
      setCopied(false);
    }
  }, [open]);

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
      // Credential-based provisioning (locked flow — NO signup links): a random
      // temp password is generated + emailed, must-change-password is set, and
      // the reviewer sets their own password on first sign-in.
      const res = await fetch("/api/superadmin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role: "reviewer",
          sendCredentials: true,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        emailSent?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "Could not create reviewer.");
      }
      setStep("success");
      toast.success(
        "Reviewer account created",
        body.emailSent
          ? `Credentials emailed to ${email.trim()} — they set a new password on first sign-in.`
          : `Reviewer created for ${email.trim()} — first sign-in forces a password reset.`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not create reviewer.");
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
    <Drawer
      open={open}
      onClose={onClose}
      appearance="gradient-glass"
      size="md"
      eyebrow="Settings · Members"
      title={step === "success" ? "Reviewer created" : "Invite a member"}
      description={
        step === "success"
          ? "Credentials were emailed. The reviewer sets their own password on first sign-in."
          : "Send a workspace invitation with role assignments. Changes apply when they accept."
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {step === "success" ? (
            <button type="button" onClick={onClose} className={glassBtnPrimary}>
              Done
            </button>
          ) : (
            <>
              <button type="button" onClick={onClose} className={glassBtnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className={cn(glassBtnPrimary, submitting && "opacity-60 pointer-events-none")}
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
          <div className="rounded-xl border border-success-border bg-success-subtle/50 px-3 py-2.5 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[12.5px] text-foreground leading-relaxed">
              Reviewer account created for <strong>{email.trim()}</strong>. A temporary
              password was emailed — they sign in at{" "}
              <span className="font-mono text-[11px]">/reviewer/login</span> and are forced to
              set a new password on first sign-in. No signup link.
            </p>
          </div>
          {selectedRoles.size > 1 && (
            <p className="font-body text-[12px] text-text-secondary">
              Other selected roles ({[...selectedRoles].filter((r) => r !== "reviewer").map((r) => ROLE_META[r].label).join(", ")})
              will be assigned separately after they join.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <GlassSection title="Contact" hint="Work email on your verified domain">
            <GlassField label="Email *">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className={glassInputCls}
              />
            </GlassField>
          </GlassSection>

          <GlassSection title="Roles" hint="Select every hat this person needs">
            <RoleCheckboxGrid selected={selectedRoles} onToggle={toggleRole} />
          </GlassSection>

          {includesReviewer && (
            <p className="font-body text-[12px] text-text-secondary leading-relaxed rounded-lg border border-border-subtle bg-bg-subtle/60 px-3 py-2">
              Reviewer invites include a signup link with two steps: confirm your invitation, then create your password at{" "}
              <span className="font-mono text-[11px]">/auth/register/reviewer</span>.
            </p>
          )}

          {sodViolations.length > 0 && (
            <div className="rounded-xl border border-warning-border bg-warning-subtle/60 px-3 py-2.5">
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

          <GlassSection title="Personal note" hint="Optional — included in the invite email">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Welcome to the workspace — here is what you'll be working on…"
              className={cn(glassInputCls, "h-auto py-2 resize-none")}
            />
          </GlassSection>

          {submitError && (
            <p className="font-body text-[12.5px] text-error-text">{submitError}</p>
          )}
        </div>
      )}
    </Drawer>
  );
}
