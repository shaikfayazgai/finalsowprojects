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

function CommissionCard() {
  const [pct, setPct] = React.useState<string>("");
  const [gst, setGst] = React.useState<string>("");
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/commission", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data?.commissionPct != null) setPct(String(j.data.commissionPct));
        if (j?.data?.gstPct != null) setGst(String(j.data.gstPct));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const c = Number(pct);
  const g = Number(gst);
  const commissionValid = Number.isFinite(c) && c >= 0 && c < 90;
  const gstValid = Number.isFinite(g) && g >= 0 && g <= 50;
  const valid = commissionValid && gstValid;
  // Worked preview on a ₹10,000 contributor payout.
  const payout = 10000;
  const client = commissionValid ? payout / (1 - c / 100) : 0;
  const margin = client - payout;
  const gstAmt = gstValid ? client * (g / 100) : 0;
  const enterpriseTotal = client + gstAmt;
  const contributorNet = gstValid ? payout * (1 - g / 100) : 0;

  async function save() {
    if (!valid) return;
    setSaving(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/commission", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPct: c, gstPct: g }),
      });
      setMsg(r.ok ? "Saved — applies to new pricing." : "Could not save.");
    } catch {
      setMsg("Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const NumField = ({ id, label, value, onChange, max, ok }: {
    id: string; label: string; value: string; onChange: (v: string) => void; max: number; ok: boolean;
  }) => (
    <div>
      <label htmlFor={id} className="block font-body text-[12px] font-medium text-foreground mb-1.5">{label}</label>
      <div className="relative w-40">
        <input
          id={id}
          type="number"
          min={0}
          max={max}
          step={0.5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!loaded}
          className={cn(
            "w-full h-10 px-3 pr-8 rounded-lg border bg-surface font-body text-[14px] tabular-nums text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            ok ? "border-stroke-subtle" : "border-error-border",
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-body text-[13px] text-text-tertiary">%</span>
      </div>
    </div>
  );

  return (
    <Card
      title="Platform commission & GST"
      description="Glimmora's margin and the GST rate that drive every price. Client price = payout ÷ (1 − commission%); GST is a pass-through on top. Admin-only."
    >
      <div className="px-4 sm:px-5 py-5 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <NumField id="commission-pct" label="Commission %" value={pct} onChange={setPct} max={89} ok={commissionValid} />
          <NumField id="gst-pct" label="GST %" value={gst} onChange={setGst} max={50} ok={gstValid} />
          <button type="button" onClick={save} disabled={!valid || saving} className={BTN_SUBMIT} style={primaryStyle}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3 font-body text-[12.5px] text-text-secondary">
          <p className="font-semibold text-foreground mb-1">Worked example · ₹10,000 contributor payout</p>
          {valid ? (
            <ul className="space-y-0.5 tabular-nums">
              <li>Contributor payout (gross): <span className="text-foreground font-medium">₹{payout.toLocaleString("en-IN")}</span></li>
              <li>Contributor net (after {g}% GST): <span className="text-foreground font-medium">₹{Math.round(contributorNet).toLocaleString("en-IN")}</span></li>
              <li>Client price (payout ÷ {(1 - c / 100).toFixed(2)}): <span className="text-foreground font-medium">₹{Math.round(client).toLocaleString("en-IN")}</span></li>
              <li>Platform margin ({c}%): <span className="text-foreground font-medium">₹{Math.round(margin).toLocaleString("en-IN")}</span></li>
              <li>+ GST on client price ({g}%): <span className="text-foreground font-medium">₹{Math.round(gstAmt).toLocaleString("en-IN")}</span></li>
              <li>Enterprise pays total: <span className="text-foreground font-medium">₹{Math.round(enterpriseTotal).toLocaleString("en-IN")}</span></li>
            </ul>
          ) : (
            <p className="text-error-text">Commission must be 0–89% and GST 0–50%.</p>
          )}
        </div>
        {msg ? <p className="font-body text-[12.5px] text-success-text">{msg}</p> : null}
      </div>
    </Card>
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

  // Hydrate persisted preferences on mount. GET returns {} when never saved —
  // only override a default when the key is actually present in the response.
  React.useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const [nRes, cRes] = await Promise.all([
          fetch("/api/prefs/admin_notifications", { cache: "no-store" }),
          fetch("/api/prefs/admin_console", { cache: "no-store" }),
        ]);
        const notif = nRes.ok ? await nRes.json() : {};
        const console_ = cRes.ok ? await cRes.json() : {};
        if (cancelled) return;
        if (typeof notif?.notifyCases === "boolean") setNotifyCases(notif.notifyCases);
        if (typeof notif?.notifySystem === "boolean") setNotifySystem(notif.notifySystem);
        if (typeof notif?.notifyTenants === "boolean") setNotifyTenants(notif.notifyTenants);
        if (typeof notif?.notifyDigest === "boolean") setNotifyDigest(notif.notifyDigest);
        if (console_?.environment === "PROD" || console_?.environment === "STAGING" || console_?.environment === "DEV") {
          setDefaultEnv(console_.environment);
        }
        if (typeof console_?.timezone === "string" && console_.timezone) setTimezone(console_.timezone);
      } catch {
        // keep defaults
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    try {
      await Promise.all([
        fetch("/api/prefs/admin_notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notifyCases, notifySystem, notifyTenants, notifyDigest }),
        }),
        fetch("/api/prefs/admin_console", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ environment: defaultEnv, timezone }),
        }),
      ]);
      setToast("Settings saved.");
    } catch {
      setToast("Could not save settings.");
    }
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
          Platform commission, notification routing, environment defaults, and timezone.
        </p>
      </header>

      <CommissionCard />

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
