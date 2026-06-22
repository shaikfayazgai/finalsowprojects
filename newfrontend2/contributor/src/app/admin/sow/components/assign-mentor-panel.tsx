"use client";

/**
 * Glimmora mentor assignment — after platform gate approval (or prep during review).
 */

import * as React from "react";
import { Check, ChevronDown, GraduationCap } from "lucide-react";
import {
  GLIMMORA_MENTOR_BENCH,
  assignSowMentor,
  getSowStaffing,
  sowStaffingOverlay,
} from "@/lib/enterprise/mocks/sow-staffing";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { primaryStyle } from "../../_shell/aurora-ui";

const SELECT =
  "w-full h-10 px-3 pr-10 rounded-lg border border-stroke-subtle bg-surface font-body text-[13px] text-foreground appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus";

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-semibold text-foreground",
  "hover:bg-bg-subtle transition-colors disabled:opacity-50",
);

export function AssignMentorPanel({ sowId }: { sowId: string }) {
  useOverlayVersion(sowStaffingOverlay);
  const staffing = getSowStaffing(sowId);
  const [picked, setPicked] = React.useState<string>(staffing.mentor?.id ?? "");
  const [saved, setSaved] = React.useState(false);

  const assigned = staffing.mentor;

  const onAssign = () => {
    const mentor = GLIMMORA_MENTOR_BENCH.find((m) => m.id === picked);
    if (!mentor) return;
    assignSowMentor(sowId, mentor);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
        <h2 className="font-body text-[13px] font-semibold text-foreground">Mentor assignment</h2>
        <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Glimmora assigns the delivery mentor after commercial approval</p>
      </div>

      <div className="px-4 sm:px-5 py-5 space-y-4">
        {assigned ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-success-border bg-success-subtle/50 px-4 py-3">
            <GraduationCap className="h-4 w-4 shrink-0 text-success-text" strokeWidth={2} aria-hidden />
            <p className="font-body text-[13px] text-foreground">
              <span className="font-semibold">{assigned.name}</span>
              <span className="text-text-tertiary"> · {assigned.role}</span>
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <select aria-label="Select a mentor" value={picked} onChange={(e) => setPicked(e.target.value)} className={SELECT}>
              <option value="">Select a mentor…</option>
              {GLIMMORA_MENTOR_BENCH.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" strokeWidth={2} aria-hidden />
          </div>
          <button
            type="button"
            onClick={onAssign}
            disabled={!picked}
            className={cn(BTN_SECONDARY, !picked ? "" : "text-on-brand border-transparent hover:opacity-90")}
            style={picked ? primaryStyle : undefined}
          >
            {saved ? <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden /> : <GraduationCap className="h-4 w-4" strokeWidth={2} aria-hidden />}
            {assigned ? "Reassign mentor" : "Assign mentor"}
          </button>
        </div>
      </div>
    </section>
  );
}
