"use client";

import * as React from "react";
import { MoreHorizontal, Plus, Webhook } from "lucide-react";
import {
  AdminModal,
  AuroraSelect,
  Chip,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";
import { getIntegrationById, getWebhooksMock, type WebhookMock } from "@/lib/settings/settings-mock";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  ConfigPanel,
  IntegrationDetailShell,
  PhaseNote,
} from "./integration-detail-ui";

const EVENT_OPTIONS = [
  "task.completed",
  "task.created",
  "task.assigned",
  "project.health.changed",
  "milestone.approved",
];

const solidInputCls =
  "w-full h-9 px-3 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function WebhooksWorkspace() {
  const integration = React.useMemo(() => getIntegrationById("webhooks")!, []);
  const [webhooks, setWebhooks] = React.useState<WebhookMock[]>(() => getWebhooksMock());
  const [modalOpen, setModalOpen] = React.useState(false);
  const [menuId, setMenuId] = React.useState<string | null>(null);

  return (
    <IntegrationDetailShell
      integration={integration}
      title="Webhooks"
      description="Push project events to Jira, Azure DevOps, Slack, or any HTTPS endpoint."
    >
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <div>
            <h2 className="font-display text-[15.5px] font-semibold text-foreground">Active endpoints</h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              {webhooks.length} webhook{webhooks.length === 1 ? "" : "s"} · {webhooks.filter((w) => w.enabled).length} enabled
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={cn(primaryBtnClass, "h-8 text-[12px]")}
            style={primaryStyle}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            New webhook
          </button>
        </div>

        <div
          aria-hidden
          className="hidden sm:grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_100px_120px_40px] gap-3 px-5 sm:px-6 py-2 border-b border-stroke-subtle bg-bg-subtle/50"
        >
          {["Event", "URL", "Status", "Last delivery", ""].map((col) => (
            <span
              key={col || "actions"}
              className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary"
            >
              {col}
            </span>
          ))}
        </div>

        <ul className="divide-y divide-stroke-subtle">
          {webhooks.map((wh) => (
            <WebhookRow
              key={wh.id}
              webhook={wh}
              menuOpen={menuId === wh.id}
              onToggleMenu={() => setMenuId((id) => (id === wh.id ? null : wh.id))}
              onCloseMenu={() => setMenuId(null)}
              onToggleEnabled={() => {
                setWebhooks((list) =>
                  list.map((w) => (w.id === wh.id ? { ...w, enabled: !w.enabled } : w)),
                );
                toast.success(wh.enabled ? "Webhook disabled" : "Webhook enabled");
                setMenuId(null);
              }}
              onTest={() => {
                toast.success("Test delivery sent", `POST ${wh.url}`);
                setMenuId(null);
              }}
            />
          ))}
        </ul>

        <PhaseNote>Webhook CRUD and delivery logs persist when the integrations API ships.</PhaseNote>
      </section>

      <NewWebhookModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(wh) => {
          setWebhooks((list) => [...list, wh]);
          toast.success("Webhook created", `${wh.event} → ${wh.url}`);
          setModalOpen(false);
        }}
      />
    </IntegrationDetailShell>
  );
}

function WebhookRow({
  webhook,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onToggleEnabled,
  onTest,
}: {
  webhook: WebhookMock;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onToggleEnabled: () => void;
  onTest: () => void;
}) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onCloseMenu();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen, onCloseMenu]);

  return (
    <li
      className={cn(
        "relative px-5 sm:px-6 py-3 min-h-[56px] hover:bg-bg-subtle/60 transition-colors duration-fast",
        "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_100px_120px_40px] sm:gap-3 sm:items-center",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Webhook className="h-3.5 w-3.5 text-text-tertiary shrink-0 sm:hidden" strokeWidth={2} aria-hidden />
        <span className="font-mono text-[12px] text-foreground truncate">{webhook.event}</span>
      </div>
      <span className="mt-1 sm:mt-0 font-mono text-[11px] text-text-secondary truncate block">{webhook.url}</span>
      <span className="mt-2 sm:mt-0 inline-flex w-fit">
        <Chip tone={webhook.enabled ? "success" : "neutral"}>
          {webhook.enabled ? "Enabled" : "Disabled"}
        </Chip>
      </span>
      <span className="mt-1 sm:mt-0 font-body text-[11px] text-text-tertiary">
        {webhook.lastDeliveryAt ? fmtRelative(webhook.lastDeliveryAt) : "—"}
      </span>

      <div ref={menuRef} className="absolute top-3 right-4 sm:relative sm:top-auto sm:right-auto sm:flex sm:justify-end">
        <button
          type="button"
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          aria-label={`Actions for ${webhook.event}`}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-subtle transition-colors duration-fast",
            menuOpen && "text-foreground bg-bg-subtle",
          )}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[148px] rounded-xl border border-stroke-subtle bg-surface shadow-[0_18px_40px_-24px_rgba(30,41,59,0.24)] py-1">
            <MenuItem onClick={onTest}>Send test</MenuItem>
            <MenuItem onClick={onToggleEnabled}>{webhook.enabled ? "Disable" : "Enable"}</MenuItem>
          </div>
        )}
      </div>
    </li>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-3 py-2 text-left font-body text-[12.5px] font-medium text-foreground hover:bg-bg-subtle transition-colors duration-fast"
    >
      {children}
    </button>
  );
}

function NewWebhookModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (wh: WebhookMock) => void;
}) {
  const [event, setEvent] = React.useState(EVENT_OPTIONS[0]);
  const [url, setUrl] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setEvent(EVENT_OPTIONS[0]);
      setUrl("");
      setSecret("");
      setError(null);
    }
  }, [open]);

  const onSubmit = () => {
    if (!url.trim()) {
      setError("Endpoint URL is required.");
      return;
    }
    onCreate({
      id: `wh-${Date.now()}`,
      event,
      url: url.trim(),
      enabled: true,
      lastDeliveryAt: null,
      lastStatus: null,
    });
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      icon={Webhook}
      tone="info"
      size="md"
      title="New webhook"
      description="Deliver Glimmora events to an external HTTPS endpoint."
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button type="button" onClick={onClose} className={secondaryBtnClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className={primaryBtnClass}
            style={primaryStyle}
          >
            Create webhook
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Event</p>
          <p className="font-body text-[11.5px] text-text-tertiary">When this fires</p>
          <AuroraSelect
            value={event}
            onChange={(e) => setEvent(e.target.value)}
          >
            {EVENT_OPTIONS.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </AuroraSelect>
        </div>

        <div className="space-y-2">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Endpoint</p>
          <div>
            <label className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
              URL <span className="text-error-text">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.example.com/glimmora"
              className={solidInputCls}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Signing secret</p>
          <p className="font-body text-[11.5px] text-text-tertiary">Optional — used to verify payload authenticity</p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="whsec_…"
            className={solidInputCls}
          />
        </div>

        {error && <p className="font-body text-[12.5px] text-error-text">{error}</p>}
      </div>
    </AdminModal>
  );
}
