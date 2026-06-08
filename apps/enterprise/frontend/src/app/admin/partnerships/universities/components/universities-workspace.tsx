"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  UniversityPartnershipModals,
  type UniModal,
} from "@/app/admin/partnerships/components/partnership-modals";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminUniversitiesList, useUniversitySummary } from "@/lib/hooks/use-admin-partnerships";
import { universityPipelineCount } from "@/lib/admin/mocks/partnerships-service";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockUniversity } from "@/mocks/admin/partnerships";
import { cn } from "@/lib/utils/cn";

export function UniversitiesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const universities = useAdminUniversitiesList();
  const summary = useUniversitySummary();
  const canEdit = useAdminSectionCanEdit("universities");
  const [modal, setModal] = React.useState<UniModal>(null);
  const [toast, setToast] = React.useState<string | null>(
    searchParams.get("added") === "1" ? "University partner added." : null,
  );

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const totalCohort = universities.reduce((sum, u) => sum + universityPipelineCount(u), 0);
  const totalSupervisors = universities.reduce((sum, u) => sum + u.supervisors.length, 0);

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

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            University partnerships require Platform Admin or Partnership Manager.
          </p>
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Partnerships
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Universities
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            MOU partners for student contributor onboarding — supervisors, cohort invites, and academic recognition rules.
          </p>
          <RecordLinks />
        </div>
        {canEdit && (
          <button type="button" onClick={() => setModal("new")} className={primaryBtnCls}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            New partner
          </button>
        )}
      </header>

      <DashboardSection title="Partnership snapshot" description="Active MOUs and student pipeline">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
          <SummaryStat label="Partners" value={String(summary.count)} highlight />
          <SummaryStat label="Students in flight" value={String(summary.inFlight)} highlight={summary.inFlight > 0} />
          <SummaryStat label="Roster total" value={String(totalCohort)} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            University partners
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            {universities.length} active · {totalSupervisors} faculty supervisors across partners
          </p>
        </header>
        <ul className="divide-y divide-stroke-subtle">
          {universities.map((u) => (
            <UniversityRow key={u.id} university={u} />
          ))}
        </ul>
      </section>

      <UniversityPartnershipModals
        open={modal}
        onClose={() => setModal(null)}
        onSuccess={(msg, newId) => {
          setToast(msg);
          if (newId) router.push(`/admin/partnerships/universities/${newId}`);
        }}
      />
    </div>
  );
}

function UniversityRow({ university: u }: { university: MockUniversity }) {
  const cohortSize = universityPipelineCount(u);

  return (
    <li>
      <Link
        href={`/admin/partnerships/universities/${u.id}`}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="font-body text-[13px] font-medium text-foreground truncate block">
            {u.name}
          </span>
          <span className="font-body text-[12px] text-text-secondary truncate block mt-0.5">
            {u.country} · {u.leadContact.name}
          </span>
          <span className="font-mono text-[11px] text-text-tertiary truncate block mt-0.5">
            {u.agreementRef}
          </span>
        </span>
        <span className="shrink-0 text-right flex flex-col items-end gap-1">
          <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
            {cohortSize}
          </span>
          <span className="font-body text-[10.5px] text-text-tertiary whitespace-nowrap">
            in cohort
          </span>
        </span>
      </Link>
    </li>
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

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/admin/kyc?track=Student"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Student KYC
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/admin/partnerships/women-workforce"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Women workforce
      </Link>
    </p>
  );
}

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0 shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);
