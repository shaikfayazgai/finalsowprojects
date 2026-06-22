import { Suspense } from "react";
import { SkillTaxonomyWorkspace } from "./components/skill-taxonomy-workspace";
import { SkillTaxonomySkeleton } from "./components/skill-taxonomy-skeleton";

export default function AdminSkillTaxonomyPage() {
  return (
    <Suspense fallback={<SkillTaxonomySkeleton />}>
      <SkillTaxonomyWorkspace />
    </Suspense>
  );
}
