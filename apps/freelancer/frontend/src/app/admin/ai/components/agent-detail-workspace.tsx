"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Shield,
} from "lucide-react";
import { Select, StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  AGENT_MODEL_OPTIONS,
  setAgentModel,
  setAgentStatus,
} from "@/lib/admin/mocks/agents-service";
import { useAdminAgent, useAdminPrompt } from "@/lib/hooks/use-admin-ai";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { AgentStatus } from "@/mocks/admin/agents";
import { cn } from "@/lib/utils/cn";

type Tab = "configuration" | "telemetry" | "policy";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "configuration", label: "Configuration" },
  { key: "telemetry", label: "Telemetry" },
  { key: "policy", label: "Policy" },
];

function statusChip(s: AgentStatus): "success" | "warning" {
  return s === "enabled" ? "success" : "warning";
}

export function AgentDetailWorkspace() {
  const params = useParams<{ agentId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = useAdminSectionCanEdit("ai");
  const a = useAdminAgent(params.agentId);
  const prompt = useAdminPrompt(a?.activePromptId);

  const tab = (searchParams.get("tab") as Tab | null) ?? "configuration";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "configuration";

  const [toast, setToast] = React.useState<string | null>(
    searchParams.get("updated") === "1" ? "Agent updated." : null,
  );

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "configuration") nextParams.delete("tab");
      else nextParams.set("tab", next);
      nextParams.delete("updated");
      const qs = nextParams.toString();
      router.replace(
        qs ? `/admin/ai/${params.agentId}?${qs}` : `/admin/ai/${params.agentId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.agentId],
  );

  if (!a) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link href="/admin/ai" className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> AI agents
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Agent not found.</p>
      </div>
    );
  }

  const agentId = a.id;
  const paused = a.status === "paused";

  function handleToggleStatus() {
    if (!canEdit) return;
    const next = paused ? "enabled" : "paused";
    setAgentStatus(agentId, next);
    setToast(next === "paused" ? "Agent paused." : "Agent enabled.");
  }

  function handleModelChange(modelId: string) {
    if (!canEdit) return;
    setAgentModel(agentId, modelId);
    setToast("Model updated.");
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div role="status" className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text">
          {toast}
        </div>
      )}

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-body text-[12px] text-text-tertiary">
        <Link href="/admin/ai" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>AI agents</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">{a.name}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · AI operations
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {a.name}
            </h1>
            <StatusChip status={statusChip(a.status)} size="sm" showDot>
              {paused ? "Paused" : "Enabled"}
            </StatusChip>
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">{a.description}</p>
        </div>
        {canEdit && (
          <button type="button" onClick={handleToggleStatus} className={actionBtnCls}>
            {paused ? (
              <>
                <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Enable agent
              </>
            ) : (
              <>
                <PauseCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Pause agent
              </>
            )}
          </button>
        )}
      </header>

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            Agent configuration requires Platform Admin or AI Operator.
          </p>
        </div>
      )}

      <DashboardSection title="24h telemetry" description="Recent invocation metrics">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Invocations" value={String(a.recentInvocations24h)} highlight />
          <SummaryStat label="Avg latency" value={`${(a.avgLatencyMs / 1000).toFixed(1)}s`} />
          <SummaryStat label="Errors" value={String(a.errors24h)} alert={a.errors24h > 0} />
          <SummaryStat label="Prompt version" value={`v${a.activePromptVersion}`} highlight />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav aria-label="Agent sections" className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                  "font-body text-[13px] font-medium whitespace-nowrap",
                  active ? "text-foreground" : "text-text-secondary",
                )}
              >
                {t.label}
                {active && (
                  <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 bg-brand rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 space-y-5">
          {activeTab === "configuration" && (
            <ConfigurationTab
              agent={a}
              promptName={prompt?.name}
              canEdit={canEdit}
              onModelChange={handleModelChange}
            />
          )}
          {activeTab === "telemetry" && <TelemetryTab agent={a} />}
          {activeTab === "policy" && <PolicyTab />}
        </div>
      </section>
    </div>
  );
}

function ConfigurationTab({
  agent: a,
  promptName,
  canEdit,
  onModelChange,
}: {
  agent: NonNullable<ReturnType<typeof useAdminAgent>>;
  promptName?: string;
  canEdit: boolean;
  onModelChange: (modelId: string) => void;
}) {
  return (
    <Panel title="Runtime configuration" description="Model and active prompt binding">
      <dl className="space-y-4">
        <div>
          <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
            Model
          </dt>
          <dd>
            {canEdit ? (
              <Select
                variant="outline"
                size="sm"
                value={a.modelId}
                onChange={(e) => onModelChange(e.target.value)}
              >
                {AGENT_MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                {!AGENT_MODEL_OPTIONS.includes(a.modelId as (typeof AGENT_MODEL_OPTIONS)[number]) && (
                  <option value={a.modelId}>{a.modelId}</option>
                )}
              </Select>
            ) : (
              <code className="font-mono text-[12px] text-foreground">{a.modelId}</code>
            )}
          </dd>
        </div>
        <DetailRow
          label="Active prompt"
          value={promptName ? `${promptName} · v${a.activePromptVersion}` : `v${a.activePromptVersion}`}
        />
        <DetailRow label="Portal" value={a.portal} />
      </dl>
      <div className="mt-4 pt-4 border-t border-stroke-subtle">
        <Link
          href={`/admin/ai/prompts/${a.activePromptId}`}
          className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand-emphasis hover:text-brand transition-colors"
        >
          Switch prompt version →
        </Link>
      </div>
    </Panel>
  );
}

function TelemetryTab({ agent: a }: { agent: NonNullable<ReturnType<typeof useAdminAgent>> }) {
  return (
    <>
      <Panel title="Recent invocations" description="Last 24 hours">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="font-body text-[12.5px] text-text-secondary">
            {a.recentInvocations24h} calls · {(a.avgLatencyMs / 1000).toFixed(1)}s avg · {a.errors24h} errors
          </p>
          <Link
            href={`/admin/audit?resource=prompt&q=${encodeURIComponent(a.shortName)}&time=24h`}
            className="inline-flex items-center gap-1 font-body text-[12px] font-semibold text-brand-emphasis hover:text-brand transition-colors shrink-0"
          >
            Open log <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </Panel>

      {a.overrideStats && (
        <Panel title="Override stats" description="Mentor portal — how AI suggestions were used">
          <dl className="grid grid-cols-3 gap-4">
            <SummaryStat label="Accepted as-is" value={`${a.overrideStats.acceptedAsIs}%`} />
            <SummaryStat label="Modified" value={`${a.overrideStats.modified}%`} />
            <SummaryStat label="Overridden" value={`${a.overrideStats.overridden}%`} highlight />
          </dl>
          <div className="mt-4 pt-4 border-t border-stroke-subtle">
            <Link
              href={`/admin/audit?resource=prompt&action=ai.prompt.rollback&q=${encodeURIComponent(a.shortName)}`}
              className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand-emphasis hover:text-brand transition-colors"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
              View override deltas in audit →
            </Link>
          </div>
        </Panel>
      )}
    </>
  );
}

function PolicyTab() {
  return (
    <div className="rounded-xl border border-brand-border/60 bg-brand-subtle/30 px-4 py-4">
      <p className="font-body text-[13px] font-semibold text-foreground flex items-center gap-1.5">
        <Shield className="h-4 w-4 text-brand" strokeWidth={2} aria-hidden />
        Autonomy policy
      </p>
      <p className="mt-2 font-body text-[12.5px] text-text-secondary leading-relaxed">
        <strong>Phase 1: assistive only.</strong> Every output is reviewed by a human. No autonomous decisions are taken. (§3.1.MVP.7)
      </p>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/20 overflow-hidden">
      <header className="px-4 py-3 border-b border-stroke-subtle">
        <h2 className="font-body text-[13px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{description}</p>
        )}
      </header>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
      <dt className="sm:w-32 shrink-0 font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className="font-body text-[13px] text-foreground capitalize">{value}</dd>
    </div>
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

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-surface border border-stroke-subtle shadow-xs",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);
