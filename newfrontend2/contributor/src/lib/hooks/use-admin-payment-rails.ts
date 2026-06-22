"use client";

import * as React from "react";
import {
  adminRailsOverlay,
  getPaymentRail,
  listPaymentRails,
} from "@/lib/admin/mocks/rails-service";

function useRailsOverlayVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    return adminRailsOverlay.subscribe(() => setV((n) => n + 1));
  }, []);
  return v;
}

export function usePaymentRailsList() {
  const v = useRailsOverlayVersion();
  return React.useMemo(() => listPaymentRails(), [v]);
}

export function usePaymentRail(railId: string | undefined) {
  const v = useRailsOverlayVersion();
  return React.useMemo(
    () => (railId ? getPaymentRail(railId) : undefined),
    [railId, v],
  );
}
