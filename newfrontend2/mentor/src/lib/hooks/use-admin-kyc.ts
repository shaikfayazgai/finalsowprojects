"use client";

import * as React from "react";
import {
  adminKycOverlays,
  computeKycSummary,
  getAdminKycCase,
  getKycPhotoReveal,
  listAdminKycCases,
} from "@/lib/admin/mocks/kyc-service";

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
  return React.useMemo(() => listAdminKycCases(), [v]);
}

export function useAdminKycCase(caseId: string | undefined) {
  const v = useAdminKycVersion();
  return React.useMemo(
    () => (caseId ? getAdminKycCase(caseId) : undefined),
    [caseId, v],
  );
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
