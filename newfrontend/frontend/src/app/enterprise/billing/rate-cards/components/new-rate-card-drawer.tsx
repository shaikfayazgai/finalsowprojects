"use client";

/**
 * New / edit rate card — AdminModal popup with phased flow:
 * Details → Rate rows → Review & save.
 * Converted from Drawer + meridian glass to AdminModal + solid inputs.
 */

import * as React from "react";
import { CalendarRange, CheckCircle2, CreditCard, Plus, Trash2, Upload } from "lucide-react";
import {
  createRateCard,
  getRateCard,
  updateRateCard,
} from "@/lib/api/enterprise-rate-cards";
import { type RateRow as MockRateRow } from "@/lib/enterprise/mocks/rate-cards";
import { cn } from "@/lib/utils/cn";
import { GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  AdminModal,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";

type Scope = "tenant" | "project" | "sow";
type Phase = "details" | "rates" | "review";

interface RateRow {
  id: string;
  role: string;
  skill: string;
  level: string;
  region: string;
  rateMinor: string;
}

const LEVELS = ["L1", "L2", "L3", "L4", "L5"] as const;

const SCOPE_OPTIONS: Array<{ value: Scope; label: string }> = [
  { value: "tenant", label: "Tenant" },
  { value: "project", label: "Project" },
  { value: "sow", label: "SOW" },
];

const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP"] as const;

const DEFAULT_ROW = (): RateRow => ({
  id: crypto.randomUUID(),
  role: "Designer",
  skill: "Figma",
  level: "L2",
  region: "India",
  rateMinor: "120000",
});

const STEPS = ["Details", "Rates", "Review"] as const;

/* ── solid input style — de-glassed ── */
const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-surface border border-stroke-subtle",
  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors",
  "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
);

const cellInputCls = cn(
  "w-full h-8 px-2.5 rounded-lg bg-surface border border-stroke-subtle",
  "font-body text-[12px] text-foreground placeholder:text-text-disabled transition-colors",
  "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
);

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

function scopeLabel(scope: Scope): string {
  if (scope === "tenant") return "Tenant-wide";
  if (scope === "project") return "Specific projects";
  return "Per SOW";
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

function mockRowToFormRow(row: MockRateRow): RateRow {
  return {
    id: crypto.randomUUID(),
    role: row.role,
    skill: row.skill,
    level: row.level,
    region: row.region,
    rateMinor: String(row.rateMinorPerHour),
  };
}

function resolveCurrency(value: string): (typeof CURRENCY_OPTIONS)[number] {
  return (CURRENCY_OPTIONS as readonly string[]).includes(value)
    ? (value as (typeof CURRENCY_OPTIONS)[number])
    : "INR";
}

async function persistRateCard(
  payload: {
    name: string;
    scope: Scope;
    currency: string;
    effectiveFrom: string;
    effectiveTo?: string;
    rows: MockRateRow[];
  },
  options: { cardId?: string; status: "draft" | "active" },
): Promise<void> {
  const body = {
    name: payload.name,
    scope: payload.scope,
    scopeLabel: scopeLabel(payload.scope),
    effectiveFrom: payload.effectiveFrom,
    effectiveTo: payload.effectiveTo ?? null,
    rows: payload.rows,
    currency: payload.currency,
    status: options.status,
  };

  if (options.cardId) {
    await updateRateCard(options.cardId, body);
    return;
  }
  // Persist on create for both draft and active (real backend honours status).
  await createRateCard(body);
}

interface NewRateCardDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editCardId?: string;
}

export function NewRateCardDrawer({
  open,
  onClose,
  onSaved,
  editCardId,
}: NewRateCardDrawerProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [phase, setPhase] = React.useState<Phase>("details");
  const [name, setName] = React.useState("");
  const [scope, setScope] = React.useState<Scope>("tenant");
  const [currency, setCurrency] = React.useState<(typeof CURRENCY_OPTIONS)[number]>("INR");
  const [effectiveFrom, setEffectiveFrom] = React.useState(today);
  const [effectiveTo, setEffectiveTo] = React.useState("");
  const [rows, setRows] = React.useState<RateRow[]>([DEFAULT_ROW()]);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<"draft" | "activate" | null>(null);

  const isEdit = Boolean(editCardId);

  React.useEffect(() => {
    if (!open) return;
    setPhase("details");
    setSubmitError(null);
    setSaving(null);

    // Start blank; if editing, fetch the real card and fill in.
    setName("");
    setScope("tenant");
    setCurrency("INR");
    setEffectiveFrom(today);
    setEffectiveTo("");
    setRows([DEFAULT_ROW()]);

    if (!editCardId) return;
    let cancelled = false;
    void (async () => {
      try {
        const card = await getRateCard(editCardId);
        if (cancelled || !card) return;
        setName(card.name);
        setScope(card.scope);
        setCurrency(resolveCurrency(card.currency));
        setEffectiveFrom(toDateInputValue(card.effectiveFrom));
        setEffectiveTo(card.effectiveTo ? toDateInputValue(card.effectiveTo) : "");
        setRows(card.rows.length > 0 ? card.rows.map(mockRowToFormRow) : [DEFAULT_ROW()]);
      } catch {
        /* keep blank form on load failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, editCardId, today]);

  const validRows = React.useMemo(
    () =>
      rows.filter(
        (r) =>
          r.role.trim() &&
          r.rateMinor.trim() &&
          Number.isFinite(Number(r.rateMinor)) &&
          Number(r.rateMinor) > 0,
      ),
    [rows],
  );

  const previewAvgMinor = React.useMemo(() => {
    if (validRows.length === 0) return 0;
    return Math.round(
      validRows.reduce((a, r) => a + Number(r.rateMinor), 0) / validRows.length,
    );
  }, [validRows]);

  const previewTotalMinor = previewAvgMinor * 24;

  const addRow = () => setRows((r) => [...r, DEFAULT_ROW()]);
  const removeRow = (id: string) =>
    setRows((r) => (r.length === 1 ? r : r.filter((x) => x.id !== id)));
  const patchRow = (id: string, patch: Partial<RateRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const validateDetails = (): string | null => {
    if (!name.trim()) return "Name is required.";
    if (!effectiveFrom) return "Effective from date is required.";
    return null;
  };

  const validateRates = (): string | null => {
    if (validRows.length === 0) return "Add at least one valid rate row (role + positive rate).";
    return null;
  };

  const goNext = () => {
    setSubmitError(null);
    if (phase === "details") {
      const err = validateDetails();
      if (err) { setSubmitError(err); return; }
      setPhase("rates");
      return;
    }
    if (phase === "rates") {
      const err = validateRates();
      if (err) { setSubmitError(err); return; }
      setPhase("review");
    }
  };

  const handleSubmit = async (kind: "draft" | "activate") => {
    setSubmitError(null);
    const err = validateDetails() ?? validateRates();
    if (err) { setSubmitError(err); return; }
    setSaving(kind);
    try {
      const mockRows: MockRateRow[] = validRows.map((r) => ({
        role: r.role,
        skill: r.skill,
        level: r.level,
        region: r.region,
        rateMinorPerHour: Number(r.rateMinor),
      }));
      await persistRateCard(
        {
          name: name.trim() || `Card ${new Date().toISOString().slice(0, 10)}`,
          scope,
          currency,
          effectiveFrom,
          effectiveTo: effectiveTo || undefined,
          rows: mockRows,
        },
        { cardId: editCardId, status: kind === "activate" ? "active" : "draft" },
      );
      onSaved?.();
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save rate card");
    } finally {
      setSaving(null);
    }
  };

  const phaseStep = phase === "details" ? 0 : phase === "rates" ? 1 : 2;

  const footer =
    phase === "details" ? (
      <>
        <button type="button" onClick={onClose} disabled={saving !== null} className={secondaryBtnClass}>
          Cancel
        </button>
        <button type="button" onClick={goNext} className={cn(primaryBtnClass)} style={primaryStyle}>
          Continue to rates
        </button>
      </>
    ) : phase === "rates" ? (
      <>
        <button
          type="button"
          onClick={() => { setSubmitError(null); setPhase("details"); }}
          disabled={saving !== null}
          className={secondaryBtnClass}
        >
          Back
        </button>
        <button type="button" onClick={goNext} className={cn(primaryBtnClass)} style={primaryStyle}>
          Review & save
        </button>
      </>
    ) : (
      <>
        <button
          type="button"
          onClick={() => { setSubmitError(null); setPhase("rates"); }}
          disabled={saving !== null}
          className={secondaryBtnClass}
        >
          Edit rates
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit("draft")}
          disabled={saving !== null}
          className={secondaryBtnClass}
        >
          {saving === "draft" ? "Saving…" : "Save as draft"}
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit("activate")}
          disabled={saving !== null}
          className={cn(primaryBtnClass)}
          style={primaryStyle}
        >
          {saving === "activate" ? "Saving…" : "Save & activate"}
        </button>
      </>
    );

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      icon={CreditCard}
      tone="ai"
      title={isEdit ? "Edit rate card" : "New rate card"}
      description={
        isEdit
          ? "Update scope, rates, and validity — then save or activate."
          : "Define scope, add hourly rates, then activate for payout computation."
      }
      size="xl"
      footer={footer}
    >
      <div className="space-y-5">
        {/* Phase rail */}
        <PhaseRail steps={STEPS} current={phaseStep} />

        {phase === "details" && (
          <DetailsPhase
            name={name}
            onNameChange={setName}
            scope={scope}
            onScopeChange={setScope}
            currency={currency}
            onCurrencyChange={setCurrency}
            effectiveFrom={effectiveFrom}
            onEffectiveFromChange={setEffectiveFrom}
            effectiveTo={effectiveTo}
            onEffectiveToChange={setEffectiveTo}
          />
        )}

        {phase === "rates" && (
          <RatesPhase
            rows={rows}
            validCount={validRows.length}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            onPatchRow={patchRow}
          />
        )}

        {phase === "review" && (
          <ReviewPhase
            name={name}
            scope={scope}
            currency={currency}
            effectiveFrom={effectiveFrom}
            effectiveTo={effectiveTo}
            validRows={validRows}
            previewAvgMinor={previewAvgMinor}
            previewTotalMinor={previewTotalMinor}
          />
        )}

        {submitError && (
          <p
            role="alert"
            className="rounded-lg border border-error-border bg-error-subtle px-3 py-2.5 font-body text-[12px] text-error-text"
          >
            {submitError}
          </p>
        )}
      </div>
    </AdminModal>
  );
}

/* ── Phase rail ── */

function PhaseRail({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <div className="flex items-center gap-0" role="list" aria-label="Steps">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step}>
            <div
              role="listitem"
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md",
                active ? "bg-bg-subtle" : "",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold",
                )}
                style={
                  done
                    ? GLASS_GRADIENT
                    : active
                      ? { background: "var(--color-brand)", color: "#fff" }
                      : { background: "var(--color-bg-subtle)", color: "var(--color-text-tertiary)" }
                }
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "font-body text-[12px] font-semibold",
                  active ? "text-foreground" : done ? "text-text-secondary" : "text-text-tertiary",
                )}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                aria-hidden
                className={cn("flex-1 h-px mx-1", done ? "" : "bg-stroke-subtle")}
                style={done ? { background: "var(--color-brand)", opacity: 0.3 } : undefined}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Section wrapper ── */

function Section({
  number,
  title,
  hint,
  trailing,
  children,
}: {
  number: string;
  title: string;
  hint?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-text-disabled">
            {number}
          </span>
          <h3 className="font-display text-[13.5px] font-bold text-foreground tracking-[-0.01em]">
            {title}
          </h3>
          {hint && (
            <span className="font-body text-[11.5px] text-text-tertiary">{hint}</span>
          )}
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

/* ── Field ── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Scope option group ── */

function ScopeGroup({
  value,
  onChange,
  options,
}: {
  value: Scope;
  onChange: (v: Scope) => void;
  options: Array<{ value: Scope; label: string }>;
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-bg-subtle border border-stroke-subtle"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-7 px-3 rounded-md font-body text-[12px] font-semibold transition-colors duration-fast",
              active ? "text-white shadow-sm" : "text-text-secondary hover:bg-surface hover:text-foreground",
            )}
            style={active ? GLASS_GRADIENT : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Currency segmented control ── */

function CurrencyControl({
  value,
  onChange,
}: {
  value: (typeof CURRENCY_OPTIONS)[number];
  onChange: (v: (typeof CURRENCY_OPTIONS)[number]) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-bg-subtle border border-stroke-subtle"
    >
      {CURRENCY_OPTIONS.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={cn(
              "h-7 px-3 rounded-md font-mono text-[11.5px] font-bold transition-colors duration-fast",
              active ? "text-white shadow-sm" : "text-text-secondary hover:bg-surface hover:text-foreground",
            )}
            style={active ? GLASS_GRADIENT : undefined}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ── MicroField ── */

function MicroField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block font-body text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
        {label}
      </span>
      {children}
    </div>
  );
}

/* ── Phases ── */

function DetailsPhase({
  name,
  onNameChange,
  scope,
  onScopeChange,
  currency,
  onCurrencyChange,
  effectiveFrom,
  onEffectiveFromChange,
  effectiveTo,
  onEffectiveToChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  scope: Scope;
  onScopeChange: (v: Scope) => void;
  currency: (typeof CURRENCY_OPTIONS)[number];
  onCurrencyChange: (v: (typeof CURRENCY_OPTIONS)[number]) => void;
  effectiveFrom: string;
  onEffectiveFromChange: (v: string) => void;
  effectiveTo: string;
  onEffectiveToChange: (v: string) => void;
}) {
  return (
    <>
      <Section number="01" title="Card identity" hint="Shown in the rate cards list.">
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 p-4 space-y-4">
          <Field label="Name *">
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Helios FY26"
              className={inputCls}
            />
          </Field>

          <Field label="Scope">
            <ScopeGroup value={scope} onChange={onScopeChange} options={SCOPE_OPTIONS} />
            <p className="mt-1.5 font-body text-[11px] text-text-tertiary">
              {scopeLabel(scope)} — rates apply to matching delivery scope.
            </p>
          </Field>

          <Field label="Currency">
            <CurrencyControl value={currency} onChange={onCurrencyChange} />
          </Field>
        </div>
      </Section>

      <Section number="02" title="Effective period" hint="Leave end date empty for no expiry.">
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <Field label="From">
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => onEffectiveFromChange(e.target.value)}
                className={inputCls}
              />
            </Field>
            <span aria-hidden className="font-body text-[11px] text-text-tertiary text-center pt-5">
              to
            </span>
            <Field label="Until (optional)">
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => onEffectiveToChange(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <p className="font-body text-[11px] text-text-tertiary inline-flex items-center gap-1">
            <CalendarRange className="h-3 w-3" strokeWidth={2} aria-hidden />
            Active cards override expired ones for the same scope.
          </p>
        </div>
      </Section>
    </>
  );
}

function RatesPhase({
  rows,
  validCount,
  onAddRow,
  onRemoveRow,
  onPatchRow,
}: {
  rows: RateRow[];
  validCount: number;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onPatchRow: (id: string, patch: Partial<RateRow>) => void;
}) {
  return (
    <Section
      number="02"
      title="Rate rows"
      hint="One row per role · skill · level combination."
      trailing={
        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
          {validCount} valid · {rows.length} total
        </span>
      }
    >
      <ul className="space-y-2">
        {rows.map((row, idx) => (
          <li key={row.id}>
            <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary tabular-nums">
                  Row {String(idx + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveRow(row.id)}
                  disabled={rows.length === 1}
                  aria-label="Remove row"
                  className={cn(
                    "h-7 w-7 inline-flex items-center justify-center rounded-lg",
                    "border border-stroke-subtle bg-surface",
                    "text-text-tertiary hover:text-error-text hover:bg-error-subtle hover:border-error-border",
                    "disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-fast",
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MicroField label="Role">
                  <input
                    value={row.role}
                    onChange={(e) => onPatchRow(row.id, { role: e.target.value })}
                    placeholder="Designer"
                    className={cellInputCls}
                  />
                </MicroField>
                <MicroField label="Skill">
                  <input
                    value={row.skill}
                    onChange={(e) => onPatchRow(row.id, { skill: e.target.value })}
                    placeholder="Figma"
                    className={cellInputCls}
                  />
                </MicroField>
                <MicroField label="Level">
                  <select
                    value={row.level}
                    onChange={(e) => onPatchRow(row.id, { level: e.target.value })}
                    className={cn(cellInputCls, "pr-2")}
                  >
                    <option value="">—</option>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </MicroField>
                <MicroField label="Region">
                  <input
                    value={row.region}
                    onChange={(e) => onPatchRow(row.id, { region: e.target.value })}
                    placeholder="India"
                    className={cellInputCls}
                  />
                </MicroField>
              </div>
              <MicroField label="Rate (minor units / hour)">
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={row.rateMinor}
                    onChange={(e) => onPatchRow(row.id, { rateMinor: e.target.value })}
                    placeholder="120000"
                    className={cn(cellInputCls, "font-mono tabular-nums pr-24 h-9")}
                  />
                  {row.rateMinor && Number(row.rateMinor) > 0 && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-text-tertiary tabular-nums">
                      = {fmtINR(Number(row.rateMinor))}/h
                    </span>
                  )}
                </div>
              </MicroField>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onAddRow} className={cn(secondaryBtnClass, "h-8 px-3 text-[12.5px]")}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Add row
        </button>
        <button
          type="button"
          disabled
          title="Phase 2"
          className={cn(secondaryBtnClass, "h-8 px-3 text-[12.5px] opacity-50 cursor-not-allowed")}
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Bulk CSV
        </button>
      </div>
    </Section>
  );
}

function ReviewPhase({
  name,
  scope,
  currency,
  effectiveFrom,
  effectiveTo,
  validRows,
  previewAvgMinor,
  previewTotalMinor,
}: {
  name: string;
  scope: Scope;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string;
  validRows: RateRow[];
  previewAvgMinor: number;
  previewTotalMinor: number;
}) {
  return (
    <>
      <Section number="03" title="Summary" hint="Confirm before activating.">
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 p-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <ReviewFact label="Name" value={name || "Untitled card"} />
            <ReviewFact label="Scope" value={scopeLabel(scope)} />
            <ReviewFact label="Currency" value={currency} mono />
            <ReviewFact
              label="Effective"
              value={`${effectiveFrom}${effectiveTo ? ` → ${effectiveTo}` : " → no expiry"}`}
            />
            <ReviewFact label="Rate rows" value={String(validRows.length)} mono />
          </dl>
        </div>
      </Section>

      <Section number="03" title="Rate preview" hint="Sample rows in this card.">
        <ul className="space-y-1.5">
          {validRows.slice(0, 5).map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-stroke-subtle bg-bg-subtle/40"
            >
              <span className="font-body text-[12.5px] text-foreground truncate min-w-0">
                {row.role} · {row.skill} · {row.level}
              </span>
              <span className="font-mono text-[12px] font-semibold tabular-nums shrink-0 text-foreground">
                {fmtINR(Number(row.rateMinor))}/h
              </span>
            </li>
          ))}
          {validRows.length > 5 && (
            <p className="font-body text-[11px] text-text-tertiary px-1">
              + {validRows.length - 5} more row{validRows.length - 5 === 1 ? "" : "s"}
            </p>
          )}
        </ul>
      </Section>

      <Section number="03" title="Impact estimate" hint="Based on 24 active tasks at the average rate.">
        <div className="grid grid-cols-3 gap-2">
          <ImpactStat label="Avg rate / h" value={fmtINR(previewAvgMinor)} />
          <ImpactStat label="Active tasks" value="24" mono />
          <ImpactStat label="Est. cost" value={fmtINR(previewTotalMinor)} emphasis />
        </div>
      </Section>

      <div className="flex items-start gap-2.5 rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        <p className="font-body text-[12px] text-text-secondary leading-relaxed">
          <span className="font-semibold text-foreground">Save & activate</span> applies this card
          to new payout computations immediately. Draft saves without activating.
        </p>
      </div>
    </>
  );
}

function ReviewFact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={cn("mt-0.5 font-body text-[13px] font-medium text-foreground", mono && "font-mono text-[12px] tabular-nums")}>
        {value}
      </dd>
    </div>
  );
}

function ImpactStat({ label, value, emphasis, mono }: { label: string; value: string; emphasis?: boolean; mono?: boolean }) {
  return (
    <div
      className={cn(
        "px-3 py-2.5 rounded-lg border",
        emphasis ? "border-[var(--color-ai-border)] bg-[var(--color-ai-surface)]" : "border-stroke-subtle bg-bg-subtle/40",
      )}
    >
      <p className="font-body text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">{label}</p>
      <p
        className={cn(
          "mt-1 tabular-nums font-semibold",
          mono ? "font-mono text-[14px]" : "font-body text-[15px]",
          emphasis ? "text-[var(--color-ai-text)]" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
