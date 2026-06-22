"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MOCK_PROFILES,
  isPersona,
  type Persona,
  type PersonaProfile,
} from "@/mocks/contributor/personas";
import {
  useContributorTrack,
  trackLoading,
} from "@/lib/hooks/use-contributor-track";

const DEMO_OVERRIDE = process.env.NEXT_PUBLIC_CONTRIBUTOR_DEMO === "1";

function sessionProfile(session: {
  user?: { name?: string | null; email?: string | null };
} | null): Partial<PersonaProfile> | null {
  const name = session?.user?.name?.trim();
  const email = session?.user?.email?.trim();
  if (!name && !email) return null;
  const parts = (name ?? email?.split("@")[0] ?? "Contributor").split(/\s+/);
  const firstName = parts[0] ?? "Contributor";
  const displayName = name ?? firstName;
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    displayName,
    firstName,
    email: email ?? "",
    avatarInitials: initials,
  };
}

function mergeProfile(
  persona: Persona,
  track: ReturnType<typeof useContributorTrack>["data"],
  session: ReturnType<typeof useSession>["data"],
  demoPersona: Persona | null,
): PersonaProfile {
  const mock = MOCK_PROFILES[persona];
  const fromSession = sessionProfile(session);
  const db = track?.profile;

  const base: PersonaProfile = {
    ...mock,
    persona,
    ...(fromSession ?? {}),
    ...(db?.country ? { country: db.country } : {}),
    ...(db?.timezone ? { timezone: db.timezone } : {}),
    // Persona modules come from the API only — never from static mocks in production.
    supervision: undefined,
    womenSupport: undefined,
    orgChip: undefined,
  };

  if (persona === "internal" && track?.orgChip) {
    base.orgChip = track.orgChip;
  }
  if (persona === "student" && track?.supervision) {
    base.supervision = track.supervision;
  }
  if (persona === "women" && track?.womenSupport) {
    base.womenSupport = track.womenSupport;
  }

  // Demo persona switcher (?persona=) may preview module layouts with fixture data.
  if (DEMO_OVERRIDE && demoPersona === persona) {
    if (mock.supervision && !base.supervision) base.supervision = mock.supervision;
    if (mock.womenSupport && !base.womenSupport) base.womenSupport = mock.womenSupport;
    if (mock.orgChip && !base.orgChip) base.orgChip = mock.orgChip;
  }

  return {
    ...base,
    persona,
    displayName: fromSession?.displayName ?? base.displayName,
    firstName: fromSession?.firstName ?? base.firstName,
    email: fromSession?.email ?? base.email,
    avatarInitials: fromSession?.avatarInitials ?? base.avatarInitials,
  };
}

/**
 * Active contributor persona — reads track from ContributorProfile via
 * `/api/contributor/track`. Demo builds may override with `?persona=`.
 */
export function useActivePersona(): {
  persona: Persona;
  profile: PersonaProfile;
  isLoading: boolean;
} {
  const sp = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const trackQuery = useContributorTrack();

  const demoRaw = DEMO_OVERRIDE ? sp.get("persona") : null;
  const demoPersona = isPersona(demoRaw) ? demoRaw : null;

  const dbPersona = trackQuery.data?.persona;
  const persona: Persona = demoPersona ?? dbPersona ?? "freelancer";

  const isLoading = trackLoading(sessionStatus, trackQuery);

  return {
    persona,
    profile: mergeProfile(persona, trackQuery.data, session, demoPersona),
    isLoading,
  };
}
