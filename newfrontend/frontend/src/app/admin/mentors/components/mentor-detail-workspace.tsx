"use client";

/**
 * Mentor detail — operate a mentor on the global roster.
 *
 * Workflow:
 *   1. Orient — status + profile (overview tab)
 *   2. Act — pause, roles, competency (actions + competency tab)
 *   3. Drill — activity and audit in separate cards
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  Mail,
  PauseCircle,
  Pencil,
  PlayCircle,
  ScrollText,
  SearchX,
  Trash2,
} from "lucide-react";
import { MentorActionModals, MentorToast } from "@/app/admin/mentors/components/mentor-action-modals";
import { MentorDetailSkeleton } from "@/app/admin/mentors/components/mentor-detail-skeleton";
import { useAdminMentorDetail } from "@/lib/hooks/use-admin-mentors";
import { deleteMentor, resendMentorInvite } from "@/lib/admin/mentors-api";
import { clearClientSession } from "@/lib/auth/clear-session";
import {
  MOCK_MENTOR_ACTIVITY,
  type AdminMentorStatus,
  type MockAdminMentor,
  type MockCompetencyRow,
  type MockMentorActivityItem,
} from "@/mocks/admin/mentors";
import { MOCK_ADMIN_AUDIT_EVENTS } from "@/mocks/admin/audit";
import { isMentorAdminSetupComplete } from "@/lib/admin/mocks/mentors-service";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "../../_shell/aurora";
import { primaryStyle } from "../../_shell/aurora-ui";

type Tab = "overview" | "competency" | "activity" | "audit";
type ModalKind = "pause" | "roles" | null;
type Tone = "success" | "info" | "warning" | "neutral";

const TABS: Tab[] = ["overview", "competency", "activity", "audit"];
const TAB_LABEL: Record<Tab, string> = {
  overview: "Overview",
  competency: "Competency",
  activity: "Activity",
  audit: "Audit",
};

const STATUS_LABEL: Record<AdminMentorStatus, string> = {
  active: "Active",
  pending: "Pending",
  paused: "Paused",
  suspended: "Suspended",
  closed: "Closed",
};

const STATUS_TONE: Record<AdminMentorStatus, Tone> = {
  active: "success",
  pending: "info",
  paused: "warning",
  suspended: "warning",
  closed: "neutral",
};

const ROLE_LABEL: Record<MockAdminMentor["roles"][number], string> = {
  mentor: "Mentor",
  "mentor.senior": "Senior",
  "mentor.lead": "Lead",
};

const TONE_TEXT: Record<Tone, string> = {
  success: "var(--color-success-text)",
  info: "var(--color-info-text)",
  warning: "var(--color-warning-text)",
  neutral: "var(--color-text-secondary)",
};

const TONE_SOFT: Record<Tone, string> = {
  success: "var(--color-success-subtle)",
  info: "var(--color-info-subtle)",
  warning: "var(--color-warning-subtle)",
  neutral: "var(--color-bg-subtle)",
};

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-medium text-foreground",
  "hover:bg-bg-subtle transition-colors",
);

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtRelative(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function primaryRoles(roles: MockAdminMentor["roles"]): MockAdminMentor["roles"] {
  const order: MockAdminMentor["roles"] = ["mentor.lead", "mentor.senior", "mentor"];
  return order.filter((r) => roles.includes(r));
}

export function MentorDetailWorkspace() {
  const params = useParams<{ mentorId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { mentor, competency, status: detailStatus, refresh } = useAdminMentorDetail(params.mentorId);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "overview";
  const inviteCode = searchParams.get("code");

  const [modal, setModal] = React.useState<ModalKind>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [resending, setResending] = React.useState(false);

  async function onResendInvite(id: string) {
    if (resending) return;
    setResending(true);
    try {
      const r = await resendMentorInvite(id);
      setToast(
        r.emailSent === false && r.tempPassword
          ? `New temp password: ${r.tempPassword} (email unavailable — copy it).`
          : "Invite resent — fresh credentials emailed to the mentor.",
      );
      refresh();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Couldn't resend the invite.");
    } finally {
      setResending(false);
    }
  }

  async function onDeleteMentor(id: string, name: string) {
    if (deleting) return;
    if (typeof window !== "undefined" &&
        !window.confirm(`Delete mentor "${name}"? They will be removed from the roster and their email freed for reuse (the record is retained and recoverable).`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteMentor(id);
      router.push("/admin/mentors");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Couldn't delete the mentor. Please try again.");
      setDeleting(false);
    }
  }
  const [toast, setToast] = React.useState<string | null>(() => {
    if (searchParams.get("invited") === "1") return "Invite sent — mentor is pending first sign-in.";
    if (searchParams.get("competency") === "saved") return "Competency saved.";
    return null;
  });

  React.useEffect(() => {
    if (searchParams.get("invited") === "1") setToast("Invite sent — mentor is pending first sign-in.");
    else if (searchParams.get("competency") === "saved") setToast("Competency saved.");
  }, [searchParams]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next === "overview") p.delete("tab");
      else p.set("tab", next);
      const qs = p.toString();
      router.replace(qs ? `/admin/mentors/${params.mentorId}?${qs}` : `/admin/mentors/${params.mentorId}`, {
        scroll: false,
      });
    },
    [router, searchParams, params.mentorId],
  );

  // Session expired (backend 401) → clear + go to admin login (not "not found").
  if (detailStatus === "unauthorized") {
    if (typeof window !== "undefined") {
      clearClientSession();
      window.location.href = `/admin/login?returnTo=/admin/mentors/${params.mentorId}`;
    }
    return <MentorDetailSkeleton />;
  }
  // Still loading + nothing yet → skeleton (not "not found").
  if (detailStatus === "loading" && !mentor) return <MentorDetailSkeleton />;

  if (!mentor) {
    return (
      <div className="space-y-5 pb-4 animate-fade-in">
        <BackLink />
        <div className={DASH_CARD}>
          <TenantEmptyState
            icon={SearchX}
            title="Mentor not found"
            description="This mentor may have been removed or the link is incorrect."
            action={
              <Link href="/admin/mentors" className={cn(BTN_SECONDARY, "h-10 px-4")}>
                Back to mentors
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const activity = MOCK_MENTOR_ACTIVITY[mentor.id] ?? [];
  const auditEvents = MOCK_ADMIN_AUDIT_EVENTS.filter(
    (e) => e.resourceId === mentor.id || e.actor === mentor.name,
  ).slice(0, 12);
  const roles = primaryRoles(mentor.roles);
  const setupComplete = isMentorAdminSetupComplete(mentor, competency);
  const needsAdminSetup = mentor.status === "pending" && !setupComplete;
  const canPause = mentor.status === "active" || mentor.status === "paused";
  const isPaused = mentor.status === "paused";
  const isActive = mentor.status === "active";

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <MentorToast message={toast} onDismiss={() => setToast(null)} />

      <BackLink />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
              {mentor.name}
            </h1>
            <StatusChip tone={STATUS_TONE[mentor.status]}>{STATUS_LABEL[mentor.status]}</StatusChip>
            {roles.map((r) => (
              <StatusChip key={r} tone="neutral">
                {ROLE_LABEL[r]}
              </StatusChip>
            ))}
          </div>
          <p className="font-body text-[14px] text-text-secondary">
            <span className="font-mono text-[12px]">{mentor.email}</span>
            <span aria-hidden className="mx-1.5 text-text-disabled">
              ·
            </span>
            {mentor.country}
            <span aria-hidden className="mx-1.5 text-text-disabled">
              ·
            </span>
            <span className="font-mono text-[12px]">{mentor.id}</span>
            <span aria-hidden className="mx-1.5 text-text-disabled">
              ·
            </span>
            <span suppressHydrationWarning>
              {mentor.status === "pending"
                ? `Invited ${fmtRelative(mentor.activeSince)}`
                : `Active since ${fmtDate(mentor.activeSince)}`}
            </span>
          </p>
        </div>

        {needsAdminSetup ? (
          <Link
            href={`/admin/mentors/${mentor.id}/competency`}
            className={cn(
              "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg shrink-0",
              "font-body text-[13px] font-semibold text-on-brand hover:opacity-90 transition-opacity",
            )}
            style={primaryStyle}
          >
            Add competency
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </Link>
        ) : null}
      </header>

      {searchParams.get("invited") === "1" && inviteCode ? (
        <section className={cn(DASH_CARD, "px-4 sm:px-5 py-4")}>
          <p className="font-body text-[13px] font-semibold text-foreground">Self-register link</p>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
            Share with the mentor if email delivery is unavailable.
          </p>
          <code className="mt-2 block font-mono text-[11px] text-foreground break-all rounded-lg border border-stroke-subtle bg-bg-subtle/50 px-3 py-2">
            {typeof window !== "undefined"
              ? `${window.location.origin}/auth/register/mentor?code=${encodeURIComponent(inviteCode)}`
              : `/auth/register/mentor?code=${inviteCode}`}
          </code>
        </section>
      ) : null}

      {mentor.status === "paused" ? (
        <div className="flex items-start gap-3 rounded-lg border border-warning-border bg-warning-subtle/50 px-4 py-3">
          <PauseCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning-text" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] text-text-secondary">
            Mentor paused — no new review assignments until resumed. In-flight reviews continue.
          </p>
        </div>
      ) : null}

      {mentor.status === "suspended" ? (
        <div className="flex items-start gap-3 rounded-lg border border-stroke-subtle bg-bg-subtle/80 px-4 py-3">
          <p className="font-body text-[13px] text-text-secondary">
            Mentor suspended — routing blocked pending platform review. Contact governance for reinstatement.
          </p>
        </div>
      ) : null}

      <SectionTabs
        active={activeTab}
        onChange={setTab}
        badges={{
          competency: competency.length,
          activity: activity.length,
          audit: auditEvents.length,
        }}
        needsSetup={needsAdminSetup}
      />

      {activeTab === "overview" && (
        <div className="space-y-5">
          {mentor.status === "pending" ? (
            <SectionCard
              title={setupComplete ? "Awaiting first sign-in" : "Finish admin setup"}
              description={
                setupComplete
                  ? "Competency is configured — matching starts after the mentor signs in."
                  : "Add skills and proficiency levels so review routing can match this mentor."
              }
            >
              {setupComplete ? (
                <p className="font-body text-[13px] text-text-secondary">
                  Invite sent to{" "}
                  <span className="font-medium text-foreground">{mentor.email}</span>. No further admin steps
                  required until sign-in.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/mentors/${mentor.id}/competency`}
                    className={cn(
                      "inline-flex items-center gap-2 h-10 px-5 rounded-lg font-body text-[13px] font-semibold text-on-brand hover:opacity-90",
                    )}
                    style={primaryStyle}
                  >
                    <GraduationCap className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                    Add competency
                  </Link>
                  <button type="button" onClick={() => setTab("competency")} className={BTN_SECONDARY}>
                    View competency tab
                  </button>
                </div>
              )}
            </SectionCard>
          ) : null}

          <SectionCard title="Actions" description="Lifecycle and routing for this mentor">
            <div className="flex flex-wrap gap-2">
              {canPause ? (
                <button type="button" onClick={() => setModal("pause")} className={BTN_SECONDARY}>
                  {isPaused ? (
                    <PlayCircle className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                  ) : (
                    <PauseCircle className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                  )}
                  {isPaused ? "Resume mentor" : "Pause mentor"}
                </button>
              ) : null}
              <button type="button" onClick={() => setModal("roles")} className={BTN_SECONDARY}>
                <Pencil className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                Edit roles
              </button>
              <Link href={`/admin/mentors/${mentor.id}/competency`} className={BTN_SECONDARY}>
                <GraduationCap className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                Edit competency
              </Link>
              <Link href={`/admin/audit?actor=${encodeURIComponent(mentor.id)}`} className={BTN_SECONDARY}>
                <ExternalLink className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                Open audit
              </Link>
              <button
                type="button"
                onClick={() => onResendInvite(mentor.id)}
                disabled={resending}
                className={cn(BTN_SECONDARY, "disabled:opacity-55")}
              >
                <Mail className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                {resending ? "Resending…" : "Resend invite"}
              </button>
              <button
                type="button"
                onClick={() => onDeleteMentor(mentor.id, mentor.name)}
                disabled={deleting}
                className={cn(BTN_SECONDARY, "text-[var(--color-error-text)] hover:bg-[var(--color-error-subtle)] disabled:opacity-55")}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                {deleting ? "Deleting…" : "Delete mentor"}
              </button>
            </div>
          </SectionCard>

          {isActive ? (
            <SectionCard title="30-day performance" description="Review and mentorship activity">
              <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
                <Metric label="Reviews" value={String(mentor.reviews30d)} />
                <Metric label="Sessions" value={String(mentor.sessions30d)} />
                <Metric label="Escalations" value={String(mentor.escalations30d)} />
                <Metric label="Avg review" value={mentor.avgReviewMin ? `${mentor.avgReviewMin}m` : "—"} />
                <Metric
                  label="SLA hit rate"
                  value={mentor.slaHitPct ? `${mentor.slaHitPct}%` : "—"}
                  subdued={mentor.slaHitPct > 0 && mentor.slaHitPct < 85}
                />
              </dl>
            </SectionCard>
          ) : null}

          <SectionCard title="Profile">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              <DetailRow label="Email" value={mentor.email} mono />
              <DetailRow label="Country" value={mentor.country} />
              <DetailRow label="Mentor ID" value={mentor.id} mono />
              <DetailRow label="Status" value={STATUS_LABEL[mentor.status]} />
              <DetailRow label="Roles" value={roles.map((r) => ROLE_LABEL[r]).join(", ") || "—"} />
              <DetailRow label="Member since" value={fmtDate(mentor.activeSince)} />
            </dl>
          </SectionCard>
        </div>
      )}

      {activeTab === "competency" && (
        <SectionCard
          title="Competency matrix"
          description="Skills and proficiency levels used for review matching"
          action={
            <Link
              href={`/admin/mentors/${mentor.id}/competency`}
              className={cn(BTN_SECONDARY, "h-9")}
            >
              <Pencil className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
              Edit matrix
            </Link>
          }
          flushList={competency.length > 0}
        >
          {competency.length === 0 ? (
            <TenantEmptyState
              compact
              icon={GraduationCap}
              title="No competency rows"
              description="Add skills and levels to enable automated review routing for this mentor."
              action={
                <Link
                  href={`/admin/mentors/${mentor.id}/competency`}
                  className={cn(
                    "inline-flex items-center gap-2 h-10 px-5 rounded-lg font-body text-[13px] font-semibold text-on-brand hover:opacity-90",
                  )}
                  style={primaryStyle}
                >
                  Add competency
                </Link>
              }
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-stroke-subtle">
              {competency.map((row, i) => (
                <CompetencyRow key={i} row={row} />
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {activeTab === "activity" && (
        <SectionCard title="Activity feed" description="Last 30 days" flushList={activity.length > 0}>
          {activity.length === 0 ? (
            <TenantEmptyState
              compact
              icon={ClipboardList}
              title="No activity yet"
              description={
                mentor.status === "pending"
                  ? "Activity appears after the mentor signs in and starts reviewing."
                  : "No recorded events in the last 30 days."
              }
              className="py-10"
            />
          ) : (
            <ol className="divide-y divide-stroke-subtle">
              {activity.map((a, i) => (
                <ActivityRow key={i} item={a} />
              ))}
            </ol>
          )}
        </SectionCard>
      )}

      {activeTab === "audit" && (
        <SectionCard
          title="Audit trail"
          description="Platform events involving this mentor"
          flushList={auditEvents.length > 0}
        >
          {auditEvents.length === 0 ? (
            <TenantEmptyState
              compact
              icon={ScrollText}
              title="No audit events"
              description="Governance and lifecycle events for this mentor will appear here."
              action={
                <Link href={`/admin/audit?actor=${encodeURIComponent(mentor.id)}`} className={BTN_SECONDARY}>
                  <ExternalLink className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                  Open full audit log
                </Link>
              }
              className="py-10"
            />
          ) : (
            <ul className="divide-y divide-stroke-subtle">
              {auditEvents.map((e) => (
                <AuditRow key={e.id} event={e} />
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      <MentorActionModals mentor={mentor} open={modal} onClose={() => setModal(null)} onSuccess={setToast} onDone={refresh} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/mentors"
      className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      Mentors
    </Link>
  );
}

function StatusChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium whitespace-nowrap"
      style={{ color: TONE_TEXT[tone], background: TONE_SOFT[tone] }}
    >
      {children}
    </span>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
  flushList,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  flushList?: boolean;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
        <div className="min-w-0">
          <h2 className="font-body text-[13px] font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(!flushList && "px-4 sm:px-5 py-4")}>{children}</div>
    </section>
  );
}

function SectionTabs({
  active,
  onChange,
  badges,
  needsSetup,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  badges: { competency: number; activity: number; audit: number };
  needsSetup: boolean;
}) {
  return (
    <div role="tablist" aria-label="Mentor sections" className="flex flex-wrap gap-1.5">
      {TABS.map((key) => {
        const isActive = active === key;
        const badge =
          key === "competency"
            ? badges.competency
            : key === "activity"
              ? badges.activity
              : key === "audit"
                ? badges.audit
                : null;
        const needsAttention = key === "competency" && needsSetup;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            style={isActive ? GLASS_GRADIENT : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold transition-colors",
              isActive ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
            )}
          >
            {TAB_LABEL[key]}
            {badge != null && badge > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                  isActive ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
                )}
              >
                {badge}
              </span>
            ) : null}
            {needsAttention && !isActive ? (
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-info-solid shrink-0" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function Metric({ label, value, subdued }: { label: string; value: string; subdued?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[11px] font-medium text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-body text-[18px] font-semibold tabular-nums leading-tight",
          subdued ? "text-warning-text" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[12px] font-medium text-text-tertiary">{label}</dt>
      <dd className={cn("mt-0.5 font-body text-[13.5px] text-foreground", mono && "font-mono text-[12.5px]")}>
        {value}
      </dd>
    </div>
  );
}

function CompetencyRow({ row }: { row: MockCompetencyRow }) {
  const levels = (["L1", "L2", "L3", "L4"] as const).filter((l) => row.levels[l]);
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 sm:px-5 py-3.5">
      <span className="font-body text-[11px] font-medium uppercase text-text-tertiary w-24 shrink-0 capitalize">
        {row.role}
      </span>
      <span className="font-body text-[13px] font-semibold text-foreground flex-1 min-w-0">
        {row.skillName || row.skillId}
      </span>
      <span className="font-mono text-[11px] text-text-secondary shrink-0">
        {levels.length > 0 ? levels.join(" · ") : "—"}
      </span>
    </li>
  );
}

const ACTIVITY_LABEL: Record<MockMentorActivityItem["kind"], string> = {
  review: "Review",
  session: "Session",
  escalation: "Escalation",
  pool: "Pool",
};

function ActivityRow({ item }: { item: MockMentorActivityItem }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 sm:px-5 py-3.5">
      <span className="inline-flex h-[20px] items-center px-2 rounded-full bg-bg-subtle font-body text-[10px] font-medium text-text-secondary">
        {ACTIVITY_LABEL[item.kind]}
      </span>
      <span className="font-body text-[13px] text-foreground flex-1 min-w-0">{item.label}</span>
      <span className="font-mono text-[11px] text-text-tertiary shrink-0 tabular-nums" suppressHydrationWarning>
        {fmtRelative(item.at)}
      </span>
    </li>
  );
}

function AuditRow({ event: e }: { event: (typeof MOCK_ADMIN_AUDIT_EVENTS)[number] }) {
  return (
    <li>
      <Link
        href={`/admin/audit?event=${encodeURIComponent(e.id)}`}
        className="group flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5 hover:bg-bg-subtle/60 transition-colors"
      >
        <span className="min-w-0 flex-1">
          <span className="font-body text-[13px] font-semibold text-foreground truncate block">{e.resourceLabel}</span>
          <span className="font-mono text-[10.5px] text-text-tertiary block mt-0.5">
            {e.action} · {e.actor}
          </span>
        </span>
        <span className="shrink-0 flex items-center gap-2">
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap" suppressHydrationWarning>
            {fmtRelative(e.timestamp)}
          </span>
          <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary" strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </li>
  );
}
