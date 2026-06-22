"use client";

import * as React from "react";
import {
  adminPartnershipOverlays,
  computeWWSummary,
  getAdminWWPartner,
  listAdminWWPartners,
} from "@/lib/admin/mocks/partnerships-service";

function usePartnershipOverlayVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const unsub = [
      adminPartnershipOverlays.wwPartners.subscribe(() => setV((n) => n + 1)),
    ];
    return () => unsub.forEach((u) => u());
  }, []);
  return v;
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
