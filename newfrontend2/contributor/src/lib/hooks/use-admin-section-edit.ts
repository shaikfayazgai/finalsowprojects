"use client";

import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import {
  ADMIN_SECTION_EDIT,
  type AdminRole,
} from "@/mocks/admin/personas";

type SectionKey = keyof typeof ADMIN_SECTION_EDIT;

function canEditSection(sectionKey: SectionKey, role: AdminRole): boolean {
  const allowed = ADMIN_SECTION_EDIT[sectionKey];
  if (!allowed) return true;
  return allowed.includes(role);
}

/** True when the active persona may mutate this admin section (not view-only). */
export function useAdminSectionCanEdit(sectionKey: SectionKey): boolean {
  const { role } = useActiveAdmin();
  return canEditSection(sectionKey, role);
}
