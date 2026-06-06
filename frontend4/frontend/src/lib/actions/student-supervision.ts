"use server";

import { revalidatePath } from "next/cache";
import { approveStudentParticipation } from "@/lib/contributor/student-supervision";
import { markUniversityStudentActiveByEmail } from "@/lib/admin/mocks/partnerships-service";

export async function approveStudentParticipationAction(
  universityId: string,
  email: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const result = await approveStudentParticipation(email);
  if (!result.success) return result;

  markUniversityStudentActiveByEmail(universityId, email);
  revalidatePath(`/admin/partnerships/universities/${universityId}`);
  revalidatePath("/admin/partnerships/universities");
  return { success: true };
}
