"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Mail, RotateCcw, Send, Save, Check, Eye, EyeOff } from "lucide-react";
import {
  useEmailTemplateStore,
  type EmailTemplateId,
  type EmailTemplate,
  DEFAULT_TEMPLATES,
} from "@/lib/stores/email-template-store";

/* ── Constants ── */

const TEMPLATE_ORDER: EmailTemplateId[] = [
  "sow_stage_activated",
  "sow_stage_approved",
  "sow_changes_requested",
  "sow_fully_approved",
  "welcome_contributor",
  "welcome_enterprise",
];

const CATEGORY_LABELS: Record<string, string> = {
  sow_stage_activated: "SOW Pipeline",
  sow_stage_approved: "SOW Pipeline",
  sow_changes_requested: "SOW Pipeline",
  sow_fully_approved: "SOW Pipeline",
  welcome_contributor: "Onboarding",
  welcome_enterprise: "Onboarding",
};

/* ── Live Preview ── */

function LivePreview({ template, selectedId }: { template: EmailTemplate; selectedId: EmailTemplateId }) {
  const placeholderValues: Record<string, Record<string, string>> = {
    sow_stage_activated: { approverName: "Sarah Chen", stageName: "Legal / Compliance Review", sowTitle: "Cloud-Native EHR Migration", slaDeadline: "5 business days", sowUrl: "#" },
    sow_stage_approved: { recipientName: "Enterprise Admin", stageName: "Business Owner Review", approverName: "Sarah Chen", sowTitle: "Cloud-Native EHR Migration", nextStageName: "GlimmoraTeam Commercial Review", sowUrl: "#" },
    sow_changes_requested: { recipientName: "Enterprise Admin", stageName: "Legal / Compliance Review", reason: "Please clarify the IP ownership clause in Section 4.", sowTitle: "Cloud-Native EHR Migration", sowUrl: "#" },
    sow_fully_approved: { adminName: "Enterprise Admin", sowTitle: "AI-Driven Supply Chain Optimizer", approvedAt: "April 8, 2026", sowUrl: "#" },
    welcome_contributor: { firstName: "Alex" },
    welcome_enterprise: { firstName: "Priya", orgName: "Luminary Logistics" },
  };

  const vars = placeholderValues[selectedId] ?? {};
  const interpolate = (str: string) => str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);

  return (
    <div style={{ border: "1px solid rgba(166,119,99,0.15)", borderRadius: 12, overflow: "hidden", fontFamily: "'Inter','Helvetica Neue',sans-serif", fontSize: 14 }}>
      <div style={{ backgroundColor: template.headerColor, padding: "20px 24px" }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Glimmora</span>
      </div>
      <div style={{ padding: 24, backgroundColor: "#fff" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: template.headerColor, marginBottom: 12 }}>
          Preview
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "#374151" }} dangerouslySetInnerHTML={{ __html: interpolate(template.bodyHtml) }} />
      </div>
      <div style={{ borderTop: "1px solid #f0ece8", padding: "12px 24px", backgroundColor: "#fafafa" }}>
        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{template.footerText}</p>
      </div>
    </div>
  );
}

/* ── Variable chip ── */

function VarChip({ name }: { name: string }) {
  const [copied, setCopied] = React.useState(false);
  function copy() {
    navigator.clipboard.writeText(`{{${name}}}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} title={`Copy {{${name}}}`} style={{ display: "inline-block", fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(166,119,99,0.25)", background: "rgba(166,119,99,0.06)", color: "#6A4C3F", cursor: "pointer", fontFamily: "monospace" }}>
      {copied ? "✓ copied" : `{{${name}}}`}
    </button>
  );
}

/* ── Field wrapper ── */

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 600, color: "#6b7280" }}>{label}</label>
      {children}
    </div>
  );
}

/* ── Styles ── */

const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(166,119,99,0.25)", background: "#fafafa", color: "#1a1a1a", fontSize: 13, outline: "none", boxSizing: "border-box" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#A67763,#8B5E4A)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const secondaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(166,119,99,0.3)", background: "transparent", color: "#6A4C3F", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 7, border: "none", background: "transparent", color: "#9ca3af", fontSize: 12, cursor: "pointer" };

function getTestPayload(id: EmailTemplateId): Record<string, string> {
  const payloads: Record<EmailTemplateId, Record<string, string>> = {
    sow_stage_activated: { approverName: "Sarah Chen", stageName: "Legal / Compliance Review", sowTitle: "Cloud-Native EHR Migration", slaDeadline: "5 business days", sowUrl: "#" },
    sow_stage_approved: { recipientName: "Enterprise Admin", stageName: "Business Owner Review", approverName: "Sarah Chen", sowTitle: "Cloud-Native EHR Migration", nextStageName: "GlimmoraTeam Commercial Review", sowUrl: "#" },
    sow_changes_requested: { recipientName: "Enterprise Admin", stageName: "Legal / Compliance Review", reason: "Please clarify the IP ownership clause in Section 4.", sowTitle: "Cloud-Native EHR Migration", sowUrl: "#" },
    sow_fully_approved: { adminName: "Enterprise Admin", sowTitle: "AI-Driven Supply Chain Optimizer", approvedAt: "April 8, 2026", sowUrl: "#" },
    welcome_contributor: { firstName: "Alex", loginUrl: "#", onboardingUrl: "#" },
    welcome_enterprise: { firstName: "Priya", orgName: "Luminary Logistics", dashboardUrl: "#" },
  };
  return payloads[id];
}

/* ── Page ── */

export default function AdminEmailTemplatesPage() {
  const { data: session } = useSession();
  const { templates, updateTemplate, resetToDefault, toggleActive } = useEmailTemplateStore();

  const [selectedId, setSelectedId] = React.useState<EmailTemplateId>("sow_stage_activated");
  const [savedId, setSavedId] = React.useState<EmailTemplateId | null>(null);
  const [sendingTest, setSendingTest] = React.useState(false);
  const [testSent, setTestSent] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(true);

  const template = templates[selectedId];
  const [draft, setDraft] = React.useState<EmailTemplate>(template);
  React.useEffect(() => { setDraft(templates[selectedId]); }, [selectedId, templates]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(template);

  function handleSave() {
    updateTemplate(selectedId, draft);
    setSavedId(selectedId);
    setTimeout(() => setSavedId(null), 2000);
  }

  function handleReset() {
    resetToDefault(selectedId);
    setDraft(DEFAULT_TEMPLATES[selectedId]);
  }

  async function handleSendTest() {
    if (!session?.user?.email) return;
    setSendingTest(true);
    try {
      await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-500 to-brown-700 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-brown-950">Email Templates</h1>
            <p className="text-sm text-beige-600 mt-0.5">Customize platform notification emails</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowPreview((v) => !v)} style={secondaryBtn}>
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <button onClick={handleSave} disabled={!isDirty} style={{ ...primaryBtn, opacity: isDirty ? 1 : 0.45 }}>
            {savedId === selectedId ? <Check size={14} /> : <Save size={14} />}
            {savedId === selectedId ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* Left: template list */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="rounded-xl border border-beige-100 bg-white overflow-hidden">
            {TEMPLATE_ORDER.map((id, idx) => {
              const t = templates[id];
              const isSelected = id === selectedId;
              const category = CATEGORY_LABELS[id];
              const prevCategory = idx > 0 ? CATEGORY_LABELS[TEMPLATE_ORDER[idx - 1]] : null;
              const showCategoryLabel = category !== prevCategory;
              return (
                <React.Fragment key={id}>
                  {showCategoryLabel && (
                    <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#9ca3af", borderTop: idx > 0 ? "1px solid rgba(166,119,99,0.1)" : "none" }}>
                      {category}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedId(id)}
                    style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-start", width: "100%", padding: "10px 14px", gap: 4, background: isSelected ? "rgba(166,119,99,0.08)" : "transparent", borderTop: "3px solid transparent", borderRight: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: isSelected ? "3px solid #A67763" : "3px solid transparent", cursor: "pointer", textAlign: "left" as const }}
                  >
                    <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 500, color: isSelected ? "#6A4C3F" : "#1a1a1a" }}>{t.name}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: t.isActive ? "rgba(45,106,79,0.1)" : "rgba(107,114,128,0.1)", color: t.isActive ? "#2D6A4F" : "#6b7280", fontWeight: 500 }}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right: editor + preview */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Editor card */}
          <div className="rounded-xl border border-beige-100 bg-white overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-beige-100">
              <div>
                <p className="font-semibold text-sm text-brown-950">{template.name}</p>
                <p className="text-xs text-beige-500 mt-0.5">{template.description}</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-beige-600">
                <input type="checkbox" checked={template.isActive} onChange={() => toggleActive(selectedId)} style={{ accentColor: "#A67763" }} />
                Active
              </label>
            </div>

            {/* Fields */}
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Subject line">
                <input type="text" value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} style={inputStyle} />
              </Field>

              <div style={{ display: "flex", gap: 12 }}>
                <Field label="Header color" style={{ flex: "0 0 140px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={draft.headerColor} onChange={(e) => setDraft((d) => ({ ...d, headerColor: e.target.value }))} style={{ width: 40, height: 36, borderRadius: 6, border: "1px solid rgba(166,119,99,0.25)", padding: 2, cursor: "pointer" }} />
                    <input type="text" value={draft.headerColor} onChange={(e) => setDraft((d) => ({ ...d, headerColor: e.target.value }))} style={{ ...inputStyle, fontFamily: "monospace", flex: 1, fontSize: 12 }} />
                  </div>
                </Field>
                <Field label="Logo URL" style={{ flex: 1 }}>
                  <input type="text" placeholder="https://example.com/logo.png" value={draft.logoUrl} onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value }))} style={inputStyle} />
                </Field>
              </div>

              <Field label="Email body (HTML with {{variable}} placeholders)">
                <textarea rows={8} value={draft.bodyHtml} onChange={(e) => setDraft((d) => ({ ...d, bodyHtml: e.target.value }))} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: "1.6" }} />
              </Field>

              <Field label="Footer text">
                <input type="text" value={draft.footerText} onChange={(e) => setDraft((d) => ({ ...d, footerText: e.target.value }))} style={inputStyle} />
              </Field>

              <div>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af" }}>
                  Available variables — click to copy
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {template.variables.map((v) => <VarChip key={v} name={v} />)}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                <button onClick={handleReset} style={ghostBtn}>
                  <RotateCcw size={13} /> Reset to Default
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSendTest} disabled={sendingTest || !session?.user?.email} style={{ ...secondaryBtn, opacity: sendingTest ? 0.6 : 1 }} title={session?.user?.email ? `Send test to ${session.user.email}` : "Sign in to send a test"}>
                    <Send size={13} />
                    {testSent ? "Sent!" : sendingTest ? "Sending…" : "Send Test Email"}
                  </button>
                  <button onClick={handleSave} disabled={!isDirty} style={{ ...primaryBtn, opacity: isDirty ? 1 : 0.45 }}>
                    {savedId === selectedId ? <Check size={13} /> : <Save size={13} />}
                    {savedId === selectedId ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live preview */}
          {showPreview && (
            <div className="rounded-xl border border-beige-100 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-beige-100">
                <Eye size={14} className="text-beige-400" />
                <span className="text-xs font-semibold text-beige-600">Live Preview</span>
                <span className="text-xs text-beige-400">(sample values)</span>
              </div>
              <div style={{ padding: 20 }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#9ca3af" }}>
                  Subject: <strong style={{ color: "#374151" }}>{draft.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => getTestPayload(selectedId)[k] ?? `[${k}]`)}</strong>
                </p>
                <LivePreview template={draft} selectedId={selectedId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
