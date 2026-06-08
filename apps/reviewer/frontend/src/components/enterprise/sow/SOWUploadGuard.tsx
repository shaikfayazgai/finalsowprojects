"use client";

import * as React from "react";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useNavigationGuard } from "@/lib/hooks/use-navigation-guard";
import { NavigationGuardModal } from "@/components/enterprise/sow/NavigationGuardModal";

const STEP_LABELS: Record<number, string> = {
  1: "Step 1 of 7 — Document Upload",
  2: "Step 2 of 7 — Extraction Report",
  3: "Step 3 of 7 — Parsed Review",
  4: "Step 4 of 7 — Gap Analysis",
  5: "Step 5 of 7 — Commercial Details",
  6: "Step 6 of 7 — Generate SOW",
  7: "Step 7 of 7 — Preview & Confirm",
};

/**
 * Drop-in navigation guard for any Manual SOW Upload page.
 *
 * Mount this at the bottom of each upload step's JSX (inside the same
 * fragment as the main content) — it renders a modal that intercepts
 * navigation to non-upload routes while the user has in-progress work.
 *
 * Mirrors the AI wizard's per-page pattern in `generate/page.tsx`.
 */
export function SOWUploadGuard() {
  // Use individual selectors so the component re-renders the moment
  // Zustand persist hydrates and these specific fields update.
  const uploadedFile    = useSOWUploadStore((s) => s.uploadedFile);
  const currentFlowStep = useSOWUploadStore((s) => s.currentFlowStep);
  const reset           = useSOWUploadStore((s) => s.reset);

  const isActive = uploadedFile !== null || currentFlowStep > 1;

  const navGuard = useNavigationGuard({
    isActive,
    allowedPathPrefixes: ["/enterprise/sow/upload"],
  });

  return (
    <NavigationGuardModal
      open={navGuard.showModal}
      onStay={navGuard.onStay}
      onSaveAndLeave={navGuard.onConfirmLeave}
      onDiscardAndLeave={() => {
        reset();
        navGuard.onConfirmLeave();
      }}
      flowLabel={`the Manual SOW Upload flow (${STEP_LABELS[currentFlowStep] ?? "in progress"})`}
    />
  );
}
