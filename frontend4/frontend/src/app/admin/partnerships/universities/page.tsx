"use client";

import { Suspense } from "react";
import { UniversitiesWorkspace } from "./components/universities-workspace";
import { UniversitiesSkeleton } from "./components/universities-skeleton";

export default function AdminUniversitiesPage() {
  return (
    <Suspense fallback={<UniversitiesSkeleton />}>
      <UniversitiesWorkspace />
    </Suspense>
  );
}
