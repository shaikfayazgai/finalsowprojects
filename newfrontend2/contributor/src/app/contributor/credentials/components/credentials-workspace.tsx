"use client";

/**
 * Credentials wallet — certificate card gallery (portfolio UX, not task rows).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Award, Search, ShieldCheck, X } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { ShareCredentialModal } from "@/components/contributor/share-credential-modal";
import { useMyCredentials } from "@/lib/hooks/use-contributor-payouts";
import type { MockCredential } from "@/mocks/contributor";
import { cn } from "@/lib/utils/cn";
import { CredentialCard } from "./credential-card";
import { WalletSkeleton } from "./wallet-skeleton";
import {
  countUnique,
  credentialSearchHaystack,
  fmtRelative,
  uniqueSkills,
} from "../lib/credentials-ui-utils";

const CARDS_PER_PAGE = 9;

export function CredentialsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const skillFilter = searchParams.get("skill") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = React.useState(search);
  const [shareCred, setShareCred] = React.useState<MockCredential | null>(null);

  React.useEffect(() => setSearchDraft(search), [search]);

  const { data, isLoading, error, refetch } = useMyCredentials();
  const list = data?.items ?? [];
  const loading = isLoading && list.length === 0;
  const skills = React.useMemo(() => uniqueSkills(list), [list]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in changes)) next.delete("page");
      router.replace(`/contributor/credentials?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const stats = React.useMemo(() => {
    const latest = list.reduce<string | null>((acc, c) => {
      if (!acc) return c.issuedAt;
      return new Date(c.issuedAt).getTime() > new Date(acc).getTime() ? c.issuedAt : acc;
    }, null);

    return {
      total: list.length,
      skills: countUnique(list.map((c) => c.skill)),
      projects: countUnique(list.map((c) => c.project)),
      latest,
    };
  }, [list]);

  const filtered = React.useMemo(() => {
    let items = list;
    if (skillFilter) {
      items = items.filter((c) => c.skill === skillFilter);
    }
    const needle = search.trim().toLowerCase();
    if (needle) {
      items = items.filter((c) => credentialSearchHaystack(c).includes(needle));
    }
    return items;
  }, [list, search, skillFilter]);

  const sorted = React.useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      ),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / CARDS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageCards = sorted.slice((pageIdx - 1) * CARDS_PER_PAGE, pageIdx * CARDS_PER_PAGE);

  const galleryDescription =
    sorted.length === 0
      ? search.trim() || skillFilter
        ? "No matches for your filters"
        : "No credentials issued yet"
      : `${sorted.length} credential${sorted.length === 1 ? "" : "s"} in your wallet`;

  if (loading) {
    return <WalletSkeleton />;
  }

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <ErrorPanel message={(error as Error).message} onRetry={() => void refetch()} />
      ) : (
        <>
          <DashboardSection
            title="Your wallet"
            description="Portable proof of accepted work — each credential has a public verify link"
          >
            <dl className="grid grid-cols-3 gap-x-8 gap-y-4 max-w-lg">
              <SummaryStat label="Credentials" value={String(stats.total)} highlight={stats.total > 0} />
              <SummaryStat label="Skills proven" value={String(stats.skills)} highlight={stats.skills > 0} />
              <SummaryStat label="Projects" value={String(stats.projects)} highlight={stats.projects > 0} />
            </dl>
            {stats.latest ? (
              <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[11.5px] text-text-secondary inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-success-text shrink-0" strokeWidth={2} aria-hidden />
                Most recent · {fmtRelative(stats.latest)} · shareable without login
              </p>
            ) : null}
          </DashboardSection>

          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke-subtle space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Credential gallery
                  </h2>
                  <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                    {galleryDescription}
                  </p>
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
                    placeholder="Search by task or skill…"
                    aria-label="Search credentials"
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

              {skills.length > 1 ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mr-1">
                    Skill
                  </span>
                  <FilterChip
                    active={!skillFilter}
                    onClick={() => setParam({ skill: null })}
                  >
                    All
                  </FilterChip>
                  {skills.map((skill) => (
                    <FilterChip
                      key={skill}
                      active={skillFilter === skill}
                      onClick={() =>
                        setParam({ skill: skillFilter === skill ? null : skill })
                      }
                    >
                      {skill}
                    </FilterChip>
                  ))}
                </div>
              ) : null}
            </div>

            {sorted.length === 0 ? (
              <EmptyState hasFilters={!!search.trim() || !!skillFilter} />
            ) : (
              <>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pageCards.map((c) => (
                    <CredentialCard key={c.id} credential={c} onShare={() => setShareCred(c)} />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-t border-stroke-subtle bg-bg-subtle">
                    <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                      Page {pageIdx} of {totalPages}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setParam({ page: pageIdx > 2 ? String(pageIdx - 1) : null })}
                        disabled={pageIdx === 1}
                        className="h-7 px-2.5 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-surface disabled:text-text-disabled disabled:hover:bg-transparent"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setParam({
                            page: pageIdx < totalPages - 1 ? String(pageIdx + 1) : null,
                          })
                        }
                        disabled={pageIdx >= totalPages}
                        className="h-7 px-2.5 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-surface disabled:text-text-disabled disabled:hover:bg-transparent"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </>
      )}

      <ShareCredentialModal
        shareId={shareCred?.shareId ?? ""}
        title={shareCred?.taskTitle ?? ""}
        open={shareCred !== null}
        onClose={() => setShareCred(null)}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 px-2.5 rounded-full font-body text-[11.5px] font-semibold transition-colors duration-fast",
        active
          ? "bg-brand text-on-brand"
          : "bg-bg-subtle text-text-secondary border border-stroke-subtle hover:bg-surface hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="px-5 py-14 text-center">
        <p className="font-body text-[13px] font-semibold text-foreground">No matching credentials</p>
        <p className="mt-1 font-body text-[12px] text-text-tertiary">
          Try clearing search or choosing a different skill filter.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-14 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-stroke-subtle bg-gradient-to-br from-brand-subtle/60 to-bg-subtle text-brand mb-4">
        <Award className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="font-body text-[14px] font-semibold text-foreground">Your wallet is empty</p>
      <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-sm mx-auto leading-relaxed">
        When a mentor accepts your delivery, Glimmora issues a verifiable credential automatically.
        It will appear here as a shareable certificate.
      </p>
      <Link
        href="/contributor/tasks/completed"
        className="mt-5 inline-flex h-9 items-center px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
      >
        View completed work
      </Link>
    </div>
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
