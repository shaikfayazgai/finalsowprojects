"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Pencil,
  Plus,
} from "lucide-react";
import {
  UniversityPartnershipModals,
  type UniModal,
} from "@/app/admin/partnerships/components/partnership-modals";
import { StudentInviteActions } from "@/components/admin/student-invite-actions";
import { ApproveStudentParticipationButton } from "@/components/admin/approve-student-participation-button";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminUniversity } from "@/lib/hooks/use-admin-partnerships";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockUniversity, UniversityStudentStatus } from "@/mocks/admin/partnerships";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "supervisors" | "cohort";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "supervisors", label: "Supervisors" },
  { key: "cohort", label: "Student cohort" },
];

function studentStatusChip(s: UniversityStudentStatus): "success" | "warning" | "info" | "neutral" | "pending" {
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

const STATUS_LABEL: Record<UniversityStudentStatus, string> = {
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

export function UniversityDetailWorkspace() {
  const params = useParams<{ uniId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = useAdminSectionCanEdit("universities");
  const u = useAdminUniversity(params.uniId);
  const [modal, setModal] = React.useState<UniModal>(null);
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
          ? `/admin/partnerships/universities/${params.uniId}?${qs}`
          : `/admin/partnerships/universities/${params.uniId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.uniId],
  );

  if (!u) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/partnerships/universities"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Universities
        </Link>
        <p className="font-body text-[13px] text-text-secondary">University not found.</p>
      </div>
    );
  }

  const cohort = u.cohort ?? [];
  const invitedCount = cohort.filter((s) => s.status === "invited").length;
  const registeredCount = cohort.filter((s) => s.status === "registered").length;
  const onboardingCount = cohort.filter((s) => s.status === "onboarding").length;
  const activeCount = cohort.filter((s) => s.status === "active").length;
  const needsSupervisors = u.supervisors.length === 0 && cohort.length > 0;

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
          href="/admin/partnerships/universities"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          <span>Universities</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary truncate">{u.name}</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Partnerships
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {u.name}
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            {u.country}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span className="font-mono text-[12px]">{u.agreementRef}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Signed {fmtDate(u.agreementSignedAt)}
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
            University partnerships require Platform Admin or Partnership Manager.
          </p>
        </div>
      )}

      {needsSupervisors && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Add supervisors before inviting students
          </p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            Students must pick a faculty supervisor during onboarding — the step is blocked until at least one supervisor is listed.{" "}
            {canEdit && (
              <button
                type="button"
                onClick={() => setTab("supervisors")}
                className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
              >
                Add supervisors
              </button>
            )}
          </p>
        </div>
      )}

      <DashboardSection title="Cohort snapshot" description="Student pipeline for this MOU">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="In flight" value={String(u.studentsInFlight)} highlight={u.studentsInFlight > 0} />
          <SummaryStat label="Invited" value={String(invitedCount)} />
          <SummaryStat label="Onboarding" value={String(onboardingCount + registeredCount)} highlight={onboardingCount > 0} />
          <SummaryStat label="Active" value={String(activeCount)} highlight={activeCount > 0} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="University sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge =
              t.key === "supervisors"
                ? u.supervisors.length
                : t.key === "cohort"
                  ? cohort.length
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
          {activeTab === "overview" && <OverviewTab university={u} />}
          {activeTab === "supervisors" && (
            <SupervisorsTab university={u} canEdit={canEdit} onAdd={() => setModal("supervisor")} />
          )}
          {activeTab === "cohort" && (
            <CohortTab
              university={u}
              cohort={cohort}
              canEdit={canEdit}
              onAdd={() => setModal("student")}
              onSent={(msg) => setToast(msg)}
            />
          )}
        </div>
      </section>

      <UniversityPartnershipModals
        university={u}
        open={modal}
        onClose={() => setModal(null)}
        onSuccess={(msg) => setToast(msg)}
      />
    </div>
  );
}

function OverviewTab({ university: u }: { university: MockUniversity }) {
  return (
    <>
      <Panel title="How to onboard students" description="Recommended sequence for this partner">
        <ol className="space-y-2 font-body text-[12.5px] text-foreground list-decimal list-inside leading-relaxed">
          <li>
            <span className="font-semibold">Add supervisors</span> — faculty coordinators students can select.
          </li>
          <li>
            <span className="font-semibold">Add student</span> with their university email — each gets a unique invite link.
          </li>
          <li>
            <span className="font-semibold">Send invite</span> — status stays Invited until they register.
          </li>
          <li>
            After registration → Registered → university step → Onboarding → KYC → Active.
          </li>
        </ol>
      </Panel>

      <Panel title="Lead contact" description="Primary partnership coordinator">
        <dl className="space-y-3">
          <DetailRow label="Name" value={u.leadContact.name} />
          <DetailRow label="Title" value={u.leadContact.title} />
          <DetailRow label="Email" value={u.leadContact.email} mono />
        </dl>
      </Panel>

      <Panel title="Academic recognition" description="Credit and transcript rules for this MOU">
        <p className="font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
          {u.academicRecognitionRules}
        </p>
      </Panel>
    </>
  );
}

function SupervisorsTab({
  university: u,
  canEdit,
  onAdd,
}: {
  university: MockUniversity;
  canEdit: boolean;
  onAdd: () => void;
}) {
  return (
    <Panel
      title="Faculty supervisors"
      description="Students select one during onboarding"
      action={
        canEdit ? (
          <button type="button" onClick={onAdd} className={smallActionBtnCls}>
            <Plus className="h-3 w-3" strokeWidth={2} aria-hidden />
            Add
          </button>
        ) : undefined
      }
    >
      {u.supervisors.length === 0 ? (
        <p className="font-body text-[12.5px] text-text-tertiary">
          No supervisors yet — add at least one before students complete onboarding.
        </p>
      ) : (
        <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
          {u.supervisors.map((s, i) => (
            <li key={`${s.email}-${i}`} className="px-4 py-3 bg-bg-subtle/20">
              <p className="font-body text-[13px] font-semibold text-foreground">{s.name}</p>
              <p className="font-body text-[12px] text-text-secondary mt-0.5">
                {s.department}
                <span aria-hidden className="opacity-50 mx-1.5">·</span>
                <span className="font-mono text-[11px]">{s.email}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function CohortTab({
  university: u,
  cohort,
  canEdit,
  onAdd,
  onSent,
}: {
  university: MockUniversity;
  cohort: NonNullable<MockUniversity["cohort"]>;
  canEdit: boolean;
  onAdd: () => void;
  onSent: (msg: string) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-[12.5px] text-text-secondary">
          {cohort.length} student{cohort.length === 1 ? "" : "s"} · {u.studentsAlumni} alumni
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button type="button" onClick={onAdd} className={smallActionBtnCls}>
              <Plus className="h-3 w-3" strokeWidth={2} aria-hidden />
              Add student
            </button>
          )}
          <Link
            href="/admin/kyc?track=Student"
            className="inline-flex items-center gap-1 font-body text-[12px] font-semibold text-brand-emphasis hover:text-brand transition-colors"
          >
            All student KYC <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>

      {cohort.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stroke-subtle bg-bg-subtle/30 px-5 py-8 text-center">
          <p className="font-body text-[13px] text-text-secondary">
            No students yet — add supervisors, then add a student and send their personal invite link.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stroke-subtle rounded-xl border border-stroke-subtle overflow-hidden">
          {cohort.map((s) => (
            <li
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-bg-subtle/10 hover:bg-bg-subtle/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-body text-[13px] font-semibold text-foreground">{s.name}</span>
                  <StatusChip status={studentStatusChip(s.status)} size="sm">
                    {STATUS_LABEL[s.status]}
                  </StatusChip>
                </div>
                <p className="font-mono text-[11px] text-text-secondary mt-0.5 truncate">{s.email}</p>
                <p className="font-body text-[11px] text-text-tertiary mt-0.5">
                  {s.rollNumber ? `Roll ${s.rollNumber}` : "No roll #"}
                  {s.programme && (
                    <>
                      <span aria-hidden className="opacity-50 mx-1">·</span>
                      {s.programme}
                    </>
                  )}
                  {s.supervisorEmail && (
                    <>
                      <span aria-hidden className="opacity-50 mx-1">·</span>
                      Supervisor {s.supervisorEmail}
                    </>
                  )}
                  <span aria-hidden className="opacity-50 mx-1">·</span>
                  Invite {s.inviteSentAt ? fmtDate(s.inviteSentAt) : "not sent"}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <ApproveStudentParticipationButton
                  universityId={u.id}
                  student={s}
                  readOnly={!canEdit}
                  onDone={onSent}
                />
                <StudentInviteActions
                  university={u}
                  student={s}
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
