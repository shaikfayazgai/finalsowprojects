"use client";

import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { primaryBtnClass, primaryStyle, ghostBtnClass } from "@/app/admin/_shell/aurora-ui";

interface ReviewNotFoundProps {
  reviewId: string;
}

/**
 * In-app empty state when a review ID doesn't exist in the QA queue.
 */
export function ReviewNotFound({ reviewId }: ReviewNotFoundProps) {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Link
        href="/enterprise/reviewer/queue"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-medium text-text-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Back to queue
      </Link>

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 py-8 flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/70 bg-white/55 backdrop-blur text-text-secondary shrink-0">
            <FileSearch className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
              Review ID · {reviewId}
            </p>
            <h2 className="font-display text-[18px] font-semibold text-foreground mt-1.5 tracking-[-0.015em]">
              Review not found
            </h2>
            <p className="font-body text-[13px] text-text-secondary mt-2 leading-relaxed max-w-lg">
              This review isn&apos;t in your QA queue. It may have been decided, withdrawn, or
              the link is out of date.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/enterprise/reviewer/queue"
                className={primaryBtnClass}
                style={primaryStyle}
              >
                Open review queue
              </Link>
              <Link
                href="/enterprise/reviewer"
                className={ghostBtnClass}
              >
                QA review dashboard
              </Link>
              <Link
                href="/enterprise/reviewer/history"
                className={ghostBtnClass}
              >
                Decision history
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
