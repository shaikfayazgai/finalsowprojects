"use client";

import * as React from "react";
import Link from "next/link";
import {
  Send,
  Save,
  ChevronLeft,
  Eye,
  ArrowUpRight,
  GitCompare,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ReadinessBar } from "@/app/contributor/_shared/primitives";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface SubmissionFlowFooterProps {
  task: WorkroomTask;
  declarationChecked: boolean;
  onSubmit: () => void;
  onSaveDraft: () => void;
}

/**
 * Submission Flow Footer — the moment of commit.
 *
 * Sticky at the bottom. Soft pressure visualization (readiness bar + signal
 * counts) but never a hard block. Submit is disabled until the declaration
 * checkbox is ticked — the only true gate, and it's a contributor-controlled
 * one.
 *
 * Provides escape hatches: Back to workroom · Save draft · Preview.
 */
export function SubmissionFlowFooter({
  task,
  declarationChecked,
  onSubmit,
  onSaveDraft,
}: SubmissionFlowFooterProps) {
  const r = task.submissionReadiness;
  const isRework = (task.reworkRound ?? 0) > 0;

  return (
    <div className="sticky bottom-0 z-30 -mx-8 px-8 py-3 bg-white/95 backdrop-blur-md border-t border-beige-200">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Readiness pill */}
        <div className="inline-flex items-center gap-3 rounded-xl border border-beige-200 bg-white px-3 py-1.5">
          <div className="w-32">
            <ReadinessBar value={r.overall} size="sm" />
          </div>
          <span className="text-[10.5px] text-beige-700 hidden md:inline">
            {r.overall >= 90
              ? "Looking great"
              : r.overall >= 70
              ? "Almost ready"
              : r.overall >= 40
              ? "Making progress"
              : "Soft pressure, no block"}
          </span>
        </div>

        {/* Quick actions */}
        <div className="hidden md:flex items-center gap-1.5">
          <Link
            href={`/contributor/tasks/${task.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-2.5 text-[11.5px] font-semibold text-brown-900 hover:bg-beige-50/60"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to workroom
          </Link>
          <FooterButton icon={Save} label="Save draft" onClick={onSaveDraft} />
          <FooterButton icon={Eye} label="Preview" />
          {isRework && <FooterButton icon={GitCompare} label="Compare versions" />}
        </div>

        {/* Spacer */}
        <span className="flex-1 hidden md:block" />

        {/* Submit */}
        <div className="flex flex-col items-end gap-1 ml-auto">
          <button
            type="button"
            onClick={() => declarationChecked && onSubmit()}
            disabled={!declarationChecked}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-xl px-6 text-[13.5px] font-bold transition-all",
              declarationChecked
                ? "bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:shadow-md"
                : "bg-beige-200 text-beige-600 cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
            Submit for review
            {declarationChecked && <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />}
          </button>
          {!declarationChecked && (
            <span className="inline-flex items-center gap-1 text-[10.5px] text-beige-600">
              <AlertCircle className="h-3 w-3" />
              Tick the declaration above to enable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FooterButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-2.5 text-[11.5px] font-semibold text-brown-900 hover:bg-beige-50/60"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
