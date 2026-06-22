"use client";

import * as React from "react";
import {
  adminSkillOverlay,
  getAdminSkill,
  listAdminSkills,
} from "@/lib/admin/mocks/skills-service";

export function useAdminSkillsVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => adminSkillOverlay.subscribe(() => setV((n) => n + 1)), []);
  return v;
}

export function useAdminSkillsList() {
  const v = useAdminSkillsVersion();
  return React.useMemo(() => listAdminSkills(), [v]);
}

export function useAdminSkill(skillId: string | undefined) {
  const v = useAdminSkillsVersion();
  return React.useMemo(
    () => (skillId ? getAdminSkill(skillId) : undefined),
    [skillId, v],
  );
}
