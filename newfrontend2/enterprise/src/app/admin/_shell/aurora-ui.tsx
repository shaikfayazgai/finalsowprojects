"use client";

/**
 * Aurora Glass — shared presentational primitives for the admin portal.
 *
 * Frosted surfaces, violet→cyan accent, tinted shadows. Logic stays in the
 * page workspaces; these are pure look-and-feel building blocks so every
 * admin screen speaks the same visual language.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronDown, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import {
  ACCENT_TEXT,
  AURORA_ACCENT,
  DASH_CARD,
  GLASS_CARD,
  GLASS_GRADIENT,
  GLASS_PANEL,
  GLASS_PANEL_SHADOW,
  GLASS_SHADOW,
} from "./aurora";

export { ACCENT_TEXT, AURORA_ACCENT, GLASS_CARD, GLASS_SHADOW, GLASS_PANEL, GLASS_PANEL_SHADOW };

/* ─── tones ─── */

export type Tone = "error" | "warning" | "success" | "info" | "ai" | "neutral";

export const TONE: Record<Tone, { text: string; dot: string; soft: string; border: string }> = {
  error: { text: "var(--color-error-text)", dot: "var(--color-error-solid)", soft: "var(--color-error-subtle)", border: "var(--color-error-border)" },
  warning: { text: "var(--color-warning-text)", dot: "var(--color-warning-solid)", soft: "var(--color-warning-subtle)", border: "var(--color-warning-border)" },
  success: { text: "var(--color-success-text)", dot: "var(--color-success-solid)", soft: "var(--color-success-subtle)", border: "var(--color-success-border)" },
  info: { text: "var(--color-info-text)", dot: "var(--color-info-solid)", soft: "var(--color-info-subtle)", border: "var(--color-info-border)" },
  ai: { text: "var(--color-ai-text)", dot: "var(--c-violet-500)", soft: "var(--color-ai-surface)", border: "var(--color-ai-border)" },
  neutral: { text: "var(--color-text-secondary)", dot: "var(--color-text-tertiary)", soft: "rgba(15,23,42,0.05)", border: "rgba(15,23,42,0.10)" },
};

/* ─── buttons ─── */

export const primaryBtnClass = cn(
  "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg shrink-0",
  "text-white font-body text-[13.5px] font-bold",
  "transition-transform duration-fast hover:scale-[1.02] active:scale-100",
  "disabled:opacity-55 disabled:hover:scale-100 disabled:cursor-not-allowed",
);

export const primaryStyle: React.CSSProperties = {
  backgroundImage: AURORA_ACCENT,
  boxShadow: "0 12px 24px -12px rgba(108,76,230,0.6)",
};

/**
 * Pop-up surface — ONE solid-white card on the admin card system (stroke + soft
 * shadow), reduced radius. A dimmed scrim sits behind it so it lifts off the
 * page. The trailing `!` overrides the Modal's default bg/border/shadow/radius.
 */
export const GLASS_MODAL_CLASS =
  "rounded-xl! bg-surface! border-stroke-subtle! shadow-[0_28px_64px_-24px_rgba(16,24,40,0.45)]!";

/** Gentle dim + blur — the page softly recedes; the solid card floats on top. */
export const GLASS_MODAL_OVERLAY = "bg-[rgba(16,20,40,0.42)] backdrop-blur-sm";

/** Footer / action bar — same plain surface, no divider; just aligns padding. */
export const GLASS_MODAL_FOOT = "sm:px-6";

/**
 * Canonical admin pop-up shell — solid white card + tone-tinted header chip +
 * close, with a footer action bar. Children render in a padded body. Every
 * admin modal should use this so they all speak the same language.
 */
export function AdminModal({
  open,
  onClose,
  icon: Icon,
  tone,
  title,
  description,
  footer,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      hideCloseButton
      className={GLASS_MODAL_CLASS}
      overlayClassName={GLASS_MODAL_OVERLAY}
      bodyClassName="p-0"
      footerClassName={GLASS_MODAL_FOOT}
      footer={footer}
    >
      <header className="flex items-start gap-3.5 px-5 sm:px-6 pt-5 pb-4">
        <span
          className="grid place-items-center h-10 w-10 shrink-0 rounded-lg border"
          style={{ background: TONE[tone].soft, borderColor: TONE[tone].border, color: TONE[tone].text }}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="font-display text-[16.5px] font-bold tracking-[-0.01em] text-foreground leading-tight">{title}</h2>
          {description ? <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid place-items-center h-8 w-8 shrink-0 rounded-lg text-text-tertiary hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <X className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </header>
      <div className="px-5 sm:px-6 pb-5">{children}</div>
    </Modal>
  );
}

export const ghostBtnClass = cn(
  "inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg shrink-0",
  "border border-white/80 bg-white/[0.68] backdrop-blur text-foreground font-body text-[13.5px] font-semibold",
  "hover:bg-white/82 transition-colors duration-fast",
  "disabled:opacity-55 disabled:cursor-not-allowed",
);

export const dangerBtnClass = cn(
  "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg shrink-0",
  "text-white font-body text-[13.5px] font-bold bg-[var(--color-error-solid)]",
  "hover:opacity-90 transition-opacity duration-fast",
  "disabled:opacity-55 disabled:cursor-not-allowed",
);

/** Solid secondary button — neutral surface, no glass. The canonical Cancel/back action. */
export const secondaryBtnClass = cn(
  "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg shrink-0",
  "border border-stroke-subtle bg-surface font-body text-[13.5px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast disabled:opacity-55",
);

/* ─── chip ─── */

export function Chip({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-[22px] pl-2 pr-2.5 rounded-full border",
        "font-body text-[11px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap",
        className,
      )}
      style={{ color: TONE[tone].text, background: TONE[tone].soft, borderColor: TONE[tone].border }}
    >
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: TONE[tone].dot }} />}
      {children}
    </span>
  );
}

const TIER_TONE: Record<string, Tone> = {
  Enterprise: "ai",
  Growth: "info",
  Pilot: "neutral",
  Trial: "warning",
};

export function TierBadge({ tier }: { tier: string }) {
  return (
    <Chip tone={TIER_TONE[tier] ?? "neutral"} dot={false}>
      {tier}
    </Chip>
  );
}

/* ─── glass surfaces ─── */

export function GlassCard({
  children,
  className,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(GLASS_CARD, className)} style={{ ...GLASS_SHADOW, ...style }} {...rest}>
      {children}
    </div>
  );
}

/**
 * Glass panel with a hairline header (title + optional description + action)
 * and a body. The workhorse for tenant list/detail sections.
 */
export function SectionCard({
  title,
  description,
  action,
  headerExtra,
  children,
  bodyClassName,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children?: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <GlassCard className={cn("overflow-hidden", className)}>
      {(title || action) && (
        <header className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
            )}
            {description && <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">{description}</p>}
          </div>
          {action}
          {headerExtra}
        </header>
      )}
      {children}
    </GlassCard>
  );
}

/* ─── back navigation ─── */

/**
 * Single back button to the nearest parent. The top bar already renders the
 * full wayfinding/breadcrumb trail, so in-page navigation is just one back
 * link. Keeps the `items` API (parent → … → current) so call sites are
 * unchanged — it links to the last item that has an `href`.
 */
export function Crumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  const parent = [...items].reverse().find((it) => it.href);
  if (!parent?.href) return null;
  return (
    <Link
      href={parent.href}
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      {parent.label}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  chips,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  chips?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-2">{eyebrow}</p>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-[24px] sm:text-[26px] font-semibold tracking-[-0.025em] text-foreground leading-none">
            {title}
          </h1>
          {chips}
        </div>
        {subtitle && <p className="mt-2 font-body text-[13px] text-text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

/* ─── stat ─── */

export function Stat({
  label,
  value,
  tone = "neutral",
  size = "md",
}: {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
  size?: "md" | "lg";
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "mt-1.5 font-display font-semibold tabular-nums leading-none",
          size === "lg" ? "text-[28px]" : "text-[22px]",
        )}
        style={{ color: tone === "neutral" ? "var(--color-foreground)" : TONE[tone].text }}
      >
        {value}
      </dd>
    </div>
  );
}

/* ─── glass KPI stat ─── */

/**
 * Shared KPI card — gradient icon chip + gradient figure on a glass panel.
 * Use on every admin page that shows headline metrics so they stay identical.
 * Pass `href` to make it a navigable tile (lifts on hover).
 */
export function GlassStat({
  label,
  value,
  icon: Icon,
  href,
  hint,
  hintTone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  hint?: React.ReactNode;
  hintTone?: Tone;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">{label}</p>
        {Icon ? (
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white shrink-0"
            style={GLASS_GRADIENT}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-[30px] font-bold tabular-nums leading-none" style={ACCENT_TEXT}>
        {value}
      </p>
      {hint != null ? (
        <p
          className="mt-1.5 font-body text-[11px]"
          style={{ color: hintTone === "neutral" ? "var(--color-text-tertiary)" : TONE[hintTone].text }}
        >
          {hint}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(GLASS_PANEL, "block p-4 transition-transform duration-fast hover:scale-[1.02]")}
        style={GLASS_PANEL_SHADOW}
      >
        {body}
      </Link>
    );
  }
  return (
    <div className={cn(GLASS_PANEL, "p-4")} style={GLASS_PANEL_SHADOW}>
      {body}
    </div>
  );
}

/* ─── solid KPI stat (commercial-gate surface + hierarchy) ─── */

/**
 * Canonical KPI card — solid `DASH_CARD` surface (stroke + soft shadow), a
 * **solid dark** value as the primary read, and the gradient used as a single
 * accent on the icon chip. Radius steps down: card 2xl → chip xl.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  hint,
  hintTone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  hint?: React.ReactNode;
  hintTone?: Tone;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary pt-1.5">{label}</p>
        {Icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white shrink-0" style={GLASS_GRADIENT}>
            <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3.5 font-display text-[33px] font-bold tabular-nums leading-none text-foreground">{value}</p>
      {hint != null ? (
        <p
          className="mt-2 font-body text-[11.5px] font-medium"
          style={{ color: hintTone === "neutral" ? "var(--color-text-tertiary)" : TONE[hintTone].text }}
        >
          {hint}
        </p>
      ) : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn(DASH_CARD, "block p-4 transition-all duration-base hover:border-stroke hover:shadow-[0_14px_30px_-12px_rgba(30,41,59,0.14)]")}>
        {inner}
      </Link>
    );
  }
  return <div className={cn(DASH_CARD, "p-4")}>{inner}</div>;
}

/* ─── banner ─── */

export function Banner({
  tone = "ai",
  icon: Icon,
  title,
  children,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3.5 backdrop-blur"
      style={{ background: TONE[tone].soft, borderColor: TONE[tone].border }}
    >
      <p className="font-body text-[13px] font-bold flex items-center gap-2 text-foreground">
        {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} style={{ color: TONE[tone].text }} aria-hidden />}
        {title}
      </p>
      {children && <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>}
    </div>
  );
}

/* ─── progress ─── */

export function ProgressBar({ pct, className, height = "h-2" }: { pct: number; className?: string; height?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("flex-1 rounded-full overflow-hidden bg-foreground/[0.08]", height)}>
        <div className="h-full rounded-full transition-all duration-base" style={{ width: `${pct}%`, backgroundImage: AURORA_ACCENT }} />
      </div>
      <span className="font-mono text-[11px] font-semibold text-text-secondary tabular-nums shrink-0">{pct}%</span>
    </div>
  );
}

/* ─── tabs ─── */

export interface TabDef {
  key: string;
  label: string;
  badge?: number | null;
  badgeTone?: Tone;
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-wrap gap-1 p-1.5 rounded-xl border border-white/80 bg-white/[0.58] backdrop-blur w-fit", className)}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors duration-fast",
              isActive ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-white/72",
            )}
            style={isActive ? { backgroundImage: AURORA_ACCENT, boxShadow: "0 8px 18px -10px rgba(108,76,230,0.6)" } : undefined}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full font-mono text-[10px] font-bold tabular-nums",
                  isActive ? "bg-white/25 text-white" : "bg-white/80",
                )}
                style={!isActive ? { color: TONE[t.badgeTone ?? "neutral"].text } : undefined}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* ─── form field ─── */

/**
 * Form-field surface. Uses a cool-ink hairline (not white) + brighter fill +
 * inset highlight so the control stays visible even when it sits on top of a
 * glass card (white-on-white otherwise reads as a single flat surface).
 */
export const FIELD_SURFACE = cn(
  "border border-stroke-subtle bg-surface transition-colors",
  "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
);

/**
 * Solid form-control surface. Border + fill live in GLASS_FIELD_CLASS (so a
 * focus or invalid state can override them); the inline style stays empty
 * except for the invalid variant.
 */
export const GLASS_FIELD_STYLE: React.CSSProperties = {
  border: "1px solid var(--color-stroke-subtle)",
  backgroundColor: "var(--color-surface)",
};

const GLASS_FIELD_INVALID_STYLE: React.CSSProperties = {
  border: "1px solid var(--color-error-border)",
  backgroundColor: "var(--color-error-subtle)",
};

export const GLASS_FIELD_CLASS =
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.22)]";

export const inputClass = cn(
  "w-full h-10 px-3 rounded-lg",
  GLASS_FIELD_CLASS,
  "font-body text-[13.5px] text-foreground placeholder:text-text-disabled",
);

/* Glass text input — the Aurora replacement for meridian <Input>. */
export const AuroraInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function AuroraInput({ className, invalid, style, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      style={{ ...(invalid ? GLASS_FIELD_INVALID_STYLE : GLASS_FIELD_STYLE), ...style }}
      className={cn(inputClass, className)}
      {...rest}
    />
  );
});

/* Glass select — the Aurora replacement for meridian <Select>. */
export function AuroraSelect({
  className,
  size = "md",
  style,
  children,
  ...rest
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: "sm" | "md" }) {
  return (
    <div className="relative">
      <select
        style={{ ...GLASS_FIELD_STYLE, ...style }}
        className={cn(
          "appearance-none w-full rounded-lg",
          GLASS_FIELD_CLASS,
          "font-body font-medium text-foreground cursor-pointer",
          size === "sm" ? "h-9 pl-3 pr-8 text-[12.5px]" : "h-10 pl-3 pr-9 text-[13.5px]",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className={cn("absolute top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none", size === "sm" ? "right-2.5 h-4 w-4" : "right-3 h-4 w-4")}
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}

export const textareaClass = cn(
  "w-full px-3 py-2.5 rounded-lg resize-none",
  FIELD_SURFACE,
  "font-body text-[13.5px] text-foreground placeholder:text-text-disabled",
);

/* Glass textarea — same glassmorphism stroke as AuroraInput/AuroraSelect. */
export const AuroraTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function AuroraTextarea({ className, style, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      style={{ ...GLASS_FIELD_STYLE, ...style }}
      className={cn("w-full px-3 py-2.5 rounded-lg resize-none", GLASS_FIELD_CLASS, "font-body text-[13.5px] text-foreground placeholder:text-text-disabled", className)}
      {...rest}
    />
  );
});

export function Field({
  label,
  hint,
  hintTone = "muted",
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  hintTone?: "muted" | "warning" | "success";
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <span className="block font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && <span style={{ color: TONE.error.text }} className="normal-case tracking-normal"> *</span>}
      </span>
      {children}
      {hint && (
        <span
          className="block mt-1 font-body text-[11px]"
          style={{
            color:
              hintTone === "warning" ? TONE.warning.text : hintTone === "success" ? TONE.success.text : "var(--color-text-tertiary)",
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

/* small inline "view all / open" link */
export function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast shrink-0"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
    </Link>
  );
}
