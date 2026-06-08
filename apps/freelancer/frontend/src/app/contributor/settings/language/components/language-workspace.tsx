"use client";

import * as React from "react";
import { SettingsSectionHeader } from "../../_components/settings-section-header";
import {
  settingsFieldLabelCls,
  settingsInputCls,
  settingsPrimaryBtnCls,
  settingsSectionCls,
  settingsSectionFooterCls,
} from "../../lib/settings-ui-utils";
import { cn } from "@/lib/utils/cn";
import { useContributorSettingsStore } from "@/lib/stores/contributor-settings-store";

type DateFmt = "dmy" | "mdy" | "ymd";
type TimeFmt = "h24" | "h12";

// Map UI codes <-> store values.
const DATE_TO_STORE: Record<DateFmt, string> = { dmy: "DD-MM-YYYY", mdy: "MM/DD/YYYY", ymd: "YYYY-MM-DD" };
const STORE_TO_DATE: Record<string, DateFmt> = { "DD-MM-YYYY": "dmy", "MM/DD/YYYY": "mdy", "YYYY-MM-DD": "ymd" };

const DATE_OPTIONS: { value: DateFmt; label: string }[] = [
  { value: "dmy", label: "DD MMM YYYY (26 May 2026)" },
  { value: "mdy", label: "MM/DD/YYYY (05/26/2026)" },
  { value: "ymd", label: "YYYY-MM-DD (2026-05-26)" },
];

const CURRENCIES = [
  { value: "INR-auto", label: "INR (₹) — auto from timezone" },
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
];

export function LanguageSettingsWorkspace() {
  const locale = useContributorSettingsStore((s) => s.locale);
  const setLocale = useContributorSettingsStore((s) => s.setLocale);

  const [language, setLanguage] = React.useState(locale.language);
  const [dateFmt, setDateFmt] = React.useState<DateFmt>(STORE_TO_DATE[locale.dateFormat] ?? "dmy");
  const [timeFmt, setTimeFmt] = React.useState<TimeFmt>(locale.timeFormat === "12h" ? "h12" : "h24");
  const [currency, setCurrency] = React.useState(locale.currency || "INR-auto");
  const [saved, setSaved] = React.useState(false);

  // Re-sync from store once it hydrates from localStorage.
  React.useEffect(() => {
    setLanguage(locale.language);
    setDateFmt(STORE_TO_DATE[locale.dateFormat] ?? "dmy");
    setTimeFmt(locale.timeFormat === "12h" ? "h12" : "h24");
    setCurrency(locale.currency || "INR-auto");
  }, [locale]);

  const onSave = () => {
    setLocale({
      language,
      dateFormat: DATE_TO_STORE[dateFmt],
      timeFormat: timeFmt === "h12" ? "12h" : "24h",
      currency,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="space-y-5 pb-12">
      <SettingsSectionHeader
        sectionId="language"
        description="Language ships in English only for now. Date, time, and currency affect how amounts and timestamps display."
      />

      <section className={settingsSectionCls}>
        <div className="p-5 space-y-5">
          <Field label="Language">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={cn(settingsInputCls, "max-w-[280px]")}
            >
              <option value="en">English</option>
              <option value="hi" disabled>
                Hindi (coming soon)
              </option>
              <option value="ta" disabled>
                Tamil (coming soon)
              </option>
            </select>
          </Field>

          <Field label="Date format">
            <div className="space-y-2">
              {DATE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer min-h-[32px]"
                >
                  <input
                    type="radio"
                    name="dateFmt"
                    checked={dateFmt === opt.value}
                    onChange={() => setDateFmt(opt.value)}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Time format">
            <div className="flex items-center gap-5">
              {(
                [
                  { value: "h24" as const, label: "24-hour" },
                  { value: "h12" as const, label: "12-hour" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer"
                >
                  <input
                    type="radio"
                    name="timeFmt"
                    checked={timeFmt === opt.value}
                    onChange={() => setTimeFmt(opt.value)}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Currency display">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={cn(settingsInputCls, "max-w-[360px]")}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <footer className={settingsSectionFooterCls}>
          {saved && <span className="font-body text-[11.5px] text-success-text mr-auto">Saved.</span>}
          <button type="button" onClick={onSave} className={settingsPrimaryBtnCls}>
            Save preferences
          </button>
        </footer>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={settingsFieldLabelCls}>{label}</label>
      {children}
    </div>
  );
}
