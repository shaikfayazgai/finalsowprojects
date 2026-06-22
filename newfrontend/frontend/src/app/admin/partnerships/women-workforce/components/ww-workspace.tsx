"use client";

/**
 * Women workforce partnerships — Aurora Glass directory.
 *
 *   · Snapshot stat strip (partners · in-flight · roster total)
 *   · Glass partner list (partner · status · region · cohort · participation %)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, HeartHandshake, Plus, Users } from "lucide-react";
import {
  WWPartnershipModals,
  type WWModal,
} from "@/app/admin/partnerships/components/partnership-modals";
import { wwPipelineCount } from "@/lib/admin/mocks/partnerships-service";
import { useAdminWWPartnersList, useWWSummary } from "@/lib/hooks/use-admin-partnerships";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockWWPartner } from "@/mocks/admin/partnerships";
import {
  Banner,
  Chip,
  GlassCard,
  InlineLink,
  PageHeader,
  ProgressBar,
  SectionCard,
  Stat,
  TONE,
  type Tone,
  primaryBtnClass,
  primaryStyle,
} from "../../../_shell/aurora-ui";

/** Derive a partner-level status from its in-flight contributor pipeline. */
function partnerStatus(w: MockWWPartner): { label: string; tone: Tone } {
  const active = (w.cohort ?? []).filter((c) => c.status === "active").length;
  if (active > 0) return { label: "Active", tone: "success" };
  if (w.contributors > 0) return { label: "Onboarding", tone: "warning" };
  return { label: "Pending", tone: "neutral" };
}

export function WWWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partners = useAdminWWPartnersList();
  const summary = useWWSummary();
  const canEdit = useAdminSectionCanEdit("womenWorkforce");
  const [modal, setModal] = React.useState<WWModal>(null);
  const [toast, setToast] = React.useState<string | null>(
    searchParams.get("added") === "1" ? "Partner added." : null,
  );

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const totalCohort = partners.reduce((sum, w) => sum + wwPipelineCount(w), 0);
  const programCount = partners.reduce((sum, w) => sum + w.programs.length, 0);

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

      <PageHeader
        eyebrow="Platform · Partnerships"
        title="Women workforce"
        subtitle="NGO and community partners for women contributor onboarding — cohort invites, peer mentorship, and KYC tracking."
        actions={
          canEdit ? (
            <button type="button" onClick={() => setModal("new")} className={primaryBtnClass} style={primaryStyle}>
              <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              New partner
            </button>
          ) : undefined
        }
      />

      <p className="-mt-2 flex flex-wrap items-center gap-x-3">
        <InlineLink href="/admin/kyc?track=Women%20WF">Women WF KYC</InlineLink>
      </p>

      {!canEdit && (
        <Banner tone="neutral" icon={HeartHandshake} title="View-only access">
          Women workforce partnerships require Platform Admin or Partnership Manager.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">
          Partnership snapshot
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Partners" value={summary.count} size="lg" />
          <Stat label="Contributors in flight" value={summary.contributors} tone={summary.contributors > 0 ? "success" : "neutral"} size="lg" />
          <Stat label="Roster total" value={totalCohort} size="lg" />
        </dl>
      </GlassCard>

      <SectionCard
        title="Workforce partners"
        description={`${partners.length} active · ${programCount} programs across partners`}
      >
        {partners.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="grid place-items-center h-12 w-12 mx-auto rounded-xl border border-white/70 bg-white/55 text-text-tertiary mb-3">
              <Users className="h-6 w-6" strokeWidth={1.85} aria-hidden />
            </span>
            <p className="font-display text-[15px] font-semibold text-foreground">No partners yet</p>
            <p className="mt-1 font-body text-[12.5px] text-text-tertiary">Add a community partner to start onboarding women contributors.</p>
          </div>
        ) : (
          <ul className="px-3 sm:px-4 py-3 space-y-2">
            {partners.map((w) => (
              <WWPartnerRow key={w.id} partner={w} />
            ))}
          </ul>
        )}
      </SectionCard>

      <WWPartnershipModals
        open={modal}
        onClose={() => setModal(null)}
        onSuccess={(msg, newId) => {
          setToast(msg);
          if (newId) router.push(`/admin/partnerships/women-workforce/${newId}`);
        }}
      />
    </div>
  );
}

function WWPartnerRow({ partner: w }: { partner: MockWWPartner }) {
  const cohortSize = wwPipelineCount(w);
  const status = partnerStatus(w);
  const active = (w.cohort ?? []).filter((c) => c.status === "active").length;
  const participation = cohortSize > 0 ? Math.round((active / cohortSize) * 100) : 0;

  return (
    <li>
      <Link
        href={`/admin/partnerships/women-workforce/${w.id}`}
        className="group flex items-center gap-4 rounded-xl border border-white/55 bg-white/40 px-4 py-3.5 hover:bg-white/65 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.4)]"
      >
        <span className="grid place-items-center h-10 w-10 rounded-lg shrink-0 text-text-tertiary border border-white/70 bg-white/55">
          <HeartHandshake className="h-5 w-5" strokeWidth={1.85} aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-[13.5px] font-semibold text-foreground truncate">{w.name}</span>
            <Chip tone={status.tone}>{status.label}</Chip>
          </span>
          <span className="block mt-0.5 font-body text-[11.5px] text-text-tertiary truncate">
            {w.country}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {w.leadContact.name}
            {w.programs.length > 0 && (
              <>
                <span aria-hidden className="opacity-50 mx-1.5">·</span>
                {w.programs.join(" · ")}
              </>
            )}
          </span>
        </span>

        <span className="hidden md:flex flex-col items-end gap-1 w-40 shrink-0">
          <span className="font-body text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary">Participation</span>
          <ProgressBar pct={participation} className="w-full" height="h-1.5" />
        </span>

        <span className="shrink-0 text-right flex flex-col items-end gap-0.5 w-16">
          <span className="font-mono text-[14px] font-semibold tabular-nums text-foreground">{cohortSize}</span>
          <span className="font-body text-[10.5px] text-text-tertiary whitespace-nowrap">in cohort</span>
        </span>

        <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0" strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}
