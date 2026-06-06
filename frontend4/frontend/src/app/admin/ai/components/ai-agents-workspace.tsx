"use client";

import Link from "next/link";
import { ScrollText } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminAgentsList } from "@/lib/hooks/use-admin-ai";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { AgentStatus, MockAIAgent } from "@/mocks/admin/agents";
import { cn } from "@/lib/utils/cn";

const PORTAL_LABEL: Record<MockAIAgent["portal"], string> = {
  enterprise: "Enterprise",
  contributor: "Contributor",
  mentor: "Mentor",
  all: "All portals",
};

function statusChip(s: AgentStatus): "success" | "warning" {
  return s === "enabled" ? "success" : "warning";
}

export function AiAgentsWorkspace() {
  const agents = useAdminAgentsList();
  const canEdit = useAdminSectionCanEdit("ai");

  const enabled = agents.filter((a) => a.status === "enabled").length;
  const invocations = agents.reduce((sum, a) => sum + a.recentInvocations24h, 0);
  const errors = agents.reduce((sum, a) => sum + a.errors24h, 0);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            Agent configuration requires Platform Admin or AI Operator.
          </p>
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · AI operations
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            AI agents
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            MVP agents per SOW §3.1.MVP.7 — enable/disable, model selection, prompt versioning, and invocation telemetry.
          </p>
          <RecordLinks />
        </div>
        <Link href="/admin/ai/prompts" className={actionBtnCls}>
          <ScrollText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Prompts
        </Link>
      </header>

      <DashboardSection title="Fleet snapshot" description="Agent status and 24h activity">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Enabled" value={String(enabled)} highlight={enabled > 0} />
          <SummaryStat label="Paused" value={String(agents.length - enabled)} />
          <SummaryStat label="Invocations (24h)" value={String(invocations)} highlight />
          <SummaryStat label="Errors (24h)" value={String(errors)} alert={errors > 0} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Agent registry
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            {agents.length} MVP agent{agents.length === 1 ? "" : "s"}
          </p>
        </header>
        <ul className="divide-y divide-stroke-subtle">
          {agents.map((a) => (
            <AgentRow key={a.id} agent={a} />
          ))}
        </ul>
      </section>

      <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/30 px-4 py-3">
        <p className="font-body text-[11.5px] text-text-tertiary leading-relaxed">
          Phase 1: enable/disable, model id, active prompt version, rollback, recent invocations.
          Bias monitoring and risk-tier config ship in Phase 2.
        </p>
      </div>
    </div>
  );
}

function AgentRow({ agent: a }: { agent: MockAIAgent }) {
  return (
    <li>
      <Link
        href={`/admin/ai/${a.id}`}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
          a.errors24h > 0 && "bg-warning-subtle/10",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0 flex-wrap">
            <StatusChip status={statusChip(a.status)} size="sm" showDot>
              {a.status === "enabled" ? "Enabled" : "Paused"}
            </StatusChip>
            <span className="font-body text-[13px] font-medium text-foreground truncate">{a.name}</span>
          </span>
          <span className="font-body text-[12px] text-text-secondary truncate block mt-0.5">
            {a.description}
          </span>
          <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
            {PORTAL_LABEL[a.portal]} · <code className="font-mono text-[10.5px]">{a.modelId}</code>
          </span>
        </span>
        <span className="shrink-0 text-right flex flex-col items-end gap-1">
          <span className="font-mono text-[12px] tabular-nums text-foreground">
            v{a.activePromptVersion}
          </span>
          <span className="font-body text-[10.5px] text-text-tertiary whitespace-nowrap">
            {a.recentInvocations24h} calls · {(a.avgLatencyMs / 1000).toFixed(1)}s avg
          </span>
        </span>
      </Link>
    </li>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-warning-text" : highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link href="/admin/audit?resource=prompt&time=24h" className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline">
        Prompt audit
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link href="/admin/system-health" className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline">
        System health
      </Link>
    </p>
  );
}

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-surface border border-stroke-subtle shadow-xs",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);
