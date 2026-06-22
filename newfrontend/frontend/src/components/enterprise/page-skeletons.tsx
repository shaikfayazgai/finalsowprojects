"use client";

import { Skeleton } from "@/components/ui";

/* ═══════════════════════════════════════════════════════════
   DASHBOARD SKELETON
   Layout: Greeting → 4 KPI cards → split (main + aside)
   ═══════════════════════════════════════════════════════════ */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke-subtle space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-stroke-subtle">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SOW LIST SKELETON
   Layout: Header + filters → KPI tiles → sortable table
   ═══════════════════════════════════════════════════════════ */
export function SOWListSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="border-b border-stroke-subtle pb-5 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-md" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-5 py-3 border-t border-stroke-subtle">
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SOW APPROVAL PIPELINE SKELETON
   Layout: Header → 5-stage pipeline columns
   ═══════════════════════════════════════════════════════════ */
export function SOWApprovalSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-3.5 w-80" />
      </div>

      {/* Pipeline stages — 5 columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-4 space-y-4">
            {/* Stage header */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
            {/* SOW cards in stage */}
            {Array.from({ length: i < 2 ? 2 : 1 }).map((_, j) => (
              <div key={j} className="rounded-xl border border-stroke-subtle p-3 space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DECOMPOSITION SKELETON
   Layout: Header → 5 KPI cards → search + filter → table
   ═══════════════════════════════════════════════════════════ */
export function DecompositionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-4 border-b border-stroke-subtle space-y-4">
          <div className="flex justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <Skeleton className="h-8 w-52 rounded-md" />
          </div>
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-sm" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectsSkeleton() {
  return <DecompositionSkeleton />;
}

export function AcceptanceSkeleton() {
  return <DecompositionSkeleton />;
}

export function AcceptanceDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="h-4 w-32 rounded bg-bg-subtle animate-pulse" />
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-bg-subtle animate-pulse" />
        <div className="h-7 w-2/3 max-w-md rounded bg-bg-subtle animate-pulse" />
        <div className="h-4 w-full max-w-lg rounded bg-bg-subtle animate-pulse" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <div className="h-5 w-40 rounded bg-bg-subtle animate-pulse" />
        <div className="h-24 w-full rounded bg-bg-subtle animate-pulse" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <div className="h-5 w-32 rounded bg-bg-subtle animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-full max-w-md rounded bg-bg-subtle animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function ReviewerQueueSkeleton() {
  return <DecompositionSkeleton />;
}

export function ReviewerDetailSkeleton() {
  return <AcceptanceDetailSkeleton />;
}

export function ReviewerHistorySkeleton() {
  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      <div className="h-4 w-36 rounded bg-bg-subtle animate-pulse" />
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-bg-subtle animate-pulse" />
        <div className="h-7 w-48 max-w-md rounded bg-bg-subtle animate-pulse" />
        <div className="h-4 w-full max-w-lg rounded bg-bg-subtle animate-pulse" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <div className="h-5 w-32 rounded bg-bg-subtle animate-pulse" />
          <div className="h-8 w-full max-w-xs rounded bg-bg-subtle animate-pulse" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <div className="h-4 w-full max-w-md rounded bg-bg-subtle animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReviewerMetricsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="h-4 w-36 rounded bg-bg-subtle animate-pulse" />
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-bg-subtle animate-pulse" />
        <div className="h-7 w-40 max-w-md rounded bg-bg-subtle animate-pulse" />
        <div className="h-4 w-full max-w-lg rounded bg-bg-subtle animate-pulse" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
          <div className="h-5 w-36 rounded bg-bg-subtle animate-pulse" />
          <div className="h-4 w-full max-w-sm rounded bg-bg-subtle animate-pulse" />
          <div className="h-16 w-full rounded bg-bg-subtle animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-7 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 flex gap-4 border-b border-stroke-subtle pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full max-w-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEAMS SKELETON
   Layout: Header + info box → 5 KPI cards → search + filter → team grid
   ═══════════════════════════════════════════════════════════ */
export function TeamsSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>

      {/* Info box */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* KPI row — 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-4 text-center space-y-2">
            <Skeleton className="h-6 w-10 mx-auto" />
            <Skeleton className="h-2.5 w-20 mx-auto" />
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Team rows */}
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-stroke-subtle last:border-0">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-2.5 w-32" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-3 w-12" />
            <div className="w-24 space-y-1">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2.5 w-10" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXCEPTIONS SKELETON
   Layout: Header → 6 KPI cards → filters → table
   ═══════════════════════════════════════════════════════════ */
export function ExceptionsSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* KPI tiles — 6 cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-4 space-y-2">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
        <Skeleton className="h-10 w-48 rounded-xl ml-auto" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="grid grid-cols-7 gap-4 px-5 py-3 border-b border-stroke-subtle bg-bg-subtle/50">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 w-14" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4 px-5 py-4 border-b border-stroke-subtle last:border-0 items-center">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REVIEW QUEUE SKELETON
   Layout: Header → 4 stat cards with rings → tabs → 3-col card grid
   ═══════════════════════════════════════════════════════════ */
export function ReviewQueueSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Stat cards — 4 with metric rings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-4 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Card grid — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REVIEW HISTORY SKELETON
   Layout: Breadcrumb → Header → 4 metric cards → filter bar → table
   ═══════════════════════════════════════════════════════════ */
export function ReviewHistorySkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Breadcrumb + header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="flex gap-2 ml-auto">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Metric cards — 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-4 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="grid grid-cols-7 gap-4 px-5 py-3 border-b border-stroke-subtle bg-bg-subtle/50">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-2.5 w-16" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4 px-5 py-4 border-b border-stroke-subtle last:border-0 items-center">
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-2.5 w-2/3" />
            </div>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-18 rounded-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BILLING SKELETON
   Layout: Header → 4 KPI cards → 2-col (chart + payout table) → avg payment
   ═══════════════════════════════════════════════════════════ */
export function BillingSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-full max-w-xs" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full max-w-lg rounded" />
        ))}
      </div>
    </div>
  );
}

export function PayoutsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-full max-w-sm" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PayoutDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full max-w-md rounded" />
        ))}
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function RateCardsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-full max-w-sm" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuditSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-full max-w-sm" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ComplianceSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-4 border-b border-stroke-subtle">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RetentionSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-36" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-4 border-b border-stroke-subtle flex justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md shrink-0" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkforceAnalyticsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-52" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke-subtle">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EconomicAnalyticsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke-subtle">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TenantSettingsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-52" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <Skeleton className="h-[88px] w-full" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-full max-w-xs rounded-md ml-auto" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded" />
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <Skeleton className="h-[88px] w-full" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex gap-2">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex gap-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <Skeleton className="h-[88px] w-full" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden p-5">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SecuritySkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <Skeleton className="h-[120px] w-full" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden p-5">
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function PoliciesSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <Skeleton className="h-[88px] w-full" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded" />
          ))}
        </div>
        <div className="divide-y divide-stroke-subtle p-5 space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function IntegrationDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-36" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden divide-y divide-stroke-subtle">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full max-w-md rounded-md" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );
}

export function IntegrationsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <Skeleton className="h-[88px] w-full" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-full max-w-xs rounded-md ml-auto" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConsentSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-36" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-52" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-full max-w-xs rounded-md ml-auto" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuditDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-7 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="p-5">
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full max-w-lg rounded" />
        ))}
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-20" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

export function RateCardDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-36" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full max-w-lg rounded" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS SKELETON
   Layout: Header → 2-col (sidebar tabs + content panel)
   ═══════════════════════════════════════════════════════════ */
export function SettingsSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3.5 w-64" />
      </div>

      {/* Two-column: sidebar + content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        {/* Content panel */}
        <div className="md:col-span-3 rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] p-6 space-y-6">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-px w-full" />
          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
