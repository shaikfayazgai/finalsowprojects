"use client";

/**
 * Prompt templates registry — Aurora Glass directory across all agents.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronRight, ScrollText } from "lucide-react";
import { useAdminAgentsList, useAdminPromptsList } from "@/lib/hooks/use-admin-ai";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { cn } from "@/lib/utils/cn";
import {
  AURORA_ACCENT,
  Banner,
  Chip,
  Crumbs,
  GlassCard,
  PageHeader,
  SectionCard,
  Stat,
} from "../../_shell/aurora-ui";

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
    <div className="space-y-6 animate-fade-in">
      <Crumbs items={[{ label: "AI agents", href: "/admin/ai" }, { label: "Prompts" }]} />

      <PageHeader
        eyebrow="Platform · AI"
        title="Prompt templates"
        subtitle="All prompt templates across agents — version history, rollback, and sandbox testing."
      />

      {!canEdit && (
        <Banner tone="neutral" icon={ScrollText} title="View-only access">
          Prompt edits require Platform Admin or AI Operator.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">Template registry</p>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Templates" value={prompts.length} tone="ai" size="lg" />
          <Stat label="With active version" value={activeCount} tone="success" size="lg" />
          <Stat label="Agents" value={agents.length} size="lg" />
        </dl>
      </GlassCard>

      <SectionCard title="All prompts" description={`${prompts.length} template${prompts.length === 1 ? "" : "s"}`}>
        <ul className="divide-y divide-white/40">
          {prompts.map((p) => {
            const agent = agentById[p.agentId];
            const active = p.versions.find((v) => v.status === "active");
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/ai/prompts/${p.id}`}
                  className={cn(
                    "group flex items-center justify-between gap-4 px-5 sm:px-6 py-4 transition-colors duration-fast hover:bg-white/55",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(124,92,246,0.32)]",
                  )}
                >
                  <span className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="grid place-items-center h-9 w-9 rounded-lg shrink-0 text-white" style={{ backgroundImage: AURORA_ACCENT }}>
                      <ScrollText className="h-4 w-4" strokeWidth={1.9} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <code className="font-mono text-[12.5px] font-semibold text-foreground block truncate">{p.name}</code>
                      <span className="font-body text-[12.5px] text-text-secondary block mt-0.5 truncate">{agent?.name ?? "—"}</span>
                      <span className="font-body text-[11px] text-text-tertiary block mt-0.5">
                        {p.variables.length} variable{p.variables.length === 1 ? "" : "s"} · {p.versions.length} version{p.versions.length === 1 ? "" : "s"}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 flex items-center gap-3">
                    <span className="flex flex-col items-end gap-1">
                      {active && <Chip tone="success">v{active.version}</Chip>}
                      {agent?.shortName && <span className="font-body text-[10.5px] text-text-tertiary">{agent.shortName}</span>}
                    </span>
                    <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0" strokeWidth={2} aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}
