"use client";

/**
 * Women workforce partner detail — Aurora Glass, tabbed.
 *
 *   · URL-synced tabs (?tab=overview|cohort|mentorship)
 *   · Stat strip + participation/placement ProgressBars
 *   · Glass section panels for programs, lead contact, cohort, mentorship
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Users } from "lucide-react";
import {
  WWPartnershipModals,
  type WWModal,
} from "@/app/admin/partnerships/components/partnership-modals";
import { WWContributorInviteActions } from "@/components/admin/ww-contributor-invite-actions";
import { useAdminWWPartner } from "@/lib/hooks/use-admin-partnerships";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockWWContributor, MockWWPartner, WWContributorStatus } from "@/mocks/admin/partnerships";
import {
  Banner,
  Chip,
  Crumbs,
  GlassCard,
  InlineLink,
  PageHeader,
  ProgressBar,
  SectionCard,
  Stat,
  Tabs,
  TONE,
  type Tone,
  ghostBtnClass,
} from "../../../_shell/aurora-ui";

type Tab = "overview" | "cohort" | "mentorship";

const TABS: Tab[] = ["overview", "cohort", "mentorship"];
const TAB_LABEL: Record<Tab, string> = {
  overview: "Overview",
  cohort: "Contributor cohort",
  mentorship: "Peer mentorship",
};

const STATUS_TONE: Record<WWContributorStatus, Tone> = {
  invited: "neutral",
  registered: "info",
  onboarding: "warning",
  active: "success",
};

const STATUS_LABEL: Record<WWContributorStatus, string> = {
  invited: "Invited",
  registered: "Registered",
  onboarding: "Onboarding",
  active: "Active",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
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
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "overview";

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
        <Crumbs items={[{ label: "Women workforce", href: "/admin/partnerships/women-workforce" }, { label: "Not found" }]} />
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

  const cohortSize = cohort.length;
  const participationPct = cohortSize > 0 ? Math.round(((registeredCount + onboardingCount + activeCount) / cohortSize) * 100) : 0;
  const placementPct = cohortSize > 0 ? Math.round((activeCount / cohortSize) * 100) : 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-xl border px-4 py-2.5 font-body text-[12.5px] font-semibold"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}
        >
          {toast}
        </div>
      )}

      <Crumbs items={[{ label: "Women workforce", href: "/admin/partnerships/women-workforce" }, { label: w.name }]} />

      <PageHeader
        eyebrow="Platform · Partnerships"
        title={w.name}
        chips={<Chip tone={activeCount > 0 ? "success" : w.contributors > 0 ? "warning" : "neutral"}>{activeCount > 0 ? "Active" : w.contributors > 0 ? "Onboarding" : "Pending"}</Chip>}
        subtitle={
          <>
            {w.country}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {w.contributors} contributor{w.contributors === 1 ? "" : "s"} in flight
          </>
        }
        actions={
          canEdit ? (
            <button type="button" onClick={() => setModal("edit")} className={ghostBtnClass}>
              <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
              Edit partner
            </button>
          ) : undefined
        }
      />

      {!canEdit && (
        <Banner tone="neutral" icon={Users} title="View-only access">
          Women workforce partnerships require Platform Admin or Partnership Manager.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">
          Cohort snapshot
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="In flight" value={w.contributors} tone={w.contributors > 0 ? "success" : "neutral"} size="lg" />
          <Stat label="Invited" value={invitedCount} size="lg" />
          <Stat label="Onboarding" value={onboardingCount + registeredCount} tone={onboardingCount > 0 ? "warning" : "neutral"} size="lg" />
          <Stat label="Active" value={activeCount} tone={activeCount > 0 ? "success" : "neutral"} size="lg" />
        </dl>
        {cohortSize > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 pt-4 border-t border-white/55">
            <div>
              <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-1.5">Participation</p>
              <ProgressBar pct={participationPct} />
            </div>
            <div>
              <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-1.5">Placement</p>
              <ProgressBar pct={placementPct} />
            </div>
          </div>
        )}
      </GlassCard>

      <Tabs
        tabs={TABS.map((t) => ({
          key: t,
          label: TAB_LABEL[t],
          badge: t === "cohort" ? cohort.length : t === "mentorship" ? pairings.length : null,
        }))}
        active={activeTab}
        onChange={(k) => setTab(k as Tab)}
      />

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
    <div className="space-y-5">
      <SectionCard title="How to onboard contributors" description="Recommended sequence for this partner">
        <ol className="px-5 sm:px-6 py-5 space-y-2 font-body text-[12.5px] text-foreground list-decimal list-inside leading-relaxed">
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
      </SectionCard>

      <SectionCard title="Programs" description="Active initiatives under this partnership">
        {w.programs.length === 0 ? (
          <p className="px-5 sm:px-6 py-5 font-body text-[12.5px] text-text-tertiary">No programs listed.</p>
        ) : (
          <div className="px-5 sm:px-6 py-5 flex flex-wrap gap-1.5">
            {w.programs.map((p) => (
              <Chip key={p} tone="neutral" dot={false}>{p}</Chip>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Lead contact" description="Primary partnership coordinator">
        <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
          <DetailRow label="Name" value={w.leadContact.name} />
          <DetailRow label="Title" value={w.leadContact.title} />
          <DetailRow label="Email" value={w.leadContact.email} mono />
        </dl>
      </SectionCard>

      <SectionCard title="About" description="Partner context and outreach focus">
        <p className="px-5 sm:px-6 py-5 font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
          {w.description}
        </p>
      </SectionCard>
    </div>
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
    <SectionCard
      title="Contributor cohort"
      description={`${cohort.length} contributor${cohort.length === 1 ? "" : "s"} in roster`}
      action={
        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button type="button" onClick={onAdd} className={ghostBtnClass}>
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Add contributor
            </button>
          )}
          <InlineLink href="/admin/kyc?track=Women%20WF">All Women WF KYC</InlineLink>
        </div>
      }
    >
      {cohort.length === 0 ? (
        <div className="px-5 sm:px-6 py-12 text-center">
          <Users className="mx-auto h-6 w-6 text-text-tertiary" strokeWidth={1.75} aria-hidden />
          <p className="mt-2 font-display text-[13.5px] font-semibold text-foreground">No contributors yet</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">Add a contributor and send their personal invite link.</p>
        </div>
      ) : (
        <ul className="px-3 sm:px-4 py-3 space-y-2">
          {cohort.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/45 px-4 py-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[13px] font-semibold text-foreground">{c.name}</span>
                  <Chip tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Chip>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-text-secondary truncate">{c.email}</p>
                <p className="mt-0.5 font-body text-[11px] text-text-tertiary" suppressHydrationWarning>
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
    </SectionCard>
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
    <SectionCard
      title="Peer-mentor pairings"
      description={`Active mentorship matches for ${w.name}`}
      action={<InlineLink href="/admin/mentors">Mentor coordination</InlineLink>}
    >
      {pairings.length === 0 ? (
        <div className="px-5 sm:px-6 py-12 text-center">
          <Users className="mx-auto h-6 w-6 text-text-tertiary" strokeWidth={1.75} aria-hidden />
          <p className="mt-2 font-display text-[13.5px] font-semibold text-foreground">No active pairings</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">Contributors can opt in during onboarding.</p>
        </div>
      ) : (
        <ul className="px-3 sm:px-4 py-3 space-y-2">
          {pairings.map((p, i) => (
            <li key={i} className="rounded-xl border border-white/60 bg-white/45 px-4 py-3">
              <p className="font-body text-[13px] text-foreground">
                <span className="font-semibold">{p.contributor}</span>
                <span className="text-text-tertiary"> ↔ </span>
                <span>{p.mentor}</span>
              </p>
              <p className="mt-0.5 font-body text-[11px] text-text-tertiary" suppressHydrationWarning>
                Paired since {fmtDate(p.since)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={mono ? "mt-1 font-mono text-[12.5px] text-foreground break-all" : "mt-1 font-body text-[13.5px] text-foreground"}>
        {value}
      </dd>
    </div>
  );
}
