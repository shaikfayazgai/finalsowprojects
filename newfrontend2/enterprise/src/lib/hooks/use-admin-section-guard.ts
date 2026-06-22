"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import {
  ADMIN_SECTION_VISIBILITY,
  type AdminRole,
} from "@/mocks/admin/personas";
import { isAdminSectionPhaseHidden } from "@/lib/admin/phase-gate";

type SectionKey = keyof typeof ADMIN_SECTION_VISIBILITY;

function canAccessSection(sectionKey: SectionKey, role: AdminRole): boolean {
  // Phase-1: block Phase-2 routes even via direct URL (reversible via flag).
  if (isAdminSectionPhaseHidden(sectionKey as string)) return false;
  const allowed = ADMIN_SECTION_VISIBILITY[sectionKey];
  if (!allowed) return true;
  return allowed.includes(role);
}

/** Redirect platform admin personas away from sections their RBAC hides. */
export function useAdminSectionGuard(sectionKey: SectionKey): boolean {
  const { role } = useActiveAdmin();
  const router = useRouter();
  const allowed = canAccessSection(sectionKey, role);

  useEffect(() => {
    if (!allowed) {
      router.replace(`/admin/dashboard?role=${role}`);
    }
  }, [allowed, role, router]);

  return allowed;
}
