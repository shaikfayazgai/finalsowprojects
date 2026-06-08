"use client";

import * as React from "react";
import { Check, Users } from "lucide-react";
import { SettingsSectionHeader } from "../../_components/settings-section-header";
import {
  settingsPrimaryBtnCls,
  settingsSectionCls,
  settingsSectionHeaderCls,
} from "../../lib/settings-ui-utils";
import { cn } from "@/lib/utils/cn";

interface MentorshipStatus {
  optedIn: boolean;
  focus: string | null;
  optedInAt: string | null;
  upcomingSession: { id: string; scheduledAt: string; agenda: string | null } | null;
}

export function MentorshipSettingsWorkspace() {
  const [status, setStatus] = React.useState<MentorshipStatus | null>(null);
  const [focus, setFocus] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/contributor/mentorship/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: MentorshipStatus) => {
        setStatus(data);
        setFocus(data.focus ?? "");
      })
      .catch(() => setError("Could not load mentorship status."))
      .finally(() => setLoading(false));
  }, []);

  async function onOptIn() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/contributor/mentorship/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: focus.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Could not request mentorship.");
        return;
      }
      setMessage("You're on the list — a mentor will be matched shortly.");
      setStatus((prev) => ({
        optedIn: true,
        focus: focus.trim() || null,
        optedInAt: new Date().toISOString(),
        upcomingSession: body.session ?? prev?.upcomingSession ?? null,
      }));
    } catch {
      setError("Could not request mentorship.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 pb-12">
      <SettingsSectionHeader
        sectionId="mentorship"
        description="Opt in to peer mentorship. The system matches you with a mentor based on your skills and availability."
      />

      {loading ? (
        <p className="font-body text-[13px] text-text-tertiary">Loading…</p>
      ) : (
        <section className={settingsSectionCls}>
          <header className={cn(settingsSectionHeaderCls, "flex items-center gap-2")}>
            <Users className="h-4 w-4 text-brand-emphasis" strokeWidth={2} aria-hidden />
            <h2 className="font-body text-[13px] font-semibold text-foreground">Peer mentorship</h2>
          </header>

          <div className="px-5 py-4 space-y-4">
            {status?.optedIn && (
              <p className="inline-flex items-center gap-1.5 font-body text-[12.5px] text-success-text font-semibold">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Opted in
                {status.optedInAt
                  ? ` · ${new Date(status.optedInAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                  : ""}
              </p>
            )}

            {status?.upcomingSession && (
              <p className="font-body text-[12.5px] text-text-secondary">
                Upcoming session:{" "}
                <span className="font-medium text-foreground">
                  {new Date(status.upcomingSession.scheduledAt).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {status.upcomingSession.agenda ? ` · ${status.upcomingSession.agenda}` : ""}
              </p>
            )}

            <div>
              <label htmlFor="mentorship-focus" className="font-body text-[12px] font-semibold text-foreground">
                What would you like help with?
              </label>
              <textarea
                id="mentorship-focus"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                rows={3}
                placeholder="e.g. Improving React submission quality, portfolio feedback…"
                className="mt-1.5 w-full rounded-lg border border-stroke bg-surface px-3 py-2 font-body text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            {error && <p className="font-body text-[12.5px] text-error-text">{error}</p>}
            {message && <p className="font-body text-[12.5px] text-success-text font-medium">{message}</p>}

            <button
              type="button"
              onClick={onOptIn}
              disabled={submitting}
              className={cn(settingsPrimaryBtnCls, "disabled:opacity-50")}
            >
              {submitting ? "Requesting…" : status?.optedIn ? "Update request" : "Request mentorship"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
