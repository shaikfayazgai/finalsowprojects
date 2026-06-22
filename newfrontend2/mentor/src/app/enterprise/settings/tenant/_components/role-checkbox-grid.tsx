"use client";

import { cn } from "@/lib/utils/cn";
import { DASH_INNER } from "@/app/admin/_shell/aurora";
import {
  ENTERPRISE_ROLE_GROUPS,
  ROLE_META,
  type EnterpriseRole,
} from "../tenant-roles";

export function RoleCheckboxGrid({
  selected,
  onToggle,
  licensedRoles,
}: {
  selected: Set<EnterpriseRole>;
  onToggle: (role: EnterpriseRole) => void;
  /** When set, only roles licensed for this tenant are selectable. */
  licensedRoles?: EnterpriseRole[];
}) {
  const licensed = licensedRoles
    ? new Set(licensedRoles)
    : null;

  return (
    <div className="space-y-4">
      {ENTERPRISE_ROLE_GROUPS.map((group) => {
        const roles = group.roles.filter((r) => !licensed || licensed.has(r));
        if (roles.length === 0) return null;

        return (
          <div key={group.id} className={cn(DASH_INNER, "p-3")}>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-2">
              {group.title}
            </p>
            <div className="grid grid-cols-1 gap-1">
              {roles.map((role) => {
                const meta = ROLE_META[role];
                const checked = selected.has(role);
                return (
                  <label
                    key={role}
                    className={cn(
                      "flex items-start gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-colors duration-fast border",
                      checked
                        ? "bg-bg-subtle border-stroke-subtle"
                        : "border-transparent hover:bg-bg-subtle/60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(role)}
                      className="mt-0.5 h-3.5 w-3.5 accent-[var(--c-violet-500)] shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="font-body text-[13px] font-semibold text-foreground block">
                        {meta.label}
                      </span>
                      <span className="font-body text-[11.5px] text-text-secondary leading-snug">
                        {meta.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
      {licensed && licensed.size === 0 && (
        <p className="font-body text-[12px] text-text-tertiary">
          No enterprise roles are licensed for this tenant. Contact your platform operator.
        </p>
      )}
    </div>
  );
}
