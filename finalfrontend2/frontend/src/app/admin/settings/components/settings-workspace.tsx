"use client";

/**
 * Admin settings — personal console preferences.
 *
 * Workflow:
 *   1. Configure which operational events reach your inbox
 *   2. Set default environment and timezone display
 *   3. Save once — preferences apply on next session
 */

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { primaryStyle } from "../../_shell/aurora-ui";

const SELECT = cn(
  "w-full h-10 px-3 pr-10 rounded-lg border border-stroke-subtle bg-surface appearance-none cursor-pointer",
  "font-body text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
);

const BTN_SUBMIT = cn(
  "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg",
  "font-body text-[13px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-50",
);

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <header className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
        <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function SelectField({
  id,
  label,
  hint,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-body text-[12px] font-medium text-foreground mb-1.5">
        {label}
      </label>
      {hint ? <p className="mb-2 font-body text-[11.5px] text-text-tertiary">{hint}</p> : null}
      <div className="relative">
        <select id={id} value={value} onChange={onChange} className={SELECT}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          strokeWidth={2}
          aria-hidden
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-4 px-4 sm:px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="font-body text-[13px] font-semibold text-foreground">{label}</p>
        {hint ? <p className="font-body text-[12px] text-text-secondary mt-0.5 leading-relaxed">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 mt-0.5",
          value ? "bg-brand" : "bg-foreground/10 border border-stroke-subtle",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow-sm transition-transform",
            value ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
    </li>
  );
}

export function SettingsWorkspace() {
  const [defaultEnv, setDefaultEnv] = React.useState<"PROD" | "STAGING" | "DEV">("PROD");
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [notifyCases, setNotifyCases] = React.useState(true);
  const [notifySystem, setNotifySystem] = React.useState(true);
  const [notifyTenants, setNotifyTenants] = React.useState(false);
  const [notifyDigest, setNotifyDigest] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  function handleSave() {
    setToast("Settings saved.");
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {toast ? (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-subtle/60 px-4 py-2.5 font-body text-[13px] font-medium text-success-text"
        >
          {toast}
        </div>
      ) : null}

      <header className="min-w-0">
        <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
          Settings
        </h1>
        <p className="mt-1.5 font-body text-[14px] text-text-secondary">
          Personal preferences for your operations console — notification routing, environment defaults, and timezone.
        </p>
      </header>

      <Card
        title="Notification preferences"
        description="Choose which operational events reach your inbox. View the full feed on the notifications page."
      >
        <ul className="divide-y divide-stroke-subtle">
          <Toggle
            label="Governance cases"
            hint="Email me when a case is assigned to me or escalated."
            value={notifyCases}
            onChange={setNotifyCases}
          />
          <Toggle
            label="System alerts"
            hint="Email me on service degradation or critical alerts."
            value={notifySystem}
            onChange={setNotifySystem}
          />
          <Toggle
            label="Tenant activity"
            hint="Daily summary of provisioning and suspension events."
            value={notifyTenants}
            onChange={setNotifyTenants}
          />
          <Toggle
            label="Daily digest"
            hint="One email at 09:00 with an operational summary."
            value={notifyDigest}
            onChange={setNotifyDigest}
          />
        </ul>
        <div className="px-4 sm:px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/40">
          <Link
            href="/admin/notifications"
            className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2"
          >
            Open notifications inbox
          </Link>
        </div>
      </Card>

      <Card title="Console display" description="Defaults applied when you sign in to the admin console">
        <div className="px-4 sm:px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SelectField
            id="settings-env"
            label="Default environment"
            hint="Which environment loads first on login."
            value={defaultEnv}
            onChange={(e) => setDefaultEnv(e.target.value as typeof defaultEnv)}
          >
            <option value="PROD">PROD</option>
            <option value="STAGING">STAGING</option>
            <option value="DEV">DEV</option>
          </SelectField>

          <SelectField
            id="settings-timezone"
            label="Timezone display"
            hint="Used to render timestamps across the console."
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="UTC">UTC</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Europe/Berlin">Europe/Berlin</option>
            <option value="Asia/Singapore">Asia/Singapore</option>
          </SelectField>
        </div>
      </Card>

      <footer className="flex items-center justify-end">
        <button type="button" onClick={handleSave} className={BTN_SUBMIT} style={primaryStyle}>
          Save changes
        </button>
      </footer>
    </div>
  );
}
