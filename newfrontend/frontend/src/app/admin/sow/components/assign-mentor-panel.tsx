"use client";

/**
 * Glimmora mentor assignment — REAL backend. Lists mentor accounts
 * (/api/superadmin/mentors) and assigns one to the SOW
 * (/api/superadmin/sows/{id}/assign-mentor). Stored in admin_records so
 * contributor submissions for this SOW route to the assigned mentor.
 */

import * as React from "react";
import { Check, ChevronDown, GraduationCap } from "lucide-react";
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

interface Mentor {
  id: string;
  name: string;
  email?: string;
  label: string;
}

export function AssignMentorPanel({ sowId }: { sowId: string }) {
  const [mentors, setMentors] = React.useState<Mentor[]>([]);
  const [assigned, setAssigned] = React.useState<{ name?: string; email?: string } | null>(null);
  const [picked, setPicked] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadMentors = React.useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/mentors", { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      const list = (body?.mentors ?? body?.items ?? body?.data ?? body) as unknown;
      const arr = Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
      setMentors(
        arr.map((m) => {
          const name = (m.name as string) || (m.email as string) || "Mentor";
          const detail = (m.roleLabel as string) || (m.role as string) || "";
          return {
            id: String(m.id),
            name,
            email: m.email as string | undefined,
            label: detail ? `${name} — ${detail}` : name,
          };
        }),
      );
    } catch {
      /* leave empty */
    }
  }, []);

  const loadAssigned = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/superadmin/sows/${sowId}/assign-mentor`, { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      const m = (body?.data?.mentor ?? body?.mentor) as
        | { mentorId?: string; mentorName?: string; mentorEmail?: string }
        | null;
      if (m && m.mentorId) {
        setAssigned({ name: m.mentorName, email: m.mentorEmail });
        setPicked(m.mentorId);
      } else {
        setAssigned(null);
      }
    } catch {
      /* none assigned */
    }
  }, [sowId]);

  React.useEffect(() => {
    void loadMentors();
    void loadAssigned();
  }, [loadMentors, loadAssigned]);

  const onAssign = async () => {
    const mentor = mentors.find((m) => m.id === picked);
    if (!mentor) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/superadmin/sows/${sowId}/assign-mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId: mentor.id, mentorName: mentor.name, mentorEmail: mentor.email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.message || "Couldn't assign mentor");
      }
      setAssigned({ name: mentor.name, email: mentor.email });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't assign mentor");
    } finally {
      setBusy(false);
    }
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
              {assigned.email ? <span className="text-text-tertiary"> · {assigned.email}</span> : null}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <select aria-label="Select a mentor" value={picked} onChange={(e) => setPicked(e.target.value)} className={SELECT}>
              <option value="">{mentors.length ? "Select a mentor…" : "No mentors available"}</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" strokeWidth={2} aria-hidden />
          </div>
          <button
            type="button"
            onClick={onAssign}
            disabled={!picked || busy}
            className={cn(BTN_SECONDARY, !picked ? "" : "text-on-brand border-transparent hover:opacity-90")}
            style={picked ? primaryStyle : undefined}
          >
            {saved ? <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden /> : <GraduationCap className="h-4 w-4" strokeWidth={2} aria-hidden />}
            {busy ? "Assigning…" : assigned ? "Reassign mentor" : "Assign mentor"}
          </button>
        </div>
        {error ? <p className="font-body text-[12px] text-error-text">{error}</p> : null}
      </div>
    </section>
  );
}
