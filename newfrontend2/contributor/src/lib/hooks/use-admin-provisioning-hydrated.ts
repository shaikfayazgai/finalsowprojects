"use client";

import * as React from "react";
import { useAdminProvisioningStore } from "@/lib/stores/admin-provisioning-store";

/**
 * Wait for Zustand persist to rehydrate admin provisioning state from localStorage.
 * Prevents mock-only tenant lists from flashing before dynamic tenants load.
 */
export function useAdminProvisioningHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const persist = useAdminProvisioningStore.persist;
    if (!persist) {
      setHydrated(true);
      return;
    }
    const finish = () => setHydrated(true);
    if (persist.hasHydrated()) {
      finish();
      return;
    }
    return persist.onFinishHydration(finish);
  }, []);

  return hydrated;
}
