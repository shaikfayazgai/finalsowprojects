"use client";

/**
 * SOW staffing — delivery roles attached to a SOW (REAL backend).
 *   - Mentor: assigned by Glimmora (read-only here; shown if present on the row).
 *   - Reviewer: assigned by Enterprise (admin/PMO) from active reviewer members
 *     (`/api/enterprise/team`), persisted to the SOW via `/api/sow/{id}/reviewer`.
 */

import * as React from "react";
import { GraduationCap, ClipboardCheck, Check, ChevronDown } from "lucide-react";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import { primaryBtnClass, primaryStyle } from "@/app/admin/_shell/aurora-ui";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { cn } from "@/lib/utils/cn";

interface Person {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface ReviewerCandidate {
  id: string;
  name: string;
  email?: string;
}

export function SowStaffingSection({
  sowId,
  reviewer: initialReviewer,
  mentor,
}: {
  sowId: string;
  reviewer?: Person | null;
  mentor?: Person | null;
}) {
  const { roles } = useEnterpriseAccess();
  const canAssignReviewer = roles.includes("admin") || roles.includes("pmo");

  const [candidates, setCandidates] = React.useState<ReviewerCandidate[]>([]);
  const [reviewer, setReviewer] = React.useState<Person | null>(initialReviewer ?? null);
  const [picked, setPicked] = React.useState<string>(initialReviewer?.id ?? "");
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load reviewer-role team members from the real tenant directory.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/enterprise/team", { cache: "no-store" });
        if (!res.ok) return;
        const body = await res.json();
        const rows = (body?.data ?? body?.items ?? body) as unknown;
        const arr = Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
        const isReviewer = (m: Record<string, unknown>) => {
          const codes = Array.isArray(m.roleCodes) ? (m.roleCodes as string[]) : [];
          const single = typeof m.roleCode === "string" ? m.roleCode : "";
          return (
            codes.some((c) => c.replace(/^ent\./, "") === "reviewer") ||
            single.replace(/^ent\./, "") === "reviewer"
          );
        };
        const status = (m: Record<string, unknown>) => (typeof m.status === "string" ? m.status : "active");
        if (alive) {
          setCandidates(
            arr
              .filter((m) => isReviewer(m) && status(m) !== "invited" && status(m) !== "disabled")
              .map((m) => ({
                id: String(m.id ?? m.memberId ?? m.email ?? ""),
                name: (m.name as string) || (m.email as string) || "Reviewer",
                email: m.email as string | undefined,
              }))
              .filter((c) => c.id),
          );
        }
      } catch {
        /* leave empty → hint shows */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onAssign = async () => {
    const member = candidates.find((m) => m.id === picked);
    if (!member) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sow/${encodeURIComponent(sowId)}/reviewer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId: member.id, reviewerName: member.name, reviewerEmail: member.email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.message || "Couldn't assign reviewer");
      }
      setReviewer({ id: member.id, name: member.name, email: member.email });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't assign reviewer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
        <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Delivery staffing</h2>
        <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
          Mentor (assigned by Glimmora) and reviewer (assigned by Enterprise)
        </p>
      </div>
      <div className="px-5 sm:px-6 py-5 space-y-4">
        {/* Mentor — Glimmora owned, read-only */}
        <div className="flex items-start gap-3">
          <span className="grid place-items-center h-8 w-8 rounded-lg border border-stroke-subtle text-text-tertiary shrink-0">
            <GraduationCap className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Mentor · Glimmora
            </p>
            {mentor?.name ? (
              <p className="mt-0.5 font-body text-[13px] text-foreground">
                <span className="font-semibold">{mentor.name}</span>
                {mentor.email ? <span className="text-text-tertiary"> · {mentor.email}</span> : null}
              </p>
            ) : (
              <p className="mt-0.5 font-body text-[12.5px] text-text-tertiary italic">
                Awaiting Glimmora mentor assignment (at platform approval).
              </p>
            )}
          </div>
        </div>

        {/* Reviewer — enterprise owned */}
        <div className="flex items-start gap-3 pt-3 border-t border-stroke-subtle">
          <span className="grid place-items-center h-8 w-8 rounded-lg border border-stroke-subtle text-text-tertiary shrink-0">
            <ClipboardCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Reviewer · Enterprise
            </p>
            {reviewer?.name ? (
              <p className="mt-0.5 font-body text-[13px] text-foreground">
                <span className="font-semibold">{reviewer.name}</span>
                {reviewer.email ? <span className="text-text-tertiary"> · {reviewer.email}</span> : null}
              </p>
            ) : (
              <p className="mt-0.5 font-body text-[12.5px] text-text-tertiary italic">No reviewer assigned yet.</p>
            )}

            {canAssignReviewer && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <div className="relative w-auto min-w-[16rem]">
                  <select
                    value={picked}
                    onChange={(e) => setPicked(e.target.value)}
                    aria-label="Select a reviewer"
                    className="appearance-none w-full h-9 pl-3 pr-9 rounded-lg border border-stroke-subtle bg-surface font-body text-[12.5px] font-medium text-foreground cursor-pointer transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
                  >
                    <option value="">{candidates.length ? "Select a reviewer…" : "No reviewers available"}</option>
                    {candidates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.email ? ` — ${m.email}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
                <button
                  type="button"
                  onClick={onAssign}
                  disabled={!picked || busy}
                  style={primaryStyle}
                  className={cn(primaryBtnClass, "h-9")}
                >
                  {saved ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                  )}
                  {busy ? "Assigning…" : reviewer ? "Reassign reviewer" : "Assign reviewer"}
                </button>
              </div>
            )}
            {error ? <p className="mt-2 font-body text-[12px] text-error-text">{error}</p> : null}
            {candidates.length === 0 && canAssignReviewer && !error && (
              <p className="mt-2 font-body text-[11.5px] text-text-tertiary">
                No reviewer-role members yet. Invite one in tenant settings.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
