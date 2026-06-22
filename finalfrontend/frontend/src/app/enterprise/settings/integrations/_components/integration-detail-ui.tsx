"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { IntegrationMock } from "@/lib/settings/settings-mock";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import {
  AuroraInput,
  AuroraSelect,
  Chip,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "@/app/admin/_shell/aurora-ui";

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function IntegrationDetailShell({
  integration,
  title,
  description,
  children,
  footer,
}: {
  integration: IntegrationMock;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Settings · Integrations
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {title}
          </h1>
          <Chip tone={integration.connected ? "success" : "neutral"}>
            {integration.connected ? "Connected" : "Not connected"}
          </Chip>
        </div>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">{description}</p>
        {(integration.connectedDetail || integration.lastSyncAt) && (
          <p className="mt-1 font-body text-[12px] text-text-secondary">
            {integration.connectedDetail}
            {integration.connectedDetail && integration.lastSyncAt && (
              <span aria-hidden className="mx-1.5 text-text-disabled">
                ·
              </span>
            )}
            {integration.lastSyncAt && <>Last sync {fmtRelative(integration.lastSyncAt)}</>}
          </p>
        )}
      </header>

      {children}

      {footer}
    </div>
  );
}

export function BackLink() {
  return (
    <Link
      href="/enterprise/settings/integrations"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)] rounded-sm transition-colors duration-fast"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to integrations
    </Link>
  );
}

export function ConfigPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className={cn(GLASS_CARD, "overflow-hidden divide-y divide-white/60")} style={GLASS_SHADOW}>
      {children}
    </section>
  );
}

export function ConfigSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 sm:px-6 py-5">
      <div className="mb-3">
        <h2 className="font-display text-[13.5px] font-semibold text-foreground">{title}</h2>
        {hint && <p className="mt-0.5 font-body text-[12px] text-text-secondary">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; disabled?: boolean; hint?: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center min-h-8 px-3.5 py-1.5 rounded-full",
              "font-body text-[12px] font-medium leading-none transition-colors duration-fast",
              active
                ? "text-white border border-transparent"
                : "border border-white/55 bg-white/45 text-text-secondary hover:bg-white/55",
              opt.disabled && "opacity-50 cursor-not-allowed",
            )}
            style={active ? primaryStyle : undefined}
          >
            {opt.label}
            {opt.hint && (
              <span className="ml-1.5 font-body text-[10.5px] text-text-tertiary">{opt.hint}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
      {children}
      {required && <span className="text-error-text ml-0.5">*</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <AuroraInput
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("max-w-xl", mono && "font-mono")}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <AuroraSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-xs"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </AuroraSelect>
  );
}

export function CheckRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer rounded-lg px-2 py-2 -mx-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 accent-brand shrink-0"
      />
      <span className="min-w-0">
        <span className="font-body text-[13px] font-medium text-foreground block">{label}</span>
        {description && (
          <span className="font-body text-[11.5px] text-text-secondary leading-snug">{description}</span>
        )}
      </span>
    </label>
  );
}

export function MappingList({
  rows,
}: {
  rows: Array<{ left: string; right: string }>;
}) {
  return (
    <ul className="rounded-lg border border-white/55 bg-white/40 overflow-hidden divide-y divide-white/60">
      <li className="grid grid-cols-2 gap-3 px-3 py-2 border-b border-white/55">
        <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          Source
        </span>
        <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          Glimmora
        </span>
      </li>
      {rows.map((row, i) => (
        <li key={i} className="grid grid-cols-2 gap-3 px-3 py-2.5 items-center">
          <span className="font-mono text-[11.5px] text-foreground truncate">{row.left}</span>
          <span className="font-body text-[12.5px] text-text-secondary truncate">{row.right}</span>
        </li>
      ))}
    </ul>
  );
}

export function DetailFooter({
  onCancelHref = "/enterprise/settings/integrations",
  onSave,
  saveLabel,
  secondaryAction,
}: {
  onCancelHref?: string;
  onSave: () => void;
  saveLabel: string;
  secondaryAction?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
      {secondaryAction}
      <Link href={onCancelHref} className={ghostBtnClass}>
        Cancel
      </Link>
      <button type="button" onClick={onSave} className={primaryBtnClass} style={primaryStyle}>
        {saveLabel}
      </button>
    </div>
  );
}

export function PhaseNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 sm:px-6 py-3 font-body text-[11.5px] text-text-tertiary border-t border-white/55">
      {children}
    </p>
  );
}
