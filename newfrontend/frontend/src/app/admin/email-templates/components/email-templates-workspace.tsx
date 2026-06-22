"use client";

/**
 * Email templates workspace — Aurora Glass.
 *
 *   · PageHeader (Platform · Comms) + view-only banner
 *   · Kit Tabs (Templates / SMTP settings) with ?tab= URL sync + dirty-guard
 *   · GlassCard Stat strip (library summary)
 *   · Bulk "send all" glass utility row
 *   · Two-column workspace: scannable template library + editor with live preview
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
} from "lucide-react";
import { Modal } from "@/components/meridian";
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
import {
  AuroraInput,
  AuroraTextarea,
  Banner,
  Chip,
  Field,
  GLASS_MODAL_CLASS,
  GLASS_MODAL_OVERLAY,
  GlassCard,
  PageHeader,
  Stat,
  Tabs,
  TONE,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

type PageTab = "templates" | "smtp";

const PAGE_TABS: Array<{ key: PageTab; label: string }> = [
  { key: "templates", label: "Templates" },
  { key: "smtp", label: "SMTP settings" },
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

  const tabDefs = PAGE_TABS.filter((t) => t.key !== "smtp" || canEdit).map((t) => ({
    key: t.key,
    label: t.label,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Platform · Comms"
        title="Email templates"
        subtitle="Customize transactional emails sent by Glimmora and configure SMTP delivery."
      />

      {!canEdit && (
        <Banner tone="neutral" icon={Mail} title="View-only access">
          Template edits require Platform Admin.
        </Banner>
      )}

      <Tabs
        tabs={tabDefs}
        active={safePageTab}
        onChange={(k) => requestNavigation({ type: "tab", tab: k as PageTab })}
      />

      {safePageTab === "smtp" ? (
        <EmailSmtpSettingsPanel />
      ) : (
        <div className="space-y-6">
          {/* Library summary */}
          <GlassCard className="p-5 sm:p-6">
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">
              Library summary
            </p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Templates" value={counts.total} tone="ai" size="lg" />
              <Stat label="Active" value={counts.active} tone={counts.active > 0 ? "success" : "neutral"} size="lg" />
              <Stat label="Paused" value={counts.paused} size="lg" />
              <Stat label="Categories" value={counts.categories} size="lg" />
            </dl>
          </GlassCard>

          {/* Bulk send utility */}
          <GlassCard className="px-5 sm:px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-display text-[14px] font-semibold text-foreground">Send test emails</p>
                <p className="mt-0.5 font-body text-[12px] text-text-secondary">
                  Send all {counts.total} template types to one address.
                </p>
              </div>
              <div className="w-full lg:max-w-xs">
                <AuroraInput
                  type="email"
                  value={bulkRecipient}
                  onChange={(e) => setBulkRecipient(e.target.value)}
                  placeholder="your@email.com"
                  aria-label="Bulk test recipient"
                />
              </div>
              <button
                type="button"
                onClick={handleSendAll}
                disabled={sendingAll || !bulkRecipient}
                className={primaryBtnClass}
                style={primaryStyle}
              >
                <SendHorizonal className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                {sendingAll ? "Sending…" : `Send all ${counts.total}`}
              </button>
            </div>
            {allSentResults.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/55">
                {allSentResults.map(({ id, ok }) => (
                  <Chip key={id} tone={ok ? "success" : "error"}>
                    {templates[id].name}
                  </Chip>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Library + editor */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] gap-5 items-start">
            <TemplateListPanel
              templates={templates}
              selectedId={selectedId}
              isDirty={isDirty}
              onSelect={(id) => requestNavigation({ type: "template", id })}
            />

            <div className="min-w-0 space-y-5">
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
    <GlassCard className="overflow-hidden xl:sticky xl:top-4">
      <header className="px-4 py-3.5 border-b border-white/55">
        <p className="font-display text-[14px] font-semibold text-foreground">Template library</p>
        <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">Select to edit</p>
      </header>
      <ul className="max-h-[min(70vh,640px)] overflow-y-auto">
        {TEMPLATE_ORDER.map((id, idx) => {
          const t = templates[id];
          const category = CATEGORY_LABELS[id];
          const prevCategory = idx > 0 ? CATEGORY_LABELS[TEMPLATE_ORDER[idx - 1]!] : null;
          const showCategory = category !== prevCategory;
          const selected = id === selectedId;
          return (
            <li key={id}>
              {showCategory && (
                <p className="px-4 pt-3.5 pb-1.5 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
                  {category}
                </p>
              )}
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "w-full text-left px-4 py-3 transition-colors duration-fast border-l-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(124,92,246,0.32)]",
                  selected ? "bg-white/70 border-l-[var(--c-violet-500)]" : "border-l-transparent hover:bg-white/55",
                )}
                style={selected && isDirty ? { boxShadow: `inset 0 0 0 1px ${TONE.warning.border}` } : undefined}
              >
                <span className="font-body text-[13px] font-semibold text-foreground block truncate">
                  {t.name}
                </span>
                <span className="mt-1.5 inline-flex">
                  <Chip tone={t.isActive ? "success" : "neutral"}>
                    {t.isActive ? "Active" : "Paused"}
                  </Chip>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="px-4 py-3.5 border-t border-white/55 bg-white/35">
        <p className="font-body text-[11px] text-text-tertiary leading-relaxed flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
          Edits apply to the selected template. Use Save to persist changes.
        </p>
      </div>
    </GlassCard>
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
    <GlassCard className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3">
      <div className="min-w-0 flex items-center gap-2 flex-wrap">
        <p className="font-display text-[14px] font-semibold text-foreground truncate">
          {templateName}
        </p>
        {isDirty && canEdit && <Chip tone="warning">Unsaved changes</Chip>}
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleMobilePreview}
          className={cn(ghostBtnClass, "xl:hidden")}
        >
          {showMobilePreview ? (
            <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden />
          )}
          {showMobilePreview ? "Hide preview" : "Show preview"}
        </button>
        {canEdit && (
          <button type="button" onClick={onSave} disabled={!isDirty} className={primaryBtnClass} style={primaryStyle}>
            {savedId === selectedId ? (
              <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            ) : (
              <Save className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            )}
            {savedId === selectedId ? "Saved!" : "Save changes"}
          </button>
        )}
      </div>
    </GlassCard>
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
    <GlassCard className={cn("overflow-hidden xl:sticky xl:top-[5.5rem]", className)}>
      <header className="px-5 py-3.5 border-b border-white/55 flex items-center gap-2">
        <Eye className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
        <span className="font-display text-[14px] font-semibold text-foreground">Live preview</span>
        <span className="font-body text-[11.5px] text-text-tertiary hidden sm:inline">
          — sample data filled in
        </span>
      </header>
      <div className="p-5">
        <p className="mb-3 font-body text-[12px] text-text-secondary">
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
    </GlassCard>
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
      className={GLASS_MODAL_CLASS}
      overlayClassName={GLASS_MODAL_OVERLAY}
      title="Unsaved changes"
      description="Save or discard before leaving this template."
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostBtnClass}>
            Keep editing
          </button>
          <button type="button" onClick={onDiscard} className={ghostBtnClass}>
            Discard
          </button>
          <button type="button" onClick={onSave} className={primaryBtnClass} style={primaryStyle}>
            <Save className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            Save &amp; continue
          </button>
        </>
      }
    >
      <div
        className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
        style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}
      >
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.warning.text }} aria-hidden />
        <p className="font-body text-[12.5px] text-text-secondary leading-relaxed m-0">
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
    <GlassCard className="overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/55">
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold text-foreground tracking-[-0.01em]">
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
            className="h-4 w-4 rounded border-[rgba(26,22,68,0.2)] accent-[var(--c-violet-500)] disabled:opacity-60"
          />
          <span className="font-body text-[12px] font-semibold text-foreground">
            {template.isActive ? "Active" : "Paused"}
          </span>
        </label>
      </header>

      <div className="px-5 sm:px-6 py-5 space-y-5">
        <Field label="Subject line" hint="Inbox title — keep under 60 characters">
          <AuroraInput
            type="text"
            value={draft.subject}
            onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
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
                className="h-10 w-12 rounded-lg border border-white/70 bg-white/70 p-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!canEdit}
              />
              <span className="font-mono text-[11px] text-text-tertiary">{draft.headerColor}</span>
            </div>
          </Field>
          <Field label="Logo URL" hint="Optional — leave blank for default">
            <AuroraInput
              type="text"
              value={draft.logoUrl}
              onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value }))}
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
          <AuroraTextarea
            ref={bodyRef}
            rows={9}
            value={draft.bodyHtml}
            onChange={(e) => setDraft((d) => ({ ...d, bodyHtml: e.target.value }))}
            className="min-h-[180px] resize-y leading-relaxed"
            readOnly={!canEdit}
            disabled={!canEdit}
          />
        </Field>

        <div className="rounded-xl border border-white/60 bg-white/45 px-4 py-3.5">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-2.5">
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
          <AuroraInput
            type="text"
            value={draft.footerText}
            onChange={(e) => setDraft((d) => ({ ...d, footerText: e.target.value }))}
            readOnly={!canEdit}
            disabled={!canEdit}
          />
        </Field>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-white/55">
        {canEdit ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 h-10 px-2 rounded-xl shrink-0 font-body text-[12.5px] font-semibold text-text-tertiary hover:text-foreground transition-colors duration-fast"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
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
              className="font-body text-[11.5px] font-semibold underline underline-offset-2 hover:opacity-80"
              style={{ color: TONE.ai.text }}
            >
              Check SMTP settings
            </button>
          )}
          <button
            type="button"
            onClick={onSendTest}
            disabled={sendingTest || !hasSessionEmail}
            title={sessionEmail ? `Send test to ${sessionEmail}` : "Sign in to send a test"}
            className={ghostBtnClass}
            style={testError ? { borderColor: TONE.error.border, color: TONE.error.text } : undefined}
          >
            <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
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
    </GlassCard>
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
      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border font-body text-[11.5px] font-semibold transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
      style={
        inserted
          ? { borderColor: TONE.success.border, background: TONE.success.soft, color: TONE.success.text }
          : { borderColor: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.65)", color: "var(--color-text-secondary)" }
      }
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
