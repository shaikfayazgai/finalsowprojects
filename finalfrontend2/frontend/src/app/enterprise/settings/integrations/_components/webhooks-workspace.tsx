"use client";

import * as React from "react";
import { MoreHorizontal, Plus, Webhook } from "lucide-react";
import {
  Drawer,
  GlassField,
  GlassSection,
  glassBtnPrimary,
  glassBtnSecondary,
  glassInputCls,
} from "@/components/meridian";
import { getIntegrationById, getWebhooksMock, type WebhookMock } from "@/lib/settings/settings-mock";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT, GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { Chip } from "@/app/admin/_shell/aurora-ui";
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
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [menuId, setMenuId] = React.useState<string | null>(null);

  return (
    <IntegrationDetailShell
      integration={integration}
      title="Webhooks"
      description="Push project events to Jira, Azure DevOps, Slack, or any HTTPS endpoint."
    >
      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/55">
          <div>
            <h2 className="font-display text-[15.5px] font-semibold text-foreground">Active endpoints</h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              {webhooks.length} webhook{webhooks.length === 1 ? "" : "s"} · {webhooks.filter((w) => w.enabled).length} enabled
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-xl shrink-0 border border-transparent",
              "text-white font-body text-[12px] font-semibold",
              "transition-transform duration-fast hover:scale-[1.02] active:scale-100",
            )}
            style={{ backgroundImage: AURORA_ACCENT, boxShadow: "0 12px 24px -12px rgba(108,76,230,0.6)" }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            New webhook
          </button>
        </div>

        <div
          aria-hidden
          className="hidden sm:grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_100px_120px_40px] gap-3 px-5 sm:px-6 py-2 border-b border-white/55 bg-white/30"
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

        <ul className="divide-y divide-white/60">
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

      <NewWebhookDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreate={(wh) => {
          setWebhooks((list) => [...list, wh]);
          toast.success("Webhook created", `${wh.event} → ${wh.url}`);
          setDrawerOpen(false);
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
        "relative px-5 sm:px-6 py-3 min-h-[56px] hover:bg-white/40 transition-colors duration-fast",
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
            "inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-secondary hover:bg-white/55 transition-colors duration-fast",
            menuOpen && "text-foreground bg-white/55",
          )}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[148px] rounded-xl border border-white/65 bg-white/85 backdrop-blur-lg backdrop-saturate-150 shadow-[0_28px_70px_-24px_rgba(26,22,68,0.38)] py-1">
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
      className="w-full px-3 py-2 text-left font-body text-[12.5px] font-medium text-foreground hover:bg-white/60 transition-colors duration-fast"
    >
      {children}
    </button>
  );
}

function NewWebhookDrawer({
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
    <Drawer
      open={open}
      onClose={onClose}
      appearance="gradient-glass"
      size="md"
      eyebrow="Integrations · Webhooks"
      title="New webhook"
      description="Deliver Glimmora events to an external HTTPS endpoint."
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button type="button" onClick={onClose} className={glassBtnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className={cn(glassBtnPrimary, "bg-transparent! hover:opacity-95 border border-transparent")}
            style={{ backgroundImage: AURORA_ACCENT, boxShadow: "0 12px 24px -12px rgba(108,76,230,0.6)" }}
          >
            Create webhook
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <GlassSection title="Event" hint="When this fires">
          <select
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className={glassInputCls}
          >
            {EVENT_OPTIONS.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </GlassSection>

        <GlassSection title="Endpoint">
          <GlassField label="URL *">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.example.com/glimmora"
              className={glassInputCls}
            />
          </GlassField>
        </GlassSection>

        <GlassSection title="Signing secret" hint="Optional — used to verify payload authenticity">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="whsec_…"
            className={glassInputCls}
          />
        </GlassSection>

        {error && <p className="font-body text-[12.5px] text-error-text">{error}</p>}
      </div>
    </Drawer>
  );
}
