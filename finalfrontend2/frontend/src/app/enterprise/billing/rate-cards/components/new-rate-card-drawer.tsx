"use client";

/**
 * New rate card — gradient-glass drawer with phased flow:
 * Details → Rate rows → Review & save.
 */

import * as React from "react";
import { CalendarRange, CheckCircle2, Plus, Trash2, Upload } from "lucide-react";
import {
  Drawer,
  GlassCard,
  GlassField,
  GlassPhaseRail,
  GlassSection,
  GlassSegmentedControl,
  glassBtnPrimary,
  glassBtnSecondary,
  glassInputCls,
  glassBorder,
  glassSurface,
} from "@/components/meridian";
import type { RateRow as MockRateRow } from "@/lib/enterprise/mocks/rate-cards";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT } from "@/app/admin/_shell/aurora";

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
  // Compute average rate from rows for the "default" field the backend expects.
  const avgRate =
    payload.rows.length > 0
      ? Math.round(
          payload.rows.reduce((a, r) => a + r.rateMinorPerHour, 0) / payload.rows.length,
        )
      : 120_000;

  // Build bySegment from any rows that match standard segment names.
  const segmentKeys: Record<string, string> = {
    "general workforce": "general_workforce",
    "women workforce": "women_workforce",
    student: "student",
    internal: "internal",
  };
  const bySegment: Record<string, number> = {};
  for (const row of payload.rows) {
    const key = segmentKeys[row.role.toLowerCase().trim()];
    if (key) bySegment[key] = row.rateMinorPerHour;
  }

  const body = {
    currency: payload.currency || "INR",
    default: avgRate,
    bySegment: Object.keys(bySegment).length > 0 ? bySegment : undefined,
  };

  const res = await fetch("/api/enterprise/rate-cards-multi", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
    throw new Error(err.error ?? err.detail ?? `Save failed: HTTP ${res.status}`);
  }
}

interface NewRateCardDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** When set, drawer opens in edit mode for an existing card. */
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

    if (editCardId) {
      // Edit mode: pre-fill from backend. Fetch current rate card config.
      fetch("/api/enterprise/rate-cards-multi", { cache: "no-store" })
        .then((r) => r.json())
        .then((data: { rateCards?: { currency?: string; default?: number; bySegment?: Record<string, number> } }) => {
          if (!data.rateCards) return;
          setCurrency(resolveCurrency(data.rateCards.currency ?? "INR"));
          // Reconstruct rows from bySegment + default
          const rows: RateRow[] = [];
          if (data.rateCards.default != null) {
            rows.push({
              id: crypto.randomUUID(),
              role: "General Workforce",
              skill: "Default",
              level: "L2",
              region: "India",
              rateMinor: String(data.rateCards.default),
            });
          }
          for (const [seg, rate] of Object.entries(data.rateCards.bySegment ?? {})) {
            rows.push({
              id: crypto.randomUUID(),
              role: seg.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
              skill: "Default",
              level: "L2",
              region: "India",
              rateMinor: String(rate),
            });
          }
          if (rows.length > 0) setRows(rows);
        })
        .catch(() => {
          // Ignore fetch errors in edit mode — form shows default rows.
        });
      return;
    }

    setName("");
    setScope("tenant");
    setCurrency("INR");
    setEffectiveFrom(today);
    setEffectiveTo("");
    setRows([DEFAULT_ROW()]);
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
  const phaseStep = phase === "details" ? 1 : phase === "rates" ? 2 : 3;

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
    if (validRows.length === 0) {
      return "Add at least one valid rate row (role + positive rate).";
    }
    return null;
  };

  const goNext = () => {
    setSubmitError(null);
    if (phase === "details") {
      const err = validateDetails();
      if (err) {
        setSubmitError(err);
        return;
      }
      setPhase("rates");
      return;
    }
    if (phase === "rates") {
      const err = validateRates();
      if (err) {
        setSubmitError(err);
        return;
      }
      setPhase("review");
    }
  };

  const handleSubmit = async (kind: "draft" | "activate") => {
    setSubmitError(null);
    const err = validateDetails() ?? validateRates();
    if (err) {
      setSubmitError(err);
      return;
    }
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
        {
          cardId: editCardId,
          status: kind === "activate" ? "active" : "draft",
        },
      );
      onSaved?.();
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save rate card");
    } finally {
      setSaving(null);
    }
  };

  const cellInputCls = cn(glassInputCls, "h-8 px-2.5 text-[12.5px]");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="xl"
      appearance="gradient-glass"
      eyebrow="Finance · Rate card"
      title={isEdit ? "Edit rate card" : "New rate card"}
      description={
        isEdit
          ? "Update scope, rates, and validity — then save or activate."
          : "Define scope, add hourly rates, then activate for payout computation."
      }
      footer={
        phase === "details" ? (
          <>
            <button type="button" onClick={onClose} disabled={saving !== null} className={glassBtnSecondary}>
              Cancel
            </button>
            <button type="button" onClick={goNext} className={glassBtnPrimary}>
              Continue to rates
            </button>
          </>
        ) : phase === "rates" ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSubmitError(null);
                setPhase("details");
              }}
              disabled={saving !== null}
              className={glassBtnSecondary}
            >
              Back
            </button>
            <button type="button" onClick={goNext} className={glassBtnPrimary}>
              Review & save
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setSubmitError(null);
                setPhase("rates");
              }}
              disabled={saving !== null}
              className={glassBtnSecondary}
            >
              Edit rates
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit("draft")}
              disabled={saving !== null}
              className={glassBtnSecondary}
            >
              {saving === "draft" ? "Saving…" : "Save as draft"}
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit("activate")}
              disabled={saving !== null}
              className={glassBtnPrimary}
            >
              {saving === "activate" ? "Saving…" : "Save & activate"}
            </button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <GlassPhaseRail steps={["Details", "Rates", "Review"]} current={phaseStep} />

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
            cellInputCls={cellInputCls}
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
            className={cn(glassSurface, "px-3 py-2.5 font-body text-[12px] text-error-text border-error-border/40 bg-error-subtle/30")}
          >
            {submitError}
          </p>
        )}
      </div>
    </Drawer>
  );
}

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
      <GlassSection step="01" title="Card identity" hint="Shown in the rate cards list.">
        <GlassCard className="space-y-4">
          <GlassField label="Name *">
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Helios FY26"
              className={glassInputCls}
            />
          </GlassField>

          <GlassField label="Scope">
            <GlassOptionGroup
              value={scope}
              onChange={onScopeChange}
              options={SCOPE_OPTIONS}
            />
            <p className="mt-1.5 font-body text-[11px] text-text-tertiary">
              {scopeLabel(scope)} — rates apply to matching delivery scope.
            </p>
          </GlassField>

          <GlassField label="Currency">
            <GlassSegmentedControl
              options={CURRENCY_OPTIONS}
              value={currency}
              onChange={onCurrencyChange}
              mono
            />
          </GlassField>
        </GlassCard>
      </GlassSection>

      <GlassSection step="02" title="Effective period" hint="Leave end date empty for no expiry.">
        <GlassCard className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <GlassField label="From">
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => onEffectiveFromChange(e.target.value)}
                className={glassInputCls}
              />
            </GlassField>
            <span aria-hidden className="font-body text-[11px] text-text-tertiary text-center pt-5">
              to
            </span>
            <GlassField label="Until (optional)">
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => onEffectiveToChange(e.target.value)}
                className={glassInputCls}
              />
            </GlassField>
          </div>
          <p className="font-body text-[11px] text-text-tertiary inline-flex items-center gap-1">
            <CalendarRange className="h-3 w-3" strokeWidth={2} aria-hidden />
            Active cards override expired ones for the same scope.
          </p>
        </GlassCard>
      </GlassSection>
    </>
  );
}

function RatesPhase({
  rows,
  validCount,
  onAddRow,
  onRemoveRow,
  onPatchRow,
  cellInputCls,
}: {
  rows: RateRow[];
  validCount: number;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onPatchRow: (id: string, patch: Partial<RateRow>) => void;
  cellInputCls: string;
}) {
  return (
    <GlassSection
      step="02"
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
            <GlassCard className="p-3 space-y-2.5 border-stroke">
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
                    glassBorder,
                    "text-text-tertiary bg-white/45",
                    "hover:text-error-text hover:bg-white/60 hover:border-stroke-strong",
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
            </GlassCard>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onAddRow} className={glassBtnPrimary}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Add row
        </button>
        <button
          type="button"
          disabled
          title="Phase 2"
          className={cn(glassBtnSecondary, "opacity-50 cursor-not-allowed")}
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Bulk CSV
        </button>
      </div>
    </GlassSection>
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
      <GlassSection step="03" title="Summary" hint="Confirm before activating.">
        <GlassCard className="space-y-3">
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
        </GlassCard>
      </GlassSection>

      <GlassSection
        step="03"
        title="Rate preview"
        hint="Sample rows included in this card."
      >
        <ul className="space-y-1.5">
          {validRows.slice(0, 5).map((row) => (
            <li key={row.id}>
              <GlassCard className="px-3 py-2 flex items-center justify-between gap-3 border-stroke">
                <span className="font-body text-[12.5px] text-foreground truncate min-w-0">
                  {row.role} · {row.skill} · {row.level}
                </span>
                <span className="font-mono text-[12px] font-semibold tabular-nums shrink-0">
                  {fmtINR(Number(row.rateMinor))}/h
                </span>
              </GlassCard>
            </li>
          ))}
          {validRows.length > 5 && (
            <p className="font-body text-[11px] text-text-tertiary px-1">
              + {validRows.length - 5} more row{validRows.length - 5 === 1 ? "" : "s"}
            </p>
          )}
        </ul>
      </GlassSection>

      <GlassSection
        step="03"
        title="Impact estimate"
        hint="Based on 24 active tasks at the average rate."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <ImpactStat label="Avg rate / h" value={fmtINR(previewAvgMinor)} />
          <ImpactStat label="Active tasks" value="24" mono />
          <ImpactStat label="Est. cost" value={fmtINR(previewTotalMinor)} emphasis />
        </div>
      </GlassSection>

      <GlassCard className="p-3 flex items-start gap-2.5 border-ai-border bg-ai-surface">
        <CheckCircle2 className="h-4 w-4 text-ai-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        <p className="font-body text-[12px] text-text-secondary leading-relaxed">
          <span className="font-semibold text-foreground">Save & activate</span> applies this card
          to new payout computations immediately. Draft saves without activating (Phase 2).
        </p>
      </GlassCard>
    </>
  );
}

function GlassOptionGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 p-1 rounded-lg",
        "bg-white/45 backdrop-blur-sm",
        glassBorder,
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
      )}
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
              active
                ? "text-white shadow-xs"
                : "text-text-secondary hover:bg-white/65 hover:text-foreground",
            )}
            style={active ? { backgroundImage: AURORA_ACCENT } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function MicroField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block font-body text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
        {label}
      </span>
      {children}
    </div>
  );
}

function ReviewFact({
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
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[13px] font-medium text-foreground",
          mono && "font-mono text-[12px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ImpactStat({
  label,
  value,
  emphasis,
  mono,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  mono?: boolean;
}) {
  return (
    <GlassCard
      className={cn(
        "px-3 py-2.5",
        emphasis && "border-ai-border bg-ai-surface",
      )}
    >
      <p className="font-body text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 tabular-nums font-semibold",
          mono ? "font-mono text-[14px]" : "font-body text-[15px]",
          emphasis ? "text-ai-text" : "text-foreground",
        )}
      >
        {value}
      </p>
    </GlassCard>
  );
}
