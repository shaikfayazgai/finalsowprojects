"use client";

/**
 * Task filter drawer — spec doc 01 §5.D.2.
 *
 * Slides in from the right; ESC closes; click-outside closes.
 * Filter set:
 *   - State (multi-check): assigned / accepted / in_progress / blocked /
 *     awaiting_clarification / ready_to_submit / revision_requested
 *   - Project (dropdown)
 *   - Skill (dropdown)
 *   - Priority (radio): any / p0 / p0p1
 *   - Due (radio): any / this_week / overdue
 *
 * Persistence is the caller's responsibility — `onApply` returns the
 * full filter set so the parent can sync to URL query params per the
 * spec's edge case.
 *
 * Phase-1 data gap: TaskDefinition has no priority field. The Priority
 * radio is rendered for spec fidelity but is a no-op against current
 * data; flagged inline so the user knows.
 */

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type FilterState =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "blocked"
  | "awaiting_clarification"
  | "ready_to_submit"
  | "revision_requested";

export type FilterPriority = "any" | "p0" | "p0p1";
export type FilterDue = "any" | "this_week" | "overdue";

export interface DrawerFilters {
  states: FilterState[];
  project: string; // tenantId or "all"
  skill: string;
  priority: FilterPriority;
  due: FilterDue;
}

export const EMPTY_FILTERS: DrawerFilters = {
  states: [],
  project: "all",
  skill: "all",
  priority: "any",
  due: "any",
};

const STATE_OPTIONS: Array<{ key: FilterState; label: string }> = [
  { key: "assigned", label: "Assigned" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "awaiting_clarification", label: "Awaiting clarification" },
  { key: "ready_to_submit", label: "Ready to submit" },
  { key: "revision_requested", label: "Revision requested" },
];

export function countActiveFilters(f: DrawerFilters): number {
  let n = 0;
  n += f.states.length;
  if (f.project !== "all") n++;
  if (f.skill !== "all") n++;
  if (f.priority !== "any") n++;
  if (f.due !== "any") n++;
  return n;
}

interface Props {
  open: boolean;
  initial: DrawerFilters;
  projectOptions: Array<[string, string]>; // [id, name]
  skillOptions: string[];
  onApply: (f: DrawerFilters) => void;
  onClose: () => void;
}

export function TaskFilterDrawer({
  open,
  initial,
  projectOptions,
  skillOptions,
  onApply,
  onClose,
}: Props) {
  const [draft, setDraft] = React.useState<DrawerFilters>(initial);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  // Seed the draft from the latest `initial` whenever the drawer opens.
  React.useEffect(() => {
    if (open) {
      setDraft(initial);
      triggerRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => closeRef.current?.focus());
    }
  }, [open, initial]);

  // ESC closes; restore focus to the trigger.
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleState = (s: FilterState) => {
    setDraft((d) => ({
      ...d,
      states: d.states.includes(s) ? d.states.filter((x) => x !== s) : [...d.states, s],
    }));
  };

  const handleReset = () => setDraft(EMPTY_FILTERS);

  const handleApply = () => {
    onApply(draft);
    onClose();
    triggerRef.current?.focus();
  };

  const activeCount = countActiveFilters(draft);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-drawer-title"
      className="fixed inset-0 z-modal"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close filters"
        onClick={() => {
          onClose();
          triggerRef.current?.focus();
        }}
        className="absolute inset-0 bg-black/30"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute top-0 right-0 h-full w-full max-w-sm bg-surface shadow-lg border-l border-stroke flex flex-col animate-slide-in-right"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-stroke-subtle shrink-0">
          <h2 id="filter-drawer-title" className="font-body text-[14px] font-semibold text-foreground">
            Filters
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => {
              onClose();
              triggerRef.current?.focus();
            }}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {/* State */}
          <fieldset>
            <legend className="font-body text-[11.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
              State
            </legend>
            <div className="space-y-1.5">
              {STATE_OPTIONS.map((s) => (
                <label
                  key={s.key}
                  className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={draft.states.includes(s.key)}
                    onChange={() => toggleState(s.key)}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Project */}
          <fieldset>
            <legend className="font-body text-[11.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
              Project
            </legend>
            <select
              value={draft.project}
              onChange={(e) => setDraft((d) => ({ ...d, project: e.target.value }))}
              className={selectCls}
            >
              <option value="all">All projects</option>
              {projectOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </fieldset>

          {/* Skill */}
          <fieldset>
            <legend className="font-body text-[11.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
              Skill
            </legend>
            <select
              value={draft.skill}
              onChange={(e) => setDraft((d) => ({ ...d, skill: e.target.value }))}
              className={selectCls}
            >
              <option value="all">All skills</option>
              {skillOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </fieldset>

          {/* Priority */}
          <fieldset>
            <legend className="font-body text-[11.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
              Priority
            </legend>
            <div role="radiogroup" className="space-y-1.5">
              {[
                { value: "any" as const, label: "Any" },
                { value: "p0" as const, label: "P0 only" },
                { value: "p0p1" as const, label: "P0 + P1" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={opt.value}
                    checked={draft.priority === opt.value}
                    onChange={() => setDraft((d) => ({ ...d, priority: opt.value }))}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="mt-1 font-body text-[10.5px] text-text-tertiary italic">
              Phase 1 data has no priority field; filter is a no-op for now.
            </p>
          </fieldset>

          {/* Due */}
          <fieldset>
            <legend className="font-body text-[11.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
              Due
            </legend>
            <div role="radiogroup" className="space-y-1.5">
              {[
                { value: "any" as const, label: "Any" },
                { value: "this_week" as const, label: "This week" },
                { value: "overdue" as const, label: "Overdue" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer"
                >
                  <input
                    type="radio"
                    name="due"
                    value={opt.value}
                    checked={draft.due === opt.value}
                    onChange={() => setDraft((d) => ({ ...d, due: opt.value }))}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="flex items-center justify-between gap-2 px-4 py-3 border-t border-stroke-subtle bg-bg-subtle shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className={cn(
              "inline-flex items-center h-9 px-3.5 rounded-md shadow-xs",
              "bg-brand text-on-brand",
              "font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
            )}
          >
            Apply {activeCount > 0 ? `${activeCount} filter${activeCount === 1 ? "" : "s"}` : "filters"}
          </button>
        </footer>
      </div>
    </div>
  );
}

const selectCls = cn(
  "w-full h-9 px-3 rounded-md bg-surface border border-stroke",
  "font-body text-[13px] text-foreground",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);
