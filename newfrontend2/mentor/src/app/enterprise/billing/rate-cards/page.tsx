"use client";

import { Suspense } from "react";
import { RateCardsWorkspace } from "./_components/rate-cards-workspace";
import { RateCardsSkeleton } from "@/components/enterprise/page-skeletons";

export default function RateCardsListPage() {
  return (
    <Suspense fallback={<RateCardsSkeleton />}>
      <RateCardsWorkspace />
    </Suspense>
  );
}
