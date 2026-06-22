"use client";

import * as React from "react";
import {
  adminGovernanceOverlay,
  computeGovSummary,
  getAdminGovCase,
  listAdminGovCases,
} from "@/lib/admin/mocks/governance-service";

export function useAdminGovernanceVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    return adminGovernanceOverlay.subscribe(() => setV((n) => n + 1));
  }, []);
  return v;
}

export function useAdminGovCasesList() {
  const v = useAdminGovernanceVersion();
  return React.useMemo(() => listAdminGovCases(), [v]);
}

export function useAdminGovCase(caseId: string | undefined) {
  const v = useAdminGovernanceVersion();
  return React.useMemo(
    () => (caseId ? getAdminGovCase(caseId) : undefined),
    [caseId, v],
  );
}

export function useGovSummary(operatorName: string) {
  const cases = useAdminGovCasesList();
  return React.useMemo(() => computeGovSummary(cases, operatorName), [cases, operatorName]);
}
