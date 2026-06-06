"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, UserCircle2 } from "lucide-react";
import { roleLabel } from "@/app/enterprise/settings/tenant/tenant-roles";
import { type TenantMemberMock } from "@/lib/settings/settings-mock";
import { type SettingsAccessLevel } from "@/lib/settings/settings-rbac";
import { cn } from "@/lib/utils/cn";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days}d ago`;
  return fmtDate(iso);
}

function statusPill(status: TenantMemberMock["status"] | "unknown"): string {
  switch (status) {
    case "active":
      return "bg-success-subtle text-success-text";
    case "invited":
      return "border border-stroke-subtle text-text-secondary";
    case "suspended":
      return "border border-error-border text-error-text";
    default:
      return "border border-stroke-subtle text-text-tertiary";
  }
}

function statusLabel(status: TenantMemberMock["status"] | "unknown"): string {
  switch (status) {
    case "active":
      return "Active";
    case "invited":
      return "Invited";
    case "suspended":
      return "Suspended";
    default:
      return "Unknown";
  }
}

export function ProfileIdentitySection({
  name,
  email,
  tenantName,
  roles,
  memberStatus,
  member,
  tenantSettingsAccess = "none",
}: {
  name: string;
  email: string;
  tenantName: string;
  roles: string[];
  memberStatus: TenantMemberMock["status"] | "unknown";
  member: TenantMemberMock | null;
  tenantSettingsAccess?: SettingsAccessLevel;
}) {
  const activityLabel = member?.lastActiveAt
    ? `Last active ${fmtRelative(member.lastActiveAt)}`
    : member?.invitedAt
      ? `Invited ${fmtDate(member.invitedAt)}`
      : null;

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stroke-subtle bg-surface text-text-secondary shrink-0">
            <UserCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Identity
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Managed by your tenant — contact an admin to change name or roles
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex px-2 py-0.5 rounded-full font-body text-[10.5px] font-semibold shrink-0",
            statusPill(memberStatus),
          )}
        >
          {statusLabel(memberStatus)}
        </span>
      </div>

      <dl className="divide-y divide-stroke-subtle border border-stroke-subtle rounded-lg overflow-hidden">
        <IdentityRow label="Display name" value={name} />
        <IdentityRow label="Email" value={email} mono />
        <IdentityRow
          label="Tenant"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-text-tertiary" strokeWidth={2} aria-hidden />
              {tenantName}
            </span>
          }
        />
        <IdentityRow
          label="Roles"
          value={
            roles.length > 0 ? (
              <span className="flex flex-wrap justify-end gap-1.5">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex px-2 py-0.5 rounded-full border border-stroke-subtle font-body text-[10.5px] font-semibold text-text-secondary"
                  >
                    {roleLabel(role)}
                  </span>
                ))}
              </span>
            ) : (
              "—"
            )
          }
        />
        {activityLabel && <IdentityRow label="Activity" value={activityLabel} />}
      </dl>

      {tenantSettingsAccess !== "none" && (
        <div className="mt-4 pt-4 border-t border-stroke-subtle">
          <Link
            href="/enterprise/settings/tenant"
            className="flex items-center justify-between gap-3 rounded-lg border border-stroke-subtle px-4 py-3 min-h-[52px]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Building2 className="h-4 w-4 text-text-secondary shrink-0" strokeWidth={2} aria-hidden />
              <div>
                <p className="font-body text-[13px] font-medium text-foreground">
                  {tenantSettingsAccess === "view" ? "View tenant & roles" : "Tenant & roles settings"}
                </p>
                <p className="font-body text-[11.5px] text-text-secondary">
                  Members, roles, and org context for {tenantName}
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}

function IdentityRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 px-4 py-3 min-h-[52px]">
      <dt className="font-body text-[11.5px] font-semibold text-text-secondary">{label}</dt>
      <dd
        className={cn(
          "font-body text-[13px] text-foreground sm:text-right",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
