"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Building2, Mail, RefreshCw } from "lucide-react";
import {
  Button,
  Textarea,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import { reasonLabel, priorityLabel } from "@/lib/config/complaints";

type Status = "open" | "in_progress" | "resolved";

interface Complaint {
  id: string;
  tenantId?: string | null;
  tenantName?: string | null;
  submittedByEmail?: string | null;
  submittedByName?: string | null;
  category: string;
  priority?: string;
  issueStartedOn?: string | null;
  subject: string;
  message: string;
  status: Status;
  adminNote?: string | null;
  createdAt?: string | null;
  resolvedAt?: string | null;
}

interface Counts {
  open: number;
  in_progress: number;
  resolved: number;
}

const STATUS_PILL: Record<Status, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-warning-subtle text-warning-text border-warning-border" },
  in_progress: { label: "In progress", cls: "bg-info-subtle text-info-text border-info-border" },
  resolved: { label: "Resolved", cls: "bg-success-subtle text-success-text border-success-border" },
};

const PRIORITY_PILL: Record<string, string> = {
  low: "bg-surface-sunken text-text-secondary border-stroke-subtle",
  medium: "bg-info-subtle text-info-text border-info-border",
  high: "bg-warning-subtle text-warning-text border-warning-border",
  urgent: "bg-error-subtle text-error-text border-error-border",
};

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

const FILTERS: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtDay(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AdminComplaintsPage() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [counts, setCounts] = useState<Counts>({ open: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [active, setActive] = useState<Complaint | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/complaints", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
      if (data?.counts) setCounts(data.counts);
    } catch {
      toast.error("Could not load complaints", "Check the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((c) => c.status === filter)),
    [items, filter],
  );

  const openDetail = (c: Complaint) => {
    setActive(c);
    setNote(c.adminNote ?? "");
  };

  const patch = async (status: Status) => {
    if (!active) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/complaints/${encodeURIComponent(active.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.message || "Update failed");
      }
      const updated: Complaint = await res.json();
      setItems((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setActive(updated);
      toast.success(
        status === "resolved" ? "Marked resolved" : status === "in_progress" ? "Marked in progress" : "Reopened",
      );
      void load();
    } catch (err) {
      toast.error("Could not update", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-subtle text-info-text">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Complaints</h1>
            <p className="text-sm text-text-secondary">
              Tenant issues sent to the platform admin. Review and resolve.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary">
            {counts.open} open · {counts.in_progress} in progress · {counts.resolved} resolved
          </span>
          <Button variant="outline" size="sm" onClick={() => load()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? items.length
              : counts[f.value as Status] ?? items.filter((c) => c.status === f.value).length;
          const activeTab = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                activeTab
                  ? "border-primary bg-primary-subtle text-primary-subtle-text"
                  : "border-stroke-subtle text-text-secondary hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {f.label} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-stroke-subtle bg-surface shadow-sm">
        <div>
          {loading ? (
            <p className="py-12 text-center text-sm text-text-secondary">Loading…</p>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center text-text-secondary">
              <MessageSquare className="h-8 w-8 opacity-50" />
              <p className="text-sm">No complaints{filter !== "all" ? ` (${filter})` : ""} right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stroke-subtle">
              {visible.map((c) => {
                const meta = STATUS_PILL[c.status] ?? STATUS_PILL.open;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => openDetail(c)}
                      className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-surface-hover"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">{c.subject}</span>
                          <Pill className={meta.cls}>{meta.label}</Pill>
                          {c.priority ? (
                            <Pill className={PRIORITY_PILL[c.priority] ?? PRIORITY_PILL.medium}>
                              {priorityLabel(c.priority)}
                            </Pill>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-text-secondary">{c.message}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {c.tenantName || c.tenantId || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {c.submittedByEmail || "—"}
                          </span>
                          <span>{reasonLabel(c.category)}</span>
                          {c.issueStartedOn ? <span>Started {fmtDay(c.issueStartedOn)}</span> : null}
                          <span>{fmtDate(c.createdAt)}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Detail / resolve dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base text-foreground">{active.subject}</DialogTitle>
                  <Pill className={STATUS_PILL[active.status].cls}>{STATUS_PILL[active.status].label}</Pill>
                  {active.priority ? (
                    <Pill className={PRIORITY_PILL[active.priority] ?? PRIORITY_PILL.medium}>
                      {priorityLabel(active.priority)}
                    </Pill>
                  ) : null}
                </div>
                <DialogDescription className="text-text-secondary">
                  {(active.tenantName || active.tenantId || "—") + " · " + reasonLabel(active.category)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-stroke-subtle bg-surface-sunken p-3">
                  <p className="whitespace-pre-wrap text-foreground">{active.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                  <div>
                    <span className="font-semibold text-foreground">From: </span>
                    {active.submittedByName || active.submittedByEmail || "—"}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Email: </span>
                    {active.submittedByEmail || "—"}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Priority: </span>
                    {priorityLabel(active.priority)}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Issue started: </span>
                    {active.issueStartedOn ? fmtDay(active.issueStartedOn) : "—"}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Submitted: </span>
                    {fmtDate(active.createdAt)}
                  </div>
                  {active.resolvedAt ? (
                    <div>
                      <span className="font-semibold text-foreground">Resolved: </span>
                      {fmtDate(active.resolvedAt)}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-note" className="text-foreground">
                    Reply / resolution note (visible to the tenant)
                  </Label>
                  <Textarea
                    id="admin-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Explain what was done or what's needed next…"
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                {active.status !== "resolved" ? (
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => patch("in_progress")}
                    className="w-full sm:w-auto"
                  >
                    Mark in progress
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => patch("open")}
                    className="w-full sm:w-auto"
                  >
                    Reopen
                  </Button>
                )}
                {active.status !== "resolved" ? (
                  <Button disabled={saving} onClick={() => patch("resolved")} className="w-full sm:w-auto">
                    {saving ? "Saving…" : "Resolve"}
                  </Button>
                ) : (
                  <Button disabled={saving} onClick={() => patch("resolved")} className="w-full sm:w-auto">
                    {saving ? "Saving…" : "Save note"}
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
