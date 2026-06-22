"use client";

/**
 * New rate card — full-page de-glassed form.
 * Solid inputs (bg-surface + border-stroke-subtle), DASH_CARD sections.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import {
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";

type Scope = "tenant" | "project" | "sow";

interface RateRow {
  id: string;
  role: string;
  skill: string;
  level: string;
  region: string;
  rateMinor: string;
}

const EMPTY_ROW = (): RateRow => ({
  id: crypto.randomUUID(),
  role: "",
  skill: "",
  level: "",
  region: "",
  rateMinor: "",
});

const LEVELS = ["L1", "L2", "L3", "L4", "L5"] as const;

interface SavePayload {
  currency: string;
  default: number;
}

async function saveRateCard(_payload: SavePayload): Promise<void> {
  await new Promise((r) => setTimeout(r, 120));
}

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

/* ── solid field input — de-glassed ── */
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

export default function NewRateCardPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [scope, setScope] = React.useState<Scope>("tenant");
  const [currency, setCurrency] = React.useState("INR");
  const today = new Date().toISOString().slice(0, 10);
  const [effectiveFrom, setEffectiveFrom] = React.useState(today);
  const [effectiveTo, setEffectiveTo] = React.useState("");
  const [rows, setRows] = React.useState<RateRow[]>([
    {
      id: crypto.randomUUID(),
      role: "Designer",
      skill: "Figma",
      level: "L2",
      region: "India",
      rateMinor: "120000",
    },
  ]);

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<"draft" | "activate" | null>(null);

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
    const sum = validRows.reduce((a, r) => a + Number(r.rateMinor), 0);
    return Math.round(sum / validRows.length);
  }, [validRows]);
  const previewTotalMinor = previewAvgMinor * 24;

  const addRow = () => setRows((r) => [...r, EMPTY_ROW()]);
  const removeRow = (id: string) =>
    setRows((r) => (r.length === 1 ? r : r.filter((x) => x.id !== id)));
  const patchRow = (id: string, patch: Partial<RateRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const validate = (): string | null => {
    if (!name.trim()) return "Name is required.";
    if (!effectiveFrom) return "Effective from date is required.";
    if (validRows.length === 0) return "Add at least one valid rate row (role + positive rate).";
    return null;
  };

  const handleSubmit = async (kind: "draft" | "activate") => {
    setSubmitError(null);
    const err = validate();
    if (err) { setSubmitError(err); return; }
    setSaving(kind);
    try {
      if (kind === "activate") {
        const sum = validRows.reduce((a, r) => a + Number(r.rateMinor), 0);
        const avg = Math.round(sum / validRows.length);
        await saveRateCard({ currency, default: avg });
      }
      router.push("/enterprise/billing/rate-cards");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save rate card");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Back nav */}
      <Link
        href="/enterprise/billing/rate-cards"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        Rate cards
      </Link>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Finance
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          New rate card
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-secondary">
          Configure the card, add rate rows, preview the impact, then save.
        </p>
      </header>

      {/* Section 01 — Identity */}
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <SectionHeader step="01" title="Card identity" />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Helios FY26"
              className={inputCls}
            />
          </Field>

          <Field label="Currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputCls}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </Field>

          <Field label="Scope" className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-1">
              <Radio name="scope" value="tenant" checked={scope === "tenant"} onChange={() => setScope("tenant")} label="Tenant-wide" />
              <Radio name="scope" value="project" checked={scope === "project"} onChange={() => setScope("project")} label="Specific projects" />
              <Radio name="scope" value="sow" checked={scope === "sow"} onChange={() => setScope("sow")} label="Per SOW" />
            </div>
          </Field>

          <Field label="Effective from" required>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Effective to">
            <input
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
              placeholder="no expiry"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Section 02 — Rates table */}
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 py-3 border-b border-stroke-subtle flex items-center justify-between">
          <div>
            <SectionHeader step="02" title="Rates" inline />
          </div>
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
            {validRows.length} valid row{validRows.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Rate rows">
            <thead className="bg-bg-subtle/50 border-b border-stroke-subtle">
              <tr>
                <Th>Role</Th>
                <Th>Skill</Th>
                <Th>Level</Th>
                <Th>Region</Th>
                <Th align="right">Rate (minor / h)</Th>
                <Th align="right">Preview</Th>
                <th aria-hidden className="w-9" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-stroke-subtle">
                  <Td>
                    <input
                      value={row.role}
                      onChange={(e) => patchRow(row.id, { role: e.target.value })}
                      placeholder="Designer"
                      className={cellInputCls}
                    />
                  </Td>
                  <Td>
                    <input
                      value={row.skill}
                      onChange={(e) => patchRow(row.id, { skill: e.target.value })}
                      placeholder="Figma"
                      className={cellInputCls}
                    />
                  </Td>
                  <Td>
                    <select
                      value={row.level}
                      onChange={(e) => patchRow(row.id, { level: e.target.value })}
                      className={cn(cellInputCls, "pr-2")}
                    >
                      <option value="">—</option>
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <input
                      value={row.region}
                      onChange={(e) => patchRow(row.id, { region: e.target.value })}
                      placeholder="India"
                      className={cellInputCls}
                    />
                  </Td>
                  <Td align="right">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={row.rateMinor}
                      onChange={(e) => patchRow(row.id, { rateMinor: e.target.value })}
                      placeholder="120000"
                      className={cn(cellInputCls, "font-mono tabular-nums text-right")}
                    />
                  </Td>
                  <Td align="right">
                    <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
                      {row.rateMinor && Number(row.rateMinor) > 0
                        ? `${fmtINR(Number(row.rateMinor))}/h`
                        : "—"}
                    </span>
                  </Td>
                  <td className="px-2 py-2 align-middle">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      aria-label="Remove row"
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-text-tertiary hover:text-error-text hover:bg-error-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-fast"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/40">
          <button
            type="button"
            onClick={addRow}
            className={cn(secondaryBtnClass, "h-8 px-3 text-[12.5px]")}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
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
          <select
            disabled
            title="Phase 2"
            className={cn(
              "h-8 px-2.5 rounded-lg bg-surface border border-stroke-subtle",
              "font-body text-[12px] font-semibold text-text-tertiary cursor-not-allowed opacity-50",
            )}
          >
            <option>Use template…</option>
          </select>
        </div>
      </section>

      {/* Section 03 — Preview */}
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <SectionHeader step="03" title="Impact preview" />
        <div className="px-5 py-4">
          {validRows.length === 0 ? (
            <p className="font-body text-[12.5px] text-text-tertiary italic">
              Add at least one rate row to see the impact preview.
            </p>
          ) : (
            <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
              At an average rate of{" "}
              <span className="font-mono text-foreground tabular-nums font-semibold">
                {fmtINR(previewAvgMinor)}/h
              </span>
              , this card would have priced{" "}
              <span className="font-mono text-foreground tabular-nums font-semibold">24</span>{" "}
              active tasks at{" "}
              <span className="font-mono text-foreground tabular-nums font-semibold">
                {fmtINR(previewTotalMinor)}
              </span>{" "}
              total.
            </p>
          )}
        </div>
      </section>

      {submitError && (
        <p className="rounded-lg border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text">
          {submitError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/enterprise/billing/rate-cards"
          className={secondaryBtnClass}
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={() => handleSubmit("draft")}
          disabled={saving !== null}
          className={secondaryBtnClass}
        >
          {saving === "draft" ? "Saving…" : "Save as draft"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("activate")}
          disabled={saving !== null}
          className={cn(primaryBtnClass, "h-9 px-3.5 text-[13px]")}
          style={primaryStyle}
        >
          {saving === "activate" ? "Saving…" : "Save & activate"}
        </button>
      </div>
    </div>
  );
}

/* ── primitives ── */

function SectionHeader({
  step,
  title,
  inline,
}: {
  step: string;
  title: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-text-disabled">{step}</span>
        <h2 className="font-display text-[13.5px] font-bold text-foreground tracking-[-0.01em]">{title}</h2>
      </div>
    );
  }
  return (
    <div className="px-5 py-3 border-b border-stroke-subtle flex items-baseline gap-2">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-text-disabled">{step}</span>
      <h2 className="font-display text-[13.5px] font-bold text-foreground tracking-[-0.01em]">{title}</h2>
    </div>
  );
}

function Field({
  label,
  required = false,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && <span className="text-error-text normal-case tracking-normal"> *</span>}
      </label>
      {children}
    </div>
  );
}

function Radio({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer font-body text-[12.5px] text-foreground">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5"
        style={{ accentColor: "var(--c-violet-500)" }}
      />
      {label}
    </label>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      scope="col"
      className={cn(
        "font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary",
        "px-3 py-2.5",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td className={cn("px-3 py-2 align-middle", align === "right" ? "text-right" : "text-left")}>
      {children}
    </td>
  );
}
