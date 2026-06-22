"use client";

/**
 * SupportCenter — the user side of the Resolution Center.
 * Any role raises a case in one of the 8 lanes (Support, Complaint, Feedback,
 * Payment, Work/Task, Site/Bug, Safety, Security), tracks their own cases, and
 * replies in a live thread. Everything routes to the Glimmora desk. Talks to
 * /api/cases. Self-contained + role-agnostic, mountable in any portal.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Send, RefreshCw, ChevronLeft, Plus } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import { LANES, LANE_BY_KEY, TONE_BG, laneLabel } from "./lanes";

type Status =
  | "new" | "investigating" | "awaiting_user" | "resolved" | "closed" | "reopened";

interface CaseMsg {
  id: number;
  author: "user" | "glimmora";
  type: "public" | "internal";
  body: string;
  createdAt: string | null;
}
interface CaseRow {
  id: string;
  lane: string;
  stream: string;
  subject: string;
  body: string;
  priority: string;
  status: Status;
  resolution?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  messages?: CaseMsg[];
}

const STATUS_PILL: Record<Status, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-info-subtle text-info-text border-info-border" },
  investigating: { label: "In progress", cls: "bg-info-subtle text-info-text border-info-border" },
  awaiting_user: { label: "Awaiting you", cls: "bg-warning-subtle text-warning-text border-warning-border" },
  resolved: { label: "Resolved", cls: "bg-success-subtle text-success-text border-success-border" },
  closed: { label: "Closed", cls: "bg-surface-sunken text-text-secondary border-stroke-subtle" },
  reopened: { label: "Reopened", cls: "bg-warning-subtle text-warning-text border-warning-border" },
};

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${className ?? ""}`}>
      {children}
    </span>
  );
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

export function SupportCenter() {
  const [items, setItems] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cases", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      toast.error("Could not load your cases", "Please retry in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadList(); }, [loadList]);

  if (selectedId) {
    return <CaseThread caseId={selectedId} onBack={() => { setSelectedId(null); void loadList(); }} />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="font-display text-xl font-semibold text-foreground">Help &amp; Support</h1>
        <p className="text-sm text-text-secondary">
          Raise a request, complaint, feedback or report — it all goes to Glimmora, and we&apos;ll reply here.
        </p>
      </header>

      <RaiseForm onRaised={(c) => { void loadList(); setSelectedId(c.id); }} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">My cases</h2>
          <button onClick={() => void loadList()} className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-text-secondary">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stroke-subtle p-8 text-center text-sm text-text-secondary">
            No cases yet. Pick a category above to raise one.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-stroke-subtle bg-surface p-3 text-left transition-colors hover:border-stroke hover:bg-surface-hover"
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${TONE_BG[LANE_BY_KEY[c.lane]?.tone ?? "info"]}`}>
                    <LaneIcon laneKey={c.lane} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{c.subject}</span>
                    <span className="block text-xs text-text-secondary">{laneLabel(c.lane)} · {fmt(c.createdAt)}</span>
                  </span>
                  <Pill className={STATUS_PILL[c.status]?.cls}>{STATUS_PILL[c.status]?.label ?? c.status}</Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RaiseForm({ onRaised }: { onRaised: (c: CaseRow) => void }) {
  const [open, setOpen] = useState(false);
  const [lane, setLane] = useState<string>("support");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setSubject(""); setBody(""); setLane("support"); };

  const submit = async () => {
    if (!subject.trim() || !body.trim()) { toast.error("Add a subject and a message"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lane, subject: subject.trim(), body: body.trim() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const created = await res.json();
      toast.success(`${laneLabel(lane)} submitted`, "Glimmora has been notified.");
      reset(); setOpen(false);
      onRaised(created);
    } catch {
      toast.error("Could not submit", "Please retry.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-4 w-4" /> Raise a case
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-stroke-subtle bg-surface p-4">
      <div>
        <p className="mb-2 text-xs font-medium text-text-secondary">What is it about?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LANES.map((l) => {
            const Icon = l.icon;
            const active = lane === l.key;
            return (
              <button
                key={l.key}
                onClick={() => setLane(l.key)}
                title={l.desc}
                className={`flex flex-col items-start gap-1.5 rounded-lg border p-2.5 text-left transition-colors ${
                  active ? "border-brand bg-brand-subtle" : "border-stroke-subtle hover:border-stroke"
                }`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-md ${TONE_BG[l.tone]}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-foreground">{l.label}</span>
                <span className="text-[10px] leading-tight text-text-secondary">{l.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={`Short summary of your ${laneLabel(lane).toLowerCase()}`}
          className="w-full rounded-md border border-stroke-subtle bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Message</label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Describe it clearly so Glimmora can help." />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={() => { reset(); setOpen(false); }} disabled={busy}>Cancel</Button>
        <Button onClick={submit} disabled={busy} className="gap-1.5">
          <Send className="h-4 w-4" /> {busy ? "Sending…" : "Submit"}
        </Button>
      </div>
    </div>
  );
}

function CaseThread({ caseId, onBack }: { caseId: string; onBack: () => void }) {
  const [row, setRow] = useState<CaseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}`, { cache: "no-store" });
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setReply("");
      await load();
    } catch {
      toast.error("Could not send reply");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to my cases
      </button>

      {loading || !row ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : (
        <>
          <header className="space-y-2 rounded-xl border border-stroke-subtle bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-base font-semibold text-foreground">{row.subject}</h1>
              <Pill className={STATUS_PILL[row.status]?.cls}>{STATUS_PILL[row.status]?.label ?? row.status}</Pill>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className={`grid h-5 w-5 place-items-center rounded ${TONE_BG[LANE_BY_KEY[row.lane]?.tone ?? "info"]}`}>
                <LaneIcon laneKey={row.lane} className="h-3 w-3" />
              </span>
              {laneLabel(row.lane)} · opened {fmt(row.createdAt)}
            </p>
            {row.resolution && (
              <p className="rounded-md bg-success-subtle p-2 text-xs text-success-text"><strong>Resolution:</strong> {row.resolution}</p>
            )}
          </header>

          <div className="space-y-3">
            {(row.messages ?? []).map((m) => (
              <div key={m.id} className={`flex ${m.author === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.author === "user" ? "bg-brand text-white" : "bg-surface-sunken text-foreground"}`}>
                  <p className="mb-0.5 text-[10px] uppercase tracking-wide opacity-70">
                    {m.author === "user" ? "You" : "Glimmora"} · {fmt(m.createdAt)}
                  </p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              </div>
            ))}
          </div>

          {row.status !== "closed" && (
            <div className="flex items-end gap-2 rounded-xl border border-stroke-subtle bg-surface p-3">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder={row.status === "resolved" ? "Reply to reopen this case…" : "Write a reply…"}
                className="flex-1"
              />
              <Button onClick={send} disabled={busy || !reply.trim()} className="gap-1.5">
                <Send className="h-4 w-4" /> Send
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
