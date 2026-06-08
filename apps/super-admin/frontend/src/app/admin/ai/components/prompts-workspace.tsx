"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminAgentsList, useAdminPromptsList } from "@/lib/hooks/use-admin-ai";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { cn } from "@/lib/utils/cn";

export function PromptsWorkspace() {
  const prompts = useAdminPromptsList();
  const agents = useAdminAgentsList();
  const canEdit = useAdminSectionCanEdit("ai");

  const agentById = React.useMemo(
    () => Object.fromEntries(agents.map((a) => [a.id, a])),
    [agents],
  );

  const activeCount = prompts.filter((p) =>
    p.versions.some((v) => v.status === "active"),
  ).length;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            Prompt edits require Platform Admin or AI Operator.
          </p>
        </div>
      )}

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-body text-[12px] text-text-tertiary">
        <Link href="/admin/ai" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>AI agents</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">Prompts</span>
      </nav>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · AI operations
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Prompt templates
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          All prompt templates across agents — version history, rollback, and sandbox testing.
        </p>
      </header>

      <DashboardSection title="Template registry" description="Prompts bound to MVP agents">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
          <SummaryStat label="Templates" value={String(prompts.length)} highlight />
          <SummaryStat label="With active version" value={String(activeCount)} highlight />
          <SummaryStat label="Agents" value={String(agents.length)} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground">All prompts</h2>
        </header>
        <ul className="divide-y divide-stroke-subtle">
          {prompts.map((p) => {
            const agent = agentById[p.agentId];
            const active = p.versions.find((v) => v.status === "active");
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/ai/prompts/${p.id}`}
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
                    "hover:bg-bg-subtle/60 transition-colors duration-fast",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <code className="font-mono text-[12.5px] font-medium text-foreground block truncate">
                      {p.name}
                    </code>
                    <span className="font-body text-[12px] text-text-secondary block mt-0.5 truncate">
                      {agent?.name ?? "—"}
                    </span>
                    <span className="font-body text-[11px] text-text-tertiary block mt-0.5">
                      {p.variables.length} variable{p.variables.length === 1 ? "" : "s"} · {p.versions.length} version{p.versions.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="shrink-0 flex flex-col items-end gap-1">
                    {active && (
                      <StatusChip status="success" size="sm">
                        v{active.version}
                      </StatusChip>
                    )}
                    <span className="font-body text-[10.5px] text-text-tertiary">{agent?.shortName}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
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
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
