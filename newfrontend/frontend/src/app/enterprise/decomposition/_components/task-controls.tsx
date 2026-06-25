"use client";

/**
 * Per-task delivery controls (shared by the plan detail row badge + the task
 * manage page): publish-for-interest (window + live matched/interested counts),
 * the interested-pool "Source" picker, and manual assign.
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Sparkles, Star, Users, XCircle } from "lucide-react";
import type { TaskDetail } from "@/lib/decomposition/types";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";

export function closesInLabel(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "closed";
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `closes in ${d}d ${h % 24}h`;
  if (h > 0) return `closes in ${h}h`;
  return `closes in ${Math.max(1, Math.floor(ms / 60_000))}m`;
}

/** Publish a task to skill-matched contributors + show the live matched/interested
 *  counts and the window countdown. Small status only — the pick stays in Source. */
export function InterestPublishControl({ planId, task }: { planId: string; task: TaskDetail }) {
  const [hours, setHours] = React.useState("48");
  const [minutes, setMinutes] = React.useState("0");
  const [publishing, setPublishing] = React.useState(false);

  const statusQ = useQuery({
    queryKey: ["decomposition", "interest-status", planId, task.id],
    queryFn: async () => {
      const r = await fetch(
        `/api/decomposition/plans/${planId}/tasks/${task.id}/interest-status`,
        { cache: "no-store" },
      );
      if (!r.ok) return null;
      return (await r.json()) as {
        matched: number; interested: number; closesAt: string | null; published: boolean; open: boolean;
      };
    },
    refetchInterval: 12_000,
  });
  const st = statusQ.data;

  async function publish() {
    setPublishing(true);
    try {
      const r = await fetch(`/api/decomposition/plans/${planId}/tasks/${task.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationHours: Number(hours) || 0,
          durationMinutes: Number(minutes) || 0,
        }),
      });
      if (!r.ok) throw new Error();
      const d = (await r.json()) as { matched: number };
      toast.success(`Published to ${d.matched} matched contributor${d.matched === 1 ? "" : "s"}`);
      await statusQ.refetch();
    } catch {
      toast.error("Could not publish", "Try again.");
    } finally {
      setPublishing(false);
    }
  }

  if (st?.published) {
    const closed = !st.open;
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[11px]">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold",
            closed ? "bg-bg-subtle text-text-tertiary" : "bg-success-subtle text-success-text",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", closed ? "bg-text-tertiary" : "bg-success-text")} aria-hidden />
          {closed ? "Interest closed" : "Open for interest"}
        </span>
        <span className="tabular-nums text-text-secondary">
          {st.matched} matched · {st.interested} interested
        </span>
        {st.closesAt ? <span className="text-text-tertiary tabular-nums">· {closesInLabel(st.closesAt)}</span> : null}
      </div>
    );
  }
  const inputCls = "h-7 w-12 px-1.5 rounded-md border border-stroke bg-surface font-body text-[11px] tabular-nums text-foreground text-right";
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-body text-[10.5px] text-text-tertiary">window</span>
      <input
        type="number" min={0} max={720} value={hours}
        onChange={(e) => setHours(e.target.value)}
        className={inputCls} aria-label="Window hours"
      />
      <span className="font-body text-[10.5px] text-text-tertiary">h</span>
      <input
        type="number" min={0} max={59} value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        className={inputCls} aria-label="Window minutes"
      />
      <span className="font-body text-[10.5px] text-text-tertiary">m</span>
      <button
        type="button"
        onClick={publish}
        disabled={publishing}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-brand text-on-brand font-body text-[11.5px] font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
      >
        <Users className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        {publishing ? "…" : "Publish to matched"}
      </button>
    </div>
  );
}

interface AssignableContributor {
  id: string;
  code?: string;
  email: string;
  name: string;
  tasksTaken?: number;
  tasksCompleted?: number;
  acceptancePct?: number;
  avgRating?: number;
  ratingCount?: number;
}

/** Real per-task contributor assignment (replaces the mock assign drawer). */
export function TaskAssignControl({ task }: { task: TaskDetail }) {
  const params = useParams();
  const planId = String((params as { planId?: string } | null)?.planId ?? "");
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [sourcing, setSourcing] = React.useState(false);
  const [selected, setSelected] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const assigneeEmail = (task as { assigneeEmail?: string | null }).assigneeEmail ?? null;
  // Runtime statuses ("ready"/"available"/"assigned") aren't in the FE TaskStatus union.
  const status = String(task.status);
  const assignable = status === "ready" || status === "available";

  const contributorsQ = useQuery({
    queryKey: ["enterprise", "assignable-contributors"],
    queryFn: async (): Promise<AssignableContributor[]> => {
      const res = await fetch("/api/decomposition/contributors", { cache: "no-store" });
      if (!res.ok) return [];
      const body = (await res.json()) as { data?: unknown; items?: unknown };
      const list = (body.data ?? body.items ?? []) as AssignableContributor[];
      return Array.isArray(list) ? list : [];
    },
    enabled: open,
    staleTime: 60_000,
  });

  if (status === "assigned" || assigneeEmail) {
    return (
      <span className="inline-flex items-center gap-1 font-body text-[11px] font-semibold text-success-text">
        <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden />
        Assigned{assigneeEmail ? ` · ${assigneeEmail}` : ""}
      </span>
    );
  }
  if (!assignable) return null;

  async function doAssign() {
    const c = (contributorsQ.data ?? []).find((x) => x.id === selected);
    if (!c) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/decomposition/plans/${planId}/tasks/${task.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributorId: c.id,
          contributorEmail: c.email,
          skills: task.requiredSkills,
        }),
      });
      if (!res.ok) throw new Error(`Assign failed (${res.status})`);
      toast.success(`Assigned to ${c.name}`);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["decomposition"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not assign task");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <InterestPublishControl planId={planId} task={task} />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSourcing(true)}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-brand text-on-brand font-body text-[11.5px] font-semibold hover:bg-brand-hover transition-colors"
          >
            <Users className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Source
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center h-7 px-2.5 rounded-md border border-stroke font-body text-[11.5px] font-semibold text-foreground hover:bg-surface-hover transition-colors"
          >
            Assign
          </button>
        </div>
        {sourcing ? (
          <SourceModal
            planId={planId}
            task={task}
            onClose={() => setSourcing(false)}
            onSelected={async () => {
              setSourcing(false);
              await queryClient.invalidateQueries({ queryKey: ["decomposition"] });
            }}
          />
        ) : null}
      </div>
    );
  }
  // Selecting a contributor opens a profile dialog (it does NOT assign directly) —
  // the enterprise reviews the track record, then Assign or Cancel.
  const selectedContributor = (contributorsQ.data ?? []).find((x) => x.id === selected) ?? null;
  return (
    <>
      <div className="flex items-center gap-1.5">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-7 px-2 rounded-md border border-stroke bg-surface font-body text-[11.5px] text-foreground max-w-[180px]"
        >
          <option value="">{contributorsQ.isLoading ? "Loading…" : "Select contributor…"}</option>
          {(contributorsQ.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => { setSelected(""); setOpen(false); }}
          aria-label="Cancel"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-text-tertiary hover:text-foreground"
        >
          <XCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      </div>
      {selectedContributor ? (
        <AssignProfileDialog
          contributor={selectedContributor}
          taskTitle={task.title}
          busy={busy}
          onAssign={doAssign}
          onCancel={() => setSelected("")}
        />
      ) : null}
    </>
  );
}

/** Confirm-assign dialog showing the picked contributor's track record. */
function AssignProfileDialog({
  contributor,
  taskTitle,
  busy,
  onAssign,
  onCancel,
}: {
  contributor: AssignableContributor;
  taskTitle: string;
  busy: boolean;
  onAssign: () => void | Promise<void>;
  onCancel: () => void;
}) {
  if (typeof document === "undefined") return null;
  const rating = contributor.ratingCount
    ? `${(contributor.avgRating ?? 0).toFixed(1)} (${contributor.ratingCount})`
    : "no rating";
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-stroke-subtle bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-stroke-subtle px-5 py-3.5">
          <h3 className="font-body text-[14px] font-semibold text-foreground">Assign this task?</h3>
          <p className="mt-0.5 font-body text-[12px] text-text-secondary truncate">{taskTitle}</p>
        </div>
        <div className="px-5 py-4 space-y-3.5">
          <div>
            <p className="font-body text-[14px] font-semibold text-foreground">{contributor.name}</p>
            <p className="font-body text-[11.5px] text-text-tertiary truncate">{contributor.email}</p>
            {contributor.code ? (
              <p className="mt-0.5 font-mono text-[10.5px] text-text-tertiary">{contributor.code}</p>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <AssignStat label="Projects taken" value={String(contributor.tasksTaken ?? 0)} />
            <AssignStat label="Completed" value={String(contributor.tasksCompleted ?? 0)} />
            <AssignStat label="Acceptance" value={`${contributor.acceptancePct ?? 0}%`} />
            <AssignStat
              label="Avg rating"
              value={rating}
              icon={<Star className="h-3 w-3" strokeWidth={2} aria-hidden />}
            />
          </dl>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-stroke-subtle px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md px-3 py-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAssign}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-body text-[12.5px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            {busy ? "Assigning…" : "Assign"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AssignStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary">{label}</dt>
      <dd className="mt-0.5 inline-flex items-center gap-1 font-body text-[14px] font-semibold text-foreground tabular-nums">
        {icon}
        {value}
      </dd>
    </div>
  );
}

interface InterestedContributor {
  accountId: string;
  name: string;
  email: string | null;
  status: string; // 'selected' | 'interested' | 'matched'
  interested: boolean;
  interestedAt: string | null;
  declaredSkills: string[];
  matchedSkills: string[];
  matchCount: number;
  avgRating: number;
  avgFinalRating?: number | null;
  ratingCount: number;
  tasksTaken?: number;
  tasksAccepted?: number;
  completedTasks: number;
  acceptancePct?: number;
}

type InterestFilter = "all" | "interested" | "matched";

const INTEREST_TABS: Array<{ id: InterestFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "interested", label: "Only interested" },
  { id: "matched", label: "Top matched" },
];

/** Interested-contributor pool for a task — the enterprise "Source" picker. */
function SourceModal({
  planId,
  task,
  onClose,
  onSelected,
}: {
  planId: string;
  task: TaskDetail;
  onClose: () => void;
  onSelected: () => void | Promise<void>;
}) {
  const [filter, setFilter] = React.useState<InterestFilter>("all");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  // Selecting opens a confirm dialog (does NOT assign directly).
  const [confirm, setConfirm] = React.useState<InterestedContributor | null>(null);

  const q = useQuery({
    queryKey: ["decomposition", "interests", planId, task.id],
    queryFn: async (): Promise<{ items: InterestedContributor[]; requiredSkills: string[] }> => {
      const res = await fetch(`/api/decomposition/plans/${planId}/tasks/${task.id}/interests`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load interest (${res.status})`);
      const body = await res.json();
      return { items: Array.isArray(body.items) ? body.items : [], requiredSkills: body.requiredSkills ?? [] };
    },
    // Always pull fresh on open (never show a cached pool from a previous open) and
    // poll while open so newly-interested contributors appear live — matching the
    // "N matched · M interested" badge instead of drifting from it.
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 10_000,
  });

  const all = q.data?.items ?? [];
  const items = React.useMemo(() => {
    if (filter === "interested") return all.filter((i) => i.interested);
    if (filter === "matched") return all.filter((i) => i.matchCount > 0);
    return all;
  }, [all, filter]);

  async function select(accountId: string, name: string) {
    setBusyId(accountId);
    try {
      const res = await fetch(`/api/decomposition/plans/${planId}/tasks/${task.id}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error(`Select failed (${res.status})`);
      toast.success(`Sourced to ${name}`, "Task assigned · deadline + payout set.");
      await onSelected();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not select contributor");
      setBusyId(null);
    }
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-stroke-subtle bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stroke-subtle px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="font-body text-[14px] font-semibold text-foreground">
              Source a contributor
            </h3>
            <p className="mt-0.5 font-body text-[12px] text-text-secondary truncate">
              {task.title} · matched &amp; interested
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-tertiary hover:text-foreground"
          >
            <XCircle className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-5 pt-3">
          {INTEREST_TABS.map((t) => {
            const active = filter === t.id;
            const count =
              t.id === "interested"
                ? all.filter((i) => i.interested).length
                : t.id === "matched"
                  ? all.filter((i) => i.matchCount > 0).length
                  : all.length;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11.5px] font-semibold transition-colors",
                  active
                    ? "bg-brand text-on-brand"
                    : "border border-stroke text-text-secondary hover:bg-surface-hover",
                )}
              >
                {t.id === "matched" ? <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden /> : null}
                {t.label}
                <span className={cn("tabular-nums", active ? "opacity-90" : "text-text-tertiary")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="max-h-[46vh] overflow-y-auto px-5 py-3">
          {q.isLoading ? (
            <p className="py-8 text-center font-body text-[12.5px] text-text-tertiary">Loading…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center font-body text-[12.5px] text-text-tertiary">
              {all.length === 0
                ? "No matched or interested contributors yet."
                : "No contributors match this filter."}
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((c) => (
                <li
                  key={c.accountId}
                  className="rounded-lg border border-stroke-subtle p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[13px] font-semibold text-foreground truncate">
                        {c.name}
                      </span>
                      {c.status === "selected" ? (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0 font-body text-[10px] font-semibold text-success-text">
                          <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden /> selected
                        </span>
                      ) : c.interested ? (
                        <span className="inline-flex items-center rounded-full bg-brand-subtle px-1.5 py-0 font-body text-[10px] font-semibold text-brand-subtle-text border border-brand/20">
                          interested
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-bg-subtle px-1.5 py-0 font-body text-[10px] font-semibold text-text-tertiary border border-stroke-subtle">
                          matched
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 font-body text-[11px] text-text-tertiary truncate">{c.email}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11px] text-text-secondary">
                      <span className={cn(c.matchCount > 0 ? "text-brand font-semibold" : "text-text-tertiary")}>
                        {c.matchCount}/{q.data?.requiredSkills.length ?? 0} skills match
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3" strokeWidth={2} aria-hidden />
                        {c.ratingCount > 0 ? `${c.avgRating.toFixed(1)} (${c.ratingCount})` : "no rating"}
                      </span>
                      <span>{c.completedTasks} done</span>
                    </div>
                    {c.matchedSkills.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {c.matchedSkills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-0.5 rounded bg-brand-subtle px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-subtle-text border border-brand/20"
                          >
                            <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={busyId !== null || c.status === "selected"}
                    onClick={() => setConfirm(c)}
                    className="shrink-0 inline-flex items-center h-7 px-3 rounded-md bg-brand text-on-brand font-body text-[11.5px] font-semibold disabled:opacity-50"
                  >
                    {busyId === c.accountId ? "…" : "Select"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {confirm ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setConfirm(null); }}
        >
          <div
            className="w-full max-w-xs rounded-xl border border-stroke-subtle bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-stroke-subtle px-5 py-3.5">
              <h4 className="font-body text-[14px] font-semibold text-foreground">Assign this task?</h4>
              <p className="mt-0.5 font-body text-[12px] text-text-secondary truncate">{task.title}</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="font-body text-[14px] font-semibold text-foreground">{confirm.name}</p>
              <p className="font-body text-[11.5px] text-text-tertiary truncate">{confirm.email}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 font-body text-[11.5px] text-text-secondary">
                <span>{confirm.matchCount}/{q.data?.requiredSkills.length ?? 0} skills</span>
                <span className="inline-flex items-center gap-0.5">
                  <Star className="h-3 w-3" strokeWidth={2} aria-hidden />
                  {confirm.ratingCount > 0 ? `${confirm.avgRating.toFixed(1)} (${confirm.ratingCount})` : "no rating"}
                </span>
                <span>{confirm.completedTasks} done</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-stroke-subtle px-5 py-3">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={busyId !== null}
                className="rounded-md px-3 py-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { const sel = confirm; setConfirm(null); void select(sel.accountId, sel.name); }}
                disabled={busyId !== null}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-body text-[12.5px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                Assign
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

/* ─── Dependencies ─── */



/** Compact live status for the plan-detail task row (status only — controls live
 *  on the task manage page). Renders nothing until the task is published. */
export function TaskInterestBadge({ planId, taskId }: { planId: string; taskId: string }) {
  const q = useQuery({
    queryKey: ["decomposition", "interest-status", planId, taskId],
    queryFn: async () => {
      const r = await fetch(`/api/decomposition/plans/${planId}/tasks/${taskId}/interest-status`, { cache: "no-store" });
      if (!r.ok) return null;
      return (await r.json()) as { matched: number; interested: number; closesAt: string | null; published: boolean; open: boolean };
    },
    refetchInterval: 15_000,
  });
  const st = q.data;
  if (!st?.published) return null;
  const closed = !st.open;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-body text-[11px]">
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold", closed ? "bg-bg-subtle text-text-tertiary" : "bg-success-subtle text-success-text")}>
        <span className={cn("h-1.5 w-1.5 rounded-full", closed ? "bg-text-tertiary" : "bg-success-text")} aria-hidden />
        {closed ? "Closed" : "Open"}
      </span>
      <span className="tabular-nums text-text-secondary">{st.matched} matched · {st.interested} interested</span>
      {st.closesAt ? <span className="text-text-tertiary tabular-nums">· {closesInLabel(st.closesAt)}</span> : null}
    </span>
  );
}

/* ─── Task-page Source + Assign side panel ─── */

/** Full sourcing experience for the dedicated task page's side panel: publish for
 *  interest, the interested-contributor pool with each person's PUBLIC track
 *  record (rating, accepted, completed, total, acceptance %, skills), select → assign. */
export function TaskSourcePanel({ planId, task }: { planId: string; task: TaskDetail }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState<InterestFilter>("all");
  const [confirm, setConfirm] = React.useState<InterestedContributor | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const status = String(task.status);
  const assigneeEmail = (task as { assigneeEmail?: string | null }).assigneeEmail ?? null;
  const isAssigned =
    status === "assigned" || !!assigneeEmail || !(status === "ready" || status === "available");

  const q = useQuery({
    queryKey: ["decomposition", "interests", planId, task.id],
    queryFn: async (): Promise<{ items: InterestedContributor[]; requiredSkills: string[] }> => {
      const res = await fetch(`/api/decomposition/plans/${planId}/tasks/${task.id}/interests`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load interest (${res.status})`);
      const body = await res.json();
      return { items: Array.isArray(body.items) ? body.items : [], requiredSkills: body.requiredSkills ?? [] };
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 10_000,
    enabled: !isAssigned,
  });

  const all = q.data?.items ?? [];
  const items = React.useMemo(() => {
    if (filter === "interested") return all.filter((i) => i.interested);
    if (filter === "matched") return all.filter((i) => i.matchCount > 0);
    return all;
  }, [all, filter]);

  async function select(accountId: string, name: string) {
    setBusyId(accountId);
    try {
      const res = await fetch(`/api/decomposition/plans/${planId}/tasks/${task.id}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error(`Select failed (${res.status})`);
      toast.success(`Sourced to ${name}`, "Task assigned · deadline + payout set.");
      await queryClient.invalidateQueries({ queryKey: ["decomposition"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not select contributor");
    } finally {
      setBusyId(null);
    }
  }

  if (isAssigned) {
    return (
      <div className="rounded-xl border border-stroke-subtle bg-surface p-4">
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.08em] text-text-tertiary">Sourcing</p>
        <p className="mt-2 inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-success-text">
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          Assigned{assigneeEmail ? ` · ${assigneeEmail}` : ""}
        </p>
        <p className="mt-1 font-body text-[11.5px] text-text-tertiary">
          This task is already with a contributor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stroke-subtle bg-surface p-4">
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.08em] text-text-tertiary mb-2.5">
          Publish for interest
        </p>
        <InterestPublishControl planId={planId} task={task} />
      </div>

      <div className="rounded-xl border border-stroke-subtle bg-surface p-4">
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.08em] text-text-tertiary mb-3">
          Source a contributor
        </p>
        <div className="flex items-center gap-1 mb-3">
          {INTEREST_TABS.map((t) => {
            const active = filter === t.id;
            const count =
              t.id === "interested"
                ? all.filter((i) => i.interested).length
                : t.id === "matched"
                  ? all.filter((i) => i.matchCount > 0).length
                  : all.length;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11.5px] font-semibold transition-colors",
                  active ? "bg-brand text-on-brand" : "border border-stroke text-text-secondary hover:bg-surface-hover",
                )}
              >
                {t.id === "matched" ? <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden /> : null}
                {t.label}
                <span className={cn("tabular-nums", active ? "opacity-90" : "text-text-tertiary")}>{count}</span>
              </button>
            );
          })}
        </div>
        {q.isLoading ? (
          <p className="py-8 text-center font-body text-[12.5px] text-text-tertiary">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center font-body text-[12.5px] text-text-tertiary">
            {all.length === 0
              ? "No matched or interested contributors yet. Publish above to invite them."
              : "No contributors match this filter."}
          </p>
        ) : (
          <>
            <ul className="space-y-2.5 max-h-[480px] overflow-y-auto overscroll-y-contain pr-0.5 -mr-0.5">
              {items.map((c) => (
                <SourceCard
                  key={c.accountId}
                  c={c}
                  reqCount={q.data?.requiredSkills.length ?? 0}
                  busy={busyId !== null}
                  onSelect={() => setConfirm(c)}
                />
              ))}
            </ul>
            {items.length > 4 ? (
              <p className="mt-2 text-center font-body text-[10.5px] text-text-tertiary">
                {items.length} contributors · scroll for more
              </p>
            ) : null}
          </>
        )}
      </div>

      {confirm ? (
        <ConfirmAssignDialog
          c={confirm}
          taskTitle={task.title}
          reqCount={q.data?.requiredSkills.length ?? 0}
          busy={busyId !== null}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const sel = confirm;
            setConfirm(null);
            void select(sel.accountId, sel.name);
          }}
        />
      ) : null}
    </div>
  );
}

/** One contributor's public track record card in the Source panel. */
function SourceCard({
  c,
  reqCount,
  busy,
  onSelect,
}: {
  c: InterestedContributor;
  reqCount: number;
  busy: boolean;
  onSelect: () => void;
}) {
  const rating = c.ratingCount > 0 ? (c.avgFinalRating ?? c.avgRating).toFixed(1) : null;
  const extraSkills = c.declaredSkills.filter((s) => !c.matchedSkills.includes(s)).slice(0, 6);
  return (
    <li className="rounded-lg border border-stroke-subtle p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-body text-[13px] font-semibold text-foreground truncate">{c.name}</span>
            {c.status === "selected" ? (
              <span className="inline-flex items-center gap-0.5 font-body text-[10px] font-semibold text-success-text">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden /> selected
              </span>
            ) : c.interested ? (
              <span className="inline-flex items-center rounded-full bg-brand-subtle px-1.5 py-0 font-body text-[10px] font-semibold text-brand-subtle-text border border-brand/20">
                interested
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-bg-subtle px-1.5 py-0 font-body text-[10px] font-semibold text-text-tertiary border border-stroke-subtle">
                matched
              </span>
            )}
          </div>
          <p className="mt-0.5 font-body text-[11px] text-text-tertiary truncate">{c.email}</p>
        </div>
        <button
          type="button"
          disabled={busy || c.status === "selected"}
          onClick={onSelect}
          className="shrink-0 inline-flex items-center h-7 px-3 rounded-md bg-brand text-on-brand font-body text-[11.5px] font-semibold disabled:opacity-50"
        >
          Select
        </button>
      </div>
      <dl className="mt-2.5 grid grid-cols-4 gap-2">
        <ProfileStat label="Rating" value={rating ? `★ ${rating}` : "—"} />
        <ProfileStat label="Accepted" value={String(c.tasksAccepted ?? c.tasksTaken ?? 0)} />
        <ProfileStat label="Completed" value={String(c.completedTasks ?? 0)} />
        <ProfileStat label="Acceptance" value={c.acceptancePct != null ? `${c.acceptancePct}%` : "—"} />
      </dl>
      <p className="mt-2 font-body text-[11px]">
        <span className={cn(c.matchCount > 0 ? "text-brand font-semibold" : "text-text-tertiary")}>
          {c.matchCount}/{reqCount} skills match
        </span>
      </p>
      {(c.matchedSkills.length > 0 || extraSkills.length > 0) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {Array.from(new Set(c.matchedSkills)).map((s) => (
            <span
              key={`matched-${s}`}
              className="inline-flex items-center gap-0.5 rounded bg-brand-subtle px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-subtle-text border border-brand/20"
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
              {s}
            </span>
          ))}
          {Array.from(new Set(extraSkills)).map((s) => (
            <span
              key={`extra-${s}`}
              className="inline-flex items-center rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary border border-stroke-subtle"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-body text-[9.5px] font-bold uppercase tracking-[0.05em] text-text-tertiary">{label}</dt>
      <dd className="mt-0.5 font-body text-[12.5px] font-semibold text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

function ConfirmAssignDialog({
  c,
  taskTitle,
  reqCount,
  busy,
  onCancel,
  onConfirm,
}: {
  c: InterestedContributor;
  taskTitle: string;
  reqCount: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (typeof document === "undefined") return null;
  const rating = c.ratingCount > 0 ? (c.avgFinalRating ?? c.avgRating).toFixed(1) : "no rating";
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div className="w-full max-w-xs rounded-xl border border-stroke-subtle bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-stroke-subtle px-5 py-3.5">
          <h4 className="font-body text-[14px] font-semibold text-foreground">Assign this task?</h4>
          <p className="mt-0.5 font-body text-[12px] text-text-secondary truncate">{taskTitle}</p>
        </div>
        <div className="px-5 py-4 space-y-2">
          <p className="font-body text-[14px] font-semibold text-foreground">{c.name}</p>
          <p className="font-body text-[11.5px] text-text-tertiary truncate">{c.email}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 font-body text-[11.5px] text-text-secondary">
            <span>{c.matchCount}/{reqCount} skills</span>
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-3 w-3" strokeWidth={2} aria-hidden />
              {rating}
            </span>
            <span>{c.completedTasks} done</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-stroke-subtle px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md px-3 py-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-body text-[12.5px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            Assign
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
