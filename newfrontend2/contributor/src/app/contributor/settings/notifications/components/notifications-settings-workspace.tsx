"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { SettingsSectionHeader } from "../../_components/settings-section-header";
import {
  settingsPrimaryBtnCls,
  settingsSectionCls,
  settingsSectionFooterCls,
  settingsSectionHeaderCls,
} from "../../lib/settings-ui-utils";

type Channel = "inApp" | "email" | "sms";

interface Row {
  key: string;
  label: string;
  locked?: boolean;
  prefs: Record<Channel, boolean>;
}

const INITIAL: Row[] = [
  { key: "critical", label: "Critical", locked: true, prefs: { inApp: true, email: true, sms: true } },
  { key: "task", label: "Task updates", prefs: { inApp: true, email: true, sms: false } },
  { key: "reviewer", label: "Reviewer messages", prefs: { inApp: true, email: true, sms: false } },
  { key: "payout", label: "Payout", prefs: { inApp: true, email: true, sms: false } },
  { key: "marketing", label: "Marketing", prefs: { inApp: false, email: false, sms: false } },
];

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "inApp", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
];

export function NotificationSettingsWorkspace() {
  const [rows, setRows] = React.useState<Row[]>(INITIAL);
  const [saved, setSaved] = React.useState(false);

  const toggle = (rowKey: string, channel: Channel) => {
    setSaved(false);
    setRows((prev) =>
      prev.map((r) =>
        r.key === rowKey && !r.locked
          ? { ...r, prefs: { ...r.prefs, [channel]: !r.prefs[channel] } }
          : r,
      ),
    );
  };

  const onSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 pb-12">
      <SettingsSectionHeader
        sectionId="notifications"
        description="Choose which channels each event uses. Critical alerts are always sent on every channel."
      />

      <section className={settingsSectionCls}>
        <header className={settingsSectionHeaderCls}>
          <h2 className="font-body text-[13px] font-semibold text-foreground">Channel matrix</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Notification channel preferences">
            <thead className="bg-bg-subtle/80">
              <tr>
                <th
                  scope="col"
                  className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-5 py-2.5 text-left"
                >
                  Event
                </th>
                {CHANNELS.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-5 py-2.5 text-center w-24"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke-subtle">
              {rows.map((r) => (
                <tr key={r.key} className="hover:bg-bg-subtle/40 transition-colors duration-fast">
                  <td className="px-5 py-3">
                    <p className="font-body text-[13px] font-medium text-foreground">{r.label}</p>
                    {r.locked && (
                      <p className="mt-0.5 font-body text-[10.5px] text-text-tertiary inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
                        Locked — required
                      </p>
                    )}
                  </td>
                  {CHANNELS.map((c) => (
                    <td key={c.key} className="px-5 py-3 text-center">
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
        <footer className={settingsSectionFooterCls}>
          {saved && <span className="font-body text-[11.5px] text-success-text mr-auto">Saved (mock).</span>}
          <button type="button" onClick={onSave} className={settingsPrimaryBtnCls}>
            Save preferences
          </button>
        </footer>
      </section>
    </div>
  );
}
