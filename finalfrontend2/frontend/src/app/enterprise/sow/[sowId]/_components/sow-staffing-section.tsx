"use client";

/**
 * SOW staffing — delivery roles attached to an approved SOW.
 *   - Mentor: assigned by Glimmora (read-only here).
 *   - Reviewer: assigned by Enterprise (admin/PMO) from active reviewer members.
 */

import * as React from "react";
import { GraduationCap, ClipboardCheck, Check } from "lucide-react";
import {
  SectionCard,
  AuroraSelect,
  primaryBtnClass,
  primaryStyle,
} from "@/app/admin/_shell/aurora-ui";
import {
  assignSowReviewer,
  getSowStaffing,
  sowStaffingOverlay,
} from "@/lib/enterprise/mocks/sow-staffing";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { getTenantMembersMock } from "@/lib/settings/settings-mock";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { cn } from "@/lib/utils/cn";

function reviewerCandidates() {
  return getTenantMembersMock().filter(
    (m) => m.status === "active" && m.roles.includes("reviewer"),
  );
}

export function SowStaffingSection({ sowId }: { sowId: string }) {
  useOverlayVersion(sowStaffingOverlay);
  const { roles } = useEnterpriseAccess();
  const staffing = getSowStaffing(sowId);
  const candidates = React.useMemo(reviewerCandidates, []);
  const [picked, setPicked] = React.useState<string>(staffing.reviewer?.id ?? "");
  const [saved, setSaved] = React.useState(false);

  const canAssignReviewer = roles.includes("admin") || roles.includes("pmo");

  const onAssign = () => {
    const member = candidates.find((m) => m.id === picked);
    if (!member) return;
    assignSowReviewer(sowId, { id: member.id, name: member.name, email: member.email });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <SectionCard
      title="Delivery staffing"
      description="Mentor (assigned by Glimmora) and reviewer (assigned by Enterprise)"
    >
      <div className="px-5 sm:px-6 py-5 space-y-4">
        {/* Mentor — Glimmora owned, read-only */}
        <div className="flex items-start gap-3">
          <span className="grid place-items-center h-8 w-8 rounded-lg border border-white/55 text-text-tertiary shrink-0">
            <GraduationCap className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Mentor · Glimmora
            </p>
            {staffing.mentor ? (
              <p className="mt-0.5 font-body text-[13px] text-foreground">
                <span className="font-semibold">{staffing.mentor.name}</span>{" "}
                <span className="text-text-tertiary">· {staffing.mentor.role}</span>
              </p>
            ) : (
              <p className="mt-0.5 font-body text-[12.5px] text-text-tertiary italic">
                Awaiting Glimmora mentor assignment (at platform approval).
              </p>
            )}
          </div>
        </div>

        {/* Reviewer — enterprise owned */}
        <div className="flex items-start gap-3 pt-3 border-t border-white/55">
          <span className="grid place-items-center h-8 w-8 rounded-lg border border-white/55 text-text-tertiary shrink-0">
            <ClipboardCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Reviewer · Enterprise
            </p>
            {staffing.reviewer ? (
              <p className="mt-0.5 font-body text-[13px] text-foreground">
                <span className="font-semibold">{staffing.reviewer.name}</span>{" "}
                {staffing.reviewer.email && (
                  <span className="text-text-tertiary">· {staffing.reviewer.email}</span>
                )}
              </p>
            ) : (
              <p className="mt-0.5 font-body text-[12.5px] text-text-tertiary italic">
                No reviewer assigned yet.
              </p>
            )}

            {canAssignReviewer && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <AuroraSelect
                  size="sm"
                  value={picked}
                  onChange={(e) => setPicked(e.target.value)}
                  className="w-auto min-w-[16rem]"
                >
                  <option value="">Select a reviewer…</option>
                  {candidates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.email}
                    </option>
                  ))}
                </AuroraSelect>
                <button
                  type="button"
                  onClick={onAssign}
                  disabled={!picked}
                  style={primaryStyle}
                  className={cn(primaryBtnClass, "h-9")}
                >
                  {saved ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                  )}
                  {staffing.reviewer ? "Reassign reviewer" : "Assign reviewer"}
                </button>
              </div>
            )}
            {candidates.length === 0 && canAssignReviewer && (
              <p className="mt-2 font-body text-[11.5px] text-text-tertiary">
                No reviewer-role members yet. Invite one in tenant settings.
              </p>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
