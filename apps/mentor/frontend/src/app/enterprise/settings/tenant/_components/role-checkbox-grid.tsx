"use client";

import { cn } from "@/lib/utils/cn";
import { GlassCard } from "@/components/meridian";
import {
  ENTERPRISE_ROLES,
  ROLE_META,
  type EnterpriseRole,
} from "../tenant-roles";

export function RoleCheckboxGrid({
  selected,
  onToggle,
}: {
  selected: Set<EnterpriseRole>;
  onToggle: (role: EnterpriseRole) => void;
}) {
  return (
    <GlassCard className="p-3">
      <div className="grid grid-cols-1 gap-1">
        {ENTERPRISE_ROLES.map((role) => {
          const meta = ROLE_META[role];
          const checked = selected.has(role);
          return (
            <label
              key={role}
              className={cn(
                "flex items-start gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-colors duration-fast",
                checked ? "bg-brand-subtle/40" : "hover:bg-white/40",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(role)}
                className="mt-0.5 h-3.5 w-3.5 accent-brand shrink-0"
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
    </GlassCard>
  );
}
