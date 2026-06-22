"use client";

import * as React from "react";
import { FileUp, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import { GLASS_FIELD_STYLE } from "@/app/admin/_shell/aurora-ui";
import type { IntakeMode } from "./mode-selector";

interface StageScopeProps {
  mode: IntakeMode;
  title: string;
  client: string;
  portfolio: string;
  scopeText: string;
  attachments: File[];
  onChange: (
    patch: Partial<{
      title: string;
      client: string;
      portfolio: string;
      scopeText: string;
      attachments: File[];
    }>,
  ) => void;
}

export const StageScope: React.FC<StageScopeProps> = ({
  mode,
  title,
  client,
  portfolio,
  scopeText,
  attachments,
  onChange,
}) => {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    onChange({ attachments: [...attachments, ...Array.from(files)] });
  };

  const removeAttachment = (idx: number) =>
    onChange({ attachments: attachments.filter((_, i) => i !== idx) });

  const dropZoneHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
  };

  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <header className="px-5 py-3.5 border-b border-stroke-subtle">
        <h2 className="font-display text-[14px] font-semibold text-foreground leading-tight">
          Capture the scope
        </h2>
        <p className="font-body text-[12px] text-text-tertiary mt-0.5 leading-snug">
          {mode === "upload"
            ? "Drop the signed SOW. Title and client autofill from the parse — adjust if needed."
            : mode === "generate"
              ? "Sketch the intent in a paragraph. AI drafts the structured scope on the next step."
              : "Fill the core fields. AI analyzes the scope on the next step."}
        </p>
      </header>

      <div className="px-5 py-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="SOW title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Helios design system Q1"
              style={GLASS_FIELD_STYLE}
              className={inputCls}
            />
          </Field>
          <Field label="Client" required>
            <input
              type="text"
              value={client}
              onChange={(e) => onChange({ client: e.target.value })}
              placeholder="e.g. ACME"
              style={GLASS_FIELD_STYLE}
              className={inputCls}
            />
          </Field>
          <Field label="Portfolio">
            <input
              type="text"
              value={portfolio}
              onChange={(e) => onChange({ portfolio: e.target.value })}
              placeholder="e.g. Design Systems"
              style={GLASS_FIELD_STYLE}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Scope summary" required hint="≥ 50 characters">
          <textarea
            rows={5}
            value={scopeText}
            onChange={(e) => onChange({ scopeText: e.target.value })}
            placeholder={
              mode === "generate"
                ? "Paste the brief or sketch the intent here…"
                : "Describe the engagement — deliverables, constraints, timing…"
            }
            style={GLASS_FIELD_STYLE}
            className={cn(inputCls, "resize-none")}
          />
        </Field>

        {(mode === "upload" || mode === "compose") && (
          <Field label="Attachments" hint="PDF, DOCX up to 25 MB each">
            <div
              {...dropZoneHandlers}
              aria-label="Drop files here or use Choose files"
              className={cn(
                "rounded-lg ring-1 px-4 py-5 transition-colors duration-150",
                "flex flex-col items-center justify-center gap-2 text-center",
                isDragging
                  ? "ring-2 ring-[var(--color-ai-border)] bg-[var(--color-ai-surface)]"
                  : "ring-stroke-subtle bg-bg-subtle",
              )}
            >
              <FileUp
                className={cn(
                  "h-5 w-5 transition-colors duration-150",
                  isDragging ? "text-[var(--color-ai-text)]" : "text-text-tertiary",
                )}
                strokeWidth={2}
                aria-hidden
              />
              <p className="font-body text-[12px] text-text-secondary">
                Drag and drop files, or
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg",
                  "bg-bg-subtle border border-stroke-subtle text-foreground",
                  "font-body text-[11.5px] font-semibold",
                  "hover:bg-bg-subtle transition-colors duration-150",
                )}
              >
                <Paperclip className="h-3 w-3" strokeWidth={2} aria-hidden />
                Choose files
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {attachments.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 rounded-lg bg-bg-subtle ring-1 ring-stroke-subtle px-3 py-2 font-body text-[12px] transition-colors duration-fast hover:bg-bg-subtle"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {f.name}
                    </span>
                    <span className="text-text-tertiary tabular-nums shrink-0">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => removeAttachment(idx)}
                      className="inline-flex items-center justify-center h-6 w-6 rounded-md text-text-tertiary hover:bg-bg-subtle hover:text-foreground transition-colors duration-150"
                    >
                      <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>
        )}
      </div>
    </section>
  );
};

const inputCls = cn(
  "w-full px-3 py-2 rounded-lg",
  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]",
);

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <label className="block">
    <span className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary inline-flex items-center gap-1.5 mb-1.5">
      {label}
      {required && <span aria-hidden className="text-[var(--color-error)]">*</span>}
      {hint && <span className="font-medium normal-case tracking-normal text-text-tertiary">· {hint}</span>}
    </span>
    {children}
  </label>
);
