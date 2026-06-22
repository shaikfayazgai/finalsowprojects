"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Download, Info, Trash2 } from "lucide-react";
import { SettingsSectionHeader } from "../../_components/settings-section-header";
import {
  settingsRowCls,
  settingsSecondaryBtnCls,
  settingsSectionCls,
  settingsSectionHeaderCls,
} from "../../lib/settings-ui-utils";
import { cn } from "@/lib/utils/cn";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TOS_ACCEPTED = "2026-05-02";
const PRIVACY_ACCEPTED = "2026-05-02";

export function PrivacySettingsWorkspace() {
  const [aiGuidanceOn, setAiGuidanceOn] = React.useState(true);
  const [taskNotifsOn, setTaskNotifsOn] = React.useState(true);
  const [surveysIn, setSurveysIn] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Hydrate consent toggles from contributor_settings.data.privacy.
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/contributor/settings", { cache: "no-store" });
        if (res.ok && active) {
          const s = (await res.json()) as Record<string, unknown>;
          const p = (s.privacy ?? (s.data as Record<string, unknown> | undefined)?.privacy) as
            | { aiGuidance?: boolean; taskNotifs?: boolean; surveys?: boolean }
            | undefined;
          if (p) {
            if (typeof p.aiGuidance === "boolean") setAiGuidanceOn(p.aiGuidance);
            if (typeof p.taskNotifs === "boolean") setTaskNotifsOn(p.taskNotifs);
            if (typeof p.surveys === "boolean") setSurveysIn(p.surveys);
          }
        }
      } catch {
        /* keep defaults */
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist consent changes (skip the initial hydration render).
  React.useEffect(() => {
    if (!loaded) return;
    void fetch("/api/contributor/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        privacy: { aiGuidance: aiGuidanceOn, taskNotifs: taskNotifsOn, surveys: surveysIn },
      }),
    }).catch(() => {});
  }, [aiGuidanceOn, taskNotifsOn, surveysIn, loaded]);

  return (
    <div className="space-y-5 pb-12">
      <SettingsSectionHeader
        sectionId="privacy"
        description="Review consents, manage AI guidance, and request a data export or account deletion."
      />

      <section className={settingsSectionCls}>
        <header className={settingsSectionHeaderCls}>
          <h2 className="font-body text-[13px] font-semibold text-foreground">Consents</h2>
        </header>
        <ul className="divide-y divide-stroke-subtle">
          <ConsentRow
            on
            title="Terms of Service"
            subtitle={`accepted ${fmtDate(TOS_ACCEPTED)}`}
            actionLabel="View"
            actionHref="#"
          />
          <ConsentRow
            on
            title="Privacy Policy"
            subtitle={`accepted ${fmtDate(PRIVACY_ACCEPTED)}`}
            actionLabel="View"
            actionHref="#"
          />
          <ConsentRow
            on={aiGuidanceOn}
            title="AI-assisted guidance"
            subtitle={aiGuidanceOn ? "on" : "off"}
            actionLabel={aiGuidanceOn ? "Turn off" : "Turn on"}
            onAction={() => setAiGuidanceOn((v) => !v)}
            warning={
              !aiGuidanceOn
                ? "AI signals are hidden from your workroom and dashboard while this is off."
                : undefined
            }
          />
          <ConsentRow
            on={taskNotifsOn}
            title="Task notifications"
            subtitle={taskNotifsOn ? "on" : "off"}
            actionLabel="Manage channels"
            actionHref="/contributor/settings/notifications"
          />
          <ConsentRow
            on={surveysIn}
            title="Optional surveys"
            subtitle={surveysIn ? "opted in · ≤ 4 per year" : "off"}
            actionLabel={surveysIn ? "Opt out" : "Opt in"}
            onAction={() => setSurveysIn((v) => !v)}
          />
        </ul>
      </section>

      <section className={settingsSectionCls}>
        <header className={settingsSectionHeaderCls}>
          <h2 className="font-body text-[13px] font-semibold text-foreground">Your data</h2>
        </header>
        <ul className="divide-y divide-stroke-subtle">
          <li className={settingsRowCls}>
            <div className="min-w-0">
              <p className="font-body text-[13px] font-semibold text-foreground inline-flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                Download my data
              </p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary max-w-xl">
                JSON export of your profile, tasks, submissions, payouts, credentials, and consent
                log. Delivered to your email within 24h.
              </p>
            </div>
            <button type="button" className={settingsSecondaryBtnCls}>
              Request export
            </button>
          </li>
          <li className={settingsRowCls}>
            <div className="min-w-0">
              <p className="font-body text-[13px] font-semibold text-foreground inline-flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5 text-error-text" strokeWidth={2} aria-hidden />
                Request account deletion
              </p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary max-w-xl">
                30-day grace period. Some data is retained for audit and legal reasons.
              </p>
            </div>
            <Link
              href="/contributor/settings/delete"
              className={cn(
                settingsSecondaryBtnCls,
                "border-error-border text-error-text hover:bg-error-subtle",
              )}
            >
              Continue →
            </Link>
          </li>
        </ul>
        <div className="px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/60 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[11.5px] text-text-tertiary">
            Audit-required data (tax records, payout history, consent log) is retained per
            applicable law even after deletion.
          </p>
        </div>
      </section>
    </div>
  );
}

function ConsentRow({
  on,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  warning,
}: {
  on: boolean;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  warning?: string;
}) {
  return (
    <li className={settingsRowCls}>
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <span
          aria-hidden
          className={cn(
            "h-5 w-5 rounded-full inline-flex items-center justify-center shrink-0 mt-0.5",
            on
              ? "bg-success-subtle text-success-text"
              : "bg-bg-subtle text-text-tertiary border border-stroke",
          )}
        >
          {on ? <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden /> : null}
        </span>
        <div className="min-w-0">
          <p className="font-body text-[13px] font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{subtitle}</p>
          {warning && (
            <p className="mt-1 font-body text-[11.5px] text-warning-text">{warning}</p>
          )}
        </div>
      </div>
      {actionHref ? (
        <Link href={actionHref} className={settingsSecondaryBtnCls}>
          {actionLabel}
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={settingsSecondaryBtnCls}>
          {actionLabel}
        </button>
      )}
    </li>
  );
}
