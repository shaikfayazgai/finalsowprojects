"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { AlertCircle, Send } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { ContributorApiError } from "@/lib/api/contributor-mock";
import { useSupportTicket } from "@/lib/hooks/use-contributor-support";
import { cn } from "@/lib/utils/cn";
import {
  fmtDateTime,
  fmtRelative,
  ticketCategoryLabel,
  ticketStatusChip,
  ticketStatusLabel,
} from "../../../lib/support-ui-utils";
import { SupportDetailSkeleton } from "../../../components/support-detail-skeleton";
import { RailItem, TicketMessageThread } from "../../../components/support-detail-parts";

interface TicketDetailViewProps {
  ticketId: string;
}

export function TicketDetailView({ ticketId }: TicketDetailViewProps) {
  const { data, isPending, isError, error } = useSupportTicket(ticketId || undefined);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [localMessages, setLocalMessages] = React.useState(data?.ticket.messages ?? []);
  const [localStatus, setLocalStatus] = React.useState(data?.ticket.status ?? "open");
  const [localUpdatedAt, setLocalUpdatedAt] = React.useState(data?.ticket.updatedAt ?? "");

  React.useEffect(() => {
    if (!data?.ticket) return;
    setLocalMessages(data.ticket.messages);
    setLocalStatus(data.ticket.status);
    setLocalUpdatedAt(data.ticket.updatedAt);
  }, [data?.ticket]);

  if (!ticketId || isPending) {
    return <SupportDetailSkeleton />;
  }

  if (isError) {
    if (error instanceof ContributorApiError && error.status === 404) notFound();
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  const ticket = data?.ticket;
  if (!ticket) notFound();

  const onSend = async () => {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/contributor/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error(`Send failed (${res.status})`);
      const at = new Date().toISOString();
      setLocalMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, from: "you", body, at },
      ]);
      setLocalUpdatedAt(at);
      if (localStatus === "resolved") setLocalStatus("open");
      setReply("");
    } catch {
      /* keep the draft so the user can retry */
    } finally {
      setSending(false);
    }
  };

  const canReply = localStatus !== "resolved";

  return (
    <div className="pb-12 animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-5 min-w-0">
          <header className="border-b border-stroke-subtle pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
                  {ticket.subject}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-body text-[12.5px] text-text-secondary">
                  <StatusChip status={ticketStatusChip(localStatus)} size="sm">
                    {ticketStatusLabel(localStatus)}
                  </StatusChip>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>{ticketCategoryLabel(ticket.category)}</span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span className="font-mono text-[11.5px] tabular-nums">{ticket.id}</span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>Updated {fmtRelative(localUpdatedAt)}</span>
                </p>
              </div>
            </div>
          </header>

          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stroke-subtle bg-bg-subtle/40">
              <h2 className="font-body text-[13px] font-semibold text-foreground">Conversation</h2>
              <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
                Messages between you and Glimmora support
              </p>
            </div>
            <TicketMessageThread messages={localMessages} />
            {canReply ? (
              <div className="p-4 border-t border-stroke-subtle bg-surface">
                <label htmlFor="ticket-reply" className="sr-only">
                  Reply to support
                </label>
                <div className="flex items-end gap-2">
                  <textarea
                    id="ticket-reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to support…"
                    rows={3}
                    className={cn(
                      "flex-1 min-h-[72px] py-2 px-3 rounded-md bg-surface border border-stroke",
                      "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                      "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 resize-y",
                    )}
                  />
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={!reply.trim() || sending}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs shrink-0",
                      "bg-brand text-on-brand font-body text-[13px] font-semibold",
                      "hover:bg-brand-hover transition-colors duration-fast",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                    )}
                  >
                    <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="px-5 py-4 border-t border-stroke-subtle font-body text-[11.5px] text-text-tertiary italic">
                This ticket is resolved. Send a new message to reopen it, or open a fresh ticket.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain">
          <DashboardSection title="Ticket details" description="Reference and timeline">
            <dl className="space-y-3">
              <RailItem label="Ticket ID">
                <span className="font-mono text-[11.5px] tabular-nums">{ticket.id}</span>
              </RailItem>
              <RailItem label="Category">{ticketCategoryLabel(ticket.category)}</RailItem>
              <RailItem label="Opened">{fmtDateTime(ticket.createdAt)}</RailItem>
              <RailItem label="Last update">{fmtDateTime(localUpdatedAt)}</RailItem>
              <RailItem label="Messages">{String(localMessages.length)}</RailItem>
            </dl>
          </DashboardSection>

          <DashboardSection title="Response time" description="Typical support SLA">
            <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
              Support replies within 24 hours on business days. Payout and account issues may require
              an extra day while we coordinate with payment rails.
            </p>
          </DashboardSection>
        </aside>
      </div>
    </div>
  );
}
