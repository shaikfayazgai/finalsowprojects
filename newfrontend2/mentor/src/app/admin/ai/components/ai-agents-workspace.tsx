"use client";

/**
 * AI agents registry — Aurora Glass directory.
 *
 *   · Fleet snapshot stat strip (enabled / paused / invocations / errors)
 *   · Glass agent registry list with status, model, and 24h telemetry
 */

import Link from "next/link";
import { ChevronRight, Cpu, ScrollText } from "lucide-react";
import { useAdminAgentsList } from "@/lib/hooks/use-admin-ai";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { AgentStatus, MockAIAgent } from "@/mocks/admin/agents";
import { cn } from "@/lib/utils/cn";
import {
  AURORA_ACCENT,
  Banner,
  Chip,
  GlassCard,
  InlineLink,
  PageHeader,
  SectionCard,
  Stat,
  ghostBtnClass,
  type Tone,
} from "../../_shell/aurora-ui";

const PORTAL_LABEL: Record<MockAIAgent["portal"], string> = {
  enterprise: "Enterprise",
  contributor: "Contributor",
  mentor: "Mentor",
  all: "All portals",
};

function statusTone(s: AgentStatus): Tone {
  return s === "enabled" ? "success" : "neutral";
}

export function AiAgentsWorkspace() {
  const agents = useAdminAgentsList();
  const canEdit = useAdminSectionCanEdit("ai");

  const enabled = agents.filter((a) => a.status === "enabled").length;
  const invocations = agents.reduce((sum, a) => sum + a.recentInvocations24h, 0);
  const errors = agents.reduce((sum, a) => sum + a.errors24h, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Platform · AI"
        title="AI agents"
        subtitle="MVP agents per SOW §3.1.MVP.7 — enable/disable, model selection, prompt versioning, and invocation telemetry."
        actions={
          <Link href="/admin/ai/prompts" className={ghostBtnClass}>
            <ScrollText className="h-4 w-4" strokeWidth={2} aria-hidden />
            Prompts
          </Link>
        }
      />

      {!canEdit && (
        <Banner tone="neutral" icon={Cpu} title="View-only access">
          Agent configuration requires Platform Admin or AI Operator.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary">Fleet snapshot</p>
          <span className="font-body text-[12px] text-text-tertiary">Agent status and 24h activity</span>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Enabled" value={enabled} tone={enabled > 0 ? "success" : "neutral"} size="lg" />
          <Stat label="Paused" value={agents.length - enabled} size="lg" />
          <Stat label="Invocations (24h)" value={invocations} tone="ai" size="lg" />
          <Stat label="Errors (24h)" value={errors} tone={errors > 0 ? "error" : "neutral"} size="lg" />
        </dl>
      </GlassCard>

      <SectionCard
        title="Agent registry"
        description={`${agents.length} MVP agent${agents.length === 1 ? "" : "s"}`}
        action={
          <div className="flex items-center gap-3 self-center">
            <InlineLink href="/admin/audit?resource=prompt&time=24h">Prompt audit</InlineLink>
            <InlineLink href="/admin/system-health">System health</InlineLink>
          </div>
        }
      >
        <ul className="divide-y divide-white/40">
          {agents.map((a) => (
            <AgentRow key={a.id} agent={a} />
          ))}
        </ul>
      </SectionCard>

      <Banner tone="ai" title="Phase 1 scope">
        Enable/disable, model id, active prompt version, rollback, recent invocations. Bias monitoring and risk-tier config ship in Phase 2.
      </Banner>
    </div>
  );
}

function AgentRow({ agent: a }: { agent: MockAIAgent }) {
  const erroring = a.errors24h > 0;
  return (
    <li>
      <Link
        href={`/admin/ai/${a.id}`}
        className={cn(
          "group flex items-center justify-between gap-4 px-5 sm:px-6 py-4 transition-colors duration-fast hover:bg-white/55",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(124,92,246,0.32)]",
        )}
      >
        <span className="flex items-start gap-3 min-w-0 flex-1">
          <span className="grid place-items-center h-9 w-9 rounded-lg shrink-0 text-white" style={{ backgroundImage: AURORA_ACCENT }}>
            <Cpu className="h-4 w-4" strokeWidth={1.9} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="font-display text-[13.5px] font-semibold text-foreground truncate">{a.name}</span>
              <Chip tone={statusTone(a.status)}>{a.status === "enabled" ? "Enabled" : "Paused"}</Chip>
            </span>
            <span className="block mt-0.5 font-body text-[12.5px] text-text-secondary truncate">{a.description}</span>
            <span className="block mt-0.5 font-body text-[11px] text-text-tertiary truncate">
              {PORTAL_LABEL[a.portal]} · <code className="font-mono text-[10.5px]">{a.modelId}</code>
            </span>
          </span>
        </span>
        <span className="shrink-0 flex items-center gap-3">
          <span className="text-right flex flex-col items-end gap-0.5">
            <span className="font-mono text-[12px] tabular-nums text-foreground">v{a.activePromptVersion}</span>
            <span className="font-body text-[10.5px] text-text-tertiary whitespace-nowrap">
              {a.recentInvocations24h} calls · {(a.avgLatencyMs / 1000).toFixed(1)}s avg
              {erroring && (
                <>
                  {" · "}
                  <span style={{ color: "var(--color-error-text)" }}>{a.errors24h} err</span>
                </>
              )}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0" strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </li>
  );
}
