"use client";

import type { RateCardDetail, RateCardStatus, RateRow } from "@/lib/enterprise/mocks/rate-cards";
import { cn } from "@/lib/utils/cn";
import { type Tone } from "@/app/admin/_shell/aurora-ui";

export function fmtRate(currency: string, minor: number): string {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function effectiveLabel(card: RateCardDetail): string {
  const from = fmtDate(card.effectiveFrom);
  const to = card.effectiveTo ? fmtDate(card.effectiveTo) : "No expiry";
  return `${from} → ${to}`;
}

export const STATUS_TONE: Record<RateCardStatus, Tone> = {
  active: "success",
  draft: "ai",
  expired: "neutral",
};

export function CardFactsSection({ card }: { card: RateCardDetail }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      <Fact label="Rate card ID" value={card.id} mono />
      <Fact label="Scope" value={card.scopeLabel} />
      <Fact label="Currency" value={card.currency} mono />
      <Fact label="Effective period" value={effectiveLabel(card)} />
      <Fact label="Rate rows" value={String(card.rowCount)} mono />
      <Fact label="Status" value={card.status} capitalize />
    </dl>
  );
}

export function RateRowsSection({
  card,
  search,
}: {
  card: RateCardDetail;
  search: string;
}) {
  const needle = search.trim().toLowerCase();
  const filtered = card.rows.filter((row) => {
    if (!needle) return true;
    const hay = `${row.role} ${row.skill} ${row.level} ${row.region}`.toLowerCase();
    return hay.includes(needle);
  });

  const groups = groupRowsByRole(filtered);

  if (filtered.length === 0) {
    return (
      <p className="font-body text-[13px] text-text-tertiary italic -mx-5 px-5">
        No rate rows match your search.
      </p>
    );
  }

  if (groups.length <= 1 && !search.trim()) {
    return (
      <ul className="divide-y divide-white/60 -mx-5">
        {filtered.map((row, i) => (
          <RateRowItem key={i} row={row} currency={card.currency} />
        ))}
      </ul>
    );
  }

  return (
    <div className="-mx-5 divide-y divide-white/60">
      {groups.map((group) => (
        <div key={group.role}>
          <p className="px-5 py-2 font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
            {group.role}
            <span className="ml-1.5 font-mono tabular-nums text-foreground normal-case tracking-normal">
              {group.rows.length}
            </span>
          </p>
          <ul className="divide-y divide-white/60 border-t border-white/55">
            {group.rows.map((row, i) => (
              <RateRowItem key={`${group.role}-${i}`} row={row} currency={card.currency} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function groupRowsByRole(rows: RateRow[]): Array<{ role: string; rows: RateRow[] }> {
  const map = new Map<string, RateRow[]>();
  for (const row of rows) {
    const list = map.get(row.role) ?? [];
    list.push(row);
    map.set(row.role, list);
  }
  return Array.from(map.entries()).map(([role, groupRows]) => ({ role, rows: groupRows }));
}

function RateRowItem({ row, currency }: { row: RateRow; currency: string }) {
  return (
    <li className="px-5 py-2.5 min-h-[44px] flex items-center justify-between gap-4">
      <span className="min-w-0 flex-1">
        <span className="font-body text-[13px] font-medium text-foreground truncate block">
          {row.skill}
          <span className="text-text-tertiary font-normal mx-1.5">·</span>
          <span className="font-mono text-[12px]">{row.level}</span>
        </span>
        <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
          {row.role} · {row.region}
        </span>
      </span>
      <span className="font-mono text-[13px] font-semibold text-foreground tabular-nums shrink-0">
        {fmtRate(currency, row.rateMinorPerHour)}
        <span className="text-text-tertiary font-normal text-[11px]">/h</span>
      </span>
    </li>
  );
}

export function SegmentRatesSection({ card }: { card: RateCardDetail }) {
  if (!card.bySegment) return null;

  const segments: Array<{ label: string; value: number | undefined }> = [
    { label: "Student", value: card.bySegment.student },
    { label: "Women workforce", value: card.bySegment.women_workforce },
    { label: "General workforce", value: card.bySegment.general_workforce },
    { label: "Internal", value: card.bySegment.internal },
  ];

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      {segments.map((seg) => (
        <div key={seg.label}>
          <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            {seg.label}
          </dt>
          <dd className="mt-1 font-body text-[18px] font-semibold text-foreground tabular-nums">
            {seg.value !== undefined ? (
              <>
                {fmtRate(card.currency, seg.value)}
                <span className="text-text-tertiary font-normal text-[13px]">/h</span>
              </>
            ) : (
              <span className="text-[13px] font-normal text-text-tertiary italic">
                Inherits default
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Fact({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12.5px] tabular-nums",
          capitalize && "capitalize",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
