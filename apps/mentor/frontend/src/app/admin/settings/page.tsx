"use client";

/**
 * Platform Admin · Settings — spec doc 04 §5.P.2.
 * Notification prefs · default environment on login · timezone display preference.
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export default function AdminSettingsPage() {
  const [defaultEnv, setDefaultEnv] = React.useState<"PROD" | "STAGING" | "DEV">("PROD");
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [notifyCases, setNotifyCases] = React.useState(true);
  const [notifySystem, setNotifySystem] = React.useState(true);
  const [notifyTenants, setNotifyTenants] = React.useState(false);
  const [notifyDigest, setNotifyDigest] = React.useState(true);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">Settings</h1>
      </header>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <header className="px-4 py-2.5 border-b border-stroke-subtle">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">Default environment on login</h2>
        </header>
        <div className="px-4 py-3">
          <select value={defaultEnv} onChange={(e) => setDefaultEnv(e.target.value as typeof defaultEnv)} className={selectCls}>
            <option>PROD</option><option>STAGING</option><option>DEV</option>
          </select>
        </div>
      </section>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <header className="px-4 py-2.5 border-b border-stroke-subtle">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">Timezone display</h2>
        </header>
        <div className="px-4 py-3">
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectCls}>
            <option>Asia/Kolkata</option><option>UTC</option><option>America/Los_Angeles</option><option>America/New_York</option><option>Europe/London</option><option>Europe/Berlin</option><option>Asia/Singapore</option>
          </select>
        </div>
      </section>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <header className="px-4 py-2.5 border-b border-stroke-subtle">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">Notification preferences</h2>
        </header>
        <ul className="divide-y divide-stroke-subtle">
          <Toggle label="Governance cases" hint="Email me when a case is assigned to me or escalated."   value={notifyCases}   onChange={setNotifyCases} />
          <Toggle label="System alerts"    hint="Email me on service degradation or critical alerts."   value={notifySystem}  onChange={setNotifySystem} />
          <Toggle label="Tenant activity"  hint="Daily summary of provisioning + suspension events."    value={notifyTenants} onChange={setNotifyTenants} />
          <Toggle label="Daily digest"     hint="One email at 09:00 with operational summary."           value={notifyDigest}  onChange={setNotifyDigest} />
        </ul>
      </section>

      <footer className="flex items-center justify-end">
        <button type="button" className="inline-flex items-center h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast">Save changes</button>
      </footer>
    </div>
  );
}

const selectCls = "block w-full max-w-xs h-9 px-3 rounded-md border border-stroke bg-surface font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand";

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="flex-1">
        <p className="font-body text-[12.5px] font-semibold text-foreground">{label}</p>
        {hint && <p className="font-body text-[11.5px] text-text-tertiary mt-0.5">{hint}</p>}
      </div>
      <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
        className={cn("relative inline-flex h-5 w-9 rounded-full transition-colors duration-fast shrink-0",
          value ? "bg-brand" : "bg-bg-subtle border border-stroke")}>
        <span aria-hidden className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow-xs transition-transform duration-fast",
          value ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </li>
  );
}
