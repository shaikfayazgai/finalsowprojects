"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, Plus, Search, Sparkles, Upload, UserCheck, Users, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkforceDirectory } from "@/lib/hooks/use-workforce";
import { Skeleton } from "@/components/meridian";
import type { WorkforceMember } from "@/lib/workforce/types";
import { cn } from "@/lib/utils/cn";
import { WorkforceCsvImport } from "./workforce-csv-import";
import { WorkforceAddEmployeeDrawer } from "./workforce-add-employee-drawer";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, primaryBtnClass, primaryStyle, secondaryBtnClass } from "@/app/admin/_shell/aurora-ui";

function isActive(m: WorkforceMember): boolean {
  return m.status !== "inactive";
}

function Avatar({ name, inactive }: { name: string; inactive?: boolean }) {
  const initials =
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      className={cn(
        "grid place-items-center h-10 w-10 rounded-full font-body text-[13px] font-bold shrink-0",
        inactive ? "bg-bg-subtle text-text-disabled border border-stroke-subtle" : "bg-[var(--color-ai-surface)] text-[var(--color-ai-text)] border border-[var(--color-ai-border)]",
      )}
    >
      {initials}
    </span>
  );
}

export function WorkforceWorkspace() {
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [dept, setDept] = React.useState<string>("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  const refreshDirectory = () => {
    void qc.invalidateQueries({ queryKey: ["enterprise", "workforce"] });
  };

  // Fetch the whole roster; filter client-side so KPIs + department pills span everyone.
  const { data, isLoading, error } = useWorkforceDirectory({});
  const all = React.useMemo(() => data?.items ?? [], [data]);

  const stats = React.useMemo(() => {
    const departments = new Set<string>();
    const skills = new Set<string>();
    let active = 0;
    for (const m of all) {
      if (m.department) departments.add(m.department);
      for (const s of m.primarySkills) skills.add(s);
      if (isActive(m)) active++;
    }
    return { total: all.length, active, departments: [...departments].sort(), skills: skills.size };
  }, [all]);

  const deptCounts = React.useMemo(() => {
    const c = new Map<string, number>();
    for (const m of all) if (m.department) c.set(m.department, (c.get(m.department) ?? 0) + 1);
    return c;
  }, [all]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter((m) => {
      if (dept !== "all" && m.department !== dept) return false;
      if (needle) {
        const hay = `${m.displayName} ${m.email} ${m.employeeId ?? ""} ${m.primarySkills.join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [all, dept, search]);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">Delivery · Workforce</p>
          <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">My organization</h1>
          <p className="mt-2 font-body text-[13px] text-text-secondary max-w-2xl">
            Internal employees available for direct assignment. Marketplace contributors appear under{" "}
            <span className="text-foreground font-medium">Glimmora network</span> in the assign popup.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setImportOpen((v) => !v)} className={cn(secondaryBtnClass, importOpen && "bg-bg-subtle text-foreground")}>
            <Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Import CSV
          </button>
          <button type="button" onClick={() => setAddOpen(true)} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Add employee
          </button>
        </div>
      </header>

      {/* Roster management — only when invoked */}
      {importOpen ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setImportOpen(false)}
            aria-label="Close import"
            className="absolute top-3 right-3 z-10 grid place-items-center h-7 w-7 rounded-md text-text-tertiary hover:text-foreground hover:bg-bg-subtle transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          <WorkforceCsvImport
            onApplied={() => {
              refreshDirectory();
              setImportOpen(false);
            }}
          />
        </div>
      ) : null}

      {/* Overview */}
      <section aria-label="Workforce overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Employees" value={stats.total} icon={Users} />
        <StatCard label="Active" value={stats.active} icon={UserCheck} hint={stats.total - stats.active > 0 ? `${stats.total - stats.active} inactive` : undefined} hintTone={stats.total - stats.active > 0 ? "warning" : "neutral"} />
        <StatCard label="Departments" value={stats.departments.length} icon={Building2} />
        <StatCard label="Skills covered" value={stats.skills} icon={Sparkles} />
      </section>

      {/* Toolbar — search + department filter */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by department" className="flex flex-wrap gap-1.5">
          <DeptPill label="All" count={stats.total} active={dept === "all"} onClick={() => setDept("all")} />
          {stats.departments.map((d) => (
            <DeptPill key={d} label={d} count={deptCounts.get(d) ?? 0} active={dept === d} onClick={() => setDept(d)} />
          ))}
        </nav>
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, skill…"
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
          />
          {search ? (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground">
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {/* Directory */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className={cn(DASH_CARD, "px-5 py-10 text-center")}>
          <p className="font-body text-[13px] text-error-text">{error instanceof Error ? error.message : "Failed to load workforce"}</p>
        </div>
      ) : all.length === 0 ? (
        <div className={cn(DASH_CARD, "px-5 py-14 text-center")}>
          <Users className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] font-semibold text-foreground">No employees yet</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">Add an employee or import a CSV to build your internal roster.</p>
          <button type="button" onClick={() => setAddOpen(true)} className={cn(primaryBtnClass, "mt-4 px-5")} style={primaryStyle}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Add employee
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={cn(DASH_CARD, "px-5 py-12 text-center")}>
          <p className="font-body text-[13px] font-semibold text-foreground">No matches</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDept("all");
            }}
            className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <EmployeeCard key={m.userId} member={m} onClick={() => router.push(`/enterprise/workforce/${encodeURIComponent(m.userId)}`)} />
          ))}
        </div>
      )}

      <WorkforceAddEmployeeDrawer open={addOpen} onClose={() => setAddOpen(false)} onSaved={refreshDirectory} />
    </div>
  );
}

function DeptPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={active ? GLASS_GRADIENT : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors max-w-[200px]",
        active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
      )}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums shrink-0",
          active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function EmployeeCard({ member: m, onClick }: { member: WorkforceMember; onClick: () => void }) {
  const inactive = !isActive(m);
  const extra = Math.max(0, m.primarySkills.length - 3);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        DASH_CARD,
        "group p-4 text-left transition-all duration-fast",
        "hover:border-stroke hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-16px_rgba(16,24,40,0.20)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
        inactive && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={m.displayName} inactive={inactive} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-body text-[13.5px] font-bold text-foreground truncate">{m.displayName}</p>
            <Chip tone={inactive ? "neutral" : "success"} dot={false}>
              {inactive ? "Inactive" : "Active"}
            </Chip>
          </div>
          <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary truncate">
            {m.department ?? "—"}
            {m.employeeId ? ` · ${m.employeeId}` : ""}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary shrink-0 transition-colors" strokeWidth={2} aria-hidden />
      </div>

      <div className="mt-3 pt-3 border-t border-stroke-subtle flex flex-wrap items-center gap-1.5">
        {m.primarySkills.length === 0 ? (
          <span className="font-body text-[11.5px] text-text-disabled italic">No skills listed</span>
        ) : (
          <>
            {m.primarySkills.slice(0, 3).map((s) => (
              <span key={s} className="inline-flex items-center h-[22px] px-2 rounded-md bg-bg-subtle border border-stroke-subtle font-body text-[11px] font-medium text-text-secondary">
                {s}
              </span>
            ))}
            {extra > 0 ? <span className="font-body text-[11px] text-text-tertiary">+{extra}</span> : null}
          </>
        )}
      </div>
    </button>
  );
}
