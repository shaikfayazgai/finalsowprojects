"use client";

/**
 * Rubric template detail — aligned with skill detail + pool detail patterns.
 *
 *   · DashboardSection summary above tabs
 *   · URL-synced tabs (?tab=overview|criteria)
 *   · Criteria editor on dedicated tab
 *   · Feedback library linked from header + overview
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  MessageSquareText,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Select, StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  RubricValidationError,
  getRubricFeedback,
  saveAdminRubric,
} from "@/lib/admin/mocks/rubrics-service";
import { useAdminRubric } from "@/lib/hooks/use-admin-rubrics";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockRubricCriterion, MockRubricTemplate } from "@/mocks/admin/rubrics";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "criteria";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "criteria", label: "Criteria" },
];

const APPLIES_OPTIONS: MockRubricTemplate["appliesTo"][] = [
  "Code",
  "Design",
  "Data",
  "Marketing",
  "Documentation",
];

const APPLIES_LABEL: Record<MockRubricTemplate["appliesTo"], string> = {
  Code: "Code / engineering",
  Design: "Design",
  Data: "Data",
  Marketing: "Marketing",
  Documentation: "Documentation",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RubricDetailWorkspace() {
  const params = useParams<{ templateId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const template = useAdminRubric(params.templateId);
  const canEdit = useAdminSectionCanEdit("rubricTemplates");

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

  const [name, setName] = React.useState("");
  const [appliesTo, setAppliesTo] = React.useState<MockRubricTemplate["appliesTo"]>("Code");
  const [criteria, setCriteria] = React.useState<MockRubricCriterion[]>([]);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(() => {
    if (searchParams.get("created") === "1") return "Template created.";
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
    if (searchParams.get("created") === "1") setToast("Template created.");
    if (searchParams.get("saved") === "1") setToast("Template saved.");
  }, [searchParams]);

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
      nextParams.delete("created");
      nextParams.delete("saved");
      const qs = nextParams.toString();
      router.replace(
        qs
          ? `/admin/rubric-templates/${params.templateId}?${qs}`
          : `/admin/rubric-templates/${params.templateId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.templateId],
  );

  if (!template) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/rubric-templates"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Rubric templates
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Template not found.</p>
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
      {
        id: `c-new-${Date.now()}`,
        label: "New criterion",
        description: "",
        weight: 0,
        scaleMax: 5,
      },
    ]);
  }

  function updateCriterion(idx: number, patch: Partial<MockRubricCriterion>) {
    setCriteria((c) => c.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeCriterion(idx: number) {
    setCriteria((c) => c.filter((_, i) => i !== idx));
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
      setSaveError(
        err instanceof RubricValidationError ? err.message : "Could not save template.",
      );
    } finally {
      setSaving(false);
    }
  }

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
          href="/admin/rubric-templates"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          <span>Rubric templates</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary truncate">{name || template.name}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Template
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {name || template.name}
            </h1>
            <AppliesBadge appliesTo={appliesTo} />
            <StatusChip status={weightValid ? "success" : "warning"} size="sm" showDot>
              v{template.version}
            </StatusChip>
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            <span className="font-mono text-[12px]">{template.id}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {APPLIES_LABEL[appliesTo]}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Updated {fmtDate(template.updatedAt)}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {template.usedByTenants} tenant{template.usedByTenants === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={`/admin/rubric-templates/${templateId}/feedback`}
            className={actionBtnCls}
          >
            <MessageSquareText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Feedback
            {feedbackCount > 0 && (
              <span className="font-mono text-[10px] tabular-nums text-text-tertiary">
                {feedbackCount}
              </span>
            )}
          </Link>
          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={primaryBtnCls}
            >
              <Save className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              {saving ? "Saving…" : "Save template"}
            </button>
          )}
        </div>
      </header>

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
            View-only access
          </p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            Rubric edits require Platform Admin or Mentor Program Manager.
          </p>
        </div>
      )}

      {!weightValid && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Criteria weights must total 100%
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            Current total is {totalWeight}%. Adjust weights before saving.
            {" "}
            <button
              type="button"
              onClick={() => setTab("criteria")}
              className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              Edit criteria
            </button>
          </p>
        </div>
      )}

      <DashboardSection title="Template profile" description="Structure and platform adoption">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Criteria" value={String(criteria.length)} highlight={criteria.length > 0} />
          <SummaryStat
            label="Total weight"
            value={`${totalWeight}%`}
            alert={!weightValid}
            highlight={weightValid}
          />
          <SummaryStat label="Tenants using" value={String(template.usedByTenants)} />
          <SummaryStat label="Feedback snippets" value={String(feedbackCount)} />
        </dl>
      </DashboardSection>

      {saveError && (
        <p
          role="alert"
          className="rounded-xl border border-error-border bg-error-subtle px-4 py-2.5 font-body text-[12.5px] text-error-text"
        >
          {saveError}
        </p>
      )}

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="Template sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge = t.key === "criteria" ? criteria.length : null;
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
                      !weightValid && t.key === "criteria" && !active && "text-warning-text font-semibold",
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
              <DashboardSection bare title="Template identity" description="Name and task type">
                {canEdit ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Field label="Display name" required>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputCls}
                        disabled={disabled}
                      />
                    </Field>
                    <Field label="Applies to" required>
                      <Select
                        variant="outline"
                        size="sm"
                        value={appliesTo}
                        onChange={(e) =>
                          setAppliesTo(e.target.value as MockRubricTemplate["appliesTo"])
                        }
                        disabled={disabled}
                      >
                        {APPLIES_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {APPLIES_LABEL[o]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                ) : (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    <ProfileField label="Display name" value={name || template.name} />
                    <ProfileField label="Applies to" value={APPLIES_LABEL[appliesTo]} />
                    <ProfileField label="Template ID" value={template.id} mono />
                    <ProfileField label="Version" value={`v${template.version}`} />
                  </dl>
                )}
              </DashboardSection>

              <DashboardSection
                bare
                title="Criteria"
                description="Weighted scoring dimensions for mentor review"
              >
                <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
                  {criteria.map((c, i) => (
                    <CriterionPreviewRow key={c.id} criterion={c} index={i} />
                  ))}
                </ul>
                {criteria.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTab("criteria")}
                    className="mt-3 inline-flex items-center gap-1 font-body text-[12px] font-semibold text-brand hover:opacity-80"
                  >
                    {canEdit ? "Edit criteria" : "View all criteria"}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </button>
                )}
              </DashboardSection>

              <DashboardSection
                bare
                title="Feedback library"
                description="Mentor starting points keyed to criteria and score ranges"
              >
                <Link
                  href={`/admin/rubric-templates/${templateId}/feedback`}
                  className="flex items-center gap-3 rounded-lg border border-stroke-subtle bg-bg-subtle/30 px-4 py-3 hover:bg-bg-subtle/50 transition-colors duration-fast group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface border border-stroke-subtle">
                    <MessageSquareText
                      className="h-4 w-4 text-brand-emphasis"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[13px] font-semibold text-foreground group-hover:text-brand-emphasis transition-colors duration-fast">
                      {feedbackCount} feedback snippet{feedbackCount === 1 ? "" : "s"}
                    </p>
                    <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
                      {canEdit ? "Edit feedback library" : "View feedback library"}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-fast"
                    strokeWidth={2}
                    aria-hidden
                  />
                </Link>
              </DashboardSection>
            </>
          )}

          {activeTab === "criteria" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-stroke-subtle bg-bg-subtle/20">
                <p className="font-body text-[12px] text-text-secondary">
                  {criteria.length} criterion{criteria.length === 1 ? "" : "s"}
                </p>
                <span
                  className={cn(
                    "font-mono text-[12px] tabular-nums font-semibold",
                    weightValid ? "text-success-text" : "text-warning-text",
                  )}
                >
                  Total weight {totalWeight}%{weightValid ? " ✓" : ""}
                </span>
              </div>

              <ul className="divide-y divide-stroke-subtle">
                {criteria.map((c, i) => (
                  <li key={c.id} className="px-5 py-4">
                    <CriterionEditorRow
                      criterion={c}
                      index={i}
                      total={criteria.length}
                      disabled={disabled}
                      onUpdate={(patch) => updateCriterion(i, patch)}
                      onRemove={() => removeCriterion(i)}
                      onMove={(dir) => move(i, dir)}
                    />
                  </li>
                ))}
              </ul>

              {canEdit && (
                <div className="px-5 py-4 border-t border-stroke-subtle">
                  <button
                    type="button"
                    onClick={addCriterion}
                    className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand-emphasis hover:text-brand transition-colors duration-fast"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Add criterion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AppliesBadge({ appliesTo }: { appliesTo: MockRubricTemplate["appliesTo"] }) {
  return (
    <span className="inline-flex items-center rounded-full border border-stroke-subtle bg-bg-subtle/60 px-2 py-0.5 font-body text-[10.5px] font-semibold text-text-secondary">
      {appliesTo}
    </span>
  );
}

function CriterionPreviewRow({
  criterion,
  index,
}: {
  criterion: MockRubricCriterion;
  index: number;
}) {
  return (
    <li className="flex gap-3 px-4 py-3 bg-surface">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-subtle font-mono text-[12px] font-bold tabular-nums text-brand-subtle-text">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-body text-[13px] font-semibold text-foreground">{criterion.label}</p>
          <span className="font-mono text-[10.5px] tabular-nums text-text-tertiary">
            {criterion.weight}%
          </span>
          <span className="font-body text-[10.5px] text-text-tertiary">
            1–{criterion.scaleMax}
          </span>
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
        <span className="font-mono text-[10.5px] tabular-nums text-text-tertiary">
          {index + 1}
        </span>
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
            className={cn(inputCls, "font-semibold")}
            disabled={disabled}
            readOnly={disabled}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={criterion.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={2}
            className={textareaCls}
            disabled={disabled}
            readOnly={disabled}
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
                  onUpdate({
                    weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  })
                }
                className={cn(inputCls, "w-20 font-mono tabular-nums")}
                disabled={disabled}
                readOnly={disabled}
              />
              <span className="font-body text-[12px] text-text-tertiary">%</span>
            </div>
          </Field>
          <Field label="Scale">
            <Select
              variant="outline"
              size="sm"
              value={String(criterion.scaleMax)}
              onChange={(e) =>
                onUpdate({ scaleMax: Number(e.target.value) as MockRubricCriterion["scaleMax"] })
              }
              disabled={disabled}
            >
              <option value={3}>1–3</option>
              <option value={4}>1–4</option>
              <option value={5}>1–5</option>
            </Select>
          </Field>
        </div>
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove criterion"
          className="p-1.5 rounded-md hover:bg-bg-subtle text-text-tertiary hover:text-error-text shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  );
}

function ProfileField({
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
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </dd>
    </div>
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

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && (
          <span className="text-error-text normal-case tracking-normal"> *</span>
        )}
      </span>
      {children}
    </div>
  );
}

const inputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke bg-surface",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

const textareaCls = cn(
  "block w-full min-h-[72px] px-3 py-2.5 rounded-md border border-stroke bg-surface resize-y",
  "font-body text-[13px] text-foreground leading-relaxed",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-bg-subtle transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs shrink-0",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);
