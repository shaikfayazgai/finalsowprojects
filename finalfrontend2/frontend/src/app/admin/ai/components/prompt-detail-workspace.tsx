"use client";

/**
 * Prompt detail — Aurora Glass, tabbed (Editor / Schema / History).
 * Editor is a two-column workspace: AuroraTextarea body + live metadata sidebar.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, RotateCcw, Save } from "lucide-react";
import { Modal } from "@/components/meridian";
import {
  rollbackPromptVersion,
  savePromptNewVersion,
} from "@/lib/admin/mocks/agents-service";
import { useAdminAgent, useAdminPrompt } from "@/lib/hooks/use-admin-ai";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockPromptVersion } from "@/mocks/admin/agents";
import { cn } from "@/lib/utils/cn";
import {
  AURORA_ACCENT,
  AuroraInput,
  AuroraTextarea,
  Banner,
  Chip,
  Crumbs,
  Field,
  GLASS_MODAL_CLASS,
  GLASS_MODAL_OVERLAY,
  GlassCard,
  PageHeader,
  SectionCard,
  Stat,
  Tabs,
  TONE,
  dangerBtnClass,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

type Tab = "editor" | "schema" | "history";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "editor", label: "Editor" },
  { key: "schema", label: "Schema" },
  { key: "history", label: "History" },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PromptDetailWorkspace() {
  const params = useParams<{ promptId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useActiveAdmin();
  const canEdit = useAdminSectionCanEdit("ai");
  const prompt = useAdminPrompt(params.promptId);
  const agent = useAdminAgent(prompt?.agentId);

  const tab = (searchParams.get("tab") as Tab | null) ?? "editor";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "editor";

  const active = prompt?.versions.find((v) => v.status === "active");
  const [selectedVersion, setSelectedVersion] = React.useState<number | null>(active?.version ?? null);
  const [editBody, setEditBody] = React.useState("");
  const [changelog, setChangelog] = React.useState("");
  const [rollbackOpen, setRollbackOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(() => {
    if (searchParams.get("rolled") === "1") return "Prompt rolled back — audit event recorded.";
    if (searchParams.get("saved") === "1") return "New prompt version saved.";
    return null;
  });

  React.useEffect(() => {
    if (!prompt) return;
    const activeVer = prompt.versions.find((v) => v.status === "active");
    setSelectedVersion((prev) => prev ?? activeVer?.version ?? null);
  }, [prompt]);

  const viewing: MockPromptVersion | undefined =
    prompt?.versions.find((v) => v.version === selectedVersion) ?? active;

  React.useEffect(() => {
    if (viewing) setEditBody(viewing.body);
  }, [viewing?.version, viewing?.body]);

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "editor") nextParams.delete("tab");
      else nextParams.set("tab", next);
      nextParams.delete("rolled");
      nextParams.delete("saved");
      const qs = nextParams.toString();
      router.replace(
        qs ? `/admin/ai/prompts/${params.promptId}?${qs}` : `/admin/ai/prompts/${params.promptId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.promptId],
  );

  if (!prompt) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Crumbs items={[{ label: "Prompts", href: "/admin/ai/prompts" }, { label: "Not found" }]} />
        <p className="font-body text-[13px] text-text-secondary">Prompt not found.</p>
      </div>
    );
  }

  const promptId = prompt.id;
  const canRollback = canEdit && viewing && viewing.version !== active?.version;
  const editingActive = canEdit && viewing?.status === "active";

  function handleRollback() {
    if (!canEdit || !viewing) return;
    const updated = rollbackPromptVersion(promptId, viewing.version, profile.displayName);
    if (updated) {
      setSelectedVersion(viewing.version);
      setRollbackOpen(false);
      setToast("Prompt rolled back — audit event recorded.");
    }
  }

  function handleSaveNewVersion() {
    if (!canEdit) return;
    const updated = savePromptNewVersion(promptId, editBody, profile.displayName, changelog);
    if (updated) {
      const newActive = updated.versions.find((v) => v.status === "active");
      if (newActive) setSelectedVersion(newActive.version);
      setChangelog("");
      setToast("New prompt version saved.");
    }
  }

  function handleSandbox() {
    setToast("Sandbox opened with last 10 anonymized invocations.");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div role="status" className="rounded-xl border px-4 py-2.5 font-body text-[12.5px] font-semibold" style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}>
          {toast}
        </div>
      )}

      <Crumbs items={[{ label: "Prompts", href: "/admin/ai/prompts" }, { label: prompt.name }]} />

      <PageHeader
        eyebrow="Platform · AI"
        title={<span className="font-mono">{prompt.name}</span>}
        chips={
          <>
            {viewing?.status === "active" && <Chip tone="success">Active</Chip>}
            <Chip tone="ai" dot={false}>viewing v{viewing?.version}</Chip>
          </>
        }
        subtitle={agent?.name ?? "—"}
        actions={
          canEdit ? (
            <>
              <button type="button" onClick={handleSandbox} className={ghostBtnClass}>
                <FlaskConical className="h-4 w-4" strokeWidth={2} aria-hidden />
                Test in sandbox
              </button>
              {editingActive && (
                <button
                  type="button"
                  disabled={editBody.trim().length < 10}
                  onClick={handleSaveNewVersion}
                  className={primaryBtnClass}
                  style={primaryStyle}
                >
                  <Save className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                  Save as new version
                </button>
              )}
            </>
          ) : undefined
        }
      />

      {!canEdit && (
        <Banner tone="neutral" icon={FlaskConical} title="View-only access">
          Prompt edits require Platform Admin or AI Operator.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">Template profile</p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Versions" value={prompt.versions.length} tone="ai" size="lg" />
          <Stat label="Variables" value={prompt.variables.length} size="lg" />
          <Stat label="Active" value={active ? `v${active.version}` : "—"} tone="success" size="lg" />
          <Stat label="Viewing" value={viewing ? `v${viewing.version}` : "—"} size="lg" />
        </dl>
      </GlassCard>

      <Tabs
        tabs={TABS.map((t) => ({ key: t.key, label: t.label, badge: t.key === "history" ? prompt.versions.length : null, badgeTone: "neutral" }))}
        active={activeTab}
        onChange={(k) => setTab(k as Tab)}
      />

      {activeTab === "editor" && (
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
          <SectionCard
            className="flex-1 min-w-0"
            title="Prompt body"
            description={editingActive ? "Edit active version — saves as new version" : "Read-only view of selected version"}
          >
            <div className="px-5 sm:px-6 py-5 space-y-4">
              {editingActive ? (
                <>
                  <AuroraTextarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={16}
                    className="font-mono text-[12px] leading-relaxed min-h-[320px]"
                  />
                  <Field label="Changelog for new version">
                    <AuroraInput
                      type="text"
                      value={changelog}
                      onChange={(e) => setChangelog(e.target.value)}
                      placeholder="Describe what changed…"
                    />
                  </Field>
                </>
              ) : (
                <pre className="font-mono text-[12px] text-foreground whitespace-pre-wrap leading-relaxed rounded-lg border border-white/60 bg-white/45 p-4">
                  {viewing?.body}
                </pre>
              )}
            </div>
          </SectionCard>

          <aside className="w-full lg:w-[320px] shrink-0 space-y-4">
            <GlassCard className="p-5">
              <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.12em] text-text-tertiary">Template variables</p>
              <p className="mt-1 font-body text-[11.5px] text-text-tertiary leading-relaxed">Interpolated at invocation time.</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {prompt.variables.map((v) => (
                  <code key={v} className="font-mono text-[11px] text-text-secondary border border-white/60 bg-white/55 rounded-lg px-1.5 py-0.5">
                    {v}
                  </code>
                ))}
              </div>
            </GlassCard>

            {viewing && (
              <GlassCard className="p-5">
                <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.12em] text-text-tertiary">Viewing version</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white font-mono text-[12px] font-bold tabular-nums" style={{ backgroundImage: AURORA_ACCENT }}>
                    {viewing.version}
                  </span>
                  <div className="min-w-0">
                    <p className="font-body text-[12.5px] font-semibold text-foreground">
                      v{viewing.version}
                      {viewing.status === "active" && <span className="ml-1.5 font-normal" style={{ color: TONE.success.text }}>· active</span>}
                    </p>
                    <p className="font-body text-[11px] text-text-tertiary" suppressHydrationWarning>
                      {fmtDate(viewing.activatedAt)} · {viewing.author}
                    </p>
                  </div>
                </div>
                <p className="mt-3 font-body text-[12px] text-text-secondary leading-relaxed">&ldquo;{viewing.changelog}&rdquo;</p>
              </GlassCard>
            )}
          </aside>
        </div>
      )}

      {activeTab === "schema" && (
        <SectionCard title="Expected output schema" description="Structured response contract for this prompt">
          <div className="px-5 sm:px-6 py-5">
            <pre className="font-mono text-[12px] text-foreground whitespace-pre-wrap leading-relaxed rounded-lg border border-white/60 bg-white/45 p-4">
              {prompt.expectedSchema}
            </pre>
          </div>
        </SectionCard>
      )}

      {activeTab === "history" && (
        <SectionCard
          title="Version history"
          description="Select a version to preview or roll back"
          action={
            canRollback ? (
              <button type="button" onClick={() => setRollbackOpen(true)} className={cn(dangerBtnClass, "self-center")}>
                <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
                Roll back to v{viewing?.version}
              </button>
            ) : undefined
          }
        >
          <ul className="px-3 sm:px-4 py-3 space-y-2">
            {prompt.versions.map((v) => {
              const selected = selectedVersion === v.version;
              return (
                <li key={v.version}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVersion(v.version);
                      setTab("editor");
                    }}
                    className={cn(
                      "w-full text-left rounded-xl border px-4 py-3 transition-colors duration-fast",
                      selected ? "border-[var(--c-violet-400)] bg-white/65" : "border-white/55 bg-white/40 hover:bg-white/55",
                    )}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: v.status === "active" ? TONE.success.dot : TONE.neutral.dot }}
                      />
                      <span className="font-body text-[13px] font-semibold text-foreground">v{v.version}</span>
                      {v.status === "active" && <Chip tone="success">active</Chip>}
                      <span className="font-body text-[11.5px] text-text-tertiary" suppressHydrationWarning>
                        {fmtDate(v.activatedAt)} · {v.author}
                      </span>
                    </div>
                    <p className="mt-1 pl-4 font-body text-[11.5px] text-text-secondary leading-relaxed">&ldquo;{v.changelog}&rdquo;</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      <Modal
        open={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        className={GLASS_MODAL_CLASS}
        overlayClassName={GLASS_MODAL_OVERLAY}
        title="Roll back prompt"
        description={`Activate v${viewing?.version} and demote the current active version`}
        footer={
          <>
            <button type="button" onClick={() => setRollbackOpen(false)} className={ghostBtnClass}>
              Cancel
            </button>
            <button type="button" onClick={handleRollback} className={dangerBtnClass}>
              <RotateCcw className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Confirm rollback
            </button>
          </>
        }
      >
        <p className="font-body text-[13px] text-text-secondary leading-relaxed">
          This action is audited. The current active version will be archived and v{viewing?.version} will become active for{" "}
          <code className="font-mono text-[12px] text-foreground">{agent?.name}</code>.
        </p>
      </Modal>
    </div>
  );
}
