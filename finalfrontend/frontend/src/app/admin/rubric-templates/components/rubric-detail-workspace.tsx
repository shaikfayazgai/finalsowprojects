"use client";

/**
 * Rubric template detail — edit platform default criteria and identity.
 *
 * Workflow:
 *   1. Orient — summary + identity (overview)
 *   2. Edit — criteria weights and labels (criteria tab)
 *   3. Extend — feedback snippets (linked page)
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  MessageSquareText,
  Plus,
  Save,
  SearchX,
  Trash2,
} from "lucide-react";
import {
  RubricValidationError,
  getRubricFeedback,
  saveAdminRubric,
} from "@/lib/admin/mocks/rubrics-service";
import { useAdminRubric } from "@/lib/hooks/use-admin-rubrics";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockRubricCriterion, MockRubricTemplate } from "@/mocks/admin/rubrics";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { primaryStyle } from "../../_shell/aurora-ui";

type Tab = "overview" | "criteria";
type Tone = "success" | "warning" | "neutral";

const TABS: Tab[] = ["overview", "criteria"];
const TAB_LABEL: Record<Tab, string> = { overview: "Overview", criteria: "Criteria" };

const APPLIES_OPTIONS: MockRubricTemplate["appliesTo"][] = ["Code", "Design", "Data", "Marketing", "Documentation"];
const APPLIES_LABEL: Record<MockRubricTemplate["appliesTo"], string> = {
  Code: "Code / engineering",
  Design: "Design",
  Data: "Data",
  Marketing: "Marketing",
  Documentation: "Documentation",
};

const FIELD =
  "w-full h-10 px-3 rounded-lg border border-stroke-subtle bg-surface font-body text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus disabled:opacity-60 disabled:cursor-not-allowed";

const TEXTAREA =
  "w-full min-h-[72px] px-3 py-2.5 rounded-lg border border-stroke-subtle bg-surface font-body text-[13px] text-foreground placeholder:text-text-disabled resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus disabled:opacity-60";

const SELECT = cn(FIELD, "appearance-none pr-10 cursor-pointer");

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-medium text-foreground",
  "hover:bg-bg-subtle transition-colors disabled:opacity-50",
);

const ADD_CRITERION_BTN = cn(BTN_SECONDARY, "h-10 px-4");

const TONE_TEXT: Record<Tone, string> = {
  success: "var(--color-success-text)",
  warning: "var(--color-warning-text)",
  neutral: "var(--color-text-secondary)",
};

const TONE_SOFT: Record<Tone, string> = {
  success: "var(--color-success-subtle)",
  warning: "var(--color-warning-subtle)",
  neutral: "var(--color-bg-subtle)",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function RubricDetailWorkspace() {
  const params = useParams<{ templateId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const template = useAdminRubric(params.templateId);
  const canEdit = useAdminSectionCanEdit("rubricTemplates");

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "overview";

  const [name, setName] = React.useState("");
  const [appliesTo, setAppliesTo] = React.useState<MockRubricTemplate["appliesTo"]>("Code");
  const [criteria, setCriteria] = React.useState<MockRubricCriterion[]>([]);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(() => {
    if (searchParams.get("created") === "1") return "Template created — refine criteria and save.";
    if (searchParams.get("saved") === "1") return "Template saved.";
    return null;
  });

  React.useEffect(() => {
    if (!template) return;
    setName(template.name);
    setAppliesTo(template.appliesTo);
    setCriteria(template.criteria);
  }, [template]);

  React.useEffect(() => {
    if (searchParams.get("created") === "1") setToast("Template created — refine criteria and save.");
    if (searchParams.get("saved") === "1") setToast("Template saved.");
  }, [searchParams]);

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next === "overview") p.delete("tab");
      else p.set("tab", next);
      p.delete("created");
      p.delete("saved");
      const qs = p.toString();
      router.replace(
        qs ? `/admin/rubric-templates/${params.templateId}?${qs}` : `/admin/rubric-templates/${params.templateId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.templateId],
  );

  if (!template) {
    return (
      <div className="space-y-5 pb-4 animate-fade-in">
        <BackLink />
        <div className={DASH_CARD}>
          <TenantEmptyState
            icon={SearchX}
            title="Template not found"
            description="This rubric may have been removed or the link is incorrect."
            action={
              <Link href="/admin/rubric-templates" className={cn(BTN_SECONDARY, "h-10 px-4")}>
                Back to templates
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const templateId = template.id;
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const weightValid = totalWeight === 100;
  const feedbackCount = getRubricFeedback(templateId).length;
  const disabled = !canEdit;

  function addCriterion() {
    setCriteria((c) => [
      ...c,
      { id: `c-new-${Date.now()}`, label: "New criterion", description: "", weight: 0, scaleMax: 5 },
    ]);
    setSaveError(null);
  }

  function updateCriterion(idx: number, patch: Partial<MockRubricCriterion>) {
    setCriteria((c) => c.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    setSaveError(null);
  }

  function removeCriterion(idx: number) {
    setCriteria((c) => c.filter((_, i) => i !== idx));
    setSaveError(null);
  }

  function move(idx: number, dir: -1 | 1) {
    setCriteria((c) => {
      const target = idx + dir;
      if (target < 0 || target >= c.length) return c;
      const next = [...c];
      [next[idx]!, next[target]!] = [next[target]!, next[idx]!];
      return next;
    });
  }

  function handleSave() {
    setSaveError(null);
    setSaving(true);
    try {
      saveAdminRubric(templateId, { name, appliesTo, criteria });
      setToast("Template saved.");
    } catch (err) {
      setSaveError(err instanceof RubricValidationError ? err.message : "Could not save template.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {toast ? (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-subtle/60 px-4 py-2.5 font-body text-[13px] font-medium text-success-text"
        >
          {toast}
        </div>
      ) : null}

      <BackLink />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
              {name || template.name}
            </h1>
            <StatusChip tone="neutral">{appliesTo}</StatusChip>
            <StatusChip tone={weightValid ? "success" : "warning"}>v{template.version}</StatusChip>
            {!weightValid ? <StatusChip tone="warning">Weights {totalWeight}%</StatusChip> : null}
          </div>
          <p className="font-body text-[14px] text-text-secondary">
            <span className="font-mono text-[12px]">{template.id}</span>
            <span aria-hidden className="mx-1.5 text-text-disabled">
              ·
            </span>
            {APPLIES_LABEL[appliesTo]}
            <span aria-hidden className="mx-1.5 text-text-disabled">
              ·
            </span>
            Updated {fmtDate(template.updatedAt)}
            <span aria-hidden className="mx-1.5 text-text-disabled">
              ·
            </span>
            {template.usedByTenants} tenant{template.usedByTenants === 1 ? "" : "s"}
          </p>
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg shrink-0",
              "font-body text-[13px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-50",
            )}
            style={primaryStyle}
          >
            <Save className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {saving ? "Saving…" : "Save template"}
          </button>
        ) : null}
      </header>

      {!canEdit ? (
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/80 px-4 py-3">
          <p className="font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">View-only access.</span> Rubric edits require Platform
            Admin or Mentor Program Manager.
          </p>
        </div>
      ) : null}

      {!weightValid ? (
        <div className="rounded-lg border border-warning-border bg-warning-subtle/50 px-4 py-3">
          <p className="font-body text-[13px] text-text-secondary">
            Criteria weights total <span className="font-semibold text-foreground">{totalWeight}%</span> — must equal
            100% before save.{" "}
            {activeTab !== "criteria" ? (
              <button
                type="button"
                onClick={() => setTab("criteria")}
                className="font-semibold text-foreground underline underline-offset-2 hover:opacity-80"
              >
                Edit criteria
              </button>
            ) : null}
          </p>
        </div>
      ) : null}

      {saveError ? (
        <p
          role="alert"
          className="rounded-lg border border-error-border bg-error-subtle px-4 py-2.5 font-body text-[13px] text-error-text"
        >
          {saveError}
        </p>
      ) : null}

      <SectionTabs
        active={activeTab}
        onChange={setTab}
        criteriaCount={criteria.length}
        weightInvalid={!weightValid}
      />

      {activeTab === "overview" && (
        <div className="space-y-5">
          <SectionCard title="Summary">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
              <Metric label="Criteria" value={String(criteria.length)} />
              <Metric label="Total weight" value={`${totalWeight}%`} warning={!weightValid} />
              <Metric label="Tenants using" value={String(template.usedByTenants)} />
              <Metric label="Feedback snippets" value={String(feedbackCount)} />
            </dl>
          </SectionCard>

          <SectionCard title="Template identity" description="Name and deliverable type">
            {canEdit ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Field label="Display name" required>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={disabled}
                    className={FIELD}
                  />
                </Field>
                <Field label="Applies to" required>
                  <SelectInput
                    value={appliesTo}
                    onChange={(e) => setAppliesTo(e.target.value as MockRubricTemplate["appliesTo"])}
                    disabled={disabled}
                  >
                    {APPLIES_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {APPLIES_LABEL[o]}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailRow label="Display name" value={name || template.name} />
                <DetailRow label="Applies to" value={APPLIES_LABEL[appliesTo]} />
                <DetailRow label="Template ID" value={template.id} mono />
                <DetailRow label="Version" value={`v${template.version}`} />
              </dl>
            )}
          </SectionCard>

          <SectionCard
            title="Criteria preview"
            description="Weighted scoring dimensions for mentor review"
            action={
              criteria.length > 0 ? (
                <button type="button" onClick={() => setTab("criteria")} className={cn(BTN_SECONDARY, "h-9")}>
                  {canEdit ? "Edit criteria" : "View criteria"}
                </button>
              ) : undefined
            }
            flushList={criteria.length > 0}
          >
            {criteria.length === 0 ? (
              <TenantEmptyState
                compact
                icon={ClipboardCheck}
                title="No criteria yet"
                description="Add scoring dimensions with weights that total 100%."
                action={
                  canEdit ? (
                    <button type="button" onClick={() => setTab("criteria")} className={ADD_CRITERION_BTN}>
                      <Plus className="h-4 w-4 text-text-tertiary" strokeWidth={2.2} aria-hidden />
                      Add criteria
                    </button>
                  ) : null
                }
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-stroke-subtle">
                {criteria.map((c, i) => (
                  <CriterionPreviewRow key={c.id} criterion={c} index={i} />
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Actions" description="Feedback library and related tools">
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/rubric-templates/${templateId}/feedback`} className={BTN_SECONDARY}>
                <MessageSquareText className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                Feedback snippets
                {feedbackCount > 0 ? (
                  <span className="font-mono text-[11px] tabular-nums text-text-tertiary">{feedbackCount}</span>
                ) : null}
              </Link>
              {canEdit ? (
                <button type="button" onClick={() => setTab("criteria")} className={BTN_SECONDARY}>
                  <ClipboardCheck className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                  Edit criteria
                </button>
              ) : null}
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === "criteria" && (
        <SectionCard
          title="Criteria editor"
          description={`${criteria.length} criterion${criteria.length === 1 ? "" : "s"} · weights must total 100%`}
          action={
            <span
              className={cn(
                "font-mono text-[12px] tabular-nums font-semibold",
                weightValid ? "text-success-text" : "text-warning-text",
              )}
            >
              Total {totalWeight}%{weightValid ? " ✓" : ""}
            </span>
          }
          flushList={criteria.length > 0}
        >
          {criteria.length === 0 ? (
            <TenantEmptyState
              icon={ClipboardCheck}
              title="No criteria yet"
              description="Each criterion needs a label, description, weight, and score scale."
              action={
                canEdit ? (
                  <button type="button" onClick={addCriterion} className={ADD_CRITERION_BTN}>
                    <Plus className="h-4 w-4 text-text-tertiary" strokeWidth={2.2} aria-hidden />
                    Add criterion
                  </button>
                ) : null
              }
            />
          ) : (
            <>
              <ul className="divide-y divide-stroke-subtle">
                {criteria.map((c, i) => (
                  <li key={c.id} className="px-4 sm:px-5 py-4">
                    <CriterionEditorRow
                      criterion={c}
                      index={i}
                      total={criteria.length}
                      disabled={disabled}
                      onUpdate={(patch) => updateCriterion(i, patch)}
                      onRemove={() => removeCriterion(i)}
                      onMove={(d) => move(i, d)}
                    />
                  </li>
                ))}
              </ul>

              {canEdit ? (
                <div className="px-4 sm:px-5 py-4 border-t border-stroke-subtle bg-bg-subtle/40">
                  <button type="button" onClick={addCriterion} className={ADD_CRITERION_BTN}>
                    <Plus className="h-4 w-4 text-text-tertiary" strokeWidth={2.2} aria-hidden />
                    Add criterion
                  </button>
                  <p className="mt-2 font-body text-[12px] text-text-tertiary">
                    Weights across all criteria must total 100%.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </SectionCard>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/rubric-templates"
      className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      Rubric templates
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

function SectionTabs({
  active,
  onChange,
  criteriaCount,
  weightInvalid,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  criteriaCount: number;
  weightInvalid: boolean;
}) {
  return (
    <div role="tablist" aria-label="Template sections" className="flex flex-wrap gap-1">
      {TABS.map((key) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg font-body text-[13px] font-medium transition-colors",
              isActive
                ? "admin-tab-on"
                : "text-text-secondary hover:text-foreground hover:bg-bg-subtle/60",
            )}
          >
            {TAB_LABEL[key]}
            {key === "criteria" && criteriaCount > 0 ? (
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  isActive ? "text-text-tertiary" : "text-text-disabled",
                )}
              >
                {criteriaCount}
              </span>
            ) : null}
            {key === "criteria" && weightInvalid && !isActive ? (
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warning-solid shrink-0" />
            ) : null}
          </button>
        );
      })}
    </div>
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
  description?: string;
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

function Metric({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[11px] font-medium text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-body text-[18px] font-semibold tabular-nums leading-tight",
          warning ? "text-warning-text" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <span className="block font-body text-[12px] font-medium text-text-tertiary mb-1.5">
        {label}
        {required ? <span className="text-error-text"> *</span> : null}
      </span>
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} disabled={disabled} className={SELECT}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}

function CriterionPreviewRow({ criterion, index }: { criterion: MockRubricCriterion; index: number }) {
  return (
    <li className="flex gap-3 px-4 sm:px-5 py-3.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-bg-subtle font-mono text-[11px] font-semibold tabular-nums text-text-secondary">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-body text-[13px] font-semibold text-foreground">{criterion.label}</p>
          <span className="font-mono text-[11px] tabular-nums text-text-tertiary">{criterion.weight}%</span>
          <span className="font-body text-[11px] text-text-tertiary">1–{criterion.scaleMax}</span>
        </div>
        <p className="mt-0.5 font-body text-[12px] text-text-secondary leading-relaxed">
          {criterion.description || "—"}
        </p>
      </div>
    </li>
  );
}

function CriterionEditorRow({
  criterion,
  index,
  total,
  disabled,
  onUpdate,
  onRemove,
  onMove,
}: {
  criterion: MockRubricCriterion;
  index: number;
  total: number;
  disabled: boolean;
  onUpdate: (patch: Partial<MockRubricCriterion>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center gap-0.5 mt-1 shrink-0">
        <button
          type="button"
          onClick={() => onMove(-1)}
          aria-label="Move up"
          disabled={disabled || index === 0}
          className="text-text-tertiary hover:text-foreground disabled:opacity-30"
        >
          <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
        <span className="font-mono text-[10.5px] tabular-nums text-text-tertiary">{index + 1}</span>
        <button
          type="button"
          onClick={() => onMove(1)}
          aria-label="Move down"
          disabled={disabled || index === total - 1}
          className="text-text-tertiary hover:text-foreground disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <Field label="Label" required>
          <input
            value={criterion.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            disabled={disabled}
            className={cn(FIELD, "font-semibold")}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={criterion.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={2}
            disabled={disabled}
            className={TEXTAREA}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Weight">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={criterion.weight}
                onChange={(e) =>
                  onUpdate({ weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                }
                disabled={disabled}
                className={cn(FIELD, "w-24 font-mono tabular-nums")}
              />
              <span className="font-body text-[12px] text-text-tertiary">%</span>
            </div>
          </Field>
          <Field label="Scale">
            <SelectInput
              value={String(criterion.scaleMax)}
              onChange={(e) => onUpdate({ scaleMax: Number(e.target.value) as MockRubricCriterion["scaleMax"] })}
              disabled={disabled}
            >
              <option value={3}>1–3</option>
              <option value={4}>1–4</option>
              <option value={5}>1–5</option>
            </SelectInput>
          </Field>
        </div>
      </div>

      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove criterion"
          className="p-1.5 rounded-lg hover:bg-error-subtle/50 text-text-tertiary hover:text-error-text shrink-0 transition-colors"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
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
