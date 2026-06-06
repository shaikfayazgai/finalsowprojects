"use client";

/**
 * Meridian — AttentionQueue
 *
 * Minimal decision list · two workflow groups, table-style rows.
 * No tabs, icon tiles, or stacked SLA chips — scannable title + meta.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type AttentionKind =
  | "critical"
  | "ai"
  | "sign_off"
  | "sla"
  | "escalation";

export type AttentionCategory = "sow_approval" | "acceptance";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  title: string;
  entity?: string;
  /** Hours until SLA. Negative = past due. */
  slaHours?: number;
  href: string;
  actionLabel?: string;
  category?: AttentionCategory;
}

interface AttentionQueueProps {
  items: AttentionItem[];
  className?: string;
  previewLimit?: number;
}

const PREVIEW_DEFAULT = 3;

function inferCategory(item: AttentionItem): AttentionCategory {
  if (item.category) return item.category;
  return item.href.includes("/enterprise/review/") ? "acceptance" : "sow_approval";
}

function queueHref(category: AttentionCategory): string {
  return category === "acceptance"
    ? "/enterprise/review"
    : "/enterprise/sow?status=approval";
}

function isOverdue(item: AttentionItem): boolean {
  return typeof item.slaHours === "number" && item.slaHours < 0;
}

/* ─────────────────────── Card ─────────────────────── */

export const AttentionQueue: React.FC<AttentionQueueProps> = ({
  items,
  className,
  previewLimit = PREVIEW_DEFAULT,
}) => {
  const enriched = React.useMemo(
    () => items.map((item) => ({ ...item, category: inferCategory(item) })),
    [items],
  );

  const sowItems = enriched.filter((i) => i.category === "sow_approval");
  const reviewItems = enriched.filter((i) => i.category === "acceptance");
  const overdueCount = sowItems.filter(isOverdue).length;

  if (items.length === 0) {
    return (
      <section
        aria-label="Attention queue"
        className={cn(
          "rounded-xl border border-stroke-subtle bg-surface px-5 py-8 text-center",
          className,
        )}
      >
        <CheckCircle2
          className="h-5 w-5 text-success-text mx-auto mb-2"
          strokeWidth={2}
          aria-hidden
        />
        <p className="font-body text-[13px] font-medium text-foreground">All caught up</p>
        <p className="mt-1 font-body text-[12px] text-text-tertiary">
          Nothing needs your decision right now.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Attention queue"
      className={cn(
        "rounded-xl border border-stroke-subtle bg-surface overflow-hidden",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-stroke-subtle">
        <div className="min-w-0">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Attention queue
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            {overdueCount > 0
              ? `${items.length} open · ${overdueCount} approval${overdueCount === 1 ? "" : "s"} overdue`
              : `${items.length} open across approval and acceptance`}
          </p>
        </div>
        <Link
          href={sowItems.length >= reviewItems.length ? queueHref("sow_approval") : queueHref("acceptance")}
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2.5 rounded-md shrink-0",
            "font-body text-[12px] font-medium text-text-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          )}
        >
          View all
          <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
        </Link>
      </header>

      <div className="divide-y divide-stroke-subtle">
        {sowItems.length > 0 && (
          <ItemGroup
            label="SOW approvals"
            count={sowItems.length}
            href={queueHref("sow_approval")}
            items={sowItems}
            previewLimit={previewLimit}
          />
        )}
        {reviewItems.length > 0 && (
          <ItemGroup
            label="Acceptance"
            count={reviewItems.length}
            href={queueHref("acceptance")}
            items={reviewItems}
            previewLimit={previewLimit}
          />
        )}
      </div>
    </section>
  );
};

/* ─────────────────────── Group + rows ─────────────────────── */

function ItemGroup({
  label,
  count,
  href,
  items,
  previewLimit,
}: {
  label: string;
  count: number;
  href: string;
  items: Array<AttentionItem & { category: AttentionCategory }>;
  previewLimit: number;
}) {
  const preview = items.slice(0, previewLimit);
  const overflow = items.length - preview.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-5 py-2.5">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
          {label}
          <span className="ml-1.5 font-mono tabular-nums text-foreground normal-case tracking-normal">
            {count}
          </span>
        </p>
        <Link
          href={href}
          className={cn(
            "font-body text-[11.5px] font-medium text-text-link inline-flex items-center gap-0.5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm",
          )}
        >
          Open
          <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
        </Link>
      </div>

      <ul role="list">
        {preview.map((item) => (
          <li key={item.id} className="border-t border-stroke-subtle">
            <QueueRow item={item} />
          </li>
        ))}
      </ul>

      {overflow > 0 && (
        <div className="px-5 py-2 border-t border-stroke-subtle">
          <Link
            href={href}
            className="font-body text-[11.5px] font-medium text-text-link"
          >
            + {overflow} more
          </Link>
        </div>
      )}
    </div>
  );
}

function QueueRow({ item }: { item: AttentionItem & { category: AttentionCategory } }) {
  const overdue = isOverdue(item);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
      )}
    >
      <span className="font-body text-[13px] font-medium text-foreground truncate min-w-0">
        {item.title}
      </span>
      {item.entity && (
        <span
          className={cn(
            "font-body text-[11px] shrink-0 text-right max-w-[45%] truncate",
            overdue ? "text-warning-text font-medium" : "text-text-tertiary",
          )}
        >
          {overdue ? `Overdue · ${item.entity.split(" · ")[0] ?? item.entity}` : item.entity}
        </span>
      )}
    </Link>
  );
}
