"use client";

/**
 * Manage member roles — AdminModal with SoD + last-admin guard.
 */

import * as React from "react";
import { AlertTriangle, Save, Shield } from "lucide-react";
import {
  AdminModal,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import type { TenantMemberMock } from "@/lib/settings/settings-mock";
import {
  ROLE_META,
  countActiveAdmins,
  type EnterpriseRole,
  detectSodViolations,
} from "../tenant-roles";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { RoleCheckboxGrid } from "./role-checkbox-grid";

/** Simple avatar from initials */
function MemberAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stroke-subtle bg-bg-subtle font-body text-[13px] font-bold text-text-secondary select-none">
      {initials}
    </span>
  );
}

export function MemberRolesDrawer({
  member,
  members,
  open,
  onClose,
}: {
  member: TenantMemberMock | null;
  members: TenantMemberMock[];
  open: boolean;
  onClose: () => void;
}) {
  const [selectedRoles, setSelectedRoles] = React.useState<Set<EnterpriseRole>>(new Set());
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && member) {
      setSelectedRoles(new Set(member.roles as EnterpriseRole[]));
      setSubmitError(null);
    }
  }, [open, member]);

  const { licensedRoles } = useEnterpriseAccess();
  const sodViolations = detectSodViolations(selectedRoles);

  const toggleRole = (role: EnterpriseRole) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const onSubmit = () => {
    if (!member) return;
    setSubmitError(null);

    if (selectedRoles.size === 0) {
      setSubmitError("Select at least one role.");
      return;
    }

    const wasAdmin = member.roles.includes("admin");
    const willBeAdmin = selectedRoles.has("admin");
    const adminCount = countActiveAdmins(members);

    if (wasAdmin && !willBeAdmin && adminCount <= 1) {
      setSubmitError("This workspace must keep at least one active admin.");
      return;
    }

    toast.success(
      isInvite ? "Invitation updated" : "Roles updated",
      `${member.name}'s role assignments were saved.`,
    );
    onClose();
  };

  if (!member) return null;

  const isInvite = member.status === "invited";

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      icon={Shield}
      tone="info"
      size="md"
      title={isInvite ? "Edit invitation" : "Manage roles"}
      description={
        isInvite
          ? "Update roles before this person accepts. The invite email is not resent automatically."
          : "Update role assignments for this workspace member. Changes emit audit events."
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button type="button" onClick={onClose} className={secondaryBtnClass}>
            Cancel
          </button>
          <button type="button" onClick={onSubmit} style={primaryStyle} className={cn(primaryBtnClass)}>
            <Save className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Save roles
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <MemberAvatar name={member.name} />
          <div className="min-w-0">
            <p className="font-body text-[14px] font-semibold text-foreground truncate">
              {member.name}
            </p>
            <p className="font-mono text-[11px] text-text-tertiary truncate">{member.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Roles
          </p>
          <p className="font-body text-[11.5px] text-text-tertiary">Every hat this person needs in the workspace</p>
          <RoleCheckboxGrid
            selected={selectedRoles}
            onToggle={toggleRole}
            licensedRoles={licensedRoles}
          />
        </div>

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

        {submitError && (
          <p className="font-body text-[12.5px] text-error-text">{submitError}</p>
        )}
      </div>
    </AdminModal>
  );
}
