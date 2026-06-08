"use client";

import * as React from "react";
import {
  adminPartnershipOverlays,
  computeUniversitySummary,
  computeWWSummary,
  getAdminUniversity,
  getAdminWWPartner,
  listAdminUniversities,
  listAdminWWPartners,
} from "@/lib/admin/mocks/partnerships-service";

function usePartnershipOverlayVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const unsub = [
      adminPartnershipOverlays.universities.subscribe(() => setV((n) => n + 1)),
      adminPartnershipOverlays.wwPartners.subscribe(() => setV((n) => n + 1)),
    ];
    return () => unsub.forEach((u) => u());
  }, []);
  return v;
}

export function useAdminUniversitiesList() {
  const v = usePartnershipOverlayVersion();
  return React.useMemo(() => listAdminUniversities(), [v]);
}

export function useAdminUniversity(uniId: string | undefined) {
  const v = usePartnershipOverlayVersion();
  return React.useMemo(
    () => (uniId ? getAdminUniversity(uniId) : undefined),
    [uniId, v],
  );
}

export function useUniversitySummary() {
  const list = useAdminUniversitiesList();
  return React.useMemo(() => computeUniversitySummary(list), [list]);
}

export function useAdminWWPartnersList() {
  const v = usePartnershipOverlayVersion();
  return React.useMemo(() => listAdminWWPartners(), [v]);
}

export function useAdminWWPartner(orgId: string | undefined) {
  const v = usePartnershipOverlayVersion();
  return React.useMemo(
    () => (orgId ? getAdminWWPartner(orgId) : undefined),
    [orgId, v],
  );
}

export function useWWSummary() {
  const list = useAdminWWPartnersList();
  return React.useMemo(() => computeWWSummary(list), [list]);
}
