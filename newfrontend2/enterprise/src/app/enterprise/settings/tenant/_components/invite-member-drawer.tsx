"use client";

/**
 * Invite member — AdminModal with role selection and SoD warnings.
 */

import * as React from "react";
import { AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";
import {
  AdminModal,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
  AuroraInput,
  AuroraTextarea,
} from "@/app/admin/_shell/aurora-ui";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";
import {
  ROLE_META,
  type EnterpriseRole,
  detectSodViolations,
} from "../tenant-roles";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { RoleCheckboxGrid } from "./role-checkbox-grid";

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
  const [name, setName] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "success">("form");
  const [createdEmail, setCreatedEmail] = React.useState("");
  const [emailSent, setEmailSent] = React.useState(true);
  const { licensedRoles } = useEnterpriseAccess();

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setName("");
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
      setCreatedEmail("");
      setEmailSent(true);
    }
  }, [open, licensedRoles]);

  const sodViolations = detectSodViolations(selectedRoles);

  const toggleRole = (role: EnterpriseRole) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  // The primary selected role becomes the member's role code; the backend
  // provisions a login_accounts row with a TEMP PASSWORD + forced reset and
  // emails the credentials. No signup link — credential-based provisioning.
  const PRIMARY_ORDER: EnterpriseRole[] = [
    "admin", "sponsor", "pmo", "finance", "compliance", "it", "procurement", "reviewer",
  ];
  const primaryRole = (): EnterpriseRole =>
    PRIMARY_ORDER.find((r) => selectedRoles.has(r)) ?? ([...selectedRoles][0] as EnterpriseRole);

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

    const local = email.trim().split("@")[0] ?? "";
    const derived = name.trim() || local.replace(/[._-]+/g, " ").trim();
    const [firstName, ...rest] = derived.split(" ");

    setSubmitting(true);
    try {
      const res = await fetch("/api/enterprise/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName || local,
          lastName: rest.join(" "),
          email: email.trim().toLowerCase(),
          roleCode: `ent.${primaryRole()}`,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        email?: string;
        emailSent?: boolean;
        detail?: string;
      };
      if (!res.ok) {
        // 409 = email already used by another user anywhere on the platform.
        setSubmitError(body.detail ?? "Could not send the invitation.");
        return;
      }
      setCreatedEmail(body.email ?? email.trim().toLowerCase());
      setEmailSent(body.emailSent !== false);
      setStep("success");
      if (body.emailSent === false) {
        toast.warning("Member created — email not sent", `Couldn't email ${body.email ?? email.trim()}. Use Resend from the list.`);
      } else {
        toast.success("Invitation sent", `Credentials emailed to ${body.email ?? email.trim()}.`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not send the invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      icon={UserPlus}
      tone="info"
      size="md"
      title={step === "success" ? "Invitation sent" : "Invite a member"}
      description={
        step === "success"
          ? "The member has been emailed their sign-in credentials."
          : "The member is emailed an invitation with sign-in credentials and must set a new password on first sign-in."
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {step === "success" ? (
            <button type="button" onClick={onClose} style={primaryStyle} className={primaryBtnClass}>
              Done
            </button>
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
                {submitting ? "Creating…" : "Create member"}
              </button>
            </>
          )}
        </div>
      }
    >
      {step === "success" ? (
        <div className="space-y-4">
          {emailSent ? (
            <div className="rounded-lg border border-success-border bg-success-subtle px-3 py-2.5 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <p className="font-body text-[12.5px] text-foreground leading-relaxed">
                An invitation with sign-in credentials was emailed to <strong>{createdEmail}</strong>.
                They&apos;ll set a new password the first time they sign in.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-warning-border bg-warning-subtle px-3 py-2.5 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <p className="font-body text-[12.5px] text-foreground leading-relaxed">
                <strong>{createdEmail}</strong> was created, but the credentials email couldn&apos;t be
                sent. Use <strong>Resend credentials</strong> from the member list to try again.
              </p>
            </div>
          )}
          {selectedRoles.size > 1 && (
            <p className="font-body text-[12px] text-text-secondary">
              Primary role <strong>{ROLE_META[primaryRole()].label}</strong> assigned. Other selected roles
              ({[...selectedRoles].filter((r) => r !== primaryRole()).map((r) => ROLE_META[r].label).join(", ")})
              can be granted from Manage roles.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <ModalSection title="Contact" hint="Work email on your verified domain">
            <div className="space-y-2.5">
              <div>
                <label className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
                  Full name
                </label>
                <AuroraInput
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
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

          <p className="font-body text-[12px] text-text-secondary leading-relaxed rounded-lg border border-stroke-subtle bg-bg-subtle px-3 py-2">
            The member is created with a temporary password and emailed their credentials —
            no signup link. They must set a new password on first sign-in.
          </p>

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
