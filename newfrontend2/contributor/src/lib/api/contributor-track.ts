import { fetchInternal } from "@/lib/api/client";
import type { ContributorTrackStatus } from "@/lib/contributor/profile-status";

export type { ContributorTrackStatus };

export async function fetchContributorTrack(): Promise<ContributorTrackStatus> {
  const res = await fetchInternal("/api/contributor/track");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail ?? `Track fetch failed (${res.status})`);
  }
  return res.json() as Promise<ContributorTrackStatus>;
}
