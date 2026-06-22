"use client";

/**
 * Admin notifications — operational alert inbox.
 *
 * Workflow:
 *   1. Filter by category (cases, system, tenants)
 *   2. Scan unread items and open the linked workflow
 *   3. Mark all read when caught up
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Boxes,
  CheckCircle2,
  CheckCheck,
  ChevronRight,
  Flag,
} from "lucide-react";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

type Category = "all" | "cases" | "system" | "tenants";

interface AdminNotice {
  id: string;
  category: "cases" | "system" | "tenants";
  text: string;
  href: string;
  at: string;
  tone: "info" | "warning";
  unread: boolean;
}

const INITIAL_NOTICES: AdminNotice[] = [
  {
    id: "n-1",
    category: "cases",
    text: "GR-1042 (Safety report) assigned to you",
    href: "/admin/governance/GR-1042",
    at: "2026-05-27T06:30:00Z",
    tone: "warning",
    unread: true,
  },
  {
    id: "n-2",
    category: "system",
    text: "payment-router error rate elevated",
    href: "/admin/system-health",
    at: "2026-05-27T05:00:00Z",
    tone: "warning",
    unread: true,
  },
  {
    id: "n-3",
    category: "tenants",
    text: "Reporting Inc. provisioning reached step 3/6",
    href: "/admin/tenants/t-reporting/provisioning",
    at: "2026-05-27T03:00:00Z",
    tone: "info",
    unread: false,
  },
  {
    id: "n-4",
    category: "cases",
    text: "GR-1041 (Dispute) — new internal note added by Sneha",
    href: "/admin/governance/GR-1041",
    at: "2026-05-26T22:00:00Z",
    tone: "info",
    unread: false,
  },
  {
    id: "n-5",
    category: "system",
    text: "ai-orchestrator cold-start spike resolved",
    href: "/admin/system-health",
    at: "2026-05-26T11:00:00Z",
    tone: "info",
    unread: false,
  },
];

const TAB_DEFS: Array<{ key: Category; label: string }> = [
  { key: "all", label: "All" },
  { key: "cases", label: "Cases" },
  { key: "system", label: "System" },
  { key: "tenants", label: "Tenants" },
];

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-medium text-foreground",
  "hover:bg-bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
);

function fmtRelative(iso: string): string {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export function NotificationsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notices, setNotices] = React.useState(INITIAL_NOTICES);
  const [toast, setToast] = React.useState<string | null>(null);

  const cat: Category = (searchParams.get("cat") as Category | null) ?? "all";
  const validCat = TAB_DEFS.some((t) => t.key === cat) ? cat : "all";

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const setCategory = React.useCallback(
    (key: Category) => {
      const next = new URLSearchParams(searchParams.toString());
      if (key === "all") next.delete("cat");
      else next.set("cat", key);
      const qs = next.toString();
      router.replace(qs ? `/admin/notifications?${qs}` : "/admin/notifications", { scroll: false });
    },
    [router, searchParams],
  );

  const rows = validCat === "all" ? notices : notices.filter((n) => n.category === validCat);
  const unreadCount = notices.filter((n) => n.unread).length;

  const tabCounts = React.useMemo(() => {
    const counts: Record<Category, number> = { all: notices.length, cases: 0, system: 0, tenants: 0 };
    for (const n of notices) counts[n.category]++;
    return counts;
  }, [notices]);

  function markAllRead() {
    if (unreadCount === 0) return;
    setNotices((prev) => prev.map((n) => ({ ...n, unread: false })));
    setToast("All notifications marked as read.");
  }

  function markRead(id: string) {
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {toast ? (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-subtle/60 px-4 py-2.5 font-body text-[13px] font-medium text-success-text"
        >
          {toast}
        </div>
      ) : null}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
            Notifications
          </h1>
          <p className="mt-1.5 font-body text-[14px] text-text-secondary">
            {unreadCount > 0
              ? `${unreadCount} unread · ${notices.length} total`
              : "You're caught up — no unread notifications."}
          </p>
        </div>
        <button type="button" onClick={markAllRead} disabled={unreadCount === 0} className={BTN_SECONDARY}>
          <CheckCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
          Mark all read
        </button>
      </header>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <CategoryTabs value={validCat} counts={tabCounts} onChange={setCategory} />
        </div>

        {rows.length === 0 ? (
          <TenantEmptyState
            icon={Bell}
            title="No notifications"
            description={
              validCat === "all"
                ? "Nothing in your inbox right now."
                : `No ${validCat} notifications in this view.`
            }
            action={
              validCat !== "all" ? (
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2"
                >
                  Show all
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-stroke-subtle">
            {rows.map((n) => (
              <NoticeRow key={n.id} notice={n} onOpen={() => markRead(n.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryTabs({
  value,
  counts,
  onChange,
}: {
  value: Category;
  counts: Record<Category, number>;
  onChange: (key: Category) => void;
}) {
  return (
    <div role="tablist" aria-label="Filter by category" className="flex flex-wrap gap-1">
      {TAB_DEFS.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg font-body text-[13px] font-medium transition-colors",
              active ? "admin-tab-on" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle/60",
            )}
          >
            {tab.label}
            <span className={cn("font-mono text-[11px] tabular-nums", active ? "text-text-tertiary" : "text-text-disabled")}>
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NoticeRow({ notice: n, onOpen }: { notice: AdminNotice; onOpen: () => void }) {
  return (
    <li>
      <Link
        href={n.href}
        onClick={onOpen}
        className={cn(
          "group flex items-center gap-3 px-4 sm:px-5 py-4 transition-colors",
          "hover:bg-bg-subtle/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
          n.unread && "bg-info-subtle/20",
        )}
      >
        <NoticeIcon category={n.category} tone={n.tone} />
        <div className="flex-1 min-w-0">
          <p className={cn("font-body text-[13px]", n.unread ? "font-semibold text-foreground" : "text-text-secondary")}>
            {n.text}
          </p>
          <p className="font-mono text-[10.5px] text-text-tertiary mt-0.5 capitalize" suppressHydrationWarning>
            {n.category} · {fmtRelative(n.at)}
          </p>
        </div>
        {n.unread ? (
          <span aria-label="Unread" className="h-2 w-2 rounded-full bg-info-solid shrink-0" />
        ) : null}
        <ChevronRight
          className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0"
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </li>
  );
}

function NoticeIcon({ category, tone }: { category: AdminNotice["category"]; tone: "info" | "warning" }) {
  const Icon =
    category === "cases"
      ? Flag
      : category === "system"
        ? tone === "warning"
          ? AlertTriangle
          : CheckCircle2
        : Boxes;

  const className =
    tone === "warning"
      ? "bg-warning-subtle text-warning-text"
      : category === "cases"
        ? "bg-info-subtle text-info-text"
        : "bg-bg-subtle text-text-secondary";

  return (
    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", className)}>
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
    </span>
  );
}
