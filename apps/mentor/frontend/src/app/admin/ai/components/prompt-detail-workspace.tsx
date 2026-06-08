"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FlaskConical, RotateCcw } from "lucide-react";
import { Modal, StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  rollbackPromptVersion,
  savePromptNewVersion,
} from "@/lib/admin/mocks/agents-service";
import { useAdminAgent, useAdminPrompt } from "@/lib/hooks/use-admin-ai";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockPromptVersion } from "@/mocks/admin/agents";
import { cn } from "@/lib/utils/cn";

type Tab = "editor" | "schema" | "history";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "editor", label: "Editor" },
  { key: "schema", label: "Schema" },
  { key: "history", label: "History" },
];

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
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link href="/admin/ai/prompts" className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Prompts
        </Link>
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
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div role="status" className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text">
          {toast}
        </div>
      )}

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-body text-[12px] text-text-tertiary">
        <Link href="/admin/ai/prompts" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Prompts</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary font-mono text-[11.5px]">{prompt.name}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · AI operations
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight font-mono">
              {prompt.name}
            </h1>
            {viewing?.status === "active" && (
              <StatusChip status="success" size="sm">Active</StatusChip>
            )}
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            {agent?.name ?? "—"} · viewing v{viewing?.version}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button type="button" onClick={handleSandbox} className={actionBtnCls}>
              <FlaskConical className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Test in sandbox
            </button>
            {editingActive && (
              <button
                type="button"
                disabled={editBody.trim().length < 10}
                onClick={handleSaveNewVersion}
                className={cn(primaryBtnCls, editBody.trim().length < 10 && "opacity-50 cursor-not-allowed hover:bg-brand")}
              >
                Save as new version
              </button>
            )}
          </div>
        )}
      </header>

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            Prompt edits require Platform Admin or AI Operator.
          </p>
        </div>
      )}

      <DashboardSection title="Template profile" description="Version and variable summary">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Versions" value={String(prompt.versions.length)} highlight />
          <SummaryStat label="Variables" value={String(prompt.variables.length)} />
          <SummaryStat label="Active" value={active ? `v${active.version}` : "—"} highlight />
          <SummaryStat label="Viewing" value={viewing ? `v${viewing.version}` : "—"} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav aria-label="Prompt sections" className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge = t.key === "history" ? prompt.versions.length : null;
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
                {badge != null && (
                  <span className="font-mono text-[10px] tabular-nums text-text-tertiary">{badge}</span>
                )}
                {active && (
                  <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 bg-brand rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 space-y-5">
          {activeTab === "editor" && (
            <Panel title="Prompt body" description={editingActive ? "Edit active version — saves as new version" : "Read-only view of selected version"}>
              {editingActive ? (
                <>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={14}
                    className={textareaCls}
                  />
                  <label className="block mt-4">
                    <span className="block font-body text-[11.5px] font-semibold text-foreground mb-1.5">
                      Changelog for new version
                    </span>
                    <input
                      type="text"
                      value={changelog}
                      onChange={(e) => setChangelog(e.target.value)}
                      placeholder="Describe what changed…"
                      className={inputCls}
                    />
                  </label>
                </>
              ) : (
                <pre className="font-mono text-[11.5px] text-foreground whitespace-pre-wrap leading-relaxed bg-bg-subtle/40 rounded-lg border border-stroke-subtle p-4">
                  {viewing?.body}
                </pre>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {prompt.variables.map((v) => (
                  <code key={v} className="font-mono text-[11px] text-text-secondary bg-bg-subtle rounded px-1.5 py-0.5">
                    {v}
                  </code>
                ))}
              </div>
            </Panel>
          )}

          {activeTab === "schema" && (
            <Panel title="Expected output schema" description="Structured response contract for this prompt">
              <pre className="font-mono text-[11.5px] text-foreground whitespace-pre-wrap leading-relaxed bg-bg-subtle/40 rounded-lg border border-stroke-subtle p-4">
                {prompt.expectedSchema}
              </pre>
            </Panel>
          )}

          {activeTab === "history" && (
            <Panel title="Version history" description="Select a version to preview or roll back">
              <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
                {prompt.versions.map((v) => (
                  <li key={v.version}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVersion(v.version);
                        setTab("editor");
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 transition-colors duration-fast",
                        selectedVersion === v.version ? "bg-bg-subtle/60" : "hover:bg-bg-subtle/40",
                      )}
                    >
                      <div className="flex items-center gap-2 font-body text-[12.5px] flex-wrap">
                        <span
                          aria-hidden
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            v.status === "active" ? "bg-success-text" : "bg-text-tertiary/50",
                          )}
                        />
                        <span className="font-semibold text-foreground">v{v.version}</span>
                        {v.status === "active" && (
                          <StatusChip status="success" size="sm">active</StatusChip>
                        )}
                        <span className="text-text-tertiary">
                          — {new Date(v.activatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} by {v.author}
                        </span>
                      </div>
                      <p className="mt-0.5 font-body text-[11.5px] text-text-secondary pl-4">
                        &ldquo;{v.changelog}&rdquo;
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              {canRollback && (
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => setRollbackOpen(true)} className={warningBtnCls}>
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Roll back to v{viewing?.version}
                  </button>
                </div>
              )}
            </Panel>
          )}
        </div>
      </section>

      <Modal
        open={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        title="Roll back prompt"
        description={`Activate v${viewing?.version} and demote the current active version`}
        footer={
          <>
            <button type="button" onClick={() => setRollbackOpen(false)} className={actionBtnCls}>
              Cancel
            </button>
            <button type="button" onClick={handleRollback} className={warningBtnCls}>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Confirm rollback
            </button>
          </>
        }
      >
        <p className="font-body text-[13px] text-text-secondary leading-relaxed">
          This action is audited. The current active version will be archived and v{viewing?.version} will become active for{" "}
          <code className="font-mono text-[12px]">{agent?.name}</code>.
        </p>
      </Modal>
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

function SummaryStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={cn("mt-1 font-body text-[20px] font-semibold tabular-nums", highlight ? "text-foreground" : "text-text-secondary")}>
        {value}
      </dd>
    </div>
  );
}

const textareaCls = cn(
  "block w-full px-3 py-2.5 rounded-md border border-stroke-subtle bg-bg-subtle/40",
  "font-mono text-[11.5px] text-foreground leading-relaxed",
  "focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand",
);

const inputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke-subtle bg-surface",
  "font-body text-[12.5px] text-foreground",
  "focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand",
);

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke-subtle shadow-xs",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);

const warningBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-warning-subtle text-warning-text border border-warning-border",
  "font-body text-[13px] font-semibold hover:bg-warning-subtle/70 transition-colors duration-fast",
);
