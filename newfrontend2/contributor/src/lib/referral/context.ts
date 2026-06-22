/**
 * Partner referral context — persists ref + track + personal invite across register → onboarding.
 */

const STORAGE_KEY = "glimmora.referral.v1";

export type ReferralTrack = "student" | "women_wf";

export interface ReferralContext {
  ref: string;
  track: ReferralTrack;
  /** Personal student invite token (university track only). */
  invite?: string;
  savedAt: string;
}

export function persistReferralContext(
  ref: string,
  track: ReferralTrack,
  invite?: string,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ref,
        track,
        invite: invite || undefined,
        savedAt: new Date().toISOString(),
      } satisfies ReferralContext),
    );
  } catch {
    // best effort
  }
}

export function readReferralContext(): ReferralContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReferralContext;
  } catch {
    return null;
  }
}

export function clearReferralContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best effort
  }
}

export function buildConsentPath(ref?: string, track?: string, invite?: string): string {
  const q = new URLSearchParams();
  if (ref) q.set("ref", ref);
  if (track) q.set("track", track);
  if (invite) q.set("invite", invite);
  const qs = q.toString();
  return qs ? `/onboarding/consent?${qs}` : "/onboarding/consent";
}

export function buildTrackOnboardingPath(
  track: ReferralTrack,
  ref?: string,
  invite?: string,
): string {
  const base = track === "student" ? "/onboarding/student" : "/onboarding/women";
  const q = new URLSearchParams();
  if (ref) q.set("ref", ref);
  if (invite) q.set("invite", invite);
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

export function resolveReferralFromSearch(params: URLSearchParams): ReferralContext | null {
  const ref = params.get("ref");
  const track = params.get("track");
  const invite = params.get("invite") ?? undefined;
  if (ref && (track === "student" || track === "women_wf")) {
    return { ref, track, invite, savedAt: new Date().toISOString() };
  }
  return readReferralContext();
}
