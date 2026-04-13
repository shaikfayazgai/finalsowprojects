"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  Mail, RotateCcw, Send, Save, Check, Eye, EyeOff,
  SendHorizonal, Info, HelpCircle,
} from "lucide-react";
import {
  useEmailTemplateStore,
  type EmailTemplateId,
  type EmailTemplate,
  DEFAULT_TEMPLATES,
} from "@/lib/stores/email-template-store";

/* ── Constants ── */

const TEMPLATE_ORDER: EmailTemplateId[] = [
  "otp_email",
  "sow_stage_activated",
  "sow_stage_approved",
  "sow_changes_requested",
  "sow_fully_approved",
  "welcome_contributor",
  "welcome_enterprise",
];

const CATEGORY_LABELS: Record<string, string> = {
  otp_email: "Verification",
  sow_stage_activated: "SOW Pipeline",
  sow_stage_approved: "SOW Pipeline",
  sow_changes_requested: "SOW Pipeline",
  sow_fully_approved: "SOW Pipeline",
  welcome_contributor: "Onboarding",
  welcome_enterprise: "Onboarding",
};

// Human-readable names for template variables
const VAR_FRIENDLY: Record<string, string> = {
  approverName: "Approver's Name",
  recipientName: "Recipient's Name",
  adminName: "Admin's Name",
  firstName: "First Name",
  stageName: "Stage Name",
  sowTitle: "Document Title",
  sowUrl: "Document Link",
  slaDeadline: "Review Deadline",
  nextStageName: "Next Stage",
  reason: "Change Reason",
  approvedAt: "Approval Date",
  orgName: "Organization Name",
  dashboardUrl: "Dashboard Link",
  loginUrl: "Login Link",
  onboardingUrl: "Onboarding Link",
  code: "Verification Code",
  expiryMinutes: "Code Expiry (minutes)",
};

/* ── Helpers ── */

function insertAtCursor(
  ref: React.RefObject<HTMLTextAreaElement>,
  value: string,
  onChangeDraft: (v: string) => void
) {
  const ta = ref.current;
  if (!ta) return;
  const start = ta.selectionStart ?? ta.value.length;
  const end = ta.selectionEnd ?? ta.value.length;
  const newVal = ta.value.substring(0, start) + value + ta.value.substring(end);
  onChangeDraft(newVal);
  setTimeout(() => {
    ta.focus();
    ta.selectionStart = ta.selectionEnd = start + value.length;
  }, 0);
}

/* ── Live Preview ── */

function LivePreview({ template, selectedId }: { template: EmailTemplate; selectedId: EmailTemplateId }) {
  const placeholderValues: Record<string, Record<string, string>> = {
    otp_email: { code: "483 921", expiryMinutes: "5" },
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

/* ── Variable insert button ── */

function VarInsertBtn({
  name,
  bodyRef,
  onChangeDraft,
}: {
  name: string;
  bodyRef: React.RefObject<HTMLTextAreaElement>;
  onChangeDraft: (v: string) => void;
}) {
  const [inserted, setInserted] = React.useState(false);

  function handleInsert() {
    insertAtCursor(bodyRef, `{{${name}}}`, onChangeDraft);
    setInserted(true);
    setTimeout(() => setInserted(false), 1200);
  }

  const label = VAR_FRIENDLY[name] ?? name;

  return (
    <button
      onClick={handleInsert}
      title={`Insert "${label}" into your message`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 500,
        padding: "5px 10px",
        borderRadius: 20,
        border: "1px solid rgba(166,119,99,0.3)",
        background: inserted ? "rgba(45,106,79,0.08)" : "rgba(166,119,99,0.06)",
        color: inserted ? "#2D6A4F" : "#6A4C3F",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap" as const,
      }}
    >
      {inserted ? (
        <>
          <Check size={11} />
          Inserted!
        </>
      ) : (
        <>
          <span style={{ fontSize: 10, opacity: 0.6 }}>+</span>
          {label}
        </>
      )}
    </button>
  );
}

/* ── Tooltip ── */

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ cursor: "help", color: "#9ca3af", display: "inline-flex" }}
      >
        <HelpCircle size={13} />
      </span>
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "#1a1a1a", color: "#fff", fontSize: 11, padding: "6px 10px", borderRadius: 6,
          whiteSpace: "normal" as const, zIndex: 50, maxWidth: 220,
          lineHeight: 1.5, textAlign: "center" as const, pointerEvents: "none",
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

/* ── Field wrapper ── */

function Field({ label, children, hint, tooltip, style }: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  tooltip?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      {hint && (
        <p style={{ margin: "0 0 6px", fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{hint}</p>
      )}
      {children}
    </div>
  );
}

/* ── Styles ── */

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid rgba(166,119,99,0.25)", background: "#fafafa",
  color: "#1a1a1a", fontSize: 13, outline: "none", boxSizing: "border-box",
};
const primaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
  borderRadius: 8, border: "none", background: "linear-gradient(135deg,#A67763,#8B5E4A)",
  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
  borderRadius: 8, border: "1px solid rgba(166,119,99,0.3)", background: "transparent",
  color: "#6A4C3F", fontSize: 13, fontWeight: 500, cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
  borderRadius: 7, border: "none", background: "transparent", color: "#9ca3af",
  fontSize: 12, cursor: "pointer",
};

function getTestPayload(id: EmailTemplateId): Record<string, string> {
  const payloads: Record<EmailTemplateId, Record<string, string>> = {
    otp_email: { code: "483921", expiryMinutes: "5" },
    sow_stage_activated: { approverName: "Sarah Chen", stageName: "Legal / Compliance Review", sowTitle: "Cloud-Native EHR Migration", slaDeadline: "5 business days", sowUrl: "#" },
    sow_stage_approved: { recipientName: "Enterprise Admin", stageName: "Business Owner Review", approverName: "Sarah Chen", sowTitle: "Cloud-Native EHR Migration", nextStageName: "GlimmoraTeam Commercial Review", sowUrl: "#" },
    sow_changes_requested: { recipientName: "Enterprise Admin", stageName: "Legal / Compliance Review", reason: "Please clarify the IP ownership clause in Section 4.", sowTitle: "Cloud-Native EHR Migration", sowUrl: "#" },
    sow_fully_approved: { adminName: "Enterprise Admin", sowTitle: "AI-Driven Supply Chain Optimizer", approvedAt: "April 8, 2026", sowUrl: "#" },
    welcome_contributor: { firstName: "Alex", loginUrl: "#", onboardingUrl: "#" },
    welcome_enterprise: { firstName: "Priya", orgName: "Luminary Logistics", dashboardUrl: "#" },
    reviewer_invitation: { reviewerName: "Jordan Lee", designation: "Senior Quality Analyst", inviterName: "Priya Sharma", inviterOrg: "Luminary Logistics", loginEmail: "jordan.lee@luminarylogistics.com", tempPassword: "Tmp@83xKq!", loginUrl: "#" },
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

  // Send-all state
  const [bulkRecipient, setBulkRecipient] = React.useState("");
  const [sendingAll, setSendingAll] = React.useState(false);
  const [allSentResults, setAllSentResults] = React.useState<{ id: EmailTemplateId; ok: boolean }[]>([]);

  const template = templates[selectedId];
  const [draft, setDraft] = React.useState<EmailTemplate>(template);
  React.useEffect(() => { setDraft(templates[selectedId]); }, [selectedId, templates]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(template);

  // Ref for body textarea (needed for cursor-position insert)
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

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

  async function handleSendAll() {
    if (!bulkRecipient) return;
    setSendingAll(true);
    setAllSentResults([]);
    const results = await Promise.all(
      TEMPLATE_ORDER.map(async (id) => {
        const t = templates[id];
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        return { id, ok: !!data.success };
      })
    );
    setAllSentResults(results);
    setSendingAll(false);
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
            <p className="text-sm text-beige-600 mt-0.5">Customize the emails your users receive from Glimmora</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowPreview((v) => !v)} style={secondaryBtn}>
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <button onClick={handleSave} disabled={!isDirty} style={{ ...primaryBtn, opacity: isDirty ? 1 : 0.45 }}>
            {savedId === selectedId ? <Check size={14} /> : <Save size={14} />}
            {savedId === selectedId ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Send All Tests banner */}
      <div className="rounded-xl border border-beige-100 bg-white px-5 py-4">
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
          <div style={{ flex: "0 0 auto" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0D1B2A", margin: "0 0 2px" }}>Send Test Emails</p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
              Send a sample of all 7 email types to one address to see how they look
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="email"
              value={bulkRecipient}
              onChange={(e) => setBulkRecipient(e.target.value)}
              placeholder="your@email.com"
              style={{ ...inputStyle, fontSize: 13 }}
            />
          </div>
          <button
            onClick={handleSendAll}
            disabled={sendingAll || !bulkRecipient}
            style={{ ...primaryBtn, opacity: sendingAll || !bulkRecipient ? 0.55 : 1, flexShrink: 0 }}
          >
            <SendHorizonal size={14} />
            {sendingAll ? "Sending…" : "Send All 7"}
          </button>
        </div>

        {allSentResults.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 12 }}>
            {allSentResults.map(({ id, ok }) => (
              <span key={id} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                background: ok ? "rgba(45,106,79,0.1)" : "rgba(185,28,28,0.08)",
                color: ok ? "#2D6A4F" : "#B91C1C",
                border: `1px solid ${ok ? "rgba(45,106,79,0.2)" : "rgba(185,28,28,0.15)"}`,
              }}>
                {ok ? "✓" : "✗"} {DEFAULT_TEMPLATES[id].name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* Left: template list */}
        <div style={{ width: 230, flexShrink: 0 }}>
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
                    <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#9ca3af", borderTop: idx > 0 ? "1px solid rgba(166,119,99,0.1)" : "none" }}>
                      {category}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedId(id)}
                    style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-start", width: "100%", padding: "10px 14px", gap: 4, background: isSelected ? "rgba(166,119,99,0.08)" : "transparent", borderTop: "3px solid transparent", borderRight: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: isSelected ? "3px solid #A67763" : "3px solid transparent", cursor: "pointer", textAlign: "left" as const }}
                  >
                    <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 500, color: isSelected ? "#6A4C3F" : "#1a1a1a", lineHeight: 1.4 }}>{t.name}</span>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: t.isActive ? "rgba(45,106,79,0.1)" : "rgba(107,114,128,0.1)", color: t.isActive ? "#2D6A4F" : "#6b7280", fontWeight: 600 }}>
                      {t.isActive ? "Active" : "Paused"}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(166,119,99,0.05)", border: "1px solid rgba(166,119,99,0.12)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
              <Info size={13} style={{ color: "#A67763", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                Select any email on the left to edit its content and see a live preview.
              </p>
            </div>
          </div>
        </div>

        {/* Right: editor + preview */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Editor card */}
          <div className="rounded-xl border border-beige-100 bg-white overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-beige-100">
              <div>
                <p className="font-semibold text-sm text-brown-950">{template.name}</p>
                <p className="text-xs text-beige-500 mt-0.5">{template.description}</p>
              </div>
              {/* Active toggle */}
              <label style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 2, cursor: "pointer" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={template.isActive}
                    onChange={() => toggleActive(selectedId)}
                    style={{ accentColor: "#A67763", width: 15, height: 15 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: template.isActive ? "#2D6A4F" : "#9ca3af" }}>
                    {template.isActive ? "Active" : "Paused"}
                  </span>
                </span>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>
                  {template.isActive ? "This email is being sent" : "This email won't be sent"}
                </span>
              </label>
            </div>

            {/* Fields */}
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Subject */}
              <Field
                label="Email subject line"
                hint="This is what recipients see as the title of the email in their inbox."
                tooltip="Keep it short and clear — under 60 characters works best."
              >
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                  style={inputStyle}
                  placeholder="e.g. Your document is ready for review"
                />
              </Field>

              {/* Header Color + Logo */}
              <div style={{ display: "flex", gap: 16 }}>
                <Field
                  label="Header colour"
                  tooltip="The background colour of the top bar in the email."
                  style={{ flex: "0 0 160px" }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="color"
                      value={draft.headerColor}
                      onChange={(e) => setDraft((d) => ({ ...d, headerColor: e.target.value }))}
                      style={{ width: 44, height: 40, borderRadius: 8, border: "1px solid rgba(166,119,99,0.25)", padding: 3, cursor: "pointer", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>{draft.headerColor}</span>
                  </div>
                </Field>
                <Field
                  label="Logo image link (optional)"
                  hint="Leave blank to use the default Glimmora logo."
                  style={{ flex: 1 }}
                >
                  <input
                    type="text"
                    placeholder="https://yoursite.com/logo.png"
                    value={draft.logoUrl}
                    onChange={(e) => setDraft((d) => ({ ...d, logoUrl: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* Body */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Email message</label>
                    <Tooltip text="Write the body of your email here. Click the 'Insert' buttons below to add dynamic info like names or links." />
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px", lineHeight: 1.5 }}>
                  Click where you want to add something, then use the <strong style={{ color: "#6A4C3F" }}>Insert</strong> buttons below to drop in names, dates, and links automatically.
                </p>
                <textarea
                  ref={bodyRef}
                  rows={9}
                  value={draft.bodyHtml}
                  onChange={(e) => setDraft((d) => ({ ...d, bodyHtml: e.target.value }))}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", fontSize: 13, lineHeight: "1.7" }}
                  placeholder="Type your message here…"
                />
              </div>

              {/* Variable insert section */}
              <div style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(166,119,99,0.2)", background: "rgba(166,119,99,0.03)" }}>
                <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#6A4C3F", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Insert into your message</span>
                  <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 11 }}>— click a button to drop it at your cursor</span>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7 }}>
                  {template.variables.map((v) => (
                    <VarInsertBtn
                      key={v}
                      name={v}
                      bodyRef={bodyRef as React.RefObject<HTMLTextAreaElement>}
                      onChangeDraft={(val) => setDraft((d) => ({ ...d, bodyHtml: val }))}
                    />
                  ))}
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 11, color: "#b0b0b0", lineHeight: 1.6 }}>
                  These tags get replaced with real info when the email is sent — e.g. <em>"Recipient's Name"</em> becomes the actual person's name.
                </p>
              </div>

              {/* Footer */}
              <Field
                label="Footer message"
                hint="Shown in small text at the bottom of every email."
                tooltip="Usually includes your company name and why the recipient is receiving this email."
              >
                <input
                  type="text"
                  value={draft.footerText}
                  onChange={(e) => setDraft((d) => ({ ...d, footerText: e.target.value }))}
                  style={inputStyle}
                />
              </Field>

              {/* Action row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, borderTop: "1px solid rgba(166,119,99,0.1)" }}>
                <button onClick={handleReset} style={ghostBtn} title="Discard your changes and restore the original version">
                  <RotateCcw size={13} /> Restore original
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleSendTest}
                    disabled={sendingTest || !session?.user?.email}
                    style={{ ...secondaryBtn, opacity: sendingTest ? 0.6 : 1 }}
                    title={session?.user?.email ? `Send a test to ${session.user.email}` : "Sign in to send a test"}
                  >
                    <Send size={13} />
                    {testSent ? "Sent!" : sendingTest ? "Sending…" : "Send Test Email"}
                  </button>
                  <button onClick={handleSave} disabled={!isDirty} style={{ ...primaryBtn, opacity: isDirty ? 1 : 0.45 }}>
                    {savedId === selectedId ? <Check size={13} /> : <Save size={13} />}
                    {savedId === selectedId ? "Saved!" : "Save Changes"}
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
                <span className="text-xs text-beige-400">— this is how the email will look with real names filled in</span>
              </div>
              <div style={{ padding: 20 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#9ca3af" }}>
                  Subject line: <strong style={{ color: "#374151" }}>{draft.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => getTestPayload(selectedId)[k] ?? `[${k}]`)}</strong>
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
