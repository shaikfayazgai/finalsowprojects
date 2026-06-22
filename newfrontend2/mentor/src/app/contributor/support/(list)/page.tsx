import { Suspense } from "react";
import { SupportWorkspace } from "../components/support-workspace";
import { SupportSkeleton } from "../components/support-skeleton";

export default function ContributorSupportPage() {
  return (
    <Suspense fallback={<SupportSkeleton />}>
      <SupportWorkspace />
    </Suspense>
  );
}
