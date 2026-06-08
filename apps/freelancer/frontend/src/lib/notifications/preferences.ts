/**
 * Channel preference resolution.
 *
 * Resolution order (highest priority first):
 *   1. Caller-supplied `channels` (explicit override)
 *   2. User's NotificationPreference row for this kind
 *   3. DEFAULT_CHANNELS for the kind's severity
 *
 * Critical-severity rule: in_app + email are ALWAYS included for
 * critical events. User can't disable them. SMS is included for
 * critical events when the user has a verified phone (Phase 2 check —
 * for now we include it whenever the kind defaults to SMS).
 */

import { prisma } from "@/lib/db";
import {
  DEFAULT_CHANNELS,
  DEFAULT_SEVERITY,
  type NotificationChannel,
  type NotificationKind,
  type NotificationSeverity,
} from "./types";

export async function resolveChannels(input: {
  userId: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  override?: NotificationChannel[];
}): Promise<NotificationChannel[]> {
  let chosen: NotificationChannel[];

  if (input.override && input.override.length > 0) {
    chosen = [...input.override];
  } else {
    // User preference for this kind, if any
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_kind: { userId: input.userId, kind: input.kind } },
    });
    if (pref) {
      chosen = pref.channels as NotificationChannel[];
    } else {
      chosen = [...DEFAULT_CHANNELS[input.severity]];
    }
  }

  // Critical floor: always include in_app + email
  if (input.severity === "critical") {
    if (!chosen.includes("in_app")) chosen.push("in_app");
    if (!chosen.includes("email")) chosen.push("email");
  }

  // Dedupe (preserves order)
  return Array.from(new Set(chosen));
}

/**
 * Resolve severity — caller's explicit value wins, otherwise use the
 * kind's default.
 */
export function resolveSeverity(
  kind: NotificationKind,
  override?: NotificationSeverity,
): NotificationSeverity {
  return override ?? DEFAULT_SEVERITY[kind] ?? "informational";
}
