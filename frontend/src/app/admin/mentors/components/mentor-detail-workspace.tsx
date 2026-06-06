"use client";

/**
 * Mentor detail — aligned with tenant detail + mentors registry list patterns.
 *
 *   · URL-synced tabs (?tab=overview|competency|activity|audit)
 *   · DashboardSection blocks + rounded-xl panels
 *   · Scannable rows (pools, competency, activity, audit)
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Edit3,
  ExternalLink,
  Layers,
  Mail,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  MentorActionButtons,
  MentorActionModals,
  MentorToast,
} from "@/app/admin/mentors/components/mentor-action-modals";
import {
  useAdminMentor,
  useAdminPoolsList,
  useMentorCompetency,
} from "@/lib/hooks/use-admin-mentors";
import {
  MOCK_MENTOR_ACTIVITY,
  type AdminMentorStatus,
  type MockAdminMentor,
  type MockCompetencyRow,
  type MockMentorActivityItem,
  type MockMentorPool,
} from "@/mocks/admin/mentors";
import { MOCK_ADMIN_AUDIT_EVENTS } from "@/mocks/admin/audit";
import { isMentorAdminSetupComplete } from "@/lib/admin/mocks/mentors-service";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "competency" | "activity" | "audit";
type ModalKind = "pause" | "roles" | "pools" | null;

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "competency", label: "Competency" },
  { key: "activity", label: "Activity" },
  { key: "audit", label: "Audit" },
];

const STATUS_LABEL: Record<AdminMentorStatus, string> = {
  active: "Active",
  pending: "Pending",
  paused: "Paused",
  suspended: "Suspended",
  closed: "Closed",
};

const STATUS_CHIP: Record<
  AdminMentorStatus,
  "success" | "pending" | "warning" | "error" | "neutral"
> = {
  active: "success",
  pending: "pending",
  paused: "warning",
  suspended: "error",
  closed: "neutral",
};

const ROLE_LABEL: Record<MockAdminMentor["roles"][number], string> = {
  mentor: "Mentor",
  "mentor.senior": "Senior",
  "mentor.lead": "Lead",
};

const ACTIVITY_KIND: Record<
  MockMentorActivityItem["kind"],
  { label: string; status: "info" | "success" | "warning" | "error" | "neutral" }
> = {
  review: { label: "Review", status: "info" },
  session: { label: "Session", status: "success" },
  escalation: { label: "Escalation", status: "warning" },
  pool: { label: "Pool", status: "neutral" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

  const mentor = useAdminMentor(params.mentorId);
  const pools = useAdminPoolsList();
  const competency = useMentorCompetency(params.mentorId);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

  const inviteCode = searchParams.get("code");

  const [modal, setModal] = React.useState<ModalKind>(null);
  const [toast, setToast] = React.useState<string | null>(() => {
    if (searchParams.get("invited") === "1") return "Invite sent — mentor is pending first sign-in.";
    if (searchParams.get("competency") === "saved") return "Competency saved.";
    return null;
  });

  React.useEffect(() => {
    if (searchParams.get("invited") === "1") {
      setToast("Invite sent — mentor is pending first sign-in.");
    } else if (searchParams.get("competency") === "saved") {
      setToast("Competency saved.");
    }
  }, [searchParams]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "overview") nextParams.delete("tab");
      else nextParams.set("tab", next);
      const qs = nextParams.toString();
      router.replace(
        qs ? `/admin/mentors/${params.mentorId}?${qs}` : `/admin/mentors/${params.mentorId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.mentorId],
  );

  if (!mentor) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/mentors"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Mentors
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Mentor not found.</p>
      </div>
    );
  }

  const mentorPools = mentor.pools
    .map((id) => pools.find((p) => p.id === id))
    .filter((p): p is MockMentorPool => Boolean(p));
  const activity = MOCK_MENTOR_ACTIVITY[mentor.id] ?? [];
  const auditEvents = MOCK_ADMIN_AUDIT_EVENTS.filter(
    (e) => e.resourceId === mentor.id || e.actor === mentor.name,
  ).slice(0, 12);

  const sinceLabel =
    mentor.status === "pending"
      ? `Invited ${fmtRelative(mentor.activeSince)}`
      : `Active since ${fmtDate(mentor.activeSince)}`;

  const roles = primaryRoles(mentor.roles);
  const setupComplete = isMentorAdminSetupComplete(mentor, competency);
  const needsAdminSetup = mentor.status === "pending" && !setupComplete;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <MentorToast message={toast} onDismiss={() => setToast(null)} />

      {searchParams.get("invited") === "1" && inviteCode && (
        <div className="rounded-xl border border-brand-border/40 bg-brand-subtle/15 px-4 py-3 space-y-1">
          <p className="font-body text-[12px] font-semibold text-foreground">Self-register link</p>
          <p className="font-body text-[12px] text-text-secondary">
            Share with the mentor if email delivery is unavailable:
          </p>
          <code className="block font-mono text-[11px] text-foreground break-all">
            {typeof window !== "undefined"
              ? `${window.location.origin}/auth/register/mentor?code=${encodeURIComponent(inviteCode)}`
              : `/auth/register/mentor?code=${inviteCode}`}
          </code>
        </div>
      )}

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/mentors"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Mentors</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary truncate">{mentor.name}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Mentor
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {mentor.name}
            </h1>
            <StatusChip status={STATUS_CHIP[mentor.status]} size="sm" showDot>
              {STATUS_LABEL[mentor.status]}
            </StatusChip>
            {roles.map((r) => (
              <RoleBadge key={r} label={ROLE_LABEL[r]} primary={r !== "mentor"} />
            ))}
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            <span className="font-mono text-[12px]">{mentor.email}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {mentor.country}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {sinceLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {needsAdminSetup && (
            <Link
              href={`/admin/mentors/${mentor.id}/competency`}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
                "bg-brand text-on-brand font-body text-[13px] font-semibold shadow-xs",
                "hover:bg-brand-hover transition-colors duration-fast",
              )}
            >
              Complete setup →
            </Link>
          )}
          <MentorActionButtons mentor={mentor} onOpen={setModal} />
          <button
            type="button"
            onClick={() => setModal("roles")}
            className={actionBtnCls}
          >
            <Edit3 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Roles
          </button>
          <button
            type="button"
            onClick={() => setModal("pools")}
            className={actionBtnCls}
          >
            <Layers className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Pools
          </button>
          <Link href={`/admin/audit?actor=${encodeURIComponent(mentor.id)}`} className={actionBtnCls}>
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Audit
          </Link>
        </div>
      </header>

      {mentor.status === "pending" && activeTab !== "competency" && (
        setupComplete ? (
          <ContextBanner title="Awaiting first sign-in">
            Invite sent to{" "}
            <span className="font-medium text-foreground">{mentor.email}</span>
            {" · "}
            Admin setup is complete — matching will start after the mentor signs in.
          </ContextBanner>
        ) : (
          <ContextBanner title="Complete admin setup">
            Invite sent to{" "}
            <span className="font-medium text-foreground">{mentor.email}</span>
            {!mentor.pools.length && " · No pools assigned yet"}
            {!competency.some(
              (r) =>
                r.skillId &&
                (r.levels.L1 || r.levels.L2 || r.levels.L3 || r.levels.L4),
            ) && " · No competency rows yet"}
            .{" "}
            <button
              type="button"
              onClick={() => setTab("competency")}
              className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              Add competency
            </button>
            {" · "}
            <button
              type="button"
              onClick={() => setModal("pools")}
              className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              Assign pools
            </button>
          </ContextBanner>
        )
      )}

      {mentor.status === "paused" && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Mentor paused
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            No new review assignments until resumed. Existing in-flight reviews continue.
          </p>
        </div>
      )}

      {mentor.status === "suspended" && (
        <div className="rounded-xl border border-error-border/60 bg-error-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-error-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Mentor suspended
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            Access and routing blocked pending platform review. Contact governance for reinstatement.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="Mentor sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge =
              t.key === "competency"
                ? competency.length
                : t.key === "activity"
                  ? activity.length
                  : t.key === "audit"
                    ? auditEvents.length
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
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                      active ? "bg-brand-subtle text-brand-subtle-text" : "text-text-tertiary",
                    )}
                  >
                    {badge}
                  </span>
                )}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className={activeTab === "overview" ? "p-5 space-y-5" : undefined}>
          {activeTab === "overview" && (
            <>
              <DashboardSection bare title="30-day activity" description="Review throughput and SLA">
                <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-4">
                  <SummaryStat label="Reviews" value={String(mentor.reviews30d)} />
                  <SummaryStat label="Sessions" value={String(mentor.sessions30d)} />
                  <SummaryStat
                    label="Escalations"
                    value={String(mentor.escalations30d)}
                    alert={mentor.escalations30d > 0}
                  />
                  <SummaryStat
                    label="Avg review time"
                    value={mentor.avgReviewMin ? `${mentor.avgReviewMin} min` : "—"}
                  />
                  <SummaryStat
                    label="SLA hit rate"
                    value={mentor.slaHitPct ? `${mentor.slaHitPct}%` : "—"}
                    highlight={mentor.slaHitPct >= 90}
                  />
                </dl>
              </DashboardSection>

              <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Profile
                  </h2>
                </header>
                <dl className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  <DetailRow label="Email" value={mentor.email} mono />
                  <DetailRow label="Country" value={mentor.country} />
                  <DetailRow label="Mentor ID" value={mentor.id} mono />
                  <DetailRow label="Status" value={STATUS_LABEL[mentor.status]} />
                  <DetailRow
                    label="Roles"
                    value={roles.map((r) => ROLE_LABEL[r]).join(", ") || "—"}
                  />
                  <DetailRow label="Member since" value={fmtDate(mentor.activeSince)} />
                </dl>
              </section>

              <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                      Pool assignments
                    </h2>
                    <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                      {mentorPools.length === 0
                        ? "Not assigned to any review pool"
                        : `${mentorPools.length} pool${mentorPools.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModal("pools")}
                    className="font-body text-[12px] font-semibold text-text-link"
                  >
                    Change pools
                  </button>
                </header>
                {mentorPools.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="font-body text-[13px] text-text-secondary">No pool assignments</p>
                    <button
                      type="button"
                      onClick={() => setModal("pools")}
                      className="mt-2 font-body text-[12px] font-semibold text-text-link"
                    >
                      Assign to a pool
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-stroke-subtle">
                    {mentorPools.map((p) => (
                      <li key={p.id}>
                        <PoolRow pool={p} mentorId={mentor.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {activeTab === "competency" && (
            <CompetencyPanel
              mentorId={mentor.id}
              rows={competency}
              onEditRoles={() => setModal("roles")}
            />
          )}

          {activeTab === "activity" && (
            <ActivityPanel mentor={mentor} items={activity} />
          )}

          {activeTab === "audit" && (
            <AuditPanel mentorId={mentor.id} events={auditEvents} />
          )}
        </div>
      </section>

      <MentorActionModals
        mentor={mentor}
        open={modal}
        onClose={() => setModal(null)}
        onSuccess={setToast}
      />
    </div>
  );
}

function PoolRow({ pool, mentorId }: { pool: MockMentorPool; mentorId: string }) {
  const isLead = pool.leadMentorId === mentorId;
  return (
    <Link
      href={`/admin/mentors/pools/${pool.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
        "hover:bg-bg-subtle/60 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
      )}
    >
      <span className="min-w-0">
        <span className="font-body text-[13px] font-medium text-foreground">{pool.name}</span>
        <span className="font-body text-[11.5px] text-text-tertiary block mt-0.5">
          {pool.scope === "tenant" ? pool.tenantName : "Cross-tenant"}
          {" · "}
          {pool.mentors} mentor{pool.mentors === 1 ? "" : "s"}
          {" · "}
          {pool.loadPct}% load
        </span>
      </span>
      <span className="shrink-0 flex items-center gap-2">
        {isLead && (
          <span className="inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold bg-brand-subtle text-brand-subtle-text border border-brand-border/40">
            Lead
          </span>
        )}
        <span className="font-body text-[11.5px] text-text-link">View pool →</span>
      </span>
    </Link>
  );
}

function CompetencyPanel({
  mentorId,
  rows,
  onEditRoles,
}: {
  mentorId: string;
  rows: MockCompetencyRow[];
  onEditRoles: () => void;
}) {
  return (
    <>
      <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Competency matrix
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Skills and proficiency levels used for review matching
          </p>
        </div>
        <Link
          href={`/admin/mentors/${mentorId}/competency`}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
            "bg-brand text-on-brand font-body text-[13px] font-semibold shadow-xs",
            "hover:bg-brand-hover transition-colors duration-fast",
          )}
        >
          Edit competency →
        </Link>
      </header>
      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="font-body text-[13.5px] font-semibold text-foreground">
            No competency rows
          </p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
            Add skills to enable automated review routing and matching.
          </p>
          <Link
            href={`/admin/mentors/${mentorId}/competency`}
            className="mt-3 inline-block font-body text-[12px] font-semibold text-text-link"
          >
            Add skills →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-stroke-subtle">
          {rows.map((row, i) => {
            const levels = (["L1", "L2", "L3", "L4"] as const).filter((l) => row.levels[l]);
            return (
              <li
                key={i}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-h-[44px]"
              >
                <span className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary w-24 shrink-0 capitalize">
                  {row.role}
                </span>
                <span className="font-body text-[13px] font-medium text-foreground flex-1 min-w-0">
                  {row.skillName || row.skillId}
                </span>
                <span className="font-mono text-[11px] text-text-secondary shrink-0">
                  {levels.length > 0 ? levels.join(" · ") : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <footer className="px-5 py-3 border-t border-stroke-subtle font-body text-[12px] text-text-secondary">
        Role tier affects cross-pool eligibility.{" "}
        <button
          type="button"
          onClick={onEditRoles}
          className="font-semibold text-text-link"
        >
          Edit roles
        </button>
      </footer>
    </>
  );
}

function ActivityPanel({
  mentor,
  items,
}: {
  mentor: MockAdminMentor;
  items: MockMentorActivityItem[];
}) {
  return (
    <>
      <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
        <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
          Activity feed
        </h2>
        <p className="mt-1 font-body text-[12.5px] text-text-secondary">Last 30 days</p>
      </header>
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="font-body text-[13px] text-text-secondary">
            {mentor.status === "pending"
              ? "No activity until first sign-in."
              : "No recorded events in the last 30 days."}
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-stroke-subtle">
          {items.map((a, i) => {
            const kind = ACTIVITY_KIND[a.kind];
            return (
              <li
                key={i}
                className="px-5 py-3 flex items-start gap-3 min-h-[44px] hover:bg-bg-subtle/40 transition-colors duration-fast"
              >
                <span className="font-mono text-[10.5px] text-text-tertiary shrink-0 w-16 pt-0.5 tabular-nums">
                  {fmtRelative(a.at)}
                </span>
                <StatusChip status={kind.status} size="sm" showDot={false} className="shrink-0">
                  {kind.label}
                </StatusChip>
                <span className="font-body text-[13px] text-foreground min-w-0">{a.label}</span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

function AuditPanel({
  mentorId,
  events,
}: {
  mentorId: string;
  events: typeof MOCK_ADMIN_AUDIT_EVENTS;
}) {
  return (
    <>
      <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Audit trail
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Platform events involving this mentor
          </p>
        </div>
        <Link
          href={`/admin/audit?actor=${encodeURIComponent(mentorId)}`}
          className="font-body text-[12px] font-semibold text-text-link"
        >
          Full audit →
        </Link>
      </header>
      {events.length === 0 ? (
        <p className="px-5 py-10 text-center font-body text-[13px] text-text-secondary">
          No audit events for this mentor.
        </p>
      ) : (
        <ul className="divide-y divide-stroke-subtle">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                href={`/admin/audit/${e.id}`}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-3 min-h-[44px]",
                  "hover:bg-bg-subtle/60 transition-colors duration-fast",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
                )}
              >
                <code className="font-mono text-[11px] text-brand-emphasis shrink-0 sm:w-36 truncate">
                  {e.action}
                </code>
                <span className="font-body text-[13px] text-foreground flex-1 min-w-0 truncate">
                  {e.resourceLabel}
                </span>
                <span className="font-mono text-[10.5px] text-text-tertiary shrink-0 tabular-nums">
                  {fmtRelative(e.timestamp)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ContextBanner({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-brand-border/50 bg-brand-subtle/20 px-4 py-3">
      <p className="font-body text-[12px] font-semibold text-foreground flex items-center gap-1.5">
        <Mail className="h-3.5 w-3.5 shrink-0 text-brand-emphasis" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function RoleBadge({ label, primary }: { label: string; primary?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold border",
        primary
          ? "bg-brand-subtle text-brand-subtle-text border-brand-border/40"
          : "bg-bg-subtle text-text-secondary border-stroke-subtle",
      )}
    >
      {label}
    </span>
  );
}

function SummaryStat({
  label,
  value,
  highlight = false,
  alert = false,
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
          alert ? "text-warning-text" : highlight ? "text-brand-emphasis" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-bg-subtle transition-colors duration-fast",
);
