"use client";

import { useQuery } from "@tanstack/react-query";

interface LabelResponse {
  type: string;
  id: string;
  label: string;
}

export type BreadcrumbEntityType = "plan";

async function fetchLabel(
  type: BreadcrumbEntityType,
  id: string,
): Promise<string | null> {
  const res = await fetch(
    `/api/breadcrumb/label?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
    { credentials: "same-origin" },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Breadcrumb label fetch failed (${res.status})`);
  const body = (await res.json()) as LabelResponse;
  return body.label;
}

/**
 * Resolves a UUID path segment to a human-readable breadcrumb label.
 *
 * Returns `null` while loading or when the resource isn't found —
 * the topbar falls back to the UUID slice in that case. Cached for
 * 5 minutes (labels rarely change mid-session).
 */
export function useBreadcrumbLabel(
  type: BreadcrumbEntityType | null,
  id: string | null,
) {
  return useQuery({
    queryKey: ["breadcrumb-label", type, id],
    queryFn: () => fetchLabel(type as BreadcrumbEntityType, id as string),
    enabled: !!type && !!id,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
