"use client";

import * as React from "react";
import { ChevronRight, Loader2, Plus, Search, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkforceDirectory } from "@/lib/hooks/use-workforce";
import { Skeleton } from "@/components/meridian";
import type { WorkforceMember } from "@/lib/workforce/types";
import { cn } from "@/lib/utils/cn";
import { WorkforceCsvImport } from "./workforce-csv-import";
import { WorkforceEmployeeDrawer } from "./workforce-employee-drawer";
import { WorkforceAddEmployeeDrawer } from "./workforce-add-employee-drawer";

export function WorkforceWorkspace() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [selected, setSelected] = React.useState<WorkforceMember | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  const refreshDirectory = () => {
    void qc.invalidateQueries({ queryKey: ["enterprise", "workforce"] });
  };

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, error } = useWorkforceDirectory({
    search: debounced || undefined,
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            Delivery · Workforce
          </p>
          <h1 className="font-display text-[22px] font-semibold text-foreground tracking-tight">
            My organization
          </h1>
          <p className="font-body text-[13px] text-text-secondary max-w-2xl">
            Internal employees — add manually or import a CSV. Available for direct assignment;
            marketplace contributors appear under{" "}
            <span className="text-foreground font-medium">Glimmora network</span> in the assign
            drawer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md bg-brand text-on-brand font-body text-[12.5px] font-semibold hover:bg-brand-hover transition-colors duration-fast shrink-0 self-start"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Add employee
        </button>
      </header>

      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
          strokeWidth={2}
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, employee ID…"
          className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface border border-stroke font-body text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-stroke-focus"
        />
      </div>

      <WorkforceCsvImport onApplied={refreshDirectory} />

      <div className="rounded-xl border border-stroke bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stroke bg-surface-subtle">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" strokeWidth={2} aria-hidden />
            <span className="font-body text-[13px] font-semibold text-foreground">
              Employees
            </span>
          </div>
          {!isLoading && data && (
            <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
              {data.total} synced
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-10 text-center">
            <p className="font-body text-[13px] text-danger-text">
              {error instanceof Error ? error.message : "Failed to load workforce"}
            </p>
          </div>
        ) : !data?.items.length ? (
          <div className="px-5 py-12 text-center">
            <p className="font-body text-[13px] font-semibold text-foreground">
              No synced employees yet
            </p>
            <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
              Import a CSV above to add internal employees, or seed contributors for demo.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stroke">
            {data.items.map((m) => (
              <li key={m.userId}>
                <button
                  type="button"
                  onClick={() => setSelected(m)}
                  className={cn(
                    "w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-3.5 min-h-[56px]",
                    "text-left transition-colors hover:bg-surface-subtle/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[13px] font-semibold text-foreground truncate">
                      {m.displayName}
                    </p>
                    <p className="font-body text-[11.5px] text-text-tertiary truncate">
                      {m.email}
                      {m.employeeId ? ` · ${m.employeeId}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right sm:text-right">
                    <p className="font-body text-[12px] text-text-secondary">{m.department}</p>
                    <p className="font-body text-[11px] text-text-tertiary truncate max-w-[200px] sm:ml-auto">
                      {m.primarySkills.slice(0, 3).join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="inline-flex self-start sm:self-center px-2 py-0.5 rounded-full bg-brand-subtle text-brand-text font-body text-[10px] font-semibold uppercase tracking-wide">
                    Internal
                  </span>
                  <ChevronRight
                    className="hidden sm:block h-4 w-4 text-text-tertiary shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-stroke">
            <Loader2 className="h-4 w-4 animate-spin text-brand" strokeWidth={2} aria-hidden />
            <span className="font-body text-[12px] text-text-tertiary">Loading directory…</span>
          </div>
        )}
      </div>

      <WorkforceEmployeeDrawer
        member={selected}
        open={selected != null}
        onClose={() => setSelected(null)}
      />

      <WorkforceAddEmployeeDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refreshDirectory}
      />
    </div>
  );
}
