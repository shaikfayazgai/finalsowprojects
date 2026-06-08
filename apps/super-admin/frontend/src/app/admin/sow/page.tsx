"use client";

import * as React from "react";
import { CommercialGateWorkspace } from "./components/commercial-gate-workspace";
import { CommercialGateSkeleton } from "./components/commercial-gate-skeleton";

export default function AdminSowCommercialGatePage() {
  return (
    <React.Suspense fallback={<CommercialGateSkeleton />}>
      <CommercialGateWorkspace />
    </React.Suspense>
  );
}
