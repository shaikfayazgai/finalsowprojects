"use client";

import * as React from "react";
import { CheckCircle2, ArrowLeft, Info, Sparkles, Loader2, ChevronDown, FileText, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ── Section header bar ── */
export function SectionHeader({
  number, title, onAIFill, aiLoading, onMockFill,
}: {
  number: number;
  title: string;
  onAIFill?: () => void;
  aiLoading?: boolean;
  onMockFill?: () => void;
}) {
  return (
    <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-brown-100 flex items-center justify-center text-[12px] font-bold text-brown-600 shrink-0">
        {number}
      </span>
      <h2 className="text-[16px] font-semibold text-gray-900">{title}</h2>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {onMockFill && (
          <button
            type="button"
            onClick={onMockFill}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all"
          >
            <FlaskConical className="w-3 h-3" /> Fill Mock Data
          </button>
        )}
        {onAIFill && (
          <button
            type="button"
            onClick={onAIFill}
            disabled={aiLoading}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-forest-700 bg-forest-50 hover:bg-forest-100 border border-forest-200 px-3 py-1.5 rounded-xl transition-all disabled:opacity-60"
          >
            {aiLoading
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
              : <><Sparkles className="w-3 h-3" /> Generate with AI</>
            }
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Labelled field wrapper ── */
export function Field({
  label, hint, info, error, children, className,
}: {
  label: string;
  hint?: string;
  info?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [showInfo, setShowInfo] = React.useState(false);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {label}
        </label>
        {info && (
          <div className="relative flex items-center">
            <button
              type="button"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="text-gray-400 hover:text-brown-500 transition-colors"
            >
              <Info className="w-3 h-3" />
            </button>
            {showInfo && (
              <div className="absolute left-5 top-1/2 -translate-y-1/2 z-50 w-56 rounded-xl bg-gray-900 px-3 py-2 shadow-lg whitespace-normal">
                <p className="text-[11px] text-white leading-relaxed">{info}</p>
              </div>
            )}
          </div>
        )}
      </div>
      {hint && <p className="text-[11px] text-gray-400 leading-snug">{hint}</p>}
      {children}
      {error && <p className="text-[11px] text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
}

/* ── Custom dropdown ── */
export function CustomSelect({
  value, onChange, onBlur, options, placeholder, className,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: { value: string; label: string; description?: string }[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onBlur]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          inputCls,
          "flex items-center justify-between text-left gap-2 cursor-pointer",
          !selected && "text-gray-300"
        )}
      >
        <span className="truncate">{selected ? selected.label : (placeholder ?? "Select…")}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full text-left px-4 py-3 transition-colors border-b border-gray-50 last:border-0",
                opt.value === value
                  ? "bg-brown-50 text-brown-700"
                  : "hover:bg-gray-50 text-gray-700"
              )}
            >
              <p className={cn("text-[13px]", opt.value === value ? "font-semibold" : "font-medium")}>
                {opt.label}
              </p>
              {opt.description && (
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{opt.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Subtle background group ── */
export function FieldGroup({
  children, className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl bg-gray-50/60 border border-gray-100 px-5 py-4 space-y-4",
      className,
    )}>
      {children}
    </div>
  );
}

/* ── Consistent input class ── */
export const inputCls =
  "w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-50 transition-colors placeholder:text-gray-300";

/* ── Section footer bar ── */
export function SectionFooter({
  onBack, onComplete, completeLabel = "Mark Complete & Next", variant = "default", loading = false,
}: {
  onBack?: () => void;
  onComplete?: () => void;
  completeLabel?: string;
  variant?: "default" | "generate";
  loading?: boolean;
}) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
      {onBack ? (
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 px-4 py-2.5 rounded-xl transition-all disabled:opacity-60">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      ) : <span />}
      {onComplete && (
        <button
          onClick={onComplete}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 text-[12px] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed",
            variant === "generate"
              ? "text-white bg-gradient-to-r from-brown-500 to-brown-700 hover:from-brown-600 hover:to-brown-800"
              : "text-white bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700"
          )}>
          {loading ? (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : variant === "generate" ? (
            <FileText className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          {loading ? "Generating…" : completeLabel}
        </button>
      )}
    </div>
  );
}
