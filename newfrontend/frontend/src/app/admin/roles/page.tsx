"use client";

/**
 * Platform Admin · Roles & permissions — spec doc 04 §5.O.1.
 * Lists every role across all portals. Read-only except for plat.admin additions.
 */

import * as React from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { MOCK_ROLES, type RoleScope } from "@/mocks/admin/roles";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import {
  AURORA_ACCENT,
  Banner,
  Chip,
  Crumbs,
  GlassCard,
  PageHeader,
  SectionCard,
  TONE,
  type Tone,
  primaryBtnClass,
  primaryStyle,
} from "../_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";

type Filter = "all" | RoleScope;

const SCOPE_LABEL: Record<RoleScope, string> = {
  plat: "Platform",
  ent: "Enterprise",
  mentor: "Mentor",
  contributor: "Contributor",
};

const SCOPE_TONE: Record<RoleScope, Tone> = {
  plat: "ai",
  ent: "neutral",
  mentor: "success",
  contributor: "warning",
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
    <div className="space-y-6 animate-fade-in">
      {phaseToast && (
        <div role="status" className="rounded-xl border px-4 py-2.5 font-body text-[12.5px] font-semibold" style={{ background: TONE.info.soft, borderColor: TONE.info.border, color: TONE.info.text }}>
          Phase 2 — custom platform roles and permission editing are not enabled yet.
        </div>
      )}

      <Crumbs items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Role catalog" }]} />

      <PageHeader
        eyebrow="Platform · Access"
        title="Roles & permissions"
        subtitle="Reference catalog (Phase 1) — read-only role definitions across portals. Not in the sidebar until Phase 2 RBAC admin ships. User assignment lives on Tenants, Mentors, and Enterprise settings."
        actions={
          canEdit ? (
            <button type="button" onClick={onAddRole} className={primaryBtnClass} style={primaryStyle}>
              <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden /> Add platform role
            </button>
          ) : undefined
        }
      />

      {!canEdit && (
        <Banner tone="neutral" icon={ShieldCheck} title="View-only access">
          Role definitions are read-only for Compliance. Only Platform Admin can add platform-side roles (Phase 2).
        </Banner>
      )}

      <div role="tablist" className="flex flex-wrap items-center gap-1.5">
        <FilterChip on={filter === "all"}         onClick={() => setFilter("all")}         label="All"          n={counts.all} />
        <FilterChip on={filter === "plat"}        onClick={() => setFilter("plat")}        label="Platform"     n={counts.plat} />
        <FilterChip on={filter === "ent"}         onClick={() => setFilter("ent")}         label="Enterprise"   n={counts.ent} />
        <FilterChip on={filter === "mentor"}      onClick={() => setFilter("mentor")}      label="Mentor"       n={counts.mentor} />
        <FilterChip on={filter === "contributor"} onClick={() => setFilter("contributor")} label="Contributor"  n={counts.contributor} />
      </div>

      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map((r) => (
          <li key={r.code}>
            <GlassCard className="h-full overflow-hidden">
              <header className="flex flex-wrap items-center gap-2 px-5 sm:px-6 pt-4 pb-3 border-b border-white/55">
                <code className="font-mono text-[12.5px] text-foreground font-semibold">{r.code}</code>
                <Chip tone={SCOPE_TONE[r.scope]} dot={false}>{SCOPE_LABEL[r.scope]}</Chip>
                {r.builtIn && <span className="font-body text-[10.5px] text-text-tertiary uppercase tracking-[0.08em]">built-in</span>}
                <span className="ml-auto font-mono text-[11px] tabular-nums text-text-tertiary">
                  {r.membersCount} {r.membersCount === 1 ? "member" : "members"}
                </span>
              </header>
              <div className="px-5 sm:px-6 py-4">
                <p className="font-body text-[12.5px] text-foreground mb-3 leading-relaxed">{r.description}</p>
                <div className="flex items-start gap-2.5">
                  <span className="grid place-items-center h-6 w-6 shrink-0 rounded-lg text-white" style={{ backgroundImage: AURORA_ACCENT }}>
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </span>
                  <ul className="font-body text-[11.5px] text-text-secondary space-y-1 pt-0.5">
                    {r.permissions.map((p) => <li key={p}>• {p}</li>)}
                  </ul>
                </div>
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterChip({ on, onClick, label, n }: { on: boolean; onClick: () => void; label: string; n: number }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[12.5px] font-semibold transition-colors duration-fast",
        on ? "text-white" : "border border-white/70 bg-white/55 backdrop-blur text-text-secondary hover:bg-white/75",
      )}
      style={on ? { backgroundImage: AURORA_ACCENT, boxShadow: "0 8px 18px -10px rgba(108,76,230,0.6)" } : undefined}
    >
      <span>{label}</span>
      <span className={cn("font-mono text-[10.5px] tabular-nums", on ? "text-white/75" : "text-text-tertiary")}>{n}</span>
    </button>
  );
}
