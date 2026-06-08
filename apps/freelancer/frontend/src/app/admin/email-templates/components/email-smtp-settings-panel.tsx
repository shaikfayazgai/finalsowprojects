"use client";

import * as React from "react";
import { AlertTriangle, Check, CheckCircle2, Loader2, Save } from "lucide-react";
import { Select } from "@/components/meridian";
import { fetchInternal } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

export interface SMTPConfig {
  provider: "office365" | "gmail" | "sendgrid" | "custom";
  host: string;
  port: number;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  replyToAddress: string;
  useTLS: boolean;
  useSSL: boolean;
  active: boolean;
  lastTested?: string;
}

const SMTP_PROVIDERS: Record<
  string,
  { host: string; port: number; useTLS: boolean; useSSL: boolean }
> = {
  office365: { host: "smtp.office365.com", port: 587, useTLS: true, useSSL: false },
  gmail: { host: "smtp.gmail.com", port: 587, useTLS: true, useSSL: false },
  sendgrid: { host: "smtp.sendgrid.net", port: 587, useTLS: true, useSSL: false },
};

export function EmailSmtpSettingsPanel() {
  const [smtpConfig, setSmtpConfig] = React.useState<SMTPConfig>({
    provider: "office365",
    host: "smtp.office365.com",
    port: 587,
    username: "",
    password: "",
    fromAddress: "",
    fromName: "Glimmora",
    replyToAddress: "",
    useTLS: true,
    useSSL: false,
    active: false,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<"idle" | "success" | "error">("idle");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchInternal("/api/admin/email-settings/smtp");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.config) {
          setSmtpConfig((c) => ({ ...c, ...data.config }));
        }
      } catch {
        // optional during dev
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleProviderChange(newProvider: string) {
    const provider = newProvider as SMTPConfig["provider"];
    const preset = SMTP_PROVIDERS[provider];
    setSmtpConfig((c) => ({
      ...c,
      provider,
      ...(preset && {
        host: preset.host,
        port: preset.port,
        useTLS: preset.useTLS,
        useSSL: preset.useSSL,
      }),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetchInternal("/api/admin/email-settings/smtp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpConfig),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(data?.message || "Failed to save SMTP config");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SMTP config");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult("idle");
    setError("");
    try {
      const res = await fetchInternal("/api/admin/email-settings/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpConfig),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTestResult("success");
        setSmtpConfig((c) => ({ ...c, lastTested: new Date().toLocaleString() }));
      } else {
        setTestResult("error");
        setError(data?.message || "SMTP test failed");
      }
    } catch (err) {
      setTestResult("error");
      setError(err instanceof Error ? err.message : "SMTP test failed");
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult("idle"), 3000);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-stroke-subtle bg-surface px-5 py-10 flex items-center gap-2 font-body text-[13px] text-text-tertiary">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
        Loading SMTP settings…
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
        <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
          SMTP provider
        </h2>
        <p className="mt-1 font-body text-[12.5px] text-text-secondary">
          Mail server configuration for platform email delivery
        </p>
      </header>

      <div className="px-5 py-5 space-y-5">
        {error && (
          <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[12.5px] text-error-text leading-relaxed m-0">{error}</p>
          </div>
        )}

        <Field label="Provider" required hint="Auto-fills host and port for known providers">
          <Select
            variant="outline"
            size="sm"
            value={smtpConfig.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <option value="office365">Office 365</option>
            <option value="gmail">Gmail / Google Workspace</option>
            <option value="sendgrid">SendGrid</option>
            <option value="custom">Custom</option>
          </Select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
          <Field label="SMTP host" required>
            <input
              type="text"
              value={smtpConfig.host}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, host: e.target.value }))}
              className={inputCls}
              placeholder="smtp.office365.com"
            />
          </Field>
          <Field label="Port" required>
            <input
              type="number"
              value={smtpConfig.port}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, port: Number(e.target.value) }))}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Username" required>
            <input
              type="text"
              value={smtpConfig.username}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, username: e.target.value }))}
              className={inputCls}
              placeholder="your-email@example.com"
            />
          </Field>
          <Field label="Password" hint="Leave blank to keep current">
            <input
              type="password"
              value={smtpConfig.password}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, password: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="From address" required>
            <input
              type="email"
              value={smtpConfig.fromAddress}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, fromAddress: e.target.value }))}
              className={inputCls}
              placeholder="noreply@example.com"
            />
          </Field>
          <Field label="From name">
            <input
              type="text"
              value={smtpConfig.fromName}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, fromName: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Reply-to address">
          <input
            type="email"
            value={smtpConfig.replyToAddress}
            onChange={(e) => setSmtpConfig((c) => ({ ...c, replyToAddress: e.target.value }))}
            className={inputCls}
            placeholder="support@example.com"
          />
        </Field>

        <div className="space-y-3 pt-1">
          <ToggleRow
            checked={smtpConfig.useTLS}
            onChange={(useTLS) => setSmtpConfig((c) => ({ ...c, useTLS }))}
            label="Use TLS"
            hint="Recommended for port 587"
          />
          <ToggleRow
            checked={smtpConfig.useSSL}
            onChange={(useSSL) => setSmtpConfig((c) => ({ ...c, useSSL }))}
            label="Use SSL"
            hint="For port 465"
          />
          <ToggleRow
            checked={smtpConfig.active}
            onChange={(active) => setSmtpConfig((c) => ({ ...c, active }))}
            label={smtpConfig.active ? "Active — sending enabled" : "Inactive — sending disabled"}
          />
        </div>

        {smtpConfig.lastTested && (
          <p className="font-body text-[12px] text-text-tertiary rounded-lg border border-stroke-subtle bg-bg-subtle/30 px-3 py-2">
            Last tested: {smtpConfig.lastTested}
          </p>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-stroke-subtle">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className={cn(
            secondaryBtnCls,
            testResult === "success" && "border-success-border text-success-text",
            testResult === "error" && "border-error-border text-error-text",
          )}
        >
          {testResult === "success" && <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          {testResult === "error" && <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          {testing && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />}
          {testResult === "success"
            ? "Test passed"
            : testResult === "error"
              ? "Test failed"
              : testing
                ? "Testing…"
                : "Test connection"}
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className={primaryBtnCls}>
          {saved ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          ) : saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />
          ) : (
            <Save className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          )}
          {saved ? "Saved!" : saving ? "Saving…" : "Save config"}
        </button>
      </footer>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && (
          <span className="text-error-text normal-case tracking-normal"> *</span>
        )}
      </span>
      {children}
      {hint && (
        <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">{hint}</p>
      )}
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-stroke accent-brand"
      />
      <span>
        <span className="block font-body text-[13px] font-semibold text-foreground">{label}</span>
        {hint && (
          <span className="block font-body text-[11.5px] text-text-tertiary mt-0.5">{hint}</span>
        )}
      </span>
    </label>
  );
}

const inputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke bg-surface",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

const secondaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-bg-subtle transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);
