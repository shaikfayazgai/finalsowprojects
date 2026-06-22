"use client";

/**
 * Data retention — configuration form / registry table.
 *   Use-case: operator sets how long each data class is retained for this tenant.
 *             Platform floor blocks reductions; indefinite is always permitted.
 *   Layout: KPI strip (classes · indefinite · fixed · draft issues) →
 *           floor-applies info banner → error/success banners →
 *           DASH_CARD { "Retention by data class" header + Save action →
 *           rules table (inline toggles + number input per entity) } →
 *           audit note card.
 *
 *   De-glassed: DASH_CARD, GLASS_GRADIENT mode pills, solid inputs, no backdrop-blur.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Database,
  Infinity,
  Info,
  Save,
} from "lucide-react";
import {
  useRetentionRules,
  useUpdateRetentionRules,
} from "@/lib/hooks/use-enterprise-retention";
import {
  RETENTION_ENTITIES,
  effectiveRule,
  formatRule,
  type RetentionEntity,
  type RetentionRuleSet,
} from "@/lib/retention";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  StatCard,
  TONE,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";

type RowState = Record<
  RetentionEntity,
  { mode: "indefinite" | "days"; days: string }
>;

function formatDaysHuman(days: number): string {
  if (days >= 365 && days % 365 === 0) {
    const y = days / 365;
    return y === 1 ? "1 year" : `${y} years`;
  }
  if (days >= 30 && days % 30 === 0) {
    const m = days / 30;
    return m === 1 ? "1 month" : `${m} months`;
  }
  return `${days} days`;
}

export function RetentionWorkspace() {
  const { data, isLoading, error } = useRetentionRules();
  const updateMut = useUpdateRetentionRules();

  const [rows, setRows] = React.useState<RowState | null>(null);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!data) return;
    const next = {} as RowState;
    for (const entity of RETENTION_ENTITIES) {
      const rule = effectiveRule(entity, data.rules);
      next[entity] = {
        mode: rule.mode,
        days: rule.days ? String(rule.days) : "",
      };
    }
    setRows(next);
  }, [data]);

  const isDirty = React.useMemo(() => {
    if (!rows || !data) return false;
    for (const entity of RETENTION_ENTITIES) {
      const saved = effectiveRule(entity, data.rules);
      const draft = rows[entity];
      if (draft.mode !== saved.mode) return true;
      if (draft.mode === "days") {
        const savedDays = saved.days != null ? String(saved.days) : "";
        if (draft.days !== savedDays) return true;
      }
    }
    return false;
  }, [rows, data]);

  const draftIssues = React.useMemo(() => {
    if (!rows || !data) return 0;
    let n = 0;
    for (const entity of RETENTION_ENTITIES) {
      const row = rows[entity];
      const floor = data.floors[entity];
      if (!floor) continue;
      if (row.mode === "days") {
        const days = Number(row.days);
        if (!Number.isFinite(days) || days < 1 || days < floor.floorDays) n++;
      }
    }
    return n;
  }, [rows, data]);

  const summary = React.useMemo(() => {
    if (!rows) return null;
    let indefinite = 0;
    let fixed = 0;
    for (const entity of RETENTION_ENTITIES) {
      if (rows[entity].mode === "indefinite") indefinite++;
      else fixed++;
    }
    return { indefinite, fixed, total: RETENTION_ENTITIES.length };
  }, [rows]);

  const setMode = (entity: RetentionEntity, mode: "indefinite" | "days") => {
    setSavedMsg(null);
    setRows((cur) => {
      if (!cur) return cur;
      const floor = data?.floors[entity];
      const fallbackDays = floor ? String(floor.floorDays) : "";
      return {
        ...cur,
        [entity]: {
          mode,
          days:
            mode === "days" && !cur[entity].days ? fallbackDays : cur[entity].days,
        },
      };
    });
  };

  const setDays = (entity: RetentionEntity, value: string) => {
    setSavedMsg(null);
    setRows((cur) =>
      cur ? { ...cur, [entity]: { ...cur[entity], days: value } } : cur,
    );
  };

  const resetDraft = () => {
    if (!data) return;
    const next = {} as RowState;
    for (const entity of RETENTION_ENTITIES) {
      const rule = effectiveRule(entity, data.rules);
      next[entity] = {
        mode: rule.mode,
        days: rule.days ? String(rule.days) : "",
      };
    }
    setRows(next);
    setValidationError(null);
    setSavedMsg(null);
  };

  const doSave = async () => {
    if (!rows || !data) return;
    setSavedMsg(null);
    setValidationError(null);
    const payload: RetentionRuleSet = {};
    for (const entity of RETENTION_ENTITIES) {
      const r = rows[entity];
      const floor = data.floors[entity];
      if (r.mode === "indefinite") {
        payload[entity] = { mode: "indefinite" };
      } else {
        const n = Number(r.days);
        if (!Number.isFinite(n) || n < 1) {
          setValidationError(
            `${floor?.label ?? entity}: enter a positive number of days.`,
          );
          return;
        }
        if (floor && n < floor.floorDays) {
          setValidationError(
            `${floor.label}: minimum is ${formatDaysHuman(floor.floorDays)} (platform floor).`,
          );
          return;
        }
        payload[entity] = { mode: "days", days: n };
      }
    }
    try {
      await updateMut.mutateAsync(payload);
      setSavedMsg("Retention rules saved — change recorded in audit trail.");
    } catch {
      /* error rendered below */
    }
  };

  const errMsg =
    validationError ?? error?.message ?? updateMut.error?.message ?? null;
  const violations =
    updateMut.error && "violations" in updateMut.error
      ? (
          updateMut.error as {
            violations?: Array<{
              entity: string;
              floorDays: number;
              submittedDays: number;
            }>;
          }
        ).violations
      : undefined;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {/* Page header */}
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Governance · Compliance · Retention
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Data retention
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Set how long each data class is kept for this tenant. You may extend beyond the platform floor or retain
          indefinitely — reducing below the floor is blocked.
        </p>
        <RecordLinks />
      </header>

      {/* KPI strip */}
      <section aria-label="Retention configuration summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Data classes"
          value={isLoading || !summary ? "—" : String(summary.total)}
          icon={Database}
        />
        <StatCard
          label="Indefinite"
          value={isLoading || !summary ? "—" : String(summary.indefinite)}
          icon={Infinity}
          hint={summary && summary.indefinite > 0 ? "retained forever" : undefined}
          hintTone="neutral"
        />
        <StatCard
          label="Fixed period"
          value={isLoading || !summary ? "—" : String(summary.fixed)}
          icon={Clock}
          hint="bounded retention rules"
        />
        <StatCard
          label="Draft issues"
          value={isLoading ? "—" : String(draftIssues)}
          icon={AlertCircle}
          hint={draftIssues > 0 ? "below platform floor" : undefined}
          hintTone={draftIssues > 0 ? "error" : "neutral"}
        />
      </section>

      {/* Floor info banner */}
      <div
        className="rounded-lg border px-4 py-3.5 flex items-start gap-3"
        style={{ background: TONE.ai.soft, borderColor: TONE.ai.border }}
      >
        <Database
          className="h-4 w-4 shrink-0 mt-0.5"
          strokeWidth={2}
          style={{ color: TONE.ai.text }}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="font-body text-[13px] font-semibold text-foreground">
            Platform floor applies
          </p>
          <p className="mt-0.5 font-body text-[12.5px] text-text-secondary leading-relaxed">
            Minimum retention is enforced server-side. Fixed-period values below the floor are rejected;
            indefinite retention is always permitted.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {errMsg && (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <div className="flex-1 font-body text-[12.5px] text-error-text">
            {errMsg}
            {violations && violations.length > 0 && (
              <ul className="mt-1.5 list-disc pl-4 space-y-0.5">
                {violations.map((v) => (
                  <li key={v.entity}>
                    <code className="font-mono text-[11px]">{v.entity}</code> requires ≥{" "}
                    {formatDaysHuman(v.floorDays)} (submitted {v.submittedDays} days)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Success banner */}
      {savedMsg && (
        <div
          className="rounded-lg border px-4 py-3 flex items-center gap-2.5"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border }}
        >
          <Check className="h-4 w-4 shrink-0" strokeWidth={2} style={{ color: TONE.success.text }} aria-hidden />
          <p className="font-body text-[12.5px] text-success-text">{savedMsg}</p>
        </div>
      )}

      {/* Rules table */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">
              Retention by data class
            </h2>
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
              {isDirty ? "Unsaved changes — review and save" : "All rules match last saved state"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isDirty && (
              <button
                type="button"
                onClick={resetDraft}
                disabled={updateMut.isPending}
                className={cn(secondaryBtnClass, "h-9 px-3.5 text-[12.5px]")}
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => void doSave()}
              disabled={updateMut.isPending || !isDirty || draftIssues > 0}
              className={cn(primaryBtnClass, "h-9 px-3.5 text-[12.5px]")}
              style={primaryStyle}
            >
              <Save className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {updateMut.isPending ? "Saving…" : "Save rules"}
            </button>
          </div>
        </div>

        {isLoading || !rows || !data ? (
          <RulesSkeleton />
        ) : (
          <ul className="divide-y divide-stroke-subtle">
            {RETENTION_ENTITIES.map((entity) => {
              const floor = data.floors[entity];
              if (!floor) return null;
              const row = rows[entity];
              const saved = effectiveRule(entity, data.rules);
              const daysNum = Number(row.days);
              const belowFloor =
                row.mode === "days" &&
                (!Number.isFinite(daysNum) || daysNum < floor.floorDays);

              return (
                <li key={entity} className="px-5 sm:px-6 py-5">
                  <RetentionEntityRow
                    entity={entity}
                    floor={floor}
                    row={row}
                    savedLabel={formatRule(saved)}
                    belowFloor={belowFloor}
                    onMode={setMode}
                    onDays={setDays}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Audit trail note */}
      <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3.5 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
          Saving emits a signed{" "}
          <code className="font-mono text-[11px] text-foreground bg-foreground/[0.06] px-1 py-0.5 rounded">
            retention_rules.update
          </code>{" "}
          event with a before/after diff.{" "}
          <Link
            href="/enterprise/audit?actionPrefix=retention_rules"
            className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            View in audit log
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/* ─── sub-components ─── */

function RetentionEntityRow({
  entity,
  floor,
  row,
  savedLabel,
  belowFloor,
  onMode,
  onDays,
}: {
  entity: RetentionEntity;
  floor: { floorDays: number; label: string; rationale: string };
  row: { mode: "indefinite" | "days"; days: string };
  savedLabel: string;
  belowFloor: boolean;
  onMode: (entity: RetentionEntity, mode: "indefinite" | "days") => void;
  onDays: (entity: RetentionEntity, value: string) => void;
}) {
  const effectiveLabel =
    row.mode === "indefinite"
      ? "Indefinite"
      : row.days && Number(row.days) > 0
        ? formatDaysHuman(Number(row.days))
        : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(260px,340px)] gap-5 lg:gap-8">
      {/* Description side */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-body text-[14px] font-semibold text-foreground">{floor.label}</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-subtle border border-stroke-subtle font-mono text-[10px] text-text-tertiary tabular-nums">
            <Clock className="h-3 w-3" strokeWidth={2} aria-hidden />
            floor · {formatDaysHuman(floor.floorDays)}
          </span>
        </div>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary leading-relaxed max-w-xl">
          {floor.rationale}
        </p>
        <p className="mt-2 font-body text-[11px] text-text-tertiary">
          Saved:{" "}
          <span className="font-medium text-text-secondary">{savedLabel}</span>
        </p>
      </div>

      {/* Control side */}
      <div className="space-y-3">
        {/* Mode toggle — gradient-pill pattern */}
        <div
          role="group"
          aria-label={`Retention mode for ${floor.label}`}
          className="inline-flex w-full p-1 rounded-lg bg-bg-subtle border border-stroke-subtle"
        >
          <ModeButton
            active={row.mode === "indefinite"}
            onClick={() => onMode(entity, "indefinite")}
            icon={Infinity}
            label="Indefinite"
          />
          <ModeButton
            active={row.mode === "days"}
            onClick={() => onMode(entity, "days")}
            icon={Clock}
            label="Fixed period"
          />
        </div>

        {/* Days input */}
        {row.mode === "days" && (
          <div className="space-y-1.5">
            <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Retain for (days)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={floor.floorDays}
                step="1"
                value={row.days}
                onChange={(e) => onDays(entity, e.target.value)}
                aria-invalid={belowFloor}
                className={cn(
                  "w-28 h-9 px-2.5 rounded-lg font-mono text-[13px] text-foreground tabular-nums",
                  "bg-surface border transition-colors",
                  "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
                  belowFloor
                    ? "border-error-border bg-error-subtle"
                    : "border-stroke-subtle",
                )}
              />
              <span className="font-body text-[12px] text-text-tertiary">
                min {floor.floorDays.toLocaleString()} ({formatDaysHuman(floor.floorDays)})
              </span>
            </div>
            {belowFloor && (
              <p className="font-body text-[11.5px] text-error-text">
                Below platform floor — increase retention or switch to indefinite.
              </p>
            )}
          </div>
        )}

        {/* Draft summary */}
        <p className="font-body text-[11.5px] text-text-tertiary">
          Draft:{" "}
          <span
            className={cn(
              "font-semibold",
              belowFloor ? "text-error-text" : "text-foreground",
            )}
          >
            {effectiveLabel}
          </span>
        </p>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={active ? GLASS_GRADIENT : undefined}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg",
        "font-body text-[12px] font-semibold transition-colors duration-fast",
        active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}

function RulesSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-5 sm:px-6 py-5">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-full max-w-lg mb-4" />
          <Skeleton className="h-9 w-64 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/compliance"
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to compliance
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/compliance/consent"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Consent inventory
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/audit?actionPrefix=retention_rules"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Retention audit events
      </Link>
    </p>
  );
}
