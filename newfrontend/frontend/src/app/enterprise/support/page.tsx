"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { LifeBuoy, Send, Inbox, UserCog } from "lucide-react";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  Button,
  Input,
  Textarea,
  Label,
} from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import { COMPLAINT_REASONS, COMPLAINT_PRIORITIES, reasonLabel, priorityLabel, todayISO } from "@/lib/config/complaints";

interface Complaint {
  id: string;
  category: string;
  priority?: string;
  issueStartedOn?: string | null;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  adminNote?: string | null;
  createdAt?: string | null;
  resolvedAt?: string | null;
}

const STATUS_PILL: Record<Complaint["status"], { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-warning-subtle text-warning-text border-warning-border" },
  in_progress: { label: "In progress", cls: "bg-info-subtle text-info-text border-info-border" },
  resolved: { label: "Resolved", cls: "bg-success-subtle text-success-text border-success-border" },
};

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

const SELECT_CLS =
  "flex h-10 w-full rounded-md border border-stroke-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus";

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
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
  if (!iso) return "";
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

export default function EnterpriseSupportPage() {
  const today = todayISO();
  const { roles, meLoading } = useEnterpriseAccess();
  const isAdmin = roles.includes("admin");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [startedOn, setStartedOn] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/enterprise/complaints", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      // leave list as-is on transient failures
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subject.trim();
    const msg = message.trim();
    if (!subj || !msg) {
      toast.error("Missing details", "Add a subject and describe the issue.");
      return;
    }
    if (startedOn && startedOn > today) {
      toast.error("Invalid date", "The start date can't be in the future.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/enterprise/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          priority,
          issueStartedOn: startedOn || null,
          subject: subj,
          message: msg,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.message || "Could not send");
      }
      toast.success("Sent to the platform admin", "We'll get back to you here once it's reviewed.");
      setSubject("");
      setMessage("");
      setCategory("general");
      setPriority("medium");
      setStartedOn("");
      await load();
    } catch (err) {
      toast.error("Could not send", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-subtle text-warning-text">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Support &amp; complaints</h1>
          <p className="text-sm text-text-secondary">
            Contact the Glimmora platform admin. Submit an issue and track its resolution here.
          </p>
        </div>
      </header>

      {meLoading ? (
        <p className="py-12 text-center text-sm text-text-secondary">Loading…</p>
      ) : !isAdmin ? (
        <GlassCard>
          <GlassCardContent>
            <div className="flex items-start gap-3 py-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info-subtle text-info-text">
                <UserCog className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Contact your admin</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Only your workspace admin can contact Glimmora support. Please reach out to your
                  admin to raise an issue on your behalf.
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      ) : (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Submit form ── */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>New request</GlassCardTitle>
            <GlassCardDescription>Goes directly to the platform admin.</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Reason</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={SELECT_CLS}
                >
                  {COMPLAINT_REASONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={SELECT_CLS}
                  >
                    {COMPLAINT_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="startedOn">When did it start?</Label>
                  <Input
                    id="startedOn"
                    type="date"
                    value={startedOn}
                    max={today}
                    onChange={(e) => setStartedOn(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of the issue"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Details</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what happened, what you expected, and any relevant context."
                  rows={6}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {submitting ? "Sending…" : "Send to platform admin"}
              </Button>
            </form>
          </GlassCardContent>
        </GlassCard>

        {/* ── My requests ── */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Your requests</GlassCardTitle>
            <GlassCardDescription>Status updates from the platform admin appear here.</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {loading ? (
              <p className="py-8 text-center text-sm text-text-secondary">Loading…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-text-secondary">
                <Inbox className="h-8 w-8 opacity-50" />
                <p className="text-sm">No requests yet. Submit one and it&apos;ll show up here.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((c) => {
                  const meta = STATUS_PILL[c.status] ?? STATUS_PILL.open;
                  return (
                    <li key={c.id} className="rounded-lg border border-stroke-subtle bg-surface-sunken p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{c.subject}</p>
                          <p className="mt-0.5 text-xs text-text-secondary">
                            {reasonLabel(c.category)}
                            {c.priority ? ` · ${priorityLabel(c.priority)} priority` : ""}
                            {c.createdAt ? ` · ${fmtDate(c.createdAt)}` : ""}
                          </p>
                          {c.issueStartedOn ? (
                            <p className="mt-0.5 text-xs text-text-secondary">
                              Started {fmtDay(c.issueStartedOn)}
                            </p>
                          ) : null}
                        </div>
                        <Pill className={meta.cls}>{meta.label}</Pill>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-text-secondary">{c.message}</p>
                      {c.adminNote ? (
                        <div className="mt-2 rounded-md border border-success-border bg-success-subtle p-2 text-xs">
                          <span className="font-semibold text-success-text">Platform admin: </span>
                          <span className="text-text-secondary">{c.adminNote}</span>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
      )}
    </div>
  );
}
