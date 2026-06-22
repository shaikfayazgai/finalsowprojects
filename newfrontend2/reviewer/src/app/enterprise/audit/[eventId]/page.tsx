"use client";

/**
 * Audit event detail — scorecard cockpit.
 * Use-case: investigator lands on a specific event to understand who did what,
 * verify tamper-evidence, and inspect the payload / before-after diff.
 *
 * Pattern: BackLink → timeline nav → identity header card (DASH_CARD with
 * GLASS_GRADIENT icon chip + eyebrow + bold action title + Chip + meta) →
 * 4-StatCard scorecard (severity · timestamp · signing key · related events) →
 * tabbed evidence card (gradient-pill tabs: Summary · Evidence · Related · IDs).
 *
 * Heuristic fixes applied:
 *   H8 Minimalist — collapsed 5 separate SectionCards into one tabbed DASH_CARD;
 *     banner border-radius rounded-2xl → rounded-lg; backdrop-blur removed from
 *     banners; GLASS_CARD/GLASS_SHADOW → DASH_CARD.
 *   H6 Recognition — AURORA_ACCENT underline tabs → gradient-pill tabs;
 *     ghostBtnClass → secondaryBtnClass.
 *   H1 Visibility — identity header now prominent like invoice detail cockpit;
 *     scorecard surfaces 4 key facts at a glance.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Hash,
  Key,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { useAuditEvents } from "@/lib/hooks/use-audit-view";
import { AuditViewApiError, type AuditViewEvent } from "@/lib/api/audit-view";
import { AuditDetailSkeleton } from "@/components/enterprise/page-skeletons";
import {
  ActorResourceSection,
  DiffSection,
  fmtFull,
  getAdjacentEvents,
  getRelatedEvents,
  IntegrityPanel,
  investigationSummary,
  PayloadSection,
  RelatedEventsSection,
  severityTone,
  TechnicalSection,
} from "./components/detail-sections";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  Chip,
  StatCard,
  TONE,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";

type DetailTab = "summary" | "evidence" | "related" | "technical";

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: "summary", label: "Summary" },
  { key: "evidence", label: "Evidence" },
  { key: "related", label: "Related" },
  { key: "technical", label: "Identifiers" },
];

export default function AuditEventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId ?? "";

  const now = React.useMemo(() => new Date(), []);
  const ninetyAgo = React.useMemo(
    () => new Date(now.getTime() - 90 * 86_400_000),
    [now],
  );

  const { data, isLoading, error } = useAuditEvents({
    from: ninetyAgo.toISOString(),
    to: now.toISOString(),
    limit: 1000,
  });

  const event: AuditViewEvent | undefined = data?.events.find((e) => e.id === eventId);

  const hasDiff =
    event &&
    ((event.before !== null && event.before !== undefined) ||
      (event.after !== null && event.after !== undefined));

  const [tab, setTab] = React.useState<DetailTab>("summary");
  const [evidenceSubTab, setEvidenceSubTab] = React.useState<"payload" | "diff">(
    hasDiff ? "diff" : "payload",
  );
  const [copied, setCopied] = React.useState<"json" | "payload" | null>(null);

  React.useEffect(() => {
    if (hasDiff) setEvidenceSubTab("diff");
    else setEvidenceSubTab("payload");
  }, [eventId, hasDiff]);

  const copyText = async (text: string, kind: "json" | "payload") => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return <AuditDetailSkeleton />;
  }

  if (error || !event) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink event={null} />
        <div
          className="rounded-lg border px-4 py-3 flex items-start gap-2.5"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} aria-hidden style={{ color: TONE.error.text }} />
          <div className="flex-1">
            <p className="font-body text-[12.5px]" style={{ color: TONE.error.text }}>
              {error instanceof AuditViewApiError ? error.message : "Event not found"}
            </p>
            {eventId ? (
              <p className="mt-1 font-mono text-[11px]" style={{ color: TONE.error.text, opacity: 0.8 }}>{eventId}</p>
            ) : null}
            <p className="mt-2 font-body text-[12px] text-text-secondary">
              Older than 90 days? Use{" "}
              <Link href="/enterprise/audit/export" className="font-medium hover:text-foreground hover:underline text-text-secondary">
                Export audit
              </Link>{" "}
              to retrieve archived events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const allEvents = data?.events ?? [];
  const { newer, older } = getAdjacentEvents(allEvents, event.id);
  const related = getRelatedEvents(allEvents, event);
  const relatedHref = `/enterprise/audit?resourceType=${encodeURIComponent(event.resource.type)}&resourceId=${encodeURIComponent(event.resource.id)}`;

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      <BackLink event={event} />

      {/* Timeline navigation */}
      {(newer || older) && (
        <nav
          aria-label="Timeline navigation"
          className={cn(DASH_CARD, "flex items-center justify-between gap-3 px-2 py-1.5")}
        >
          {older ? (
            <TimelineNavLink direction="older" target={older} />
          ) : (
            <span className="w-[120px]" aria-hidden />
          )}
          <span className="font-body text-[11px] text-text-tertiary hidden sm:block">
            Navigate timeline
          </span>
          {newer ? (
            <TimelineNavLink direction="newer" target={newer} />
          ) : (
            <span className="w-[120px]" aria-hidden />
          )}
        </nav>
      )}

      {/* Identity header card */}
      <header className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
        <div className="flex items-start gap-4 min-w-0">
          <span
            className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0"
            style={GLASS_GRADIENT}
            aria-hidden
          >
            <ScrollText className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
              Governance · Audit · {event.id.slice(0, 16)}…
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-[20px] sm:text-[22px] font-bold text-foreground tracking-[-0.015em] leading-none break-all">
                {event.action}
              </h1>
              <Chip tone={severityTone(event.severity)} className="capitalize shrink-0">
                {event.severity}
              </Chip>
            </div>
            <p className="mt-2 font-mono text-[12px] text-text-tertiary tabular-nums">
              {fmtFull(event.timestamp)}
            </p>
            <RecordLinks event={event} relatedHref={relatedHref} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void copyText(JSON.stringify(event.payload ?? null, null, 2), "payload")}
            disabled={event.payload === null || event.payload === undefined}
            className={cn(secondaryBtnClass, "h-9 px-3 text-[12px] disabled:opacity-40 disabled:cursor-not-allowed")}
          >
            {copied === "payload" ? (
              <Check className="h-3.5 w-3.5 text-success-text" strokeWidth={2} aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            )}
            Copy payload
          </button>
          <button
            type="button"
            onClick={() => void copyText(JSON.stringify(event, null, 2), "json")}
            className={cn(secondaryBtnClass, "h-9 px-3 text-[12px]")}
          >
            {copied === "json" ? (
              <Check className="h-3.5 w-3.5 text-success-text" strokeWidth={2} aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            )}
            Copy event
          </button>
        </div>
      </header>

      {/* Alerts */}
      {!event.signatureValid && (
        <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE.error.soft, borderColor: TONE.error.border }}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} aria-hidden style={{ color: TONE.error.text }} />
          <p className="font-body text-[12.5px] text-text-secondary">
            <span className="font-semibold" style={{ color: TONE.error.text }}>Do not trust this record</span> — Tamper-evidence verification failed. Treat as compromised until your security team completes investigation.
          </p>
        </div>
      )}

      {event.severity === "critical" && event.signatureValid && (
        <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning-text" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-text-secondary">
            <span className="font-semibold text-foreground">Critical severity</span> — This action has compliance impact — review evidence below and check related events on the same resource.
          </p>
        </div>
      )}

      {/* Scorecard */}
      <section aria-label="Event facts" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Severity"
          value={event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
          icon={ShieldCheck}
          hintTone={severityTone(event.severity)}
          hint={event.signatureValid ? "signature OK" : "signature FAIL"}
        />
        <StatCard
          label="Timestamp"
          value={new Date(event.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          icon={Clock}
          hint={new Date(event.timestamp).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
        />
        <StatCard
          label="Signing key"
          value={`v${event.signingKeyVersion}`}
          icon={Key}
          hint={event.signature ? "HMAC present" : "no signature"}
          hintTone={event.signature ? "neutral" : "warning"}
        />
        <StatCard
          label="Related events"
          value={related.length}
          icon={Hash}
          hint={related.length > 0 ? "on this resource" : "none in window"}
        />
      </section>

      {/* Tabbed content card */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="border-b border-stroke-subtle px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <nav aria-label="Event sections" className="flex flex-wrap gap-1.5">
            {DETAIL_TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-current={active ? "page" : undefined}
                  style={active ? GLASS_GRADIENT : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                    active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                  )}
                >
                  {t.label}
                  {t.key === "related" && related.length > 0 ? (
                    <span className={cn("inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums", active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary")}>
                      {related.length}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {tab === "evidence" && (
            <Link
              href="/enterprise/audit/export"
              className={cn(secondaryBtnClass, "h-8 px-3 text-[12px]")}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Export
            </Link>
          )}
        </div>

        <div className="px-5 sm:px-6 py-5">
          {tab === "summary" && (
            <div className="space-y-4">
              <p className="font-body text-[14px] text-foreground leading-relaxed">
                {investigationSummary(event)}
              </p>
              <IntegrityPanel event={event} />
              <ActorResourceSection event={event} />
            </div>
          )}

          {tab === "evidence" && (
            <div className="space-y-3">
              {hasDiff && (
                <div className="flex gap-1.5 flex-wrap">
                  {(
                    [
                      { key: "diff" as const, label: "State change" },
                      { key: "payload" as const, label: "Payload" },
                    ] as const
                  ).map((sub) => {
                    const active = evidenceSubTab === sub.key;
                    return (
                      <button
                        key={sub.key}
                        type="button"
                        onClick={() => setEvidenceSubTab(sub.key)}
                        aria-current={active ? "page" : undefined}
                        style={active ? GLASS_GRADIENT : undefined}
                        className={cn(
                          "inline-flex items-center h-7 px-3 rounded-lg font-body text-[12px] font-semibold whitespace-nowrap transition-colors",
                          active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                        )}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {evidenceSubTab === "diff" && hasDiff ? (
                <DiffSection event={event} />
              ) : (
                <PayloadSection event={event} />
              )}
            </div>
          )}

          {tab === "related" && (
            <RelatedEventsSection events={related} currentId={event.id} />
          )}

          {tab === "technical" && (
            <TechnicalSection event={event} />
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink({ event }: { event: AuditViewEvent | null }) {
  const href = event
    ? `/enterprise/audit?resourceType=${encodeURIComponent(event.resource.type)}&resourceId=${encodeURIComponent(event.resource.id)}`
    : "/enterprise/audit";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      {event ? "Back to resource timeline" : "Back to audit log"}
    </Link>
  );
}

function TimelineNavLink({
  direction,
  target,
}: {
  direction: "newer" | "older";
  target: AuditViewEvent;
}) {
  const isNewer = direction === "newer";
  return (
    <Link
      href={`/enterprise/audit/${target.id}`}
      className={cn(
        "inline-flex items-center gap-1 max-w-[48%] px-2 py-1.5 rounded-lg",
        "font-body text-[12px] font-medium text-text-secondary hover:text-foreground",
        "hover:bg-bg-subtle transition-colors",
        isNewer ? "ml-auto text-right" : "",
      )}
    >
      {!isNewer && <ChevronLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />}
      <span className="min-w-0 truncate">
        <span className="block font-body text-[10px] text-text-tertiary">
          {isNewer ? "More recent" : "Earlier"}
        </span>
        <span className="font-mono text-[11.5px]">{target.action}</span>
      </span>
      {isNewer && <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />}
    </Link>
  );
}

function RecordLinks({
  event,
  relatedHref,
}: {
  event: AuditViewEvent;
  relatedHref: string;
}) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href={relatedHref}
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        All on this resource
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href={`/enterprise/audit?actor=${encodeURIComponent(event.actor.userId)}`}
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        By this actor
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/compliance"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        Compliance
      </Link>
    </p>
  );
}
