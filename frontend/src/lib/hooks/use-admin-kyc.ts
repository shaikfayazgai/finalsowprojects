"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  adminKycOverlays,
  computeKycSummary,
  getAdminKycCase,
  getKycPhotoReveal,
  listAdminKycCases,
} from "@/lib/admin/mocks/kyc-service";
import {
  decideKyc,
  listKyc,
  type BackendKycStatus,
  type KycDecision,
} from "@/lib/api/admin-kyc";
import type { MockKycCase } from "@/mocks/admin/kyc";

/** Backend statuses we pull to populate the full client-side queue. */
const FETCH_STATUSES: BackendKycStatus[] = ["pending", "verified", "rejected"];

function useAccessToken(): string {
  const { data: session } = useSession();
  return (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
}

export function useAdminKycVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const unsubs = Object.values(adminKycOverlays).map((store) =>
      store.subscribe(() => setV((n) => n + 1)),
    );
    return () => unsubs.forEach((u) => u());
  }, []);
  return v;
}

/**
 * Live KYC cases across all statuses. Fetches from the superadmin proxy and,
 * if the live call fails (or there is no token), falls back to the mock queue
 * so the page never crashes. Returns the same `MockKycCase[]` shape the UI
 * already renders. `refresh` re-pulls the live data.
 */
export function useAdminKycCasesList(): MockKycCase[] {
  const token = useAccessToken();
  const v = useAdminKycVersion();
  const [liveCases, setLiveCases] = React.useState<MockKycCase[] | null>(null);

  const refresh = React.useCallback(async () => {
    if (!token) return;
    try {
      const results = await Promise.all(FETCH_STATUSES.map((s) => listKyc(token, s)));
      const merged = results.flatMap((r) => r.cases);
      const byId = new Map<string, MockKycCase>();
      for (const c of merged) byId.set(c.id, c);
      setLiveCases(Array.from(byId.values()));
    } catch {
      // Defensive: keep whatever we have (or fall back to mock) on failure.
      setLiveCases((prev) => prev);
    }
  }, [token]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return React.useMemo(
    () => liveCases ?? listAdminKycCases(),
    [liveCases, v],
  );
}

/**
 * Live single-case lookup. Resolves from the live list when available and
 * falls back to the mock store otherwise.
 */
export function useAdminKycCase(caseId: string | undefined): MockKycCase | undefined {
  const cases = useAdminKycCasesList();
  const v = useAdminKycVersion();
  return React.useMemo(() => {
    if (!caseId) return undefined;
    return cases.find((c) => c.id === caseId) ?? getAdminKycCase(caseId);
  }, [caseId, cases, v]);
}

export function useKycSummary() {
  const cases = useAdminKycCasesList();
  return React.useMemo(() => computeKycSummary(cases), [cases]);
}

export function useKycPhotoReveal(caseId: string | undefined) {
  const v = useAdminKycVersion();
  return React.useMemo(
    () => (caseId ? getKycPhotoReveal(caseId) : undefined),
    [caseId, v],
  );
}

/**
 * Approve/reject action wired to the live decision endpoint. On success it
 * invokes `onDone` so callers can refresh the list / navigate.
 */
export function useKycDecision() {
  const token = useAccessToken();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = React.useCallback(
    async (
      accountId: string,
      decision: KycDecision,
      note: string | undefined,
      onDone?: () => void,
    ): Promise<boolean> => {
      if (!token) {
        setError("Not authenticated.");
        return false;
      }
      setSubmitting(true);
      setError(null);
      try {
        await decideKyc(token, accountId, decision, note);
        onDone?.();
        return true;
      } catch {
        setError("Decision failed. Please try again.");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [token],
  );

  return { submit, submitting, error };
}
