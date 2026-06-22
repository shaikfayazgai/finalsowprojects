"use client";

/**
 * Reviewer settings — personal QA notification preferences.
 *
 * Persists to the generic account-scoped prefs store via the in-place
 * Next route: GET/PATCH /api/prefs/reviewer_notifications. GET returns the
 * section object directly ({} when never saved) — a missing key defaults to
 * `true`, so a fresh reviewer is opted in to all alerts until they change it.
 */

import * as React from "react";
import { Bell, Save } from "lucide-react";
import { Button } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";

const SECTION = "reviewer_notifications";

type ToggleKey = "newQaAssigned" | "slaApproaching" | "reworkReturned" | "weeklyDigest";

const TOGGLES: Array<{ key: ToggleKey; label: string; hint: string }> = [
  {
    key: "newQaAssigned",
    label: "New QA assigned to me",
    hint: "Notify me when a submission is routed to my review queue.",
  },
  {
    key: "slaApproaching",
    label: "SLA approaching",
    hint: "Warn me when a review in my queue is nearing its SLA deadline.",
  },
  {
    key: "reworkReturned",
    label: "Rework returned",
    hint: "Tell me when a contributor resubmits work I sent back for rework.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    hint: "One email each week summarising my QA throughput and pending items.",
  },
];

type Prefs = Record<ToggleKey, boolean>;

const DEFAULTS: Prefs = {
  newQaAssigned: true,
  slaApproaching: true,
  reworkReturned: true,
  weeklyDigest: true,
};

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="font-body text-[13px] font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 font-body text-[12px] leading-relaxed text-text-secondary">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          value ? "bg-brand" : "border border-stroke-subtle bg-foreground/10",
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

export default function ReviewerSettingsPage() {
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Hydrate on mount. GET returns the saved section object directly ({} when
  // never saved) — a missing key keeps the `true` default.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/prefs/${SECTION}`, { cache: "no-store" });
        const saved = res.ok ? await res.json() : {};
        if (cancelled) return;
        setPrefs((prev) => {
          const next = { ...prev };
          for (const { key } of TOGGLES) {
            if (typeof saved?.[key] === "boolean") next[key] = saved[key];
          }
          return next;
        });
      } catch {
        // keep defaults on failure
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key: ToggleKey) => (v: boolean) =>
    setPrefs((prev) => ({ ...prev, [key]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/prefs/${SECTION}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error(`PATCH ${SECTION} failed (${res.status})`);
      toast.success("Settings saved", "Your notification preferences have been updated.");
    } catch {
      toast.error("Could not save", "Something went wrong saving your preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="font-display text-xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 font-body text-[13px] text-text-secondary">
          Manage how Glimmora notifies you about your QA review work.
        </p>
      </header>

      <section className="overflow-hidden rounded-xl border border-stroke-subtle bg-surface">
        <header className="flex items-center gap-2.5 border-b border-stroke-subtle px-5 py-4">
          <Bell className="h-4 w-4 text-text-secondary" strokeWidth={2} aria-hidden />
          <div>
            <h2 className="font-display text-[15px] font-semibold text-foreground">
              Notification preferences
            </h2>
            <p className="mt-0.5 font-body text-[12px] text-text-secondary">
              Choose which review events reach you.
            </p>
          </div>
        </header>

        <ul className="divide-y divide-stroke-subtle">
          {TOGGLES.map((t) => (
            <Toggle
              key={t.key}
              label={t.label}
              hint={t.hint}
              value={prefs[t.key]}
              onChange={set(t.key)}
            />
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-end">
        <Button onClick={handleSave} disabled={!loaded || saving}>
          <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
