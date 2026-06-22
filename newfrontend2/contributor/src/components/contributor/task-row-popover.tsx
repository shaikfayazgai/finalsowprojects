"use client";

/**
 * Task row preview popover — spec §5.D.3.
 *
 * Hover/focus a list row → floating card with project, skill, brief
 * excerpt, and Open workroom CTA. Renders nothing until the parent
 * sets `open`; positions are anchor-based.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ContributorTaskSummary } from "@/lib/api/contributor-tasks";

export function TaskRowPopover({
  task,
  anchorRect,
  onClose,
}: {
  task: ContributorTaskSummary;
  anchorRect: DOMRect | null;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  if (!anchorRect) return null;

  // Position to the right of the row, vertically aligned, with a viewport guard.
  const top = Math.min(
    anchorRect.top + window.scrollY,
    window.scrollY + window.innerHeight - 280,
  );
  const left = Math.min(
    anchorRect.right + 8,
    window.innerWidth - 360,
  );

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Task preview"
      style={{ top, left }}
      className="absolute z-popover w-[340px] rounded-lg border border-stroke bg-surface shadow-xs p-4 space-y-2"
    >
      <div>
        <p className="font-body text-[13.5px] font-semibold text-foreground leading-snug">
          {task.title}
        </p>
        {task.externalKey && (
          <p className="font-mono text-[10.5px] text-text-tertiary">{task.externalKey}</p>
        )}
      </div>

      <dl className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1 font-body text-[11.5px]">
        {task.sow?.tenantName && (
          <>
            <dt className="text-text-tertiary uppercase tracking-wide font-semibold text-[10px]">Project</dt>
            <dd className="text-text-secondary truncate">{task.sow.tenantName}{task.sow.title ? ` · ${task.sow.title}` : ""}</dd>
          </>
        )}
        {task.requiredSkills.length > 0 && (
          <>
            <dt className="text-text-tertiary uppercase tracking-wide font-semibold text-[10px]">Skill</dt>
            <dd className="text-text-secondary truncate">{task.requiredSkills.slice(0, 3).join(" · ")}</dd>
          </>
        )}
        {task.estimatedHours !== null && (
          <>
            <dt className="text-text-tertiary uppercase tracking-wide font-semibold text-[10px]">Effort</dt>
            <dd className="text-text-secondary font-mono tabular-nums">{task.estimatedHours}h</dd>
          </>
        )}
        {task.agreedRatePerHour && task.agreedCurrency && (
          <>
            <dt className="text-text-tertiary uppercase tracking-wide font-semibold text-[10px]">Rate</dt>
            <dd className="text-text-secondary font-mono tabular-nums">
              {task.agreedCurrency === "INR" ? "₹" : `${task.agreedCurrency} `}{task.agreedRatePerHour}/h
            </dd>
          </>
        )}
      </dl>

      {task.acceptanceCriteria && (
        <p className="font-body text-[11.5px] text-text-secondary leading-snug line-clamp-3 italic">
          "{task.acceptanceCriteria}"
        </p>
      )}

      <div className="pt-1">
        <Link
          href={`/contributor/tasks/${task.id}`}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-brand text-on-brand font-body text-[12px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
        >
          Open workroom
          <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
