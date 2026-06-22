"use client";

/**
 * Glimmora desk — the unified Resolution Center queue. Every role's cases across
 * all 8 lanes (Support, Complaint, Feedback, Payment, Work/Task, Site/Bug,
 * Safety, Security) land here; the admin triages, replies (public or internal
 * note), and resolves/closes. Talks to /api/admin/cases + /api/cases.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Send, RefreshCw, ShieldCheck, Lock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import { LANES, LANE_BY_KEY, TONE_BG, laneLabel } from "@/components/cases/lanes";

type Status = "new" | "investigating" | "awaiting_user" | "resolved" | "closed" | "reopened";

interface CaseMsg {
  id: number; author: "user" | "glimmora"; type: "public" | "internal"; body: string; createdAt: string | null;
}
interface CaseRow {
  id: string; lane: string; stream: string; subject: string; body: string; priority: string; status: Status;
  raiserEmail?: string | null; raiserRole?: string | null; resolution?: string | null;
  createdAt: string | null; updatedAt: string | null; messages?: CaseMsg[];
}

const STATUS_PILL: Record<Status, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-info-subtle text-info-text border-info-border" },
  investigating: { label: "Investigating", cls: "bg-info-subtle text-info-text border-info-border" },
  awaiting_user: { label: "Awaiting user", cls: "bg-warning-subtle text-warning-text border-warning-border" },
  resolved: { label: "Resolved", cls: "bg-success-subtle text-success-text border-success-border" },
  closed: { label: "Closed", cls: "bg-surface-sunken text-text-secondary border-stroke-subtle" },
  reopened: { label: "Reopened", cls: "bg-warning-subtle text-warning-text border-warning-border" },
};
const PRIORITY_PILL: Record<string, string> = {
  critical: "bg-error-subtle text-error-text border-error-border",
  high: "bg-warning-subtle text-warning-text border-warning-border",
};

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${className ?? ""}`}>{children}</span>;
}
function fmt(d: string | null | undefined): string {
  if (!d) return "";
  try { return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}
function LaneIcon({ laneKey, className }: { laneKey: string; className?: string }) {
  const Icon = LANE_BY_KEY[laneKey]?.icon ?? LANES[0].icon;
  return <Icon className={className ?? "h-4 w-4"} />;
}

export default function AdminCasesPage() {
  const [items, setItems] = useState<CaseRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all"); // "all" | lane key
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === "all" ? "" : `?lane=${filter}`;
      const res = await fetch(`/api/admin/cases${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
      setOpen(Number(data?.open ?? 0));
      setCounts(data?.counts ?? {});
      // total across all lanes (counts is unfiltered)
      setTotal(Object.values<number>(data?.counts ?? {}).reduce((a, b) => a + Number(b), 0));
    } catch {
      toast.error("Could not load cases", "Check the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-xl font-semibold text-foreground">Resolution Center</h1>
          <p className="text-sm text-text-secondary">Every role&apos;s cases across all lanes — triage, reply, resolve.</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-foreground">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open" value={open} tone="warning" />
        <Stat label="Total" value={total} tone="info" />
        <Stat label="Complaints" value={counts.complaint ?? 0} tone="error" />
        <Stat label="Feedback" value={counts.feedback ?? 0} tone="neutral" />
      </div>

      {/* lane filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <Chip active={filter === "all"} onClick={() => { setFilter("all"); setSelectedId(null); }} label="All" count={total} />
        {LANES.map((l) => (
          <Chip key={l.key} active={filter === l.key} onClick={() => { setFilter(l.key); setSelectedId(null); }} label={l.label} count={counts[l.key] ?? 0} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
        <section className="space-y-2">
          {loading ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stroke-subtle p-8 text-center text-sm text-text-secondary">No cases.</div>
          ) : (
            items.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedId === c.id ? "border-brand bg-brand-subtle" : "border-stroke-subtle bg-surface hover:border-stroke hover:bg-surface-hover"
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${TONE_BG[LANE_BY_KEY[c.lane]?.tone ?? "info"]}`}>
                  <LaneIcon laneKey={c.lane} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{c.subject}</span>
                  <span className="block truncate text-xs text-text-secondary">{laneLabel(c.lane)} · {c.raiserEmail ?? c.raiserRole} · {fmt(c.createdAt)}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Pill className={STATUS_PILL[c.status]?.cls}>{STATUS_PILL[c.status]?.label ?? c.status}</Pill>
                  {PRIORITY_PILL[c.priority] && <Pill className={PRIORITY_PILL[c.priority]}><AlertTriangle className="h-3 w-3" />{c.priority}</Pill>}
                </span>
              </button>
            ))
          )}
        </section>

        <section>
          {selectedId ? (
            <CaseDetail key={selectedId} caseId={selectedId} onChanged={() => void load()} />
          ) : (
            <div className="grid h-full min-h-[240px] place-items-center rounded-xl border border-dashed border-stroke-subtle text-sm text-text-secondary">
              Select a case to open it.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "warning" | "info" | "error" | "neutral" }) {
  const cls = tone === "warning" ? "text-warning-text" : tone === "error" ? "text-error-text" : tone === "neutral" ? "text-foreground" : "text-info-text";
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface p-4">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`text-2xl font-semibold ${cls}`}>{value}</p>
    </div>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-brand text-white" : "bg-surface-sunken text-text-secondary hover:text-foreground"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/25" : "bg-stroke-subtle text-text-secondary"}`}>{count}</span>
    </button>
  );
}

function CaseDetail({ caseId, onChanged }: { caseId: string; onChanged: () => void }) {
  const [row, setRow] = useState<CaseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setRow(await res.json());
    } catch {
      toast.error("Could not open the case");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { void load(); }, [load]);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim(), internal }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setReply(""); setInternal(false);
      await load(); onChanged();
    } catch { toast.error("Could not send"); } finally { setBusy(false); }
  };

  const patch = async (payload: Record<string, unknown>, ok: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success(ok); setResolution("");
      await load(); onChanged();
    } catch { toast.error("Update failed"); } finally { setBusy(false); }
  };

  if (loading || !row) return <p className="text-sm text-text-secondary">Loading…</p>;

  return (
    <div className="space-y-4 rounded-xl border border-stroke-subtle bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">{row.subject}</h2>
          <p className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={`grid h-5 w-5 place-items-center rounded ${TONE_BG[LANE_BY_KEY[row.lane]?.tone ?? "info"]}`}>
              <LaneIcon laneKey={row.lane} className="h-3 w-3" />
            </span>
            {laneLabel(row.lane)} · {row.raiserEmail ?? row.raiserRole} · {fmt(row.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Pill className={STATUS_PILL[row.status]?.cls}>{STATUS_PILL[row.status]?.label ?? row.status}</Pill>
          {PRIORITY_PILL[row.priority] && <Pill className={PRIORITY_PILL[row.priority]}><AlertTriangle className="h-3 w-3" />{row.priority}</Pill>}
        </div>
      </div>

      {row.resolution && <p className="rounded-md bg-success-subtle p-2 text-xs text-success-text"><strong>Resolution:</strong> {row.resolution}</p>}

      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
        {(row.messages ?? []).map((m) => (
          <div key={m.id} className={`flex ${m.author === "glimmora" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-xl px-3 py-2 text-sm ${
              m.type === "internal" ? "border border-dashed border-warning-border bg-warning-subtle text-warning-text"
                : m.author === "glimmora" ? "bg-brand text-white" : "bg-surface-sunken text-foreground"
            }`}>
              <p className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-70">
                {m.type === "internal" && <Lock className="h-3 w-3" />}
                {m.author === "glimmora" ? "Glimmora" : (row.raiserRole ?? "User")}
                {m.type === "internal" && " · internal note"} · {fmt(m.createdAt)}
              </p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-stroke-subtle p-3">
        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder={internal ? "Internal note (staff only)…" : "Reply to the user…"} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
            <Lock className="h-3 w-3" /> Internal note
          </label>
          <Button onClick={send} disabled={busy || !reply.trim()} className="gap-1.5"><Send className="h-4 w-4" /> Send</Button>
        </div>
      </div>

      <div className="space-y-2 border-t border-stroke-subtle pt-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => void patch({ assignToMe: true }, "Assigned to you")}><ShieldCheck className="mr-1 h-4 w-4" /> Assign to me</Button>
          <Button variant="outline" disabled={busy} onClick={() => void patch({ status: "investigating" }, "Marked investigating")}>Investigating</Button>
          <Button variant="outline" disabled={busy} onClick={() => void patch({ status: "awaiting_user" }, "Marked awaiting user")}>Awaiting user</Button>
          <Button variant="ghost" disabled={busy} onClick={() => void patch({ status: "closed" }, "Case closed")}><XCircle className="mr-1 h-4 w-4" /> Close</Button>
        </div>
        <div className="flex items-end gap-2">
          <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution summary (shown to the user)"
            className="flex-1 rounded-md border border-stroke-subtle bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand" />
          <Button disabled={busy} onClick={() => void patch({ status: "resolved", resolution: resolution.trim() || undefined }, "Case resolved")} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Resolve
          </Button>
        </div>
      </div>
    </div>
  );
}
