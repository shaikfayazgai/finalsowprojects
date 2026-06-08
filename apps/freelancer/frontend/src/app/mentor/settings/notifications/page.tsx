"use client";

/**
 * Mentor notification preferences — spec doc 03 §5.H.4.
 * Channel × event matrix. 'New review assigned' is critical-locked.
 */

import * as React from "react";
import { Lock } from "lucide-react";
import {
  SettingsFormFooter,
  SettingsFormPanel,
  SettingsSubpageShell,
} from "@/app/mentor/settings/_components/settings-subpage-shell";
import { StatusChip } from "@/components/meridian";
import { patchMentorNotificationPrefs } from "@/lib/api/mentor";
import { useMentorSettingsStore } from "@/lib/stores/mentor-settings-store";

type Channel = "inApp" | "email" | "sms";
interface Row { key: string; label: string; locked?: boolean; prefs: Record<Channel, boolean>; }

const INITIAL: Row[] = [
  { key: "review_assigned",  label: "New review assigned",          locked: true, prefs: { inApp: true,  email: true,  sms: true  } },
  { key: "sla_approaching",  label: "SLA approaching",                            prefs: { inApp: true,  email: true,  sms: false } },
  { key: "mentorship_30m",   label: "Mentorship session in 30 min",               prefs: { inApp: true,  email: true,  sms: false } },
  { key: "escalation_to_me", label: "Escalation directed to me",     locked: true, prefs: { inApp: true,  email: true,  sms: true  } },
  { key: "digest",           label: "Mentor digest (weekly)",                     prefs: { inApp: false, email: true,  sms: false } },
];

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "inApp", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "sms",   label: "SMS" },
];

export default function MentorNotificationsSettingsPage() {
  const savedPrefs = useMentorSettingsStore((s) => s.notifications);
  const setSavedPrefs = useMentorSettingsStore((s) => s.setNotifications);
  const [rows, setRows] = React.useState<Row[]>(INITIAL);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Hydrate from the persisted store on mount so saved prefs survive reloads
  // (Zustand persist reads localStorage after mount → apply once available).
  React.useEffect(() => {
    if (!savedPrefs || Object.keys(savedPrefs).length === 0) return;
    setRows((prev) =>
      prev.map((r) =>
        r.locked || !savedPrefs[r.key] ? r : { ...r, prefs: { ...r.prefs, ...savedPrefs[r.key] } },
      ),
    );
  }, [savedPrefs]);

  const toggle = (k: string, ch: Channel) =>
    setRows((prev) => prev.map((r) => r.key === k && !r.locked ? { ...r, prefs: { ...r.prefs, [ch]: !r.prefs[ch] } } : r));

  const onSave = async () => {
    setSaving(true);
    // Persist browser-locally first so the choice survives reload regardless of
    // backend availability; then best-effort sync to the API.
    setSavedPrefs(Object.fromEntries(rows.map((r) => [r.key, r.prefs])));
    try {
      await patchMentorNotificationPrefs({
        rows: rows.map((r) => ({ key: r.key, prefs: r.prefs })),
      });
    } catch {
      // API unavailable (Phase-1 / no DB) — local persistence already applied.
    } finally {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      setSaving(false);
    }
  };

  return (
    <SettingsSubpageShell
      title="Notification preferences"
      subtitle="Critical events (new review, escalation directed to you) are always sent on every channel."
    >
      <SettingsFormPanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]" aria-label="Notification channels">
            <thead className="bg-bg-subtle/60 border-b border-stroke-subtle">
              <tr>
                <th scope="col" className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-5 py-3 text-left">
                  Event
                </th>
                {CHANNELS.map((c) => (
                  <th key={c.key} scope="col" className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-5 py-3 text-center w-24">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-stroke-subtle last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-body text-[13px] font-medium text-foreground">{r.label}</p>
                    {r.locked && (
                      <div className="mt-1.5">
                        <StatusChip status="warning" size="sm">
                          <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
                          Locked — required
                        </StatusChip>
                      </div>
                    )}
                  </td>
                  {CHANNELS.map((c) => (
                    <td key={c.key} className="px-5 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={r.prefs[c.key]}
                        disabled={!!r.locked}
                        onChange={() => toggle(r.key, c.key)}
                        aria-label={`${r.label} — ${c.label}`}
                        className="h-4 w-4 accent-brand rounded-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SettingsFormFooter
          onSave={onSave}
          saving={saving}
          saved={saved}
          saveLabel="Save preferences"
        />
      </SettingsFormPanel>
    </SettingsSubpageShell>
  );
}
