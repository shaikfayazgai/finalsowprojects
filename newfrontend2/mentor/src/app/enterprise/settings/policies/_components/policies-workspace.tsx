"use client";

/**
 * Policies workspace — SLA templates, escalation chain, governance thresholds.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Plus, ScrollText, Shield } from "lucide-react";
import {
  computePoliciesSummary,
  getEscalationRulesMock,
  getGovernanceThresholdsMock,
  getSlaTemplatesMock,
  type EscalationRuleMock,
  type GovernanceThresholdMock,
  type SlaTemplateMock,
} from "@/lib/settings/settings-mock";
import { toast } from "@/lib/stores/toast-store";
import { DASH_CARD, DASH_INNER, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  AuroraInput,
  AuroraSelect,
  primaryBtnClass,
  primaryStyle,
} from "@/app/admin/_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";

type PolicyView = "all" | "sla" | "escalation" | "governance";

const VIEW_TABS: Array<{ key: PolicyView; label: string }> = [
  { key: "all", label: "All" },
  { key: "sla", label: "SLA templates" },
  { key: "escalation", label: "Escalation" },
  { key: "governance", label: "Governance" },
];

function fmtDays(value: number): string {
  return value % 1 === 0 ? `${value}d` : `${value}d`;
}

export function PoliciesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = (searchParams.get("view") as PolicyView | null) ?? "all";

  const slaTemplates = React.useMemo(() => getSlaTemplatesMock(), []);
  const escalationRules = React.useMemo(() => getEscalationRulesMock(), []);
  const summary = React.useMemo(
    () => computePoliciesSummary(slaTemplates, escalationRules),
    [slaTemplates, escalationRules],
  );

  const [thresholds, setThresholds] = React.useState<GovernanceThresholdMock>(() =>
    getGovernanceThresholdsMock(),
  );

  const setView = React.useCallback(
    (next: PolicyView) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("view");
      else params.set("view", next);
      const qs = params.toString();
      router.replace(
        qs ? `/enterprise/settings/policies?${qs}` : "/enterprise/settings/policies",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const showSla = view === "all" || view === "sla";
  const showEscalation = view === "all" || view === "escalation";
  const showGovernance = view === "all" || view === "governance";

  const onSaveGovernance = () => {
    toast.success("Governance thresholds saved", "Updated rules apply to new reviews and suggestions.");
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Settings · Policies
        </p>
        <h1 className="font-display text-[24px] font-bold tracking-[-0.025em] leading-none text-foreground">
          Policies
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          SLA timelines, escalation on breach, and governance floors for AI suggestions and audit retention.
        </p>
        <RecordLinks />
      </header>

      <OverviewCard summary={summary} />

      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 pt-3 pb-3 border-b border-stroke-subtle">
          <nav aria-label="Policy sections" className="flex flex-wrap gap-1 p-1 rounded-xl border border-stroke-subtle bg-bg-subtle/60 w-fit">
            {VIEW_TABS.map((tab) => {
              const active = view === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setView(tab.key)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center h-8 px-3.5 rounded-lg",
                    "font-body text-[13px] font-semibold whitespace-nowrap transition-colors duration-fast",
                    active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-surface",
                  )}
                  style={active ? GLASS_GRADIENT : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="divide-y divide-stroke-subtle">
          {showSla && (
            <SlaSection
              templates={slaTemplates}
              onNewTemplate={() =>
                toast.info("New SLA template", "Template editor ships with the policies API.")
              }
            />
          )}
          {showEscalation && <EscalationSection rules={escalationRules} />}
          {showGovernance && (
            <GovernanceSection
              thresholds={thresholds}
              onChange={setThresholds}
              onSave={onSaveGovernance}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function OverviewCard({
  summary,
}: {
  summary: ReturnType<typeof computePoliciesSummary>;
}) {
  return (
    <div className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-stroke-subtle">
        <div className="flex items-start gap-3 px-5 py-4 min-w-0 flex-1">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke-subtle bg-bg-subtle text-text-secondary shrink-0">
            <ScrollText className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[15px] font-semibold text-foreground">Workspace policies</p>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Delivery SLAs, breach escalation, and AI governance floors for this tenant.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 sm:w-[280px] shrink-0 divide-x divide-stroke-subtle">
          {[
            { label: "SLA templates", value: summary.slaTemplates },
            { label: "Escalation steps", value: summary.escalationSteps },
            { label: "Gov. rules", value: summary.governanceRules },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-3 text-center">
              <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                {stat.label}
              </dt>
              <dd className="mt-0.5 font-body text-[18px] font-semibold tabular-nums text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function SlaSection({
  templates,
  onNewTemplate,
}: {
  templates: SlaTemplateMock[];
  onNewTemplate: () => void;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            SLA templates
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Target days per phase by work type
          </p>
        </div>
        <button
          type="button"
          onClick={onNewTemplate}
          className={cn(primaryBtnClass, "h-8 text-[12px]")}
          style={primaryStyle}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          New template
        </button>
      </div>

      <div
        aria-hidden
        className="hidden md:grid grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,0.55fr))] gap-3 px-0 py-2 border-b border-stroke-subtle mb-0"
      >
        {["Work type", "Intake", "Decomp", "Review", "Accept", "Total"].map((col) => (
          <span
            key={col}
            className={cn(
              "font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary",
              col !== "Work type" && "text-right",
            )}
          >
            {col}
          </span>
        ))}
      </div>

      <ul className={cn(DASH_INNER, "divide-y divide-stroke-subtle overflow-hidden")}>
        {templates.map((t) => (
          <SlaRow key={t.workType} template={t} />
        ))}
      </ul>
    </div>
  );
}

function SlaRow({ template }: { template: SlaTemplateMock }) {
  const cells = [
    template.intakeDays,
    template.decompDays,
    template.reviewDays,
    template.acceptDays,
    template.totalDays,
  ];

  return (
    <li className="md:grid md:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,0.55fr))] md:gap-3 md:items-center px-4 py-3 min-h-[48px] hover:bg-bg-subtle/40 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <Clock className="h-3.5 w-3.5 text-text-tertiary shrink-0 md:hidden" strokeWidth={2} aria-hidden />
        <span className="font-body text-[13px] font-medium text-foreground">{template.workType}</span>
      </div>
      <div className="mt-2 md:mt-0 flex flex-wrap md:contents gap-x-4 gap-y-1">
        {cells.map((value, i) => {
          const labels = ["Intake", "Decomp", "Review", "Accept", "Total"];
          const emphasized = i === 4;
          return (
            <span
              key={labels[i]}
              className={cn(
                "md:text-right font-mono tabular-nums text-[11px]",
                emphasized ? "text-[12.5px] font-semibold text-foreground" : "text-text-secondary",
              )}
            >
              <span className="md:hidden font-body text-[10px] text-text-tertiary mr-1">{labels[i]}</span>
              {fmtDays(value)}
            </span>
          );
        })}
      </div>
    </li>
  );
}

function EscalationSection({ rules }: { rules: EscalationRuleMock[] }) {
  return (
    <div className="px-5 py-4">
      <div className="mb-4">
        <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
          Escalation rules
        </h2>
        <p className="mt-1 font-body text-[12.5px] text-text-secondary">
          On SLA breach — notify, escalate, then auto-reassign
        </p>
      </div>

      <ul className={cn(DASH_INNER, "divide-y divide-stroke-subtle overflow-hidden")}>
        {rules.map((rule, index) => (
          <li key={rule.id} className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-3 min-h-[48px] hover:bg-bg-subtle/40 transition-colors">
            <span className="inline-flex items-center justify-center min-w-[44px] h-7 px-2 rounded-full border border-stroke-subtle bg-surface font-mono text-[10.5px] font-semibold text-text-secondary tabular-nums shrink-0">
              {rule.offset}
            </span>
            <span className="font-body text-[13px] font-medium text-foreground">{rule.label}</span>
            <span aria-hidden className="text-text-disabled hidden sm:inline">
              →
            </span>
            <span className="font-body text-[12.5px] text-text-secondary flex-1 min-w-[160px]">
              {rule.detail}
            </span>
            <span className="font-mono text-[10px] text-text-tertiary">Step {index + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GovernanceSection({
  thresholds,
  onChange,
  onSave,
}: {
  thresholds: GovernanceThresholdMock;
  onChange: (t: GovernanceThresholdMock) => void;
  onSave: () => void;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em] flex items-center gap-2">
            Governance thresholds
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Floors for AI suggestions, mentor routing, audit, and consent
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className={cn(primaryBtnClass, "h-8 text-[12px]")}
          style={primaryStyle}
        >
          Save thresholds
        </button>
      </div>

      <dl className={cn(DASH_INNER, "divide-y divide-stroke-subtle overflow-hidden")}>
        <GovernanceField
          label="Min AI confidence to surface a suggestion"
          hint="Below this score, suggestions stay hidden from reviewers"
        >
          <div className="flex items-center gap-2">
            <AuroraInput
              type="number"
              min={0}
              max={100}
              value={thresholds.minAiConfidencePct}
              onChange={(e) =>
                onChange({ ...thresholds, minAiConfidencePct: Number(e.target.value) })
              }
              className="w-28 h-9 font-mono text-[12px]"
            />
            <span className="font-body text-[12px] text-text-tertiary">%</span>
          </div>
        </GovernanceField>

        <GovernanceField
          label="Min mentor stars to auto-route to client reviewer"
          hint="Deliverables below this rating stay in mentor queue"
        >
          <div className="flex items-center gap-2">
            <AuroraInput
              type="number"
              min={1}
              max={5}
              step={0.5}
              value={thresholds.minMentorStars}
              onChange={(e) =>
                onChange({ ...thresholds, minMentorStars: Number(e.target.value) })
              }
              className="w-28 h-9 font-mono text-[12px]"
            />
            <span className="font-body text-[12px] text-text-tertiary">★</span>
          </div>
        </GovernanceField>

        <GovernanceField label="Audit retention">
          <AuroraSelect
            size="sm"
            value={thresholds.auditRetention}
            onChange={(e) => onChange({ ...thresholds, auditRetention: e.target.value })}
            className="w-36"
          >
            <option value="Indefinite">Indefinite</option>
            <option value="7 years">7 years</option>
            <option value="3 years">3 years</option>
          </AuroraSelect>
        </GovernanceField>

        <GovernanceField label="Consent expiry">
          <AuroraSelect
            size="sm"
            value={thresholds.consentExpiry}
            onChange={(e) => onChange({ ...thresholds, consentExpiry: e.target.value })}
            className="w-36"
          >
            <option value="Never">Never</option>
            <option value="1 year">1 year</option>
            <option value="2 years">2 years</option>
          </AuroraSelect>
        </GovernanceField>
      </dl>

      <p className="mt-3 font-body text-[11.5px] text-text-tertiary">
        Threshold changes apply to new work only. Existing reviews keep their original governance context.
      </p>
    </div>
  );
}

function GovernanceField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 min-h-[52px] hover:bg-bg-subtle/40 transition-colors">
      <div className="min-w-0 flex-1">
        <dt className="font-body text-[13px] font-medium text-foreground">{label}</dt>
        {hint && <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">{hint}</p>}
      </div>
      <dd className="shrink-0">{children}</dd>
    </div>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/compliance"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Compliance
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/settings/integrations"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Integrations
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/settings/security"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Security
      </Link>
    </p>
  );
}
