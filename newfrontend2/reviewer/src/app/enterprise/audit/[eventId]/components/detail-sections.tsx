"use client";

/**
 * Audit event detail sections — pure presentational helpers.
 *
 * De-glass fixes applied:
 *   H8 Minimalist — border-white/60 → border-stroke-subtle; divide-white/60 →
 *     divide-stroke-subtle; backdrop-blur removed; rounded-2xl → rounded-lg;
 *     bg-white/50 hover → hover:bg-bg-subtle/60; bg-white/55 → bg-bg-subtle.
 */

import Link from "next/link";
import type { AuditViewEvent } from "@/lib/api/audit-view";
import { cn } from "@/lib/utils/cn";
import { Chip, type Tone } from "@/app/admin/_shell/aurora-ui";

export function fmtFull(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function severityPillCls(s: AuditViewEvent["severity"]): string {
  switch (s) {
    case "warning":
      return "bg-warning-subtle text-warning-text";
    case "critical":
      return "bg-error-subtle text-error-text";
    case "info":
    default:
      return "bg-brand-subtle text-brand-subtle-text";
  }
}

export function severityTone(s: AuditViewEvent["severity"]): Tone {
  switch (s) {
    case "warning":
      return "warning";
    case "critical":
      return "error";
    case "info":
    default:
      return "info";
  }
}

export function sortNewestFirst(items: AuditViewEvent[]): AuditViewEvent[] {
  return [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function getAdjacentEvents(
  events: AuditViewEvent[],
  eventId: string,
): { newer: AuditViewEvent | null; older: AuditViewEvent | null } {
  const sorted = sortNewestFirst(events);
  const idx = sorted.findIndex((e) => e.id === eventId);
  if (idx === -1) return { newer: null, older: null };
  return {
    newer: idx > 0 ? sorted[idx - 1]! : null,
    older: idx < sorted.length - 1 ? sorted[idx + 1]! : null,
  };
}

export function getRelatedEvents(
  events: AuditViewEvent[],
  event: AuditViewEvent,
  limit = 6,
): AuditViewEvent[] {
  return sortNewestFirst(events)
    .filter(
      (e) =>
        e.id !== event.id &&
        e.resource.type === event.resource.type &&
        e.resource.id === event.resource.id,
    )
    .slice(0, limit);
}

export function resourceRecordHref(type: string, id: string): string | null {
  switch (type) {
    case "payout":
      return `/enterprise/billing/payouts/${id}`;
    case "sow":
      return `/enterprise/sow/${id}`;
    case "invoice":
      return `/enterprise/billing/invoices/${id}`;
    case "rate_card":
      return `/enterprise/billing/rate-cards/${id}`;
    default:
      return null;
  }
}

export function investigationSummary(event: AuditViewEvent): string {
  const who = event.actor.userId;
  const what = event.action;
  const resource = event.resource.label
    ? `${event.resource.type}:${event.resource.id} (${event.resource.label})`
    : `${event.resource.type}:${event.resource.id}`;
  return `${who} performed ${what} on ${resource}.`;
}

export function IntegrityPanel({ event }: { event: AuditViewEvent }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 flex flex-wrap items-center justify-between gap-3",
        event.signatureValid
          ? "border-success-border/50 bg-success-subtle/30"
          : "border-error-border bg-error-subtle/40",
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "font-body text-[13px] font-semibold",
            event.signatureValid ? "text-success-text" : "text-error-text",
          )}
        >
          {event.signatureValid ? "Signature verified" : "Signature verification failed"}
        </p>
        <p className="mt-0.5 font-body text-[12px] text-text-secondary">
          Signing key v{event.signingKeyVersion}
          {event.signature ? " · HMAC present" : " · No signature stored"}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full shrink-0",
          event.signatureValid ? "bg-success-subtle text-success-text" : "bg-error-subtle text-error-text",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            event.signatureValid ? "bg-success-text" : "bg-error-text",
          )}
        />
      </span>
    </div>
  );
}

export function ActorResourceSection({ event }: { event: AuditViewEvent }) {
  const recordHref = resourceRecordHref(event.resource.type, event.resource.id);

  return (
    <ul className="divide-y divide-stroke-subtle -mx-5 sm:-mx-6">
      <FactRow
        label="Actor"
        primary={event.actor.userId}
        secondary={`${event.actor.portalRole}${event.actor.sessionId ? ` · session ${event.actor.sessionId.slice(0, 8)}…` : ""}`}
        mono
      />
      <FactRow
        label="Resource"
        primary={`${event.resource.type}:${event.resource.id}`}
        secondary={event.resource.label ?? undefined}
        mono
        href={recordHref ?? undefined}
      />
      <FactRow
        label="Network"
        primary={event.actor.ipAddress ?? "—"}
        secondary={event.actor.userAgent ? truncateUa(event.actor.userAgent) : undefined}
        mono
      />
      <FactRow label="Timestamp" primary={fmtFull(event.timestamp)} secondary={fmtRelative(event.timestamp)} mono />
    </ul>
  );
}

export function TechnicalSection({ event }: { event: AuditViewEvent }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      <Fact label="Event ID" value={event.id} mono />
      <Fact label="Tenant" value={event.tenantId ?? "Platform scope"} mono />
      <Fact label="Severity" value={event.severity} capitalize />
      {event.actor.userAgent && (
        <div className="sm:col-span-2">
          <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Full user agent
          </dt>
          <dd className="mt-1 font-body text-[12px] text-foreground leading-snug break-all">
            {event.actor.userAgent}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function PayloadSection({
  event,
  className,
}: {
  event: AuditViewEvent;
  className?: string;
}) {
  const text = JSON.stringify(event.payload ?? null, null, 2);
  const empty = event.payload === null || event.payload === undefined;

  if (empty) {
    return (
      <p className="font-body text-[13px] text-text-tertiary italic">
        No payload attached to this event.
      </p>
    );
  }

  return (
    <pre
      className={cn(
        "font-mono text-[11.5px] text-foreground whitespace-pre-wrap overflow-x-auto",
        "max-h-[420px] overflow-y-auto px-4 py-3 rounded-lg bg-bg-subtle border border-stroke-subtle",
        className,
      )}
    >
      {text}
    </pre>
  );
}

export function DiffSection({ event }: { event: AuditViewEvent }) {
  const hasBefore = event.before !== null && event.before !== undefined;
  const hasAfter = event.after !== null && event.after !== undefined;
  if (!hasBefore && !hasAfter) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <DiffPane label="Before" value={event.before} tone="neutral" />
      <DiffPane label="After" value={event.after} tone="brand" />
    </div>
  );
}

export function RelatedEventsSection({
  events,
  currentId,
}: {
  events: AuditViewEvent[];
  currentId: string;
}) {
  if (events.length === 0) {
    return (
      <p className="font-body text-[13px] text-text-tertiary italic">
        No other events on this resource in the loaded window.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stroke-subtle -mx-5 sm:-mx-6">
      {events.map((ev) => (
        <li key={ev.id}>
          <Link
            href={`/enterprise/audit/${ev.id}`}
            aria-current={ev.id === currentId ? "page" : undefined}
            className={cn(
              "flex items-center justify-between gap-4 px-5 sm:px-6 py-2.5 min-h-[44px]",
              "hover:bg-bg-subtle/60 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
              ev.id === currentId && "bg-bg-subtle",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="font-mono text-[12.5px] font-medium text-foreground truncate block">
                {ev.action}
              </span>
              <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
                {ev.actor.userId} · {fmtRelative(ev.timestamp)}
              </span>
            </span>
            <Chip tone={severityTone(ev.severity)} className="shrink-0 capitalize">
              {ev.severity}
            </Chip>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FactRow({
  label,
  primary,
  secondary,
  mono,
  href,
}: {
  label: string;
  primary: string;
  secondary?: string;
  mono?: boolean;
  href?: string;
}) {
  return (
    <li className="px-5 sm:px-6 py-2.5 min-h-[44px] flex items-center justify-between gap-4">
      <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary w-20 shrink-0">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-right">
        {href ? (
          <Link
            href={href}
            className={cn(
              "font-body text-[13px] font-medium text-text-secondary hover:text-foreground hover:underline underline-offset-2",
              mono && "font-mono text-[12.5px]",
            )}
          >
            {primary}
          </Link>
        ) : (
          <span
            className={cn(
              "font-body text-[13px] font-medium text-foreground block truncate",
              mono && "font-mono text-[12.5px] tabular-nums",
            )}
          >
            {primary}
          </span>
        )}
        {secondary && (
          <span className="font-body text-[11px] text-text-tertiary block truncate mt-0.5">
            {secondary}
          </span>
        )}
      </span>
    </li>
  );
}

function DiffPane({
  label,
  value,
  tone,
}: {
  label: string;
  value: unknown;
  tone: "neutral" | "brand";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 min-h-[140px] max-h-[420px] overflow-y-auto",
        tone === "brand"
          ? "border-[var(--c-violet-400)]/40 bg-[var(--c-violet-500)]/[0.05]"
          : "border-stroke-subtle bg-bg-subtle",
      )}
    >
      <p className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
        {label}
      </p>
      <pre className="font-mono text-[11px] text-foreground whitespace-pre-wrap overflow-x-auto">
        {value === null || value === undefined ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function Fact({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12.5px] tabular-nums break-all",
          capitalize && "capitalize",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function truncateUa(ua: string): string {
  return ua.length > 72 ? `${ua.slice(0, 72)}…` : ua;
}
