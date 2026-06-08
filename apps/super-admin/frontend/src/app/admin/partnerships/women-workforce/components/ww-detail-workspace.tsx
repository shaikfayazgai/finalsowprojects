"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import {
  WWPartnershipModals,
  type WWModal,
} from "@/app/admin/partnerships/components/partnership-modals";
import { WWContributorInviteActions } from "@/components/admin/ww-contributor-invite-actions";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminWWPartner } from "@/lib/hooks/use-admin-partnerships";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockWWContributor, MockWWPartner, WWContributorStatus } from "@/mocks/admin/partnerships";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "cohort" | "mentorship";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "cohort", label: "Contributor cohort" },
  { key: "mentorship", label: "Peer mentorship" },
];

function contributorStatusChip(s: WWContributorStatus): "success" | "warning" | "info" | "neutral" | "pending" {
  switch (s) {
    case "invited":
      return "neutral";
    case "registered":
      return "info";
    case "onboarding":
      return "pending";
    case "active":
      return "success";
  }
}

const STATUS_LABEL: Record<WWContributorStatus, string> = {
  invited: "Invited",
  registered: "Registered",
  onboarding: "Onboarding",
  active: "Active",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WWDetailWorkspace() {
  const params = useParams<{ orgId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = useAdminSectionCanEdit("womenWorkforce");
  const w = useAdminWWPartner(params.orgId);
  const [modal, setModal] = React.useState<WWModal>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

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
      const qs = nextParams.toString();
      router.replace(
        qs
          ? `/admin/partnerships/women-workforce/${params.orgId}?${qs}`
          : `/admin/partnerships/women-workforce/${params.orgId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.orgId],
  );

  if (!w) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/partnerships/women-workforce"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Women workforce
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Partner not found.</p>
      </div>
    );
  }

  const cohort = w.cohort ?? [];
  const invitedCount = cohort.filter((c) => c.status === "invited").length;
  const registeredCount = cohort.filter((c) => c.status === "registered").length;
  const onboardingCount = cohort.filter((c) => c.status === "onboarding").length;
  const activeCount = cohort.filter((c) => c.status === "active").length;
  const pairings = w.peerMentorPairings ?? [];

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
          href="/admin/partnerships/women-workforce"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          <span>Women workforce</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary truncate">{w.name}</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Partnerships
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {w.name}
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            {w.country}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {w.contributors} contributor{w.contributors === 1 ? "" : "s"} in flight
          </p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setModal("edit")} className={actionBtnCls}>
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Edit partner
          </button>
        )}
      </header>

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            Women workforce partnerships require Platform Admin or Partnership Manager.
          </p>
        </div>
      )}

      <DashboardSection title="Cohort snapshot" description="Contributor pipeline for this partner">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="In flight" value={String(w.contributors)} highlight={w.contributors > 0} />
          <SummaryStat label="Invited" value={String(invitedCount)} />
          <SummaryStat label="Onboarding" value={String(onboardingCount + registeredCount)} highlight={onboardingCount > 0} />
          <SummaryStat label="Active" value={String(activeCount)} highlight={activeCount > 0} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="Partner sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge =
              t.key === "cohort"
                ? cohort.length
                : t.key === "mentorship"
                  ? pairings.length
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
                  active ? "text-foreground" : "text-text-secondary",
                )}
              >
                {t.label}
                {badge != null && badge > 0 && (
                  <span className="font-mono text-[10px] tabular-nums text-text-tertiary">{badge}</span>
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
          {activeTab === "overview" && <OverviewTab partner={w} />}
          {activeTab === "cohort" && (
            <CohortTab
              partner={w}
              cohort={cohort}
              canEdit={canEdit}
              onAdd={() => setModal("contributor")}
              onSent={(msg) => setToast(msg)}
            />
          )}
          {activeTab === "mentorship" && <MentorshipTab partner={w} pairings={pairings} />}
        </div>
      </section>

      <WWPartnershipModals
        partner={w}
        open={modal}
        onClose={() => setModal(null)}
        onSuccess={(msg) => setToast(msg)}
      />
    </div>
  );
}

function OverviewTab({ partner: w }: { partner: MockWWPartner }) {
  return (
    <>
      <Panel title="How to onboard contributors" description="Recommended sequence for this partner">
        <ol className="space-y-2 font-body text-[12.5px] text-foreground list-decimal list-inside leading-relaxed">
          <li>
            <span className="font-semibold">Add contributor</span> with their email — each gets a unique personal invite link.
          </li>
          <li>
            <span className="font-semibold">Send invite</span> — status stays Invited until they register.
          </li>
          <li>
            After registration → Registered → partner step → Onboarding → KYC → Active.
          </li>
        </ol>
      </Panel>

      <Panel title="Programs" description="Active initiatives under this partnership">
        {w.programs.length === 0 ? (
          <p className="font-body text-[12.5px] text-text-tertiary">No programs listed.</p>
        ) : (
          <ul className="space-y-1.5">
            {w.programs.map((p) => (
              <li key={p} className="font-body text-[13px] text-foreground flex items-start gap-2">
                <span aria-hidden className="text-text-tertiary mt-0.5">·</span>
                {p}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Lead contact" description="Primary partnership coordinator">
        <dl className="space-y-3">
          <DetailRow label="Name" value={w.leadContact.name} />
          <DetailRow label="Title" value={w.leadContact.title} />
          <DetailRow label="Email" value={w.leadContact.email} mono />
        </dl>
      </Panel>

      <Panel title="About" description="Partner context and outreach focus">
        <p className="font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
          {w.description}
        </p>
      </Panel>
    </>
  );
}

function CohortTab({
  partner: w,
  cohort,
  canEdit,
  onAdd,
  onSent,
}: {
  partner: MockWWPartner;
  cohort: MockWWContributor[];
  canEdit: boolean;
  onAdd: () => void;
  onSent: (msg: string) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-[12.5px] text-text-secondary">
          {cohort.length} contributor{cohort.length === 1 ? "" : "s"} in roster
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button type="button" onClick={onAdd} className={smallActionBtnCls}>
              <Plus className="h-3 w-3" strokeWidth={2} aria-hidden />
              Add contributor
            </button>
          )}
          <Link
            href="/admin/kyc?track=Women%20WF"
            className="inline-flex items-center gap-1 font-body text-[12px] font-semibold text-brand-emphasis hover:text-brand transition-colors"
          >
            All Women WF KYC <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>

      {cohort.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stroke-subtle bg-bg-subtle/30 px-5 py-8 text-center">
          <p className="font-body text-[13px] text-text-secondary">
            No contributors yet — add a contributor and send their personal invite link.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stroke-subtle rounded-xl border border-stroke-subtle overflow-hidden">
          {cohort.map((c) => (
            <li
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-bg-subtle/10 hover:bg-bg-subtle/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-body text-[13px] font-semibold text-foreground">{c.name}</span>
                  <StatusChip status={contributorStatusChip(c.status)} size="sm">
                    {STATUS_LABEL[c.status]}
                  </StatusChip>
                </div>
                <p className="font-mono text-[11px] text-text-secondary mt-0.5 truncate">{c.email}</p>
                <p className="font-body text-[11px] text-text-tertiary mt-0.5">
                  {c.referredBy && (
                    <>
                      Referred by {c.referredBy}
                      <span aria-hidden className="opacity-50 mx-1">·</span>
                    </>
                  )}
                  {c.wantsPeerMentor && (
                    <>
                      Peer mentor requested
                      <span aria-hidden className="opacity-50 mx-1">·</span>
                    </>
                  )}
                  Invite {c.inviteSentAt ? fmtDate(c.inviteSentAt) : "not sent"}
                </p>
              </div>
              <div className="shrink-0">
                <WWContributorInviteActions
                  partner={w}
                  contributor={c}
                  readOnly={!canEdit}
                  onSent={onSent}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function MentorshipTab({
  partner: w,
  pairings,
}: {
  partner: MockWWPartner;
  pairings: NonNullable<MockWWPartner["peerMentorPairings"]>;
}) {
  return (
    <Panel
      title="Peer-mentor pairings"
      description={`Active mentorship matches for ${w.name}`}
      action={
        <Link
          href="/admin/mentors"
          className="inline-flex items-center gap-1 font-body text-[12px] font-semibold text-brand-emphasis hover:text-brand transition-colors"
        >
          Mentor coordination <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
        </Link>
      }
    >
      {pairings.length === 0 ? (
        <p className="font-body text-[12.5px] text-text-tertiary">
          No active pairings recorded — contributors can opt in during onboarding.
        </p>
      ) : (
        <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
          {pairings.map((p, i) => (
            <li key={i} className="px-4 py-3 bg-bg-subtle/20">
              <p className="font-body text-[13px] text-foreground">
                <span className="font-semibold">{p.contributor}</span>
                <span className="text-text-tertiary"> ↔ </span>
                <span>{p.mentor}</span>
              </p>
              <p className="font-body text-[11px] text-text-tertiary mt-0.5">
                Paired since {fmtDate(p.since)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/20 overflow-hidden">
      <header className="px-4 py-3 border-b border-stroke-subtle flex items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-[13px] font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
      <dt className="sm:w-28 shrink-0 font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className={cn("font-body text-[13px] text-foreground", mono && "font-mono text-[12px]")}>
        {value}
      </dd>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-surface border border-stroke-subtle shadow-xs",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const smallActionBtnCls = cn(
  "inline-flex items-center gap-1 h-8 px-2.5 rounded-md shrink-0",
  "bg-surface border border-stroke-subtle",
  "font-body text-[12px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);
