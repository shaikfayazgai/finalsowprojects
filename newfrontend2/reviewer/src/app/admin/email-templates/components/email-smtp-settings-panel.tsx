"use client";

import * as React from "react";
import { AlertTriangle, Check, CheckCircle2, Loader2, Save } from "lucide-react";
import { fetchInternal } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import {
  AuroraInput,
  AuroraSelect,
  Banner,
  Field,
  GlassCard,
  TONE,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

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
      <GlassCard className="px-5 py-10 flex items-center gap-2 font-body text-[13px] text-text-tertiary">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
        Loading SMTP settings…
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden">
      <header className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55">
        <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">
          SMTP provider
        </h2>
        <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">
          Mail server configuration for platform email delivery.
        </p>
      </header>

      <div className="px-5 sm:px-6 py-5 space-y-5">
        {error && (
          <Banner tone="error" icon={AlertTriangle} title="SMTP error">
            {error}
          </Banner>
        )}

        <Field label="Provider" required hint="Auto-fills host and port for known providers">
          <AuroraSelect
            value={smtpConfig.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <option value="office365">Office 365</option>
            <option value="gmail">Gmail / Google Workspace</option>
            <option value="sendgrid">SendGrid</option>
            <option value="custom">Custom</option>
          </AuroraSelect>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
          <Field label="SMTP host" required>
            <AuroraInput
              type="text"
              value={smtpConfig.host}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, host: e.target.value }))}
              placeholder="smtp.office365.com"
            />
          </Field>
          <Field label="Port" required>
            <AuroraInput
              type="number"
              value={smtpConfig.port}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, port: Number(e.target.value) }))}
              className="font-mono tabular-nums"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Username" required>
            <AuroraInput
              type="text"
              value={smtpConfig.username}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, username: e.target.value }))}
              placeholder="your-email@example.com"
            />
          </Field>
          <Field label="Password" hint="Leave blank to keep current">
            <AuroraInput
              type="password"
              value={smtpConfig.password}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, password: e.target.value }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="From address" required>
            <AuroraInput
              type="email"
              value={smtpConfig.fromAddress}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, fromAddress: e.target.value }))}
              placeholder="noreply@example.com"
            />
          </Field>
          <Field label="From name">
            <AuroraInput
              type="text"
              value={smtpConfig.fromName}
              onChange={(e) => setSmtpConfig((c) => ({ ...c, fromName: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Reply-to address">
          <AuroraInput
            type="email"
            value={smtpConfig.replyToAddress}
            onChange={(e) => setSmtpConfig((c) => ({ ...c, replyToAddress: e.target.value }))}
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
          <p className="font-body text-[12px] text-text-tertiary rounded-lg border border-white/60 bg-white/45 px-3 py-2">
            Last tested: {smtpConfig.lastTested}
          </p>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-white/55">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className={cn(ghostBtnClass)}
          style={
            testResult === "success"
              ? { borderColor: TONE.success.border, color: TONE.success.text }
              : testResult === "error"
                ? { borderColor: TONE.error.border, color: TONE.error.text }
                : undefined
          }
        >
          {testResult === "success" && <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />}
          {testResult === "error" && <AlertTriangle className="h-4 w-4" strokeWidth={2} aria-hidden />}
          {testing && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />}
          {testResult === "success"
            ? "Test passed"
            : testResult === "error"
              ? "Test failed"
              : testing
                ? "Testing…"
                : "Test connection"}
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className={primaryBtnClass} style={primaryStyle}>
          {saved ? (
            <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          ) : saving ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
          ) : (
            <Save className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          )}
          {saved ? "Saved!" : saving ? "Saving…" : "Save config"}
        </button>
      </footer>
    </GlassCard>
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
        className="mt-0.5 h-4 w-4 rounded border-[rgba(26,22,68,0.2)] accent-[var(--c-violet-500)]"
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
