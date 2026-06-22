"use client";

import { Suspense } from "react";
import { WWWorkspace } from "./components/ww-workspace";
import { WWSkeleton } from "./components/ww-skeleton";

export default function AdminWomenWorkforcePage() {
  return (
    <Suspense fallback={<WWSkeleton />}>
      <WWWorkspace />
    </Suspense>
  );
}
