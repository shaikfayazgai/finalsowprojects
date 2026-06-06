"use client";

import * as React from "react";
import {
  adminKycOverlays,
  computeKycSummary,
  getAdminKycCase,
  getKycPhotoReveal,
  listAdminKycCases,
} from "@/lib/admin/mocks/kyc-service";
import { fetchRealKycCases } from "@/lib/api/admin-kyc";
import type { MockKycCase } from "@/mocks/admin/kyc";

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

export function useAdminKycCasesList() {
  const v = useAdminKycVersion();
  const mockCases = React.useMemo(() => listAdminKycCases(), [v]);

  // Real backend KYC cases (women + freelancer self-signups) take priority;
  // they're merged ahead of the mock seed so the queue shows actual applicants.
  const [realCases, setRealCases] = React.useState<MockKycCase[] | null>(null);
  React.useEffect(() => {
    let alive = true;
    fetchRealKycCases().then((rows) => {
      if (alive) setRealCases(rows);
    });
    return () => {
      alive = false;
    };
  }, [v]);

  return React.useMemo(() => {
    if (!realCases || realCases.length === 0) return mockCases;
    // De-dupe by email — real wins.
    const realEmails = new Set(realCases.map((c) => c.contributorEmail.toLowerCase()));
    const seed = mockCases.filter((c) => !realEmails.has(c.contributorEmail.toLowerCase()));
    return [...realCases, ...seed];
  }, [realCases, mockCases]);
}

/** Returns the case + a `loading` flag so the detail page can show a spinner
 *  instead of "not found" while the real backend list is still fetching. */
export function useAdminKycCase(caseId: string | undefined): {
  case: MockKycCase | undefined;
  loading: boolean;
} {
  const v = useAdminKycVersion();

  // Try the mock store first (rich detail fields).
  const mockCase = React.useMemo(
    () => (caseId ? getAdminKycCase(caseId) : undefined),
    [caseId, v],
  );

  // If not in the mock store, look it up in the real backend list.
  const [realCase, setRealCase] = React.useState<MockKycCase | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!caseId || mockCase) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    fetchRealKycCases().then((rows) => {
      if (!alive) return;
      setRealCase(rows.find((c) => c.id === caseId));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [caseId, mockCase, v]);

  return { case: mockCase ?? realCase, loading };
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
