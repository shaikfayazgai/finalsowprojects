"use client";

/**
 * Help workspace — FAQ search + sticky quick actions (matches Credentials / Earnings).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  LifeBuoy,
  MessageSquarePlus,
  Scale,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { useSupportIndex } from "@/lib/hooks/use-contributor-support";
import type { MockGrievance, MockSafetyCase, MockTicket } from "@/mocks/contributor/support";
import { cn } from "@/lib/utils/cn";
import { SupportSkeleton } from "./support-skeleton";
import {
  faqEntryHaystack,
  flattenFaqs,
  fmtRelative,
  fmtUpdatedDate,
  grievanceStatusChip,
  grievanceStatusLabel,
  grievanceTypeLabel,
  safetyStatusChip,
  safetyStatusLabel,
  ticketCategoryLabel,
  ticketStatusChip,
  ticketStatusLabel,
  type FlatFaqEntry,
} from "../lib/support-ui-utils";

export function SupportWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const topic = searchParams.get("topic") ?? "all";

  const [searchDraft, setSearchDraft] = React.useState(search);
  React.useEffect(() => setSearchDraft(search), [search]);

  const { data, isLoading, error, refetch } = useSupportIndex();
  const loading = isLoading && !data;

  const faqs = data?.faqs ?? [];
  const tickets = data?.tickets ?? [];
  const safetyCases = data?.safetyCases ?? [];
  const grievances = data?.grievances ?? [];
  const flatFaqs = React.useMemo(() => flattenFaqs(faqs), [faqs]);
  const topics = React.useMemo(() => faqs.map((g) => ({ id: g.id, title: g.title })), [faqs]);

  const topicCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: flatFaqs.length };
    for (const group of faqs) {
      counts[group.id] = group.entries.length;
    }
    return counts;
  }, [faqs, flatFaqs.length]);

  const activeTopic =
    topic === "all" || topics.some((t) => t.id === topic) ? topic : "all";

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`/contributor/support?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const stats = React.useMemo(() => {
    const openTickets = tickets.filter((t) => t.status !== "resolved").length;
    const activeCases =
      safetyCases.filter((c) => c.status !== "resolved").length +
      grievances.filter((g) => g.status !== "resolved").length;
    return {
      openTickets,
      activeCases,
      faqArticles: flatFaqs.length,
      totalTickets: tickets.length,
    };
  }, [tickets, safetyCases, grievances, flatFaqs.length]);

  const filteredFaqs = React.useMemo(() => {
    let items = flatFaqs;
    if (activeTopic !== "all") items = items.filter((e) => e.groupId === activeTopic);
    const needle = search.trim().toLowerCase();
    if (needle) {
      items = items.filter((e) => faqEntryHaystack({ id: e.groupId, title: e.groupTitle, entries: [] }, e.q, e.a).includes(needle));
    }
    return items;
  }, [flatFaqs, activeTopic, search]);

  const faqDescription =
    filteredFaqs.length === 0
      ? search.trim() || activeTopic !== "all"
        ? "No matching answers"
        : "No FAQs available"
      : `${filteredFaqs.length} answer${filteredFaqs.length === 1 ? "" : "s"}`;

  if (loading) {
    return <SupportSkeleton />;
  }

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <ErrorPanel message={(error as Error).message} onRetry={() => void refetch()} />
      ) : null}

      <DashboardSection
        title="Support overview"
        description="Typical ticket response within 24 hours on business days"
      >
        <dl className="grid grid-cols-3 gap-x-8 gap-y-4 max-w-lg">
          <SummaryStat label="Open tickets" value={String(stats.openTickets)} highlight={stats.openTickets > 0} />
          <SummaryStat label="Active cases" value={String(stats.activeCases)} highlight={stats.activeCases > 0} />
          <SummaryStat label="FAQ articles" value={String(stats.faqArticles)} highlight={stats.faqArticles > 0} />
        </dl>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden min-w-0">
          <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
              <div>
                <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                  Frequently asked questions
                </h2>
                <p className="mt-1 font-body text-[12.5px] text-text-secondary">{faqDescription}</p>
              </div>
              <div className="relative w-full sm:w-56 shrink-0">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                  strokeWidth={2}
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(e) => {
                    setSearchDraft(e.target.value);
                    setParam({ q: e.target.value.trim() || null });
                  }}
                  placeholder="Search help…"
                  aria-label="Search FAQs"
                  className={cn(
                    "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                    "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                    "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                  )}
                />
                {searchDraft ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchDraft("");
                      setParam({ q: null });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                ) : null}
              </div>
            </div>

            {topics.length > 1 ? (
              <nav aria-label="Filter FAQs by topic" className="flex flex-wrap gap-x-1 -mb-px">
                {[{ id: "all", title: "All" }, ...topics].map((tab) => {
                  const active = activeTopic === tab.id;
                  const count = topicCounts[tab.id] ?? 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setParam({ topic: tab.id === "all" ? null : tab.id })}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                        "font-body text-[13px] font-medium whitespace-nowrap",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                        active ? "text-foreground" : "text-text-secondary",
                      )}
                    >
                      {tab.title}
                      <span
                        className={cn(
                          "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                          active
                            ? "bg-brand-subtle text-brand-subtle-text"
                            : "text-text-tertiary",
                        )}
                      >
                        {count}
                      </span>
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            ) : null}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-body text-[13px] font-semibold text-foreground">No matching answers</p>
              <p className="mt-1 font-body text-[12px] text-text-tertiary">
                Try another search term or open a support ticket below.
              </p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-stroke-subtle">
              {filteredFaqs.map((entry, i) => (
                <FaqRow key={`${entry.groupId}-${i}`} entry={entry} />
              ))}
            </ul>
          )}
        </section>

        <aside className="xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain space-y-4">
          <QuickActionCard
            icon={MessageSquarePlus}
            title="Open a ticket"
            description="Can't find an answer? We respond within 24h on business days."
            href="/contributor/support/tickets/new"
            cta="New ticket"
            variant="brand"
          />

          <QuickActionCard
            icon={ShieldAlert}
            title="Safety report"
            description="Harassment, unsafe content, or discrimination. Anonymous option available."
            href="/contributor/support/safety-report"
            cta="Report concern"
            variant="error"
          />

          <QuickActionCard
            icon={Scale}
            title="Open a grievance"
            description="Unfair rejection, payout dispute, or process issues outside one task."
            href="/contributor/support/grievance"
            cta="File grievance"
            variant="warning"
          />

          {tickets.length > 0 ? (
            <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-stroke-subtle">
                <h3 className="font-body text-[13px] font-semibold text-foreground">Your tickets</h3>
                <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
                  {stats.totalTickets} total
                </p>
              </div>
              <ul role="list" className="divide-y divide-stroke-subtle">
                {tickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} />
                ))}
              </ul>
            </section>
          ) : null}

          {safetyCases.length > 0 || grievances.length > 0 ? (
            <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-stroke-subtle">
                <h3 className="font-body text-[13px] font-semibold text-foreground">Safety & grievances</h3>
                <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">Your submitted cases</p>
              </div>
              <ul role="list" className="divide-y divide-stroke-subtle">
                {safetyCases.map((c) => (
                  <SafetyCaseRow key={c.id} caseItem={c} />
                ))}
                {grievances.map((g) => (
                  <GrievanceRow key={g.id} grievance={g} />
                ))}
              </ul>
            </section>
          ) : null}

          <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/60 px-4 py-3 flex items-start gap-2.5">
            <LifeBuoy className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[11.5px] text-text-secondary leading-relaxed">
              For urgent safety matters, use a safety report — it routes to a dedicated review queue
              separate from general support.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FaqRow({ entry }: { entry: FlatFaqEntry }) {
  const [open, setOpen] = React.useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "w-full text-left px-5 py-3.5 transition-colors duration-fast",
          "hover:bg-bg-subtle/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13px] font-semibold text-foreground leading-snug">
              {entry.q}
            </span>
            <span className="mt-1 inline-block font-body text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              {entry.groupTitle}
            </span>
          </span>
          <ChevronRight
            className={cn(
              "h-4 w-4 text-text-tertiary shrink-0 mt-0.5 transition-transform duration-fast",
              open && "rotate-90",
            )}
            strokeWidth={2}
            aria-hidden
          />
        </span>
        {open ? (
          <p className="mt-2.5 font-body text-[12.5px] text-text-secondary leading-relaxed pr-6">
            {entry.a}
          </p>
        ) : null}
      </button>
    </li>
  );
}

function TicketRow({ ticket: t }: { ticket: MockTicket }) {
  return (
    <li>
      <Link
        href={`/contributor/support/tickets/${t.id}`}
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 min-h-[56px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-body text-[12.5px] font-medium text-foreground truncate">
            {t.subject}
          </span>
          <span className="mt-0.5 block font-body text-[11px] text-text-tertiary">
            {ticketCategoryLabel(t.category)} · Updated {fmtRelative(t.updatedAt)}
          </span>
        </span>
        <StatusChip status={ticketStatusChip(t.status)} size="sm">
          {ticketStatusLabel(t.status)}
        </StatusChip>
      </Link>
    </li>
  );
}

function SafetyCaseRow({ caseItem: c }: { caseItem: MockSafetyCase }) {
  return (
    <li>
      <Link
        href={`/contributor/support/safety/${c.id}`}
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 min-h-[56px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-body text-[12.5px] font-medium text-foreground truncate">
            Safety · <span className="font-mono text-[11px] text-text-secondary">{c.caseRef}</span>
            {c.anonymous ? (
              <span className="ml-1.5 font-body text-[10.5px] text-text-tertiary italic">(anonymous)</span>
            ) : null}
          </span>
          <span className="mt-0.5 block font-body text-[11px] text-text-tertiary truncate">
            {c.summary}
          </span>
          <span className="mt-0.5 block font-body text-[10.5px] text-text-tertiary">
            Submitted {fmtUpdatedDate(c.submittedAt)}
          </span>
        </span>
        <StatusChip status={safetyStatusChip(c.status)} size="sm">
          {safetyStatusLabel(c.status)}
        </StatusChip>
      </Link>
    </li>
  );
}

function GrievanceRow({ grievance: g }: { grievance: MockGrievance }) {
  return (
    <li>
      <Link
        href={`/contributor/support/grievances/${g.id}`}
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 min-h-[56px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-body text-[12.5px] font-medium text-foreground truncate">
            Grievance · <span className="font-mono text-[11px] text-text-secondary">{g.caseRef}</span>
          </span>
          <span className="mt-0.5 block font-body text-[11px] text-text-tertiary truncate">
            {grievanceTypeLabel(g.type)} · {g.summary}
          </span>
          <span className="mt-0.5 block font-body text-[10.5px] text-text-tertiary">
            Submitted {fmtUpdatedDate(g.submittedAt)}
          </span>
        </span>
        <StatusChip status={grievanceStatusChip(g.status)} size="sm">
          {grievanceStatusLabel(g.status)}
        </StatusChip>
      </Link>
    </li>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
  variant,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  href: string;
  cta: string;
  variant: "brand" | "error" | "warning";
}) {
  const iconTone =
    variant === "brand"
      ? "bg-brand-subtle text-brand-subtle-text border-brand/20"
      : variant === "error"
        ? "bg-error-subtle text-error-text border-error-border/30"
        : "bg-warning-subtle text-warning-text border-warning-border/30";

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl border border-stroke-subtle bg-surface p-4",
        "transition-shadow duration-fast hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            iconTone,
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-body text-[13px] font-semibold text-foreground">{title}</span>
          <span className="mt-0.5 block font-body text-[11.5px] text-text-secondary leading-relaxed">
            {description}
          </span>
          <span className="mt-2 inline-flex items-center gap-0.5 font-body text-[12px] font-semibold text-text-link">
            {cta}
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </span>
        </span>
      </div>
    </Link>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[22px] font-semibold tabular-nums tracking-[-0.02em]",
          highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex flex-wrap items-center gap-3">
      <AlertCircle className="h-4 w-4 text-error-text shrink-0" strokeWidth={2} aria-hidden />
      <p className="font-body text-[12.5px] text-error-text flex-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
      >
        Retry
      </button>
    </div>
  );
}
