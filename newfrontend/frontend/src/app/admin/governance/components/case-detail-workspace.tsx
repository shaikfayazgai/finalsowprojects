"use client";

/**
 * Governance case detail — Aurora Glass, tabbed triage workspace.
 *
 *   · Crumbs + PageHeader (severity/status chips, take/reassign actions)
 *   · Status Banners (view-only, locked, unassigned)
 *   · GlassCard Stat strip + kit Tabs (?tab=overview|investigation|resolution)
 *   · SectionCard panels, audit-style notes/actions timeline, glass close form
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ExternalLink,
  Lock,
  Plus,
  ShieldAlert,
  UserCog,
  UserX,
} from "lucide-react";
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
import {
  AURORA_ACCENT,
  AuroraTextarea,
  Banner,
  Chip,
  Crumbs,
  GlassCard,
  PageHeader,
  SectionCard,
  Stat,
  Tabs,
  TONE,
  type Tone,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

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

function severityTone(s: GovSeverity): Tone {
  if (s === "high") return "error";
  if (s === "medium") return "warning";
  return "info";
}

function statusTone(s: GovCaseStatus): Tone {
  switch (s) {
    case "open":
      return "warning";
    case "in_review":
    case "pending_legal":
      return "info";
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

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
      <div className="space-y-5 animate-fade-in">
        <Crumbs items={[{ label: "Cases", href: "/admin/governance" }, { label: "Not found" }]} />
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
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-xl border px-4 py-2.5 font-body text-[12.5px] font-semibold"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}
        >
          {toast}
        </div>
      )}

      <Crumbs items={[{ label: "Cases", href: "/admin/governance" }, { label: c.id }]} />

      <PageHeader
        eyebrow="Platform · Governance"
        title={TYPE_LABEL[c.type]}
        chips={
          <>
            <Chip tone={severityTone(c.severity)}>{c.severity}</Chip>
            <Chip tone={statusTone(c.status)}>{STATUS_LABEL[c.status]}</Chip>
          </>
        }
        subtitle={
          <>
            <span className="font-mono text-[11px]">{c.id}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span suppressHydrationWarning>Opened {fmtRel(c.openedAt)}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Source: {sourceLabel}
            {c.anonymous && " (anonymous)"}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {c.assignedTo ? (
              <>Assigned to {c.assignedTo}</>
            ) : (
              <span style={{ color: TONE.warning.text }} className="font-semibold">Unassigned</span>
            )}
          </>
        }
        actions={
          canEdit && !locked ? (
            <>
              <button type="button" onClick={() => setModal("reassign")} className={ghostBtnClass}>
                <UserCog className="h-4 w-4" strokeWidth={2} aria-hidden />
                Reassign
              </button>
              {c.assignedTo !== profile.displayName && (
                <button type="button" onClick={handleTakeCase} className={primaryBtnClass} style={primaryStyle}>
                  Take case
                </button>
              )}
            </>
          ) : undefined
        }
      />

      {!canEdit && (
        <Banner tone="neutral" icon={ShieldAlert} title="View-only access">
          Case triage requires Platform Admin or Trust &amp; Safety.
        </Banner>
      )}

      {locked && (
        <Banner tone="warning" icon={Lock} title="Case locked">
          This case is {STATUS_LABEL[c.status].toLowerCase()} — no further T&amp;S edits allowed.
        </Banner>
      )}

      {!c.assignedTo && !locked && canEdit && (
        <Banner tone="warning" icon={UserX} title="Unassigned case">
          No operator owns this case yet.{" "}
          <button
            type="button"
            onClick={handleTakeCase}
            className="font-bold underline underline-offset-2 hover:opacity-80"
            style={{ color: TONE.warning.text }}
          >
            Take case
          </button>
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">Triage snapshot</p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Days open" value={daysOpen(c.openedAt)} size="lg" />
          <Stat label="Internal notes" value={notesCount} tone={notesCount > 0 ? "ai" : "neutral"} size="lg" />
          <Stat label="Actions logged" value={actionsCount} tone={actionsCount > 0 ? "ai" : "neutral"} size="lg" />
          <Stat
            label="Assignment"
            value={<span className="text-[20px]">{c.assignedTo ? "Assigned" : "Unassigned"}</span>}
            tone={c.assignedTo ? "neutral" : "warning"}
            size="lg"
          />
        </dl>
      </GlassCard>

      <Tabs
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          badge:
            t.key === "investigation"
              ? notesCount + actionsCount
              : t.key === "resolution" && c.resolution
                ? 1
                : null,
        }))}
        active={activeTab}
        onChange={(k) => setTab(k as Tab)}
      />

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
    <div className="space-y-5">
      <SectionCard title="Report (verbatim)" description="Original submission from reporter">
        <div className="px-5 sm:px-6 py-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <DetailRow label="Category" value={c.report.category} />
            {c.report.incidentDate && (
              <DetailRow label="Date of incident" value={c.report.incidentDate} />
            )}
            <DetailRow label="Anonymous" value={c.anonymous ? "Yes" : "No"} />
            <div className="sm:col-span-2">
              <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
                Description
              </dt>
              <dd className="mt-1.5 font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                {c.report.description}
              </dd>
            </div>
          </dl>
        </div>
      </SectionCard>

      <SectionCard title="Context" description="Auto-populated from platform audit">
        <div className="px-5 sm:px-6 py-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {c.context.relatedSessionId && (
              <DetailRow
                label="Probable session"
                value={`${c.context.relatedSessionId}${
                  c.context.sessionAt ? ` · ${new Date(c.context.sessionAt).toLocaleString()}` : ""
                }${c.context.sessionDurationMin ? ` · ${c.context.sessionDurationMin} min` : ""}`}
                className="sm:col-span-2"
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
          {(c.context.mentorId || c.context.relatedSessionId) && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {c.context.mentorId && (
                <Link href={`/admin/mentors/${c.context.mentorId}`} className={ghostBtnClass}>
                  <ExternalLink className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Open mentor profile
                </Link>
              )}
              {c.context.relatedSessionId && (
                <button type="button" onClick={onOpenSession} className={ghostBtnClass}>
                  <ExternalLink className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Open session record
                </button>
              )}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
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
    <div className="space-y-5">
      <SectionCard
        title="Internal notes"
        description="Not visible to anyone outside Trust & Safety"
      >
        <div className="px-5 sm:px-6 py-5">
          <ul className="space-y-3">
            {c.internalNotes.length === 0 && (
              <li className="font-body text-[12.5px] text-text-tertiary">No notes yet.</li>
            )}
            {c.internalNotes.map((n, i) => (
              <li key={i} className="relative pl-5">
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 h-2 w-2 rounded-full"
                  style={{ backgroundImage: AURORA_ACCENT }}
                />
                {i < c.internalNotes.length - 1 && (
                  <span aria-hidden className="absolute left-[3.5px] top-4 bottom-[-12px] w-px bg-[rgba(26,22,68,0.10)]" />
                )}
                <p className="font-mono text-[10.5px] text-text-tertiary" suppressHydrationWarning>
                  {fmtDateTime(n.at)} · {n.by}
                </p>
                <p className="mt-1 font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                  {n.text}
                </p>
              </li>
            ))}
          </ul>

          {canEdit && !readOnly && (
            <div className="mt-5 pt-5 border-t border-[rgba(26,22,68,0.07)] space-y-2.5">
              <AuroraTextarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add internal note…"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={note.trim().length < 3}
                  onClick={onAddNote}
                  className={primaryBtnClass}
                  style={primaryStyle}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  Add note
                </button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {(c.actionsTaken?.length ?? 0) > 0 && (
        <SectionCard title="Logged actions" description="Investigation steps recorded on this case">
          <ul className="px-5 sm:px-6 py-5 space-y-2">
            {c.actionsTaken!.map((a, i) => (
              <li key={i} className="font-body text-[13px] text-foreground flex items-start gap-2.5">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundImage: AURORA_ACCENT }} />
                {a}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {canEdit && !readOnly && (
        <SectionCard title="Take action" description="Log an investigation step on this case">
          <ul className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INVESTIGATION_ACTIONS.map((a) => (
              <li key={a}>
                <button
                  type="button"
                  onClick={() => onAction(a)}
                  className="w-full text-left inline-flex items-center h-10 px-3.5 rounded-lg border border-white/70 bg-white/55 backdrop-blur font-body text-[12.5px] text-foreground hover:bg-white/75 transition-colors duration-fast"
                >
                  {a}
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
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
      <SectionCard title="Resolution recorded" description="Final outcome for this case">
        <div className="px-5 sm:px-6 py-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <DetailRow label="Decision" value={c.resolution.decision.replace(/_/g, " ")} />
            <DetailRow
              label="Closed by"
              value={`${c.resolution.by} · ${new Date(c.resolution.at).toLocaleString()}`}
            />
            <div className="sm:col-span-2">
              <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
                Summary
              </dt>
              <dd className="mt-1.5 font-body text-[13px] text-foreground leading-relaxed">
                {c.resolution.summary}
              </dd>
            </div>
          </dl>
        </div>
      </SectionCard>
    );
  }

  if (!canEdit || readOnly) {
    return (
      <GlassCard className="px-5 sm:px-6 py-12 text-center">
        <p className="font-body text-[13px] text-text-secondary">No resolution recorded yet.</p>
      </GlassCard>
    );
  }

  return (
    <SectionCard title="Close case" description="Record the final decision and summary">
      <div className="px-5 sm:px-6 py-5">
        <fieldset className="space-y-2.5">
          <legend className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-2.5">
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
          <span className="block font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
            Resolution summary{" "}
            <span className="normal-case tracking-normal text-text-tertiary">
              (visible to reporter if non-anonymous)
            </span>
          </span>
          <AuroraTextarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
          />
        </label>

        <footer className="mt-5 pt-5 border-t border-[rgba(26,22,68,0.07)] flex items-center justify-between gap-3">
          <Link
            href="/admin/governance"
            className="font-body text-[13px] font-semibold text-text-secondary hover:text-foreground transition-colors"
          >
            Back to queue
          </Link>
          <button
            type="button"
            disabled={!decision || summary.trim().length < 5}
            onClick={onClose}
            className={primaryBtnClass}
            style={primaryStyle}
          >
            Close case
          </button>
        </footer>
      </div>
    </SectionCard>
  );
}

function DetailRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-1 font-body text-[13.5px] text-foreground">{value}</dd>
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
    <label
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 cursor-pointer transition-colors duration-fast",
        checked
          ? "border-[var(--c-violet-400)] bg-[var(--color-ai-surface)]"
          : "border-white/70 bg-white/45 hover:bg-white/65",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-[var(--c-violet-500)]"
      />
      <span className="font-body text-[12.5px] text-foreground leading-relaxed">{children}</span>
    </label>
  );
}
