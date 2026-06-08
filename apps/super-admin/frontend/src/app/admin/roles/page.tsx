"use client";

/**
 * Platform Admin · Roles & permissions — spec doc 04 §5.O.1.
 * Lists every role across all portals. Read-only except for plat.admin additions.
 */

import * as React from "react";
import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { MOCK_ROLES, type RoleScope } from "@/mocks/admin/roles";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { cn } from "@/lib/utils/cn";

type Filter = "all" | RoleScope;

const SCOPE_LABEL: Record<RoleScope, string> = {
  plat: "Platform",
  ent: "Enterprise",
  mentor: "Mentor",
  contributor: "Contributor",
};

const SCOPE_TONE: Record<RoleScope, string> = {
  plat:        "bg-brand-subtle text-brand-emphasis ring-brand-border",
  ent:         "bg-bg-subtle text-text-secondary ring-stroke",
  mentor:      "bg-success-subtle text-success-text ring-success-border",
  contributor: "bg-warning-subtle text-warning-text ring-warning-border",
};

export default function AdminRolesPage() {
  const canEdit = useAdminSectionCanEdit("roles");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [phaseToast, setPhaseToast] = React.useState(false);

  const counts = React.useMemo(() => ({
    all: MOCK_ROLES.length,
    plat: MOCK_ROLES.filter((r) => r.scope === "plat").length,
    ent: MOCK_ROLES.filter((r) => r.scope === "ent").length,
    mentor: MOCK_ROLES.filter((r) => r.scope === "mentor").length,
    contributor: MOCK_ROLES.filter((r) => r.scope === "contributor").length,
  }), []);

  const rows = filter === "all" ? MOCK_ROLES : MOCK_ROLES.filter((r) => r.scope === filter);

  function onAddRole() {
    setPhaseToast(true);
    setTimeout(() => setPhaseToast(false), 3500);
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {phaseToast && (
        <div role="status" className="rounded-lg border border-stroke bg-bg-subtle px-4 py-2 font-body text-[12.5px] text-text-secondary">
          Phase 2 — custom platform roles and permission editing are not enabled yet.
        </div>
      )}
      {!canEdit && (
        <div role="status" className="rounded-lg border border-stroke bg-bg-subtle px-4 py-2 font-body text-[12.5px] text-text-secondary">
          View-only — role definitions are read-only for Compliance. Only Platform Admin can add platform-side roles (Phase 2).
        </div>
      )}

      <header className="flex items-center justify-between gap-3">
        <div>
          <nav aria-label="Breadcrumb" className="mb-1 font-body text-[12px] text-text-tertiary">
            <Link href="/admin/dashboard" className="hover:text-foreground transition-colors duration-fast">Dashboard</Link>
            <span aria-hidden className="mx-1.5 opacity-60">/</span>
            <span className="text-text-secondary">Role catalog</span>
          </nav>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">Roles &amp; permissions</h1>
          <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">
            Reference catalog (Phase 1) — read-only role definitions across portals. Not in the sidebar until Phase 2 RBAC admin ships. User assignment lives on Tenants, Mentors, and Enterprise settings.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onAddRole}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold shadow-xs hover:bg-brand-hover transition-colors duration-fast"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Add platform role
          </button>
        )}
      </header>

      <div role="tablist" className="flex flex-wrap items-center gap-1.5">
        <Chip on={filter === "all"}         onClick={() => setFilter("all")}         label="All"          n={counts.all} />
        <Chip on={filter === "plat"}        onClick={() => setFilter("plat")}        label="Platform"     n={counts.plat} />
        <Chip on={filter === "ent"}         onClick={() => setFilter("ent")}         label="Enterprise"   n={counts.ent} />
        <Chip on={filter === "mentor"}      onClick={() => setFilter("mentor")}      label="Mentor"       n={counts.mentor} />
        <Chip on={filter === "contributor"} onClick={() => setFilter("contributor")} label="Contributor"  n={counts.contributor} />
      </div>

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.code} className="rounded-lg border border-stroke bg-surface shadow-xs">
            <header className="flex items-center gap-2 px-4 py-2.5 border-b border-stroke-subtle">
              <code className="font-mono text-[12.5px] text-foreground font-semibold">{r.code}</code>
              <span className={cn("inline-flex items-center rounded-full ring-1 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-[0.06em]", SCOPE_TONE[r.scope])}>
                {SCOPE_LABEL[r.scope]}
              </span>
              {r.builtIn && <span className="font-body text-[10.5px] text-text-tertiary uppercase tracking-[0.06em]">built-in</span>}
              <span className="ml-auto font-mono text-[11px] tabular-nums text-text-tertiary">{r.membersCount} {r.membersCount === 1 ? "member" : "members"}</span>
            </header>
            <div className="px-4 py-3">
              <p className="font-body text-[12.5px] text-foreground mb-2">{r.description}</p>
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-text-tertiary mt-0.5 shrink-0" strokeWidth={2} aria-hidden />
                <ul className="font-body text-[11.5px] text-text-secondary space-y-0.5">
                  {r.permissions.map((p) => <li key={p}>• {p}</li>)}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Chip({ on, onClick, label, n }: { on: boolean; onClick: () => void; label: string; n: number }) {
  return (
    <button type="button" role="tab" aria-selected={on} onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border font-body text-[12px] transition-colors duration-fast",
        on ? "bg-foreground text-surface border-foreground" : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle")}>
      <span>{label}</span>
      <span className={cn("font-mono text-[10.5px] tabular-nums", on ? "text-surface/70" : "text-text-tertiary")}>{n}</span>
    </button>
  );
}
