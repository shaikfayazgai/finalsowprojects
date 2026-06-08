"use client";

import * as React from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { SettingsSectionHeader } from "../../_components/settings-section-header";
import {
  settingsRowCls,
  settingsSecondaryBtnCls,
  settingsSectionCls,
} from "../../lib/settings-ui-utils";
import { cn } from "@/lib/utils/cn";

type Kind = "desktop" | "mobile" | "tablet";

interface Session {
  id: string;
  label: string;
  device: string;
  location: string;
  lastSeen: string;
  current?: boolean;
  kind: Kind;
}

const INITIAL: Session[] = [
  {
    id: "s-current",
    label: "Chrome on macOS",
    device: "MacBook Pro · macOS 15",
    location: "Chennai, IN",
    lastSeen: "Active now",
    current: true,
    kind: "desktop",
  },
  {
    id: "s-mob",
    label: "Safari on iPhone",
    device: "iPhone 15 · iOS 18",
    location: "Chennai, IN",
    lastSeen: "2 hours ago",
    kind: "mobile",
  },
  {
    id: "s-tab",
    label: "Chrome on iPad",
    device: "iPad Air · iOS 18",
    location: "Bengaluru, IN",
    lastSeen: "Yesterday",
    kind: "tablet",
  },
  {
    id: "s-old",
    label: "Firefox on Windows",
    device: "Lab PC · Windows 11",
    location: "Chennai, IN",
    lastSeen: "4 days ago",
    kind: "desktop",
  },
];

const ICON: Record<
  Kind,
  React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>
> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

export function SessionsWorkspace() {
  const [sessions, setSessions] = React.useState<Session[]>(INITIAL);

  const signOut = (id: string) => setSessions((p) => p.filter((s) => s.id !== id));
  const signOutAll = () => setSessions((p) => p.filter((s) => s.current));

  return (
    <div className="space-y-5 pb-12">
      <SettingsSectionHeader
        sectionId="sessions"
        description="Devices currently signed in to your account. Sign out sessions you don't recognize."
      />

      {sessions.length > 1 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={signOutAll}
            className={cn(
              settingsSecondaryBtnCls,
              "h-9 px-3.5 border-error-border text-error-text hover:bg-error-subtle",
            )}
          >
            Sign out everywhere else
          </button>
        </div>
      )}

      <section className={settingsSectionCls}>
        <ul className="divide-y divide-stroke-subtle">
          {sessions.map((s) => {
            const Icon = ICON[s.kind];
            return (
              <li key={s.id} className={cn(settingsRowCls, "items-center gap-3")}>
                <span
                  aria-hidden
                  className="h-9 w-9 rounded-lg bg-bg-subtle border border-stroke-subtle text-text-secondary inline-flex items-center justify-center shrink-0"
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] font-semibold text-foreground inline-flex items-center gap-2 flex-wrap">
                    {s.label}
                    {s.current && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-success-subtle text-success-text font-body text-[10px] font-semibold">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
                    {s.device}
                    <span aria-hidden className="opacity-50 mx-1">
                      ·
                    </span>
                    {s.location}
                    <span aria-hidden className="opacity-50 mx-1">
                      ·
                    </span>
                    {s.lastSeen}
                  </p>
                </div>
                {!s.current && (
                  <button type="button" onClick={() => signOut(s.id)} className={settingsSecondaryBtnCls}>
                    Sign out
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
