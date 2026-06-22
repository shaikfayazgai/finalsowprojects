"use client";

import * as React from "react";
import {
  AlertCircle,
  Clock,
  Globe,
  LogOut,
  Monitor,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { type UserSessionRecord } from "@/lib/api/auth";
import {
  useRevokeAllSessions,
  useRevokeSession,
  useSessions,
} from "@/lib/hooks/use-auth";
import { Skeleton } from "@/components/meridian";

interface NormalizedSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
  icon: "phone" | "monitor";
}

function normalizeSession(s: UserSessionRecord): NormalizedSession {
  const ua = s.user_agent ?? "";
  const deviceRaw = s.device_name ?? s.device ?? "";
  const isPhone =
    /iphone|android|mobile/i.test(ua) ||
    /iphone|android|mobile/i.test(deviceRaw);
  const device = deviceRaw || (isPhone ? "Mobile device" : "Desktop");
  const browser =
    s.browser_name ??
    s.browser ??
    (ua.includes("Chrome")
      ? "Chrome"
      : ua.includes("Firefox")
        ? "Firefox"
        : ua.includes("Safari")
          ? "Safari"
          : ua.includes("Edg")
            ? "Edge"
            : "Browser");
  const location =
    s.location ??
    (s.city && s.country
      ? `${s.city}, ${s.country}`
      : s.city ?? s.country ?? s.ip_address ?? "Unknown");
  const lastActive = s.last_active_at ?? s.last_activity ?? s.created_at ?? "";
  return {
    id: s.id,
    device,
    browser,
    location,
    lastActive,
    current: s.is_current ?? false,
    icon: isPhone ? "phone" : "monitor",
  };
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "Unknown";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  } catch {
    return dateStr;
  }
}

export function AccountSessionsSection() {
  const { data: rawSessions, isLoading, isError, refetch } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeAll = useRevokeAllSessions();

  const sessions = (rawSessions ?? []).map(normalizeSession);
  const others = sessions.filter((s) => !s.current).length;

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stroke-subtle bg-surface text-text-secondary shrink-0">
            <Globe className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Active sessions
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Devices currently signed into your account
            </p>
          </div>
        </div>
        {others > 0 && (
          <button
            type="button"
            disabled={revokeAll.isPending}
            onClick={() => revokeAll.mutate()}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-md shrink-0",
              "border border-error-border bg-surface text-error-text",
              "font-body text-[12px] font-semibold",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {revokeAll.isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <LogOut className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            )}
            Revoke all others
          </button>
        )}
      </div>

      {isLoading ? (
        <SessionsSkeleton />
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-error-border px-3 py-2.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-error-text" strokeWidth={2} aria-hidden />
          <p className="font-body text-[11.5px] text-text-secondary flex-1">Failed to load sessions.</p>
          <button type="button" onClick={() => refetch()} className="font-body text-[11.5px] font-semibold text-brand">
            Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <p className="font-body text-[12px] text-text-tertiary text-center py-6">No active sessions found.</p>
      ) : (
        <ul className="divide-y divide-stroke-subtle border border-stroke-subtle rounded-lg overflow-hidden">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stroke-subtle bg-surface text-text-secondary shrink-0">
                {s.icon === "phone" ? (
                  <Smartphone className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                ) : (
                  <Monitor className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-body text-[13px] font-medium text-foreground truncate">{s.device}</p>
                  {s.current && (
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-success-subtle text-success-text font-body text-[10px] font-semibold">
                      This device
                    </span>
                  )}
                </div>
                <p className="font-body text-[11px] text-text-tertiary mt-0.5 truncate">
                  {s.browser}
                  {s.location ? ` · ${s.location}` : ""}
                </p>
                <p className="inline-flex items-center gap-1 mt-0.5 font-body text-[10.5px] text-text-tertiary tabular-nums">
                  <Clock className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                  {s.current ? "Now (current session)" : formatRelativeTime(s.lastActive)}
                </p>
              </div>
              {!s.current && (
                <button
                  type="button"
                  disabled={revokeSession.isPending || revokeAll.isPending}
                  onClick={() => revokeSession.mutate(s.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md shrink-0",
                    "border border-error-border bg-surface text-error-text",
                    "font-body text-[11px] font-semibold",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {revokeSession.isPending && revokeSession.variables === s.id ? (
                    <RefreshCw className="h-3 w-3 animate-spin" strokeWidth={2} aria-hidden />
                  ) : (
                    <LogOut className="h-3 w-3" strokeWidth={2} aria-hidden />
                  )}
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <ul className="divide-y divide-stroke-subtle border border-stroke-subtle rounded-lg overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-7 w-16 rounded-md shrink-0" />
        </li>
      ))}
    </ul>
  );
}
