"use client";

import * as React from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ── Section header bar ── */
export function SectionHeader({
  number, title, fsdRef,
}: { number: number; title: string; fsdRef: string }) {
  return (
    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-brown-100 flex items-center justify-center text-[12px] font-bold text-brown-600 shrink-0">
          {number}
        </span>
        <h2 className="text-[16px] font-semibold text-gray-900">{title}</h2>
      </div>
      <span className="text-[10px] text-gray-400 hidden sm:block">{fsdRef}</span>
    </div>
  );
}

/* ── Labelled field wrapper ── */
export function Field({
  label, hint, error, children, className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      {hint && <p className="text-[11px] text-gray-400 leading-snug">{hint}</p>}
      {children}
      {error && <p className="text-[11px] text-red-500 font-medium mt-1">{error}</p>}
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
  onBack, onComplete, completeLabel = "Mark Complete & Next",
}: {
  onBack?: () => void;
  onComplete: () => void;
  completeLabel?: string;
}) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 px-4 py-2.5 rounded-xl transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      ) : <span />}
      <button
        onClick={onComplete}
        className="flex items-center gap-2 text-[12px] font-semibold text-white bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 px-5 py-2.5 rounded-xl transition-all shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5" /> {completeLabel}
      </button>
    </div>
  );
}
