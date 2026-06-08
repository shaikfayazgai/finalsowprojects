"use client";

/**
 * Governance case detail — aligned with rubric/skill detail patterns.
 *
 *   · DashboardSection summary above tabs
 *   · URL-synced tabs (?tab=overview|investigation|resolution)
 *   · Context banners for view-only, locked, and unassigned cases
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Lock,
  Plus,
  ShieldAlert,
  UserCog,
  UserX,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { GovernanceActionModals } from "./governance-action-modals";
import { useAdminGovCase } from "@/lib/hooks/use-admin-governance";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import {
  addGovCaseNote,
  applyGovCaseAction,
  closeGovCase,
  isGovCaseLocked,
  takeGovCase,
  type CloseGovDecision,
} from "@/lib/admin/mocks/governance-service";
import type {
  GovCaseStatus,
  GovCaseType,
  GovSeverity,
  MockGovCase,
} from "@/mocks/admin/governance";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "investigation" | "resolution";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "investigation", label: "Investigation" },
  { key: "resolution", label: "Resolution" },
];

const TYPE_LABEL: Record<GovCaseType, string> = {
  safety_report: "Safety report",
  dispute: "Dispute",
  mentor_escalation: "Mentor escalation",
  grievance: "Grievance",
};

const STATUS_LABEL: Record<GovCaseStatus, string> = {
  open: "Open",
  in_review: "In review",
  pending_legal: "Pending legal",
  resolved_action: "Resolved (action)",
  resolved_no_action: "Resolved",
  escalated: "Escalated",
};

const INVESTIGATION_ACTIONS = [
  "Pause mentor pending review",
  "Send formal warning",
  "Suspend mentor",
  "Forward to legal",
  "Notify enterprise (if applicable)",
  "Unassign contributor task",
] as const;

function severityChip(s: GovSeverity): "error" | "warning" | "info" {
  if (s === "high") return "error";
  if (s === "medium") return "warning";
  return "info";
}

function statusChip(s: GovCaseStatus): "success" | "warning" | "error" | "pending" | "neutral" | "info" {
  switch (s) {
    case "open":
      return "warning";
    case "in_review":
    case "pending_legal":
      return "pending";
    case "resolved_action":
      return "success";
    case "resolved_no_action":
      return "neutral";
    case "escalated":
      return "error";
  }
}

function fmtRel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.round(ms / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function daysOpen(iso: string): number {
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export function CaseDetailWorkspace() {
  const params = useParams<{ caseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useActiveAdmin();
  const canEdit = useAdminSectionCanEdit("governance");
  const c = useAdminGovCase(params.caseId);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

  const [note, setNote] = React.useState("");
  const [decision, setDecision] = React.useState<CloseGovDecision | "">("");
  const [summary, setSummary] = React.useState("");
  const [modal, setModal] = React.useState<"reassign" | "session" | null>(null);
  const [toast, setToast] = React.useState<string | null>(() => {
    if (searchParams.get("assigned") === "1") return "Case assigned to you.";
    return null;
  });

  const locked = c ? isGovCaseLocked(c) : false;
  const readOnly = !canEdit || locked;

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "overview") nextParams.delete("tab");
      else nextParams.set("tab", next);
      nextParams.delete("assigned");
      const qs = nextParams.toString();
      router.replace(
        qs ? `/admin/governance/${params.caseId}?${qs}` : `/admin/governance/${params.caseId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.caseId],
  );

  if (!c) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/governance"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Cases
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Case not found.</p>
      </div>
    );
  }

  const caseId = c.id;
  const sourceLabel =
    c.source === "contributor"
      ? "Contributor"
      : c.source === "mentor"
        ? "Mentor portal"
        : c.source === "enterprise"
          ? "Enterprise"
          : "Internal";
  const notesCount = c.internalNotes.length;
  const actionsCount = c.actionsTaken?.length ?? 0;

  function handleTakeCase() {
    const updated = takeGovCase(caseId, profile.displayName);
    if (updated) setToast(`Case assigned to ${profile.displayName}.`);
  }

  function handleAddNote() {
    const updated = addGovCaseNote(caseId, note, profile.displayName);
    if (updated) {
      setNote("");
      setToast("Internal note added.");
    }
  }

  function handleAction(action: string) {
    const updated = applyGovCaseAction(caseId, action, profile.displayName);
    if (updated) setToast(`Action logged: ${action}.`);
  }

  function handleClose() {
    if (!decision || summary.trim().length < 5) return;
    const updated = closeGovCase(caseId, decision, summary, profile.displayName);
    if (updated) router.push("/admin/governance?queue=closed&closed=1");
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text"
        >
          {toast}
        </div>
      )}

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/governance"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          <span>Cases</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary font-mono text-[11.5px]">{c.id}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Trust &amp; Safety
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {TYPE_LABEL[c.type]}
            </h1>
            <StatusChip status={severityChip(c.severity)} size="sm" showDot>
              {c.severity}
            </StatusChip>
            <StatusChip status={statusChip(c.status)} size="sm">
              {STATUS_LABEL[c.status]}
            </StatusChip>
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            <span className="font-mono text-[12px]">{c.id}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Opened {fmtRel(c.openedAt)}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Source: {sourceLabel}
            {c.anonymous && " (anonymous)"}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {c.assignedTo ? (
              <>Assigned to {c.assignedTo}</>
            ) : (
              <span className="text-warning-text font-medium">Unassigned</span>
            )}
          </p>
        </div>

        {canEdit && !locked && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button type="button" onClick={() => setModal("reassign")} className={actionBtnCls}>
              <UserCog className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Reassign
            </button>
            {c.assignedTo !== profile.displayName && (
              <button type="button" onClick={handleTakeCase} className={primaryBtnCls}>
                Take case
              </button>
            )}
          </div>
        )}
      </header>

      {!canEdit && (
        <ContextBanner icon={ShieldAlert} title="View-only access">
          Case triage requires Platform Admin or Trust &amp; Safety.
        </ContextBanner>
      )}

      {locked && (
        <ContextBanner icon={Lock} title="Case locked" variant="warning">
          This case is {STATUS_LABEL[c.status].toLowerCase()} — no further T&amp;S edits allowed.
        </ContextBanner>
      )}

      {!c.assignedTo && !locked && canEdit && (
        <ContextBanner icon={UserX} title="Unassigned case" variant="warning">
          No operator owns this case yet.{" "}
          <button
            type="button"
            onClick={handleTakeCase}
            className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
          >
            Take case
          </button>
        </ContextBanner>
      )}

      <DashboardSection title="Case summary" description="Triage snapshot for this report">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Days open" value={String(daysOpen(c.openedAt))} highlight />
          <SummaryStat label="Internal notes" value={String(notesCount)} highlight={notesCount > 0} />
          <SummaryStat label="Actions logged" value={String(actionsCount)} highlight={actionsCount > 0} />
          <SummaryStat
            label="Assignment"
            value={c.assignedTo ? "Assigned" : "Unassigned"}
            alert={!c.assignedTo}
          />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="Case sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge =
              t.key === "investigation"
                ? notesCount + actionsCount
                : t.key === "resolution" && c.resolution
                  ? 1
                  : null;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                  "font-body text-[13px] font-medium whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                  active ? "text-foreground" : "text-text-secondary",
                )}
              >
                {t.label}
                {badge != null && badge > 0 && (
                  <span className="font-mono text-[10px] tabular-nums text-text-tertiary">
                    {badge}
                  </span>
                )}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-px h-0.5 bg-brand rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 space-y-5">
          {activeTab === "overview" && (
            <OverviewTab govCase={c} onOpenSession={() => setModal("session")} />
          )}
          {activeTab === "investigation" && (
            <InvestigationTab
              govCase={c}
              note={note}
              setNote={setNote}
              readOnly={readOnly}
              canEdit={canEdit}
              onAddNote={handleAddNote}
              onAction={handleAction}
            />
          )}
          {activeTab === "resolution" && (
            <ResolutionTab
              govCase={c}
              decision={decision}
              setDecision={setDecision}
              summary={summary}
              setSummary={setSummary}
              readOnly={readOnly}
              canEdit={canEdit}
              onClose={handleClose}
            />
          )}
        </div>
      </section>

      <GovernanceActionModals
        govCase={c}
        open={modal}
        onClose={() => setModal(null)}
        onSuccess={setToast}
      />
    </div>
  );
}

function OverviewTab({
  govCase: c,
  onOpenSession,
}: {
  govCase: MockGovCase;
  onOpenSession: () => void;
}) {
  return (
    <>
      <Panel title="Report (verbatim)" description="Original submission from reporter">
        <dl className="space-y-3">
          <DetailRow label="Category" value={c.report.category} />
          {c.report.incidentDate && (
            <DetailRow label="Date of incident" value={c.report.incidentDate} />
          )}
          <div>
            <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Description
            </dt>
            <dd className="mt-1.5 font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
              {c.report.description}
            </dd>
          </div>
          <DetailRow label="Anonymous" value={c.anonymous ? "Yes" : "No"} />
        </dl>
      </Panel>

      <Panel title="Context" description="Auto-populated from platform audit">
        <dl className="space-y-3">
          {c.context.relatedSessionId && (
            <DetailRow
              label="Probable session"
              value={`${c.context.relatedSessionId}${
                c.context.sessionAt ? ` · ${new Date(c.context.sessionAt).toLocaleString()}` : ""
              }${c.context.sessionDurationMin ? ` · ${c.context.sessionDurationMin} min` : ""}`}
            />
          )}
          {c.context.mentorName && <DetailRow label="Mentor" value={c.context.mentorName} />}
          {c.context.enterpriseName && (
            <DetailRow label="Enterprise" value={c.context.enterpriseName} />
          )}
          <DetailRow
            label="Contributor identity"
            value={c.context.contributorIdentityRedacted ? "Redacted (anonymous case)" : "Visible"}
          />
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {c.context.mentorId && (
            <Link href={`/admin/mentors/${c.context.mentorId}`} className={actionBtnCls}>
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Open mentor profile
            </Link>
          )}
          {c.context.relatedSessionId && (
            <button type="button" onClick={onOpenSession} className={actionBtnCls}>
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Open session record
            </button>
          )}
        </div>
      </Panel>
    </>
  );
}

function InvestigationTab({
  govCase: c,
  note,
  setNote,
  readOnly,
  canEdit,
  onAddNote,
  onAction,
}: {
  govCase: MockGovCase;
  note: string;
  setNote: (v: string) => void;
  readOnly: boolean;
  canEdit: boolean;
  onAddNote: () => void;
  onAction: (action: string) => void;
}) {
  return (
    <>
      <Panel
        title="Internal notes"
        description="Not visible to anyone outside Trust &amp; Safety"
      >
        <ul className="space-y-2">
          {c.internalNotes.length === 0 && (
            <li className="font-body text-[12.5px] text-text-tertiary">No notes yet.</li>
          )}
          {c.internalNotes.map((n, i) => (
            <li
              key={i}
              className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3.5 py-2.5"
            >
              <p className="font-mono text-[10.5px] text-text-tertiary">
                {new Date(n.at).toLocaleString()} · {n.by}
              </p>
              <p className="mt-1 font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                {n.text}
              </p>
            </li>
          ))}
        </ul>

        {canEdit && !readOnly && (
          <div className="mt-4 pt-4 border-t border-stroke-subtle space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add internal note…"
              className={textareaCls}
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={note.trim().length < 3}
                onClick={onAddNote}
                className={cn(
                  primaryBtnCls,
                  note.trim().length < 3 && "opacity-50 cursor-not-allowed hover:bg-brand",
                )}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Add note
              </button>
            </div>
          </div>
        )}
      </Panel>

      {(c.actionsTaken?.length ?? 0) > 0 && (
        <Panel title="Logged actions" description="Investigation steps recorded on this case">
          <ul className="space-y-1.5">
            {c.actionsTaken!.map((a, i) => (
              <li
                key={i}
                className="font-body text-[13px] text-foreground flex items-start gap-2"
              >
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {canEdit && !readOnly && (
        <Panel title="Take action" description="Log an investigation step on this case">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INVESTIGATION_ACTIONS.map((a) => (
              <li key={a}>
                <button
                  type="button"
                  onClick={() => onAction(a)}
                  className="w-full text-left inline-flex items-center h-9 px-3 rounded-md bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground hover:bg-surface-hover transition-colors duration-fast"
                >
                  {a}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

function ResolutionTab({
  govCase: c,
  decision,
  setDecision,
  summary,
  setSummary,
  readOnly,
  canEdit,
  onClose,
}: {
  govCase: MockGovCase;
  decision: CloseGovDecision | "";
  setDecision: (v: CloseGovDecision | "") => void;
  summary: string;
  setSummary: (v: string) => void;
  readOnly: boolean;
  canEdit: boolean;
  onClose: () => void;
}) {
  if (c.resolution) {
    return (
      <Panel title="Resolution recorded" description="Final outcome for this case">
        <dl className="space-y-3">
          <DetailRow label="Decision" value={c.resolution.decision.replace(/_/g, " ")} />
          <div>
            <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Summary
            </dt>
            <dd className="mt-1.5 font-body text-[13px] text-foreground leading-relaxed">
              {c.resolution.summary}
            </dd>
          </div>
          <DetailRow
            label="Closed by"
            value={`${c.resolution.by} · ${new Date(c.resolution.at).toLocaleString()}`}
          />
        </dl>
      </Panel>
    );
  }

  if (!canEdit || readOnly) {
    return (
      <div className="rounded-xl border border-dashed border-stroke-subtle bg-bg-subtle/30 px-5 py-8 text-center">
        <p className="font-body text-[13px] text-text-secondary">No resolution recorded yet.</p>
      </div>
    );
  }

  return (
    <Panel title="Close case" description="Record the final decision and summary">
      <fieldset className="space-y-2">
        <legend className="font-body text-[11.5px] font-semibold text-foreground mb-2">
          Decision
        </legend>
        <Radio
          name="decision"
          checked={decision === "resolved_no_action"}
          onChange={() => setDecision("resolved_no_action")}
        >
          Resolved (no action — investigated, not substantiated)
        </Radio>
        <Radio
          name="decision"
          checked={decision === "resolved_action"}
          onChange={() => setDecision("resolved_action")}
        >
          Resolved (action taken — describe)
        </Radio>
        <Radio
          name="decision"
          checked={decision === "escalated"}
          onChange={() => setDecision("escalated")}
        >
          Escalated to legal
        </Radio>
      </fieldset>

      <label className="block mt-5">
        <span className="block font-body text-[11.5px] font-semibold text-foreground mb-1.5">
          Resolution summary{" "}
          <span className="font-normal text-text-tertiary">
            (visible to reporter if non-anonymous)
          </span>
        </span>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          className={textareaCls}
        />
      </label>

      <footer className="mt-5 pt-4 border-t border-stroke-subtle flex items-center justify-between gap-3">
        <Link
          href="/admin/governance"
          className="font-body text-[13px] text-text-secondary hover:text-foreground transition-colors"
        >
          Back to queue
        </Link>
        <button
          type="button"
          disabled={!decision || summary.trim().length < 5}
          onClick={onClose}
          className={cn(
            primaryBtnCls,
            (!decision || summary.trim().length < 5) &&
              "opacity-50 cursor-not-allowed hover:bg-brand",
          )}
        >
          Close case
        </button>
      </footer>
    </Panel>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/20 overflow-hidden">
      <header className="px-4 py-3 border-b border-stroke-subtle">
        <h2 className="font-body text-[13px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{description}</p>
        )}
      </header>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
      <dt className="sm:w-40 shrink-0 font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className="font-body text-[13px] text-foreground">{value}</dd>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-warning-text" : highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ContextBanner({
  icon: Icon,
  title,
  children,
  variant = "neutral",
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  title: string;
  children: React.ReactNode;
  variant?: "neutral" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        variant === "warning"
          ? "border-warning-border/60 bg-warning-subtle/30"
          : "border-stroke-subtle bg-bg-subtle/50",
      )}
    >
      <p
        className={cn(
          "font-body text-[12px] font-semibold flex items-center gap-1.5",
          variant === "warning" ? "text-warning-text" : "text-text-secondary",
        )}
      >
        <Icon
          className={cn("h-3.5 w-3.5 shrink-0", variant === "warning" ? "" : "text-text-tertiary")}
          strokeWidth={2}
          aria-hidden
        />
        {title}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">{children}</p>
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 font-body text-[12.5px] text-foreground cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 border-stroke text-brand focus:ring-brand"
      />
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke-subtle shadow-xs",
  "font-body text-[13px] font-medium text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);

const textareaCls = cn(
  "block w-full px-3 py-2.5 rounded-md border border-stroke-subtle bg-surface",
  "font-body text-[13px] text-foreground leading-relaxed",
  "focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand",
);
