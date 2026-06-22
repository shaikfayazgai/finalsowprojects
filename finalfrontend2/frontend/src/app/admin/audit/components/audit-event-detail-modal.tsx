"use client";

/**
 * Audit event detail — modal overlay on the log (keeps filter context).
 * Looks up event by ID from the AuditEventsContext (fetched from real backend).
 */

import * as React from "react";
import { ScrollText } from "lucide-react";
import { useAuditEventsContext } from "@/app/admin/audit/components/audit-events-context";
import type { AdminAuditSeverity } from "@/mocks/admin/audit";
import { cn } from "@/lib/utils/cn";
import { AdminModal, secondaryBtnClass } from "../../_shell/aurora-ui";

type Tone = "neutral" | "warning" | "error";

function severityTone(s: AdminAuditSeverity): Tone {
  switch (s) {
    case "info":
      return "neutral";
    case "warning":
      return "warning";
    case "critical":
      return "error";
  }
}

const TONE_TEXT: Record<Tone, string> = {
  neutral: "var(--color-text-secondary)",
  warning: "var(--color-warning-text)",
  error: "var(--color-error-text)",
};

const TONE_SOFT: Record<Tone, string> = {
  neutral: "var(--color-bg-subtle)",
  warning: "var(--color-warning-subtle)",
  error: "var(--color-error-subtle)",
};

function fmtTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailRow({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={cn("mt-1 font-body text-[13.5px] text-foreground break-words", mono && "font-mono text-[12.5px]")}>
        {value}
      </dd>
    </div>
  );
}

interface AuditEventDetailModalProps {
  eventId: string | null;
  open: boolean;
  onClose: () => void;
}

export function AuditEventDetailModal({ eventId, open, onClose }: AuditEventDetailModalProps) {
  const { findById } = useAuditEventsContext();
  const e = eventId ? findById(eventId) : undefined;
  const tenantLabel = e?.tenant || "Glimmora internal";

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      size="lg"
      icon={ScrollText}
      tone={e ? severityTone(e.severity) : "neutral"}
      title={e ? e.action : "Event not found"}
      description={
        e ? (
          <>
            <span className="font-mono text-[11px]">{e.id}</span>
            <span aria-hidden className="mx-1.5 opacity-40">·</span>
            <span suppressHydrationWarning>{fmtTimestamp(e.timestamp)}</span>
          </>
        ) : (
          "This audit event may have been purged or the ID is invalid."
        )
      }
      footer={
        <button type="button" onClick={onClose} className={secondaryBtnClass}>
          Close
        </button>
      }
    >
      {!e ? (
        <p className="font-body text-[13px] text-text-secondary">No event matches this ID.</p>
      ) : (
        <div className="space-y-5">
          {e.severity !== "info" ? (
            <span
              className="inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium capitalize"
              style={{ color: TONE_TEXT[severityTone(e.severity)], background: TONE_SOFT[severityTone(e.severity)] }}
            >
              {e.severity}
            </span>
          ) : null}

          <section>
            <h3 className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-3">Actor & tenant</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <DetailRow label="Tenant" value={tenantLabel} />
              <DetailRow label="Actor" value={e.actor} />
              <DetailRow label="Role" value={e.actorRole} />
              <DetailRow label="IP address" value={e.ip ?? "—"} mono />
            </dl>
          </section>

          <section>
            <h3 className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-3">Resource</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <DetailRow label="Action" value={e.action} mono />
              <DetailRow label="Type" value={e.resourceType} />
              <DetailRow label="ID" value={e.resourceId} mono />
              <DetailRow label="Label" value={e.resourceLabel} />
            </dl>
          </section>

          {e.details && Object.keys(e.details).length > 0 ? (
            <section>
              <h3 className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-3">Extended payload</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {Object.entries(e.details).map(([k, v]) => (
                  <DetailRow key={k} label={k} value={v} mono />
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      )}
    </AdminModal>
  );
}
