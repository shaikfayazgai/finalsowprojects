import { Suspense } from "react";
import { WorkforceWorkspace } from "./_components/workforce-workspace";
import { TeamsSkeleton } from "@/components/enterprise/page-skeletons";

export default function EnterpriseWorkforcePage() {
  return (
    <Suspense fallback={<TeamsSkeleton />}>
      <WorkforceWorkspace />
    </Suspense>
  );
}
