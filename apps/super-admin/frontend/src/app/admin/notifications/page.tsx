"use client";

/**
 * Platform Admin · Notifications — spec doc 04 §5.P.3.
 */

import * as React from "react";
import Link from "next/link";
import { Bell, Flag, Server, Boxes, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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

const NOTICES: AdminNotice[] = [];

export default function AdminNotificationsPage() {
  const [cat, setCat] = React.useState<Category>("all");
  const rows = cat === "all" ? NOTICES : NOTICES.filter((n) => n.category === cat);
  const unread = NOTICES.filter((n) => n.unread).length;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">Notifications</h1>
          <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">{unread} unread · {NOTICES.length} total</p>
        </div>
      </header>

      <div role="tablist" className="flex flex-wrap items-center gap-1.5">
        <Chip on={cat === "all"}     onClick={() => setCat("all")}     label="All" />
        <Chip on={cat === "cases"}   onClick={() => setCat("cases")}   label="Cases" />
        <Chip on={cat === "system"}  onClick={() => setCat("system")}  label="System" />
        <Chip on={cat === "tenants"} onClick={() => setCat("tenants")} label="Tenants" />
      </div>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
        <ul>
          {rows.length === 0 && <li className="px-4 py-4 font-body text-[12.5px] text-text-tertiary">No notifications.</li>}
          {rows.map((n) => (
            <li key={n.id} className="border-b border-stroke-subtle last:border-0">
              <Link href={n.href} className="flex items-start gap-3 px-4 py-3 hover:bg-bg-subtle/50 transition-colors duration-fast">
                <Icon category={n.category} tone={n.tone} />
                <div className="flex-1 min-w-0">
                  <p className={cn("font-body text-[12.5px]", n.unread ? "text-foreground font-semibold" : "text-text-secondary")}>{n.text}</p>
                  <p className="font-mono text-[10.5px] text-text-tertiary mt-0.5">{fmtRel(n.at)}</p>
                </div>
                {n.unread && <span aria-label="Unread" className="mt-2 h-2 w-2 rounded-full bg-brand shrink-0" />}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Chip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="tab" aria-selected={on} onClick={onClick}
      className={cn("inline-flex items-center h-7 px-2.5 rounded-md border font-body text-[12px] transition-colors duration-fast",
        on ? "bg-foreground text-surface border-foreground" : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle")}>
      {label}
    </button>
  );
}

function Icon({ category, tone }: { category: AdminNotice["category"]; tone: "info" | "warning" }) {
  const cls = cn("h-3.5 w-3.5 mt-0.5 shrink-0", tone === "warning" ? "text-warning-text" : "text-text-tertiary");
  if (category === "cases")   return <Flag className={cls} strokeWidth={2} aria-hidden />;
  if (category === "system")  return tone === "warning" ? <AlertTriangle className={cls} strokeWidth={2} aria-hidden /> : <CheckCircle2 className={cls} strokeWidth={2} aria-hidden />;
  if (category === "tenants") return <Boxes className={cls} strokeWidth={2} aria-hidden />;
  return <Bell className={cls} strokeWidth={2} aria-hidden />;
}

function fmtRel(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.round(ms / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}
