"use client";

/**
 * AI agent detail — Aurora Glass, tabbed (Configuration / Telemetry / Policy).
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Cpu,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Shield,
} from "lucide-react";
import {
  AGENT_MODEL_OPTIONS,
  setAgentModel,
  setAgentStatus,
} from "@/lib/admin/mocks/agents-service";
import { useAdminAgent, useAdminPrompt } from "@/lib/hooks/use-admin-ai";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { AgentStatus } from "@/mocks/admin/agents";
import { cn } from "@/lib/utils/cn";
import {
  AURORA_ACCENT,
  AuroraSelect,
  Banner,
  Chip,
  Crumbs,
  Field,
  GlassCard,
  PageHeader,
  SectionCard,
  Stat,
  Tabs,
  TONE,
  ghostBtnClass,
  type Tone,
} from "../../_shell/aurora-ui";

type Tab = "configuration" | "telemetry" | "policy";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "configuration", label: "Configuration" },
  { key: "telemetry", label: "Telemetry" },
  { key: "policy", label: "Policy" },
];

function statusTone(s: AgentStatus): Tone {
  return s === "enabled" ? "success" : "neutral";
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
      <div className="space-y-5 animate-fade-in">
        <Crumbs items={[{ label: "AI agents", href: "/admin/ai" }, { label: "Not found" }]} />
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
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div role="status" className="rounded-xl border px-4 py-2.5 font-body text-[12.5px] font-semibold" style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}>
          {toast}
        </div>
      )}

      <Crumbs items={[{ label: "AI agents", href: "/admin/ai" }, { label: a.name }]} />

      <PageHeader
        eyebrow="Platform · AI"
        title={a.name}
        chips={<Chip tone={statusTone(a.status)}>{paused ? "Paused" : "Enabled"}</Chip>}
        subtitle={a.description}
        actions={
          canEdit ? (
            <button type="button" onClick={handleToggleStatus} className={ghostBtnClass}>
              {paused ? (
                <>
                  <PlayCircle className="h-4 w-4" strokeWidth={2} aria-hidden /> Enable agent
                </>
              ) : (
                <>
                  <PauseCircle className="h-4 w-4" strokeWidth={2} aria-hidden /> Pause agent
                </>
              )}
            </button>
          ) : undefined
        }
      />

      {!canEdit && (
        <Banner tone="neutral" icon={Cpu} title="View-only access">
          Agent configuration requires Platform Admin or AI Operator.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">24h telemetry</p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Invocations" value={a.recentInvocations24h} tone="ai" size="lg" />
          <Stat label="Avg latency" value={`${(a.avgLatencyMs / 1000).toFixed(1)}s`} tone={a.avgLatencyMs > 3000 ? "warning" : "neutral"} size="lg" />
          <Stat label="Errors" value={a.errors24h} tone={a.errors24h > 0 ? "error" : "success"} size="lg" />
          <Stat label="Prompt version" value={`v${a.activePromptVersion}`} size="lg" />
        </dl>
      </GlassCard>

      <Tabs tabs={TABS.map((t) => ({ key: t.key, label: t.label }))} active={activeTab} onChange={(k) => setTab(k as Tab)} />

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
    <SectionCard title="Runtime configuration" description="Model and active prompt binding">
      <div className="px-5 sm:px-6 py-5 space-y-5">
        {canEdit ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Field label="Model">
              <AuroraSelect value={a.modelId} onChange={(e) => onModelChange(e.target.value)}>
                {AGENT_MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                {!AGENT_MODEL_OPTIONS.includes(a.modelId as (typeof AGENT_MODEL_OPTIONS)[number]) && (
                  <option value={a.modelId}>{a.modelId}</option>
                )}
              </AuroraSelect>
            </Field>
            <DetailRow label="Portal" value={a.portal} />
          </div>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <DetailRow label="Model" value={a.modelId} mono />
            <DetailRow label="Portal" value={a.portal} />
          </dl>
        )}
        <DetailRow
          label="Active prompt"
          value={promptName ? `${promptName} · v${a.activePromptVersion}` : `v${a.activePromptVersion}`}
          mono
        />
      </div>
      <div className="px-5 sm:px-6 py-3.5 border-t border-white/55">
        <Link
          href={`/admin/ai/prompts/${a.activePromptId}`}
          className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold"
          style={{ color: TONE.ai.text }}
        >
          Switch prompt version
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </SectionCard>
  );
}

function TelemetryTab({ agent: a }: { agent: NonNullable<ReturnType<typeof useAdminAgent>> }) {
  return (
    <div className="space-y-5">
      <SectionCard
        title="Recent invocations"
        description="Last 24 hours"
        action={
          <Link
            href={`/admin/audit?resource=prompt&q=${encodeURIComponent(a.shortName)}&time=24h`}
            className="inline-flex items-center gap-1 font-body text-[12.5px] font-semibold self-center"
            style={{ color: TONE.ai.text }}
          >
            Open log <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </Link>
        }
      >
        <div className="px-5 sm:px-6 py-5">
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat label="Calls" value={a.recentInvocations24h} tone="ai" />
            <Stat label="Avg latency" value={`${(a.avgLatencyMs / 1000).toFixed(1)}s`} tone={a.avgLatencyMs > 3000 ? "warning" : "neutral"} />
            <Stat label="Errors" value={a.errors24h} tone={a.errors24h > 0 ? "error" : "success"} />
          </dl>
        </div>
      </SectionCard>

      {a.overrideStats && (
        <SectionCard
          title="Override stats"
          description="Mentor portal — how AI suggestions were used"
          action={
            <Link
              href={`/admin/audit?resource=prompt&action=ai.prompt.rollback&q=${encodeURIComponent(a.shortName)}`}
              className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold self-center"
              style={{ color: TONE.ai.text }}
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Override deltas
            </Link>
          }
        >
          <div className="px-5 sm:px-6 py-5">
            <dl className="grid grid-cols-3 gap-4">
              <Stat label="Accepted as-is" value={`${a.overrideStats.acceptedAsIs}%`} tone="success" />
              <Stat label="Modified" value={`${a.overrideStats.modified}%`} tone="warning" />
              <Stat label="Overridden" value={`${a.overrideStats.overridden}%`} tone="ai" />
            </dl>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function PolicyTab() {
  return (
    <GlassCard
      className="flex items-start gap-3.5 px-5 sm:px-6 py-5"
      style={{ background: TONE.ai.soft, borderColor: TONE.ai.border }}
    >
      <span className="grid place-items-center h-10 w-10 rounded-xl shrink-0 text-white" style={{ backgroundImage: AURORA_ACCENT }}>
        <Shield className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-display text-[14px] font-semibold text-foreground">Autonomy policy</p>
        <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">
          <strong>Phase 1: assistive only.</strong> Every output is reviewed by a human. No autonomous decisions are taken. (§3.1.MVP.7)
        </p>
      </div>
    </GlassCard>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={cn("mt-1 font-body text-[13.5px] text-foreground capitalize", mono && "font-mono text-[12.5px] normal-case")}>{value}</dd>
    </div>
  );
}
