"use client";

/**
 * Mentor availability — spec doc 03 §5.H.5.
 *
 * Working hours, capacity, OOO. While OOO: matching skips this mentor for
 * new assignments; existing queue is paused (no SLA accrual).
 */

import * as React from "react";
import { Info } from "lucide-react";
import {
  MentorFormSection,
  mentorFieldLabel,
  mentorInputCls,
} from "@/app/mentor/_components/mentor-ui";
import {
  SettingsFormFooter,
  SettingsFormPanel,
  SettingsSubpageShell,
} from "@/app/mentor/settings/_components/settings-subpage-shell";
import { patchMentorAvailability, fetchMentorAvailability } from "@/lib/api/mentor";
import { cn } from "@/lib/utils/cn";

const DAYS: Array<{ key: string; label: string }> = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

export default function MentorAvailabilityPage() {
  const [activeDays, setActiveDays] = React.useState<Record<string, boolean>>({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false });
  const [from, setFrom] = React.useState("09:00");
  const [to, setTo] = React.useState("18:00");
  const [timezone, setTimezone] = React.useState("Asia/Kolkata (IST)");
  const [capacity, setCapacity] = React.useState(25);
  const [oooEnabled, setOooEnabled] = React.useState(false);
  const [oooFrom, setOooFrom] = React.useState("");
  const [oooTo, setOooTo] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Hydrate from the persisted (backend) availability so saved values survive reload.
  React.useEffect(() => {
    let cancelled = false;
    fetchMentorAvailability()
      .then((a) => {
        if (cancelled || !a) return;
        if (a.activeDays && typeof a.activeDays === "object") {
          setActiveDays(a.activeDays as Record<string, boolean>);
        }
        if (typeof a.from === "string") setFrom(a.from);
        if (typeof a.to === "string") setTo(a.to);
        if (typeof a.timezone === "string") setTimezone(a.timezone);
        if (typeof a.capacity === "number") setCapacity(a.capacity);
        if (typeof a.oooEnabled === "boolean") setOooEnabled(a.oooEnabled);
        if (typeof a.oooFrom === "string") setOooFrom(a.oooFrom);
        if (typeof a.oooTo === "string") setOooTo(a.oooTo);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDay = (k: string) => setActiveDays((p) => ({ ...p, [k]: !p[k] }));

  const onSave = async () => {
    setSaving(true);
    try {
      await patchMentorAvailability({
        activeDays,
        from,
        to,
        timezone,
        capacity,
        oooEnabled,
        oooFrom,
        oooTo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSubpageShell
      title="Availability"
      subtitle="Declare when you're available to be assigned reviews. Affects matching and SLA fairness."
    >
      <SettingsFormPanel>
        <MentorFormSection title="Working hours" description="Days and hours you're open for new review assignments">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  aria-pressed={activeDays[d.key]}
                  className={cn(
                    "h-10 w-12 inline-flex items-center justify-center rounded-lg font-body text-[11.5px] font-semibold transition-colors duration-fast",
                    activeDays[d.key]
                      ? "bg-brand text-on-brand shadow-xs"
                      : "bg-surface border border-stroke-subtle text-foreground hover:bg-bg-subtle/60",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="From">
                <select value={from} onChange={(e) => setFrom(e.target.value)} className={cn(mentorInputCls, "max-w-[140px]")}>
                  {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
              <Field label="To">
                <select value={to} onChange={(e) => setTo(e.target.value)} className={cn(mentorInputCls, "max-w-[140px]")}>
                  {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
              <Field label="Timezone">
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={cn(mentorInputCls, "max-w-[280px]")}>
                  <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                  <option value="Asia/Singapore">Asia/Singapore</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </Field>
            </div>
          </div>
        </MentorFormSection>

        <MentorFormSection bordered title="Weekly review capacity" description="Maximum reviews you can take per week">
          <select value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={cn(mentorInputCls, "max-w-[240px]")}>
            {[10, 15, 20, 25, 30, 35, 40].map((n) => <option key={n} value={n}>Up to {n} reviews / week</option>)}
          </select>
        </MentorFormSection>

        <MentorFormSection bordered title="Out of office" description="Pause new assignments and SLA accrual while away">
          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
              <input type="checkbox" checked={oooEnabled} onChange={(e) => setOooEnabled(e.target.checked)} className="h-3.5 w-3.5 accent-brand rounded-sm" />
              Mark me OOO
            </label>
            {oooEnabled && (
              <div className="flex flex-wrap items-end gap-3">
                <Field label="From">
                  <input type="date" value={oooFrom} onChange={(e) => setOooFrom(e.target.value)} className={mentorInputCls} />
                </Field>
                <Field label="To">
                  <input type="date" value={oooTo} onChange={(e) => setOooTo(e.target.value)} className={mentorInputCls} />
                </Field>
              </div>
            )}
            <div className="rounded-xl bg-bg-subtle/60 border border-stroke-subtle px-3 py-2.5 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <p className="font-body text-[11.5px] text-text-tertiary">
                While OOO, new reviews go to others; existing reviews pause (no SLA accrual).
              </p>
            </div>
          </div>
        </MentorFormSection>

        <SettingsFormFooter onSave={onSave} saving={saving} saved={saved} />
      </SettingsFormPanel>
    </SettingsSubpageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={mentorFieldLabel}>{label}</label>
      {children}
    </div>
  );
}
