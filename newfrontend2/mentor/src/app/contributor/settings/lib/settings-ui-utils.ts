import { cn } from "@/lib/utils/cn";

export const settingsInputCls = cn(
  "w-full h-9 px-3 rounded-md bg-surface border border-stroke",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);

export const settingsFieldLabelCls =
  "block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5";

export const settingsPrimaryBtnCls = cn(
  "inline-flex items-center h-8 px-3 rounded-md",
  "bg-brand text-[var(--color-on-primary)] font-body text-[12.5px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

export const settingsSecondaryBtnCls = cn(
  "inline-flex items-center h-8 px-3 rounded-md",
  "bg-surface border border-stroke font-body text-[12.5px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

export const settingsSectionCls = "rounded-xl border border-stroke-subtle bg-surface overflow-hidden";

export const settingsSectionHeaderCls =
  "px-5 py-3.5 border-b border-stroke-subtle flex items-center gap-2";

export const settingsSectionFooterCls =
  "flex items-center justify-end gap-2 px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/60";

export const settingsRowCls =
  "px-5 min-h-[56px] py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-bg-subtle/60 transition-colors duration-fast";
