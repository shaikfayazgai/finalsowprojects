"use client";

/**
 * Internal employee profile — gradient-glass drawer (read-only roster view).
 */

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Clock,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import {
  Drawer,
  GlassAvatar,
  GlassCard,
  GlassField,
  GlassSection,
  glassBtnSecondary,
} from "@/components/meridian";
import type { WorkforceMember } from "@/lib/workforce/types";
import { cn } from "@/lib/utils/cn";

/** Demo delivery stats — stable per userId until backend ships. */
function mockDeliveryStats(_userId: string) {
  return {
    activeTasks: 0,
    completedTasks: 0,
    acceptanceRate: 0,
    lastActiveDays: 0,
  };
}

function DetailValue({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <p
      className={cn(
        "font-body text-[13px] text-foreground leading-snug",
        mono && "font-mono text-[12px]",
      )}
    >
      {children}
    </p>
  );
}

export function WorkforceEmployeeDrawer({
  member,
  open,
  onClose,
}: {
  member: WorkforceMember | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!member) return null;

  const stats = mockDeliveryStats(member.userId);
  const availability =
    member.availability != null && member.availability !== ""
      ? `${member.availability} hrs / week`
      : "—";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      appearance="gradient-glass"
      size="md"
      eyebrow="Workforce · Internal employee"
      title={member.displayName}
      description={`${member.department ?? "—"} · Direct assign from project tasks`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button type="button" onClick={onClose} className={glassBtnSecondary}>
            Close
          </button>
          <Link href="/enterprise/projects" className={glassBtnSecondary}>
            <Briefcase className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Assign from project
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <GlassAvatar name={member.displayName} />
          <div className="min-w-0 flex-1">
            <p className="font-body text-[14px] font-semibold text-foreground truncate">
              {member.displayName}
            </p>
            <p className="font-mono text-[11px] text-text-tertiary truncate mt-0.5">
              {member.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex px-2 py-0.5 rounded-full bg-brand-subtle text-brand-text font-body text-[10px] font-semibold uppercase tracking-wide">
                Internal
              </span>
              <span className="inline-flex px-2 py-0.5 rounded-full bg-white/60 border border-stroke-subtle font-body text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                {member.status === "inactive" ? "Inactive" : "Active"}
              </span>
            </div>
          </div>
        </div>

        <GlassSection step="01" title="Roster" hint="Synced from CSV / HR export">
          <GlassCard className="p-3.5 space-y-3">
            <GlassField label="Employee ID">
              <DetailValue mono>{member.employeeId ?? "—"}</DetailValue>
            </GlassField>
            <GlassField label="Department">
              <DetailValue>{member.department ?? "—"}</DetailValue>
            </GlassField>
            <GlassField label="Manager">
              <DetailValue mono>{member.managerEmail ?? "—"}</DetailValue>
            </GlassField>
            <GlassField label="Cost center">
              <DetailValue mono>{member.costCenter ?? "—"}</DetailValue>
            </GlassField>
          </GlassCard>
        </GlassSection>

        <GlassSection step="02" title="Skills & capacity" hint="Used for matching and direct assign">
          <GlassCard className="p-3.5 space-y-3">
            <GlassField label="Primary skills">
              {member.primarySkills.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {member.primarySkills.map((skill) => (
                    <li
                      key={skill}
                      className="inline-flex px-2 py-0.5 rounded-md bg-white/50 border border-stroke-subtle font-body text-[11.5px] text-foreground"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <DetailValue>—</DetailValue>
              )}
            </GlassField>
            <GlassField label="Availability">
              <DetailValue>{availability}</DetailValue>
            </GlassField>
          </GlassCard>
        </GlassSection>

        <GlassSection step="03" title="Access" hint="How this employee signs in to Glimmora">
          <GlassCard className="p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <div>
                <p className="font-body text-[12.5px] font-semibold text-foreground">
                  Company SSO
                </p>
                <p className="font-body text-[11.5px] text-text-secondary mt-0.5 leading-relaxed">
                  Password managed by your organization. Employee uses work email at sign-in.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Building2 className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <div>
                <p className="font-body text-[12.5px] font-semibold text-foreground">
                  Tenant
                </p>
                <p className="font-body text-[11.5px] text-text-secondary mt-0.5">
                  Visible under My organization for direct assignment.
                </p>
              </div>
            </div>
          </GlassCard>
        </GlassSection>

        <GlassSection step="04" title="Delivery snapshot" hint="Mock stats until backend connects">
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="Active tasks" value={String(stats.activeTasks)} icon={Briefcase} />
            <StatTile label="Completed" value={String(stats.completedTasks)} icon={UserRound} />
            <StatTile label="Accept rate" value={`${stats.acceptanceRate}%`} icon={Mail} />
            <StatTile
              label="Last active"
              value={`${stats.lastActiveDays}d ago`}
              icon={Clock}
            />
          </div>
        </GlassSection>
      </div>
    </Drawer>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <GlassCard className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
          {label}
        </p>
      </div>
      <p className="font-body text-[18px] font-semibold text-foreground tabular-nums">{value}</p>
    </GlassCard>
  );
}
