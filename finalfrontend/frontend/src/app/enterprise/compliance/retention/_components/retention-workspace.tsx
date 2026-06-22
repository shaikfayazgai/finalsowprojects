"use client";

/**
 * Data retention workspace — per-entity rules with platform floor enforcement.
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
import { ACCENT_TEXT, AURORA_ACCENT, GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import {
  SectionCard,
  TONE,
  primaryBtnClass,
  primaryStyle,
  ghostBtnClass,
  GLASS_FIELD_STYLE,
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

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Governance · Compliance · Retention
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Data retention
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Set how long each data class is kept for this tenant. You may extend beyond the platform floor or retain indefinitely — reducing below the floor is blocked.
        </p>
        <RecordLinks />
      </header>

      <div
        className="rounded-2xl border px-4 py-3 backdrop-blur"
        style={{ background: TONE.ai.soft, borderColor: TONE.ai.border }}
      >
        <p className="font-body text-[13px] font-semibold text-foreground flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 shrink-0" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
          Platform floor applies
        </p>
        <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">
          Minimum retention is enforced server-side. Fixed-period values below the floor are rejected; indefinite retention is always permitted.
        </p>
      </div>

      {errMsg && (
        <div
          className="rounded-2xl border px-4 py-3 flex items-start gap-2.5 backdrop-blur"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border }}
        >
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

      {savedMsg && (
        <div
          className="rounded-2xl border px-4 py-3 font-body text-[12.5px] text-success-text flex items-center gap-2 backdrop-blur"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border }}
        >
          <Check className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {savedMsg}
        </div>
      )}

      <SectionCard
        title="Configuration summary"
        description={isLoading ? "Loading rules…" : `${summary?.total ?? 0} data classes · tenant overrides`}
      >
        <dl className="px-5 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat
            label="Data classes"
            value={isLoading || !summary ? null : String(summary.total)}
          />
          <SummaryStat
            label="Indefinite"
            value={isLoading || !summary ? null : String(summary.indefinite)}
            highlight={Boolean(summary && summary.indefinite > 0)}
          />
          <SummaryStat
            label="Fixed period"
            value={isLoading || !summary ? null : String(summary.fixed)}
          />
          <SummaryStat
            label="Draft issues"
            value={isLoading ? null : String(draftIssues)}
            alert={draftIssues > 0}
          />
        </dl>
      </SectionCard>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-4 border-b border-white/55 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Retention by data class
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              {isDirty ? "Unsaved changes — review and save" : "All rules match last saved state"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isDirty && (
              <button
                type="button"
                onClick={resetDraft}
                disabled={updateMut.isPending}
                className={cn(ghostBtnClass, "h-9 px-3.5 text-[12.5px]")}
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
          <div className="divide-y divide-white/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 sm:px-6 py-4">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-full max-w-lg mb-3" />
                <Skeleton className="h-9 w-64 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-white/60">
            {RETENTION_ENTITIES.map((entity) => {
              const floor = data.floors[entity];
              if (!floor) return null;
              const row = rows[entity];
              const saved = effectiveRule(entity, data.rules);
              const daysNum = Number(row.days);
              const belowFloor =
                row.mode === "days" &&
                ( !Number.isFinite(daysNum) || daysNum < floor.floorDays);

              return (
                <li key={entity} className="px-5 sm:px-6 py-4">
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
      </section>

      <SectionCard title="Audit trail" description="Every save is tamper-evident">
        <p className="font-body text-[13px] text-text-secondary leading-relaxed px-5 sm:px-6 py-5">
          Saving emits a signed{" "}
          <code className="font-mono text-[11px] text-foreground bg-foreground/[0.06] px-1 py-0.5 rounded">
            retention_rules.update
          </code>{" "}
          event with a before/after diff.{" "}
          <Link
            href="/enterprise/audit?actionPrefix=retention_rules"
            className="text-text-secondary font-medium hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            View in audit log
          </Link>
          .
        </p>
      </SectionCard>
    </div>
  );
}

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-4 lg:gap-8">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-body text-[14px] font-semibold text-foreground">{floor.label}</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/65 border border-white/70 backdrop-blur font-mono text-[10px] text-text-tertiary tabular-nums">
            <Clock className="h-3 w-3" strokeWidth={2} aria-hidden />
            floor · {formatDaysHuman(floor.floorDays)}
          </span>
        </div>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary leading-relaxed max-w-xl">
          {floor.rationale}
        </p>
        <p className="mt-2 font-body text-[11px] text-text-tertiary">
          Saved: <span className="font-medium text-text-secondary">{savedLabel}</span>
        </p>
      </div>

      <div className="space-y-3">
        <div
          role="group"
          aria-label={`Retention mode for ${floor.label}`}
          className="inline-flex w-full p-1 rounded-2xl bg-white/45 border border-white/70 backdrop-blur"
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
                style={
                  belowFloor
                    ? {
                        ...GLASS_FIELD_STYLE,
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), linear-gradient(140deg, rgba(255,224,224,0.95), rgba(192,36,54,0.55))",
                      }
                    : GLASS_FIELD_STYLE
                }
                className={cn(
                  "w-28 h-9 px-2.5 rounded-xl backdrop-blur-md",
                  "font-mono text-[13px] text-foreground tabular-nums",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]",
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
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-xl",
        "font-body text-[12px] font-semibold transition-colors duration-fast",
        active
          ? "text-white"
          : "text-text-secondary hover:text-foreground hover:bg-white/60",
      )}
      style={active ? { backgroundImage: AURORA_ACCENT, boxShadow: "0 8px 18px -10px rgba(108,76,230,0.6)" } : undefined}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/compliance"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to compliance
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/compliance/consent"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Consent inventory
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/audit?actionPrefix=retention_rules"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Retention audit events
      </Link>
    </p>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string | null;
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
          "mt-1 font-display text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-error-text" : "text-foreground",
        )}
        style={highlight && !alert ? ACCENT_TEXT : undefined}
      >
        {value === null ? <Skeleton className="h-6 w-12 rounded inline-block" /> : value}
      </dd>
    </div>
  );
}
