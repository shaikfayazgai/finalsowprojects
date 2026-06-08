"use client";

/**
 * Email templates workspace — aligned with rubric + skill taxonomy admin UX.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Info,
  Mail,
  RotateCcw,
  Save,
  Send,
  SendHorizonal,
  Settings,
} from "lucide-react";
import { Modal, StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  CATEGORY_LABELS,
  TEMPLATE_ORDER,
  VAR_FRIENDLY,
  getTestPayload,
  insertAtCursor,
} from "@/app/admin/email-templates/constants";
import { EmailSmtpSettingsPanel } from "@/app/admin/email-templates/components/email-smtp-settings-panel";
import { EmailTemplateLivePreview } from "@/app/admin/email-templates/components/email-template-live-preview";
import { fetchInternal } from "@/lib/api/client";
import {
  DEFAULT_TEMPLATES,
  useEmailTemplateStore,
  type EmailTemplate,
  type EmailTemplateId,
} from "@/lib/stores/email-template-store";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { cn } from "@/lib/utils/cn";

type PageTab = "templates" | "smtp";

const PAGE_TABS: Array<{ key: PageTab; label: string; icon: typeof Mail }> = [
  { key: "templates", label: "Templates", icon: Mail },
  { key: "smtp", label: "SMTP settings", icon: Settings },
];

const DEFAULT_SELECTED: EmailTemplateId = "sow_stage_activated";

type PendingNav =
  | { type: "template"; id: EmailTemplateId }
  | { type: "tab"; tab: PageTab };

function isTemplateId(value: string | null): value is EmailTemplateId {
  return Boolean(value && TEMPLATE_ORDER.includes(value as EmailTemplateId));
}

export function EmailTemplatesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { templates, updateTemplate, resetToDefault, toggleActive } = useEmailTemplateStore();
  const canEdit = useAdminSectionCanEdit("emailTemplates");

  const pageTab = (searchParams.get("tab") as PageTab | null) ?? "templates";
  const activePageTab = PAGE_TABS.some((t) => t.key === pageTab) ? pageTab : "templates";
  const safePageTab = !canEdit && activePageTab === "smtp" ? "templates" : activePageTab;

  const queryTemplate = searchParams.get("template");
  const selectedId = isTemplateId(queryTemplate) ? queryTemplate : DEFAULT_SELECTED;

  const [savedId, setSavedId] = React.useState<EmailTemplateId | null>(null);
  const [sendingTest, setSendingTest] = React.useState(false);
  const [testSent, setTestSent] = React.useState(false);
  const [testError, setTestError] = React.useState(false);
  const [showMobilePreview, setShowMobilePreview] = React.useState(true);
  const [pendingNav, setPendingNav] = React.useState<PendingNav | null>(null);
  const [bulkRecipient, setBulkRecipient] = React.useState("");
  const [sendingAll, setSendingAll] = React.useState(false);
  const [allSentResults, setAllSentResults] = React.useState<
    { id: EmailTemplateId; ok: boolean }[]
  >([]);

  const template = templates[selectedId];
  const [draft, setDraft] = React.useState<EmailTemplate>(template);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setDraft(templates[selectedId]);
  }, [selectedId, templates]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(template);

  const counts = React.useMemo(() => {
    const active = TEMPLATE_ORDER.filter((id) => templates[id].isActive).length;
    const categories = new Set(TEMPLATE_ORDER.map((id) => CATEGORY_LABELS[id])).size;
    return {
      total: TEMPLATE_ORDER.length,
      active,
      paused: TEMPLATE_ORDER.length - active,
      categories,
    };
  }, [templates]);

  const applyPageTab = React.useCallback(
    (next: PageTab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "templates") nextParams.delete("tab");
      else nextParams.set("tab", next);
      const qs = nextParams.toString();
      router.replace(qs ? `/admin/email-templates?${qs}` : "/admin/email-templates", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const applySelectedId = React.useCallback(
    (id: EmailTemplateId) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (id === DEFAULT_SELECTED) nextParams.delete("template");
      else nextParams.set("template", id);
      const qs = nextParams.toString();
      router.replace(qs ? `/admin/email-templates?${qs}` : "/admin/email-templates", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const executeNavigation = React.useCallback(
    (nav: PendingNav) => {
      if (nav.type === "template") applySelectedId(nav.id);
      else applyPageTab(nav.tab);
      setPendingNav(null);
    },
    [applyPageTab, applySelectedId],
  );

  const requestNavigation = React.useCallback(
    (nav: PendingNav) => {
      if (isDirty && canEdit) {
        setPendingNav(nav);
        return;
      }
      executeNavigation(nav);
    },
    [isDirty, canEdit, executeNavigation],
  );

  React.useEffect(() => {
    if (!isDirty || !canEdit) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, canEdit]);

  function handleDiscardAndContinue() {
    if (!pendingNav) return;
    executeNavigation(pendingNav);
  }

  function handleSaveAndContinue() {
    if (!pendingNav || !canEdit) return;
    updateTemplate(selectedId, draft);
    setSavedId(selectedId);
    executeNavigation(pendingNav);
    setTimeout(() => setSavedId(null), 2000);
  }

  function handleSave() {
    if (!canEdit) return;
    updateTemplate(selectedId, draft);
    setSavedId(selectedId);
    setTimeout(() => setSavedId(null), 2000);
  }

  function handleReset() {
    if (!canEdit) return;
    resetToDefault(selectedId);
    setDraft(DEFAULT_TEMPLATES[selectedId]);
  }

  async function handleSendTest() {
    if (!session?.user?.email) return;
    setSendingTest(true);
    setTestError(false);
    try {
      const res = await fetchInternal("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        timeoutMs: 120_000,
        body: JSON.stringify({
          event: selectedId,
          payload: getTestPayload(selectedId),
          to: session.user.email,
          subject: draft.subject,
          headerColor: draft.headerColor,
          logoUrl: draft.logoUrl || undefined,
          footerText: draft.footerText,
          bodyHtml: draft.bodyHtml,
        }),
      });
      const data = await res.json().catch(() => ({ success: false }));
      if (data.success) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      } else {
        setTestError(true);
        setTimeout(() => setTestError(false), 4000);
      }
    } catch {
      setTestError(true);
      setTimeout(() => setTestError(false), 4000);
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendAll() {
    if (!bulkRecipient) return;
    setSendingAll(true);
    setAllSentResults([]);
    const results: { id: EmailTemplateId; ok: boolean }[] = [];
    for (const id of TEMPLATE_ORDER) {
      const t = templates[id];
      try {
        const res = await fetchInternal("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          timeoutMs: 120_000,
          body: JSON.stringify({
            event: id,
            payload: getTestPayload(id),
            to: bulkRecipient,
            subject: t.subject,
            headerColor: t.headerColor,
            logoUrl: t.logoUrl || undefined,
            footerText: t.footerText,
            bodyHtml: t.bodyHtml,
          }),
        });
        const data = await res.json().catch(() => ({ success: false }));
        results.push({ id, ok: !!data.success });
      } catch {
        results.push({ id, ok: false });
      }
    }
    setAllSentResults(results);
    setSendingAll(false);
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="min-w-0">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Communications
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Email templates
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Customize transactional emails sent by Glimmora and configure SMTP delivery.
        </p>
      </header>

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
            View-only access
          </p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            Template edits require Platform Admin.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="Email settings sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {PAGE_TABS.map((t) => {
            if (t.key === "smtp" && !canEdit) return null;
            const active = safePageTab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => requestNavigation({ type: "tab", tab: t.key })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                  "font-body text-[13px] font-medium whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                  active ? "text-foreground" : "text-text-secondary",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {t.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </section>

      {safePageTab === "smtp" ? (
        <EmailSmtpSettingsPanel />
      ) : (
        <div className="space-y-5">
              <DashboardSection bare title="Library summary" description="Templates across workflows">
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
                  <SummaryStat label="Templates" value={String(counts.total)} highlight />
                  <SummaryStat label="Active" value={String(counts.active)} highlight={counts.active > 0} />
                  <SummaryStat label="Paused" value={String(counts.paused)} />
                  <SummaryStat label="Categories" value={String(counts.categories)} />
                </dl>
              </DashboardSection>

              <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/20 px-4 py-3.5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[12px] font-semibold text-foreground">
                      Send test emails
                    </p>
                    <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
                      Send all {counts.total} template types to one address
                    </p>
                  </div>
                  <input
                    type="email"
                    value={bulkRecipient}
                    onChange={(e) => setBulkRecipient(e.target.value)}
                    placeholder="your@email.com"
                    className={cn(inputCls, "lg:max-w-xs")}
                  />
                  <button
                    type="button"
                    onClick={handleSendAll}
                    disabled={sendingAll || !bulkRecipient}
                    className={primaryBtnCls}
                  >
                    <SendHorizonal className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                    {sendingAll ? "Sending…" : `Send all ${counts.total}`}
                  </button>
                </div>
                {allSentResults.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-stroke-subtle">
                    {allSentResults.map(({ id, ok }) => (
                      <StatusChip key={id} status={ok ? "success" : "error"} size="sm">
                        {templates[id].name}
                      </StatusChip>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] gap-5 items-start">
                <TemplateListPanel
                  templates={templates}
                  selectedId={selectedId}
                  isDirty={isDirty}
                  onSelect={(id) => requestNavigation({ type: "template", id })}
                />

                <div className="min-w-0 space-y-4">
                  <StickyEditorBar
                    templateName={template.name}
                    isDirty={isDirty}
                    canEdit={canEdit}
                    savedId={savedId}
                    selectedId={selectedId}
                    showMobilePreview={showMobilePreview}
                    onToggleMobilePreview={() => setShowMobilePreview((v) => !v)}
                    onSave={handleSave}
                  />

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                    <TemplateEditorPanel
                      template={template}
                      draft={draft}
                      setDraft={setDraft}
                      canEdit={canEdit}
                      bodyRef={bodyRef}
                      onReset={handleReset}
                      onSendTest={handleSendTest}
                      onToggleActive={() => canEdit && toggleActive(selectedId)}
                      sendingTest={sendingTest}
                      testSent={testSent}
                      testError={testError}
                      hasSessionEmail={Boolean(session?.user?.email)}
                      sessionEmail={session?.user?.email}
                      onGoToSmtp={() => requestNavigation({ type: "tab", tab: "smtp" })}
                    />

                    <TemplatePreviewPanel
                      draft={draft}
                      selectedId={selectedId}
                      className="hidden xl:block"
                    />

                    {showMobilePreview && (
                      <TemplatePreviewPanel
                        draft={draft}
                        selectedId={selectedId}
                        className="xl:hidden"
                      />
                    )}
                  </div>
                </div>
              </div>

              <UnsavedChangesModal
                open={pendingNav !== null}
                templateName={template.name}
                onClose={() => setPendingNav(null)}
                onDiscard={handleDiscardAndContinue}
                onSave={handleSaveAndContinue}
              />
        </div>
      )}
    </div>
  );
}

function TemplateListPanel({
  templates,
  selectedId,
  isDirty,
  onSelect,
}: {
  templates: Record<EmailTemplateId, EmailTemplate>;
  selectedId: EmailTemplateId;
  isDirty: boolean;
  onSelect: (id: EmailTemplateId) => void;
}) {
  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden xl:sticky xl:top-4">
      <header className="px-4 py-3 border-b border-stroke-subtle">
        <p className="font-body text-[12px] font-semibold text-foreground">Template library</p>
        <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">Select to edit</p>
      </header>
      <ul className="divide-y divide-stroke-subtle max-h-[min(70vh,640px)] overflow-y-auto">
        {TEMPLATE_ORDER.map((id, idx) => {
          const t = templates[id];
          const category = CATEGORY_LABELS[id];
          const prevCategory = idx > 0 ? CATEGORY_LABELS[TEMPLATE_ORDER[idx - 1]!] : null;
          const showCategory = category !== prevCategory;
          const selected = id === selectedId;
          return (
            <li key={id}>
              {showCategory && (
                <p className="px-4 pt-3 pb-1 font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                  {category}
                </p>
              )}
              <button
                type="button"
                onClick={() => onSelect(id)}
                className={cn(
                  "w-full text-left px-4 py-3 transition-colors duration-fast",
                  "hover:bg-bg-subtle/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
                  selected && "bg-brand-subtle/15 border-l-2 border-l-brand",
                  !selected && "border-l-2 border-l-transparent",
                  selected && isDirty && "ring-1 ring-inset ring-warning-border/40",
                )}
              >
                <span className="font-body text-[13px] font-medium text-foreground block truncate">
                  {t.name}
                </span>
                <span className="mt-1.5 inline-flex">
                  <StatusChip status={t.isActive ? "success" : "neutral"} size="sm">
                    {t.isActive ? "Active" : "Paused"}
                  </StatusChip>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="px-4 py-3 border-t border-stroke-subtle bg-bg-subtle/20">
        <p className="font-body text-[11px] text-text-tertiary leading-relaxed flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand-emphasis" strokeWidth={2} aria-hidden />
          Edits apply to the selected template. Use Save to persist changes.
        </p>
      </div>
    </section>
  );
}

function StickyEditorBar({
  templateName,
  isDirty,
  canEdit,
  savedId,
  selectedId,
  showMobilePreview,
  onToggleMobilePreview,
  onSave,
}: {
  templateName: string;
  isDirty: boolean;
  canEdit: boolean;
  savedId: EmailTemplateId | null;
  selectedId: EmailTemplateId;
  showMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3",
        "rounded-xl border border-stroke-subtle bg-surface/95 backdrop-blur-sm",
        "px-4 py-3 shadow-xs",
      )}
    >
      <div className="min-w-0 flex items-center gap-2 flex-wrap">
        <p className="font-body text-[13px] font-semibold text-foreground truncate">
          {templateName}
        </p>
        {isDirty && canEdit && (
          <StatusChip status="warning" size="sm">
            Unsaved changes
          </StatusChip>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleMobilePreview}
          className={cn(secondaryBtnCls, "xl:hidden")}
        >
          {showMobilePreview ? (
            <EyeOff className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          ) : (
            <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          )}
          {showMobilePreview ? "Hide preview" : "Show preview"}
        </button>
        {canEdit && (
          <button type="button" onClick={onSave} disabled={!isDirty} className={primaryBtnCls}>
            {savedId === selectedId ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            )}
            {savedId === selectedId ? "Saved!" : "Save changes"}
          </button>
        )}
      </div>
    </div>
  );
}

function TemplatePreviewPanel({
  draft,
  selectedId,
  className,
}: {
  draft: EmailTemplate;
  selectedId: EmailTemplateId;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-stroke-subtle bg-surface overflow-hidden xl:sticky xl:top-[4.5rem]",
        className,
      )}
    >
      <header className="px-5 py-3 border-b border-stroke-subtle flex items-center gap-2">
        <Eye className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
        <span className="font-body text-[12px] font-semibold text-foreground">Live preview</span>
        <span className="font-body text-[11.5px] text-text-tertiary hidden sm:inline">
          — sample data filled in
        </span>
      </header>
      <div className="p-5">
        <p className="mb-3 font-body text-[12px] text-text-tertiary">
          Subject:{" "}
          <strong className="text-foreground">
            {draft.subject.replace(
              /\{\{(\w+)\}\}/g,
              (_, k) => getTestPayload(selectedId)[k] ?? `[${k}]`,
            )}
          </strong>
        </p>
        <EmailTemplateLivePreview template={draft} selectedId={selectedId} />
      </div>
    </section>
  );
}

function UnsavedChangesModal({
  open,
  templateName,
  onClose,
  onDiscard,
  onSave,
}: {
  open: boolean;
  templateName: string;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unsaved changes"
      description="Save or discard before leaving this template."
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryBtnCls}>
            Keep editing
          </button>
          <button type="button" onClick={onDiscard} className={secondaryBtnCls}>
            Discard
          </button>
          <button type="button" onClick={onSave} className={primaryBtnCls}>
            <Save className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Save & continue
          </button>
        </>
      }
    >
      <div className="rounded-md border border-warning-border/60 bg-warning-subtle/30 px-3 py-2.5 flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-warning-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        <p className="font-body text-[12px] text-text-secondary leading-relaxed m-0">
          <strong className="text-foreground">{templateName}</strong> has changes that
          haven&apos;t been saved.
        </p>
      </div>
    </Modal>
  );
}

function TemplateEditorPanel({
  template,
  draft,
  setDraft,
  canEdit,
  bodyRef,
  onReset,
  onSendTest,
  onToggleActive,
  sendingTest,
  testSent,
  testError,
  hasSessionEmail,
  sessionEmail,
  onGoToSmtp,
}: {
  template: EmailTemplate;
  draft: EmailTemplate;
  setDraft: React.Dispatch<React.SetStateAction<EmailTemplate>>;
  canEdit: boolean;
  bodyRef: React.RefObject<HTMLTextAreaElement | null>;
  onReset: () => void;
  onSendTest: () => void;
  onToggleActive: () => void;
  sendingTest: boolean;
  testSent: boolean;
  testError: boolean;
  hasSessionEmail: boolean;
  sessionEmail?: string | null;
  onGoToSmtp: () => void;
}) {
  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-stroke-subtle">
        <div className="min-w-0">
          <p className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            {template.name}
          </p>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">{template.description}</p>
        </div>
        <label className="flex items-center gap-2 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={template.isActive}
            onChange={onToggleActive}
            disabled={!canEdit}
            className="h-4 w-4 rounded border-stroke accent-brand disabled:opacity-60"
          />
          <span className="font-body text-[12px] font-semibold text-foreground">
            {template.isActive ? "Active" : "Paused"}
          </span>
        </label>
      </header>

      <div className="px-5 py-5 space-y-5">
        <Field label="Subject line" hint="Inbox title — keep under 60 characters">
          <input
            type="text"
            value={draft.subject}
            onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
            className={inputCls}
            readOnly={!canEdit}
            disabled={!canEdit}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
          <Field label="Header colour">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.headerColor}
                onChange={(e) => setDraft((d) => ({ ...d, headerColor: e.target.value }))}
                className="h-9 w-11 rounded-md border border-stroke p-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!canEdit}
              />
              <span className="font-mono text-[11px] text-text-tertiary">{draft.headerColor}</span>
            </div>
          </Field>
          <Field label="Logo URL" hint="Optional — leave blank for default">
            <input
              type="text"
              value={draft.logoUrl}
              onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value }))}
              className={inputCls}
              placeholder="https://yoursite.com/logo.png"
              readOnly={!canEdit}
              disabled={!canEdit}
            />
          </Field>
        </div>

        <Field
          label="Message body"
          hint="Click Insert buttons to add dynamic fields at your cursor"
        >
          <textarea
            ref={bodyRef}
            rows={9}
            value={draft.bodyHtml}
            onChange={(e) => setDraft((d) => ({ ...d, bodyHtml: e.target.value }))}
            className={textareaCls}
            readOnly={!canEdit}
            disabled={!canEdit}
          />
        </Field>

        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/30 px-4 py-3">
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
            Insert variables
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.variables.map((v) => (
              <VarInsertBtn
                key={v}
                name={v}
                bodyRef={bodyRef}
                onChangeDraft={(val) => setDraft((d) => ({ ...d, bodyHtml: val }))}
                disabled={!canEdit}
              />
            ))}
          </div>
        </div>

        <Field label="Footer text">
          <input
            type="text"
            value={draft.footerText}
            onChange={(e) => setDraft((d) => ({ ...d, footerText: e.target.value }))}
            className={inputCls}
            readOnly={!canEdit}
            disabled={!canEdit}
          />
        </Field>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-stroke-subtle">
        {canEdit ? (
          <button type="button" onClick={onReset} className={ghostBtnCls}>
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Restore original
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2">
          {testError && (
            <button
              type="button"
              onClick={onGoToSmtp}
              className="font-body text-[11.5px] font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              Check SMTP settings
            </button>
          )}
          <button
            type="button"
            onClick={onSendTest}
            disabled={sendingTest || !hasSessionEmail}
            title={sessionEmail ? `Send test to ${sessionEmail}` : "Sign in to send a test"}
            className={cn(secondaryBtnCls, testError && "border-error-border text-error-text")}
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {testError
              ? "Send failed"
              : testSent
                ? "Sent!"
                : sendingTest
                  ? "Sending…"
                  : "Send test"}
          </button>
        </div>
      </footer>
    </section>
  );
}

function VarInsertBtn({
  name,
  bodyRef,
  onChangeDraft,
  disabled,
}: {
  name: string;
  bodyRef: React.RefObject<HTMLTextAreaElement | null>;
  onChangeDraft: (v: string) => void;
  disabled?: boolean;
}) {
  const [inserted, setInserted] = React.useState(false);
  const label = VAR_FRIENDLY[name] ?? name;

  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        insertAtCursor(bodyRef, `{{${name}}}`, onChangeDraft);
        setInserted(true);
        setTimeout(() => setInserted(false), 1200);
      }}
      disabled={disabled}
      title={`Insert ${label}`}
      className={cn(
        "inline-flex items-center gap-1 h-7 px-2.5 rounded-full border font-body text-[11.5px] font-medium transition-colors duration-fast",
        inserted
          ? "border-success-border bg-success-subtle text-success-text"
          : "border-stroke-subtle bg-surface text-text-secondary hover:bg-bg-subtle",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {inserted ? (
        <>
          <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          Inserted
        </>
      ) : (
        <>+ {label}</>
      )}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </span>
      {children}
      {hint && (
        <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">{hint}</p>
      )}
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
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          highlight ? "text-brand-emphasis" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

const inputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke bg-surface",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

const textareaCls = cn(
  "block w-full min-h-[180px] px-3 py-2.5 rounded-md border border-stroke bg-surface resize-y",
  "font-body text-[13px] text-foreground leading-relaxed",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs shrink-0",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

const secondaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-bg-subtle transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

const ghostBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-2 rounded-md shrink-0",
  "font-body text-[12px] font-semibold text-text-tertiary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast",
);
