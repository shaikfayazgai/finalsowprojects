import { prisma } from "@/lib/db";
import { isMentorRole, type MentorRole } from "@/mocks/mentor/personas";

const SENIOR_CODES = new Set(["mentor.senior", "mentor.lead"]);

/**
 * Resolve scoped mentor tier from UserRole rows (falls back to base mentor).
 */
export async function resolveMentorRoleForUser(userId: string): Promise<MentorRole> {
  // Scoped tiers (mentor.senior / mentor.lead) live in the Prisma UserRole table.
  // The mentor standalone deployment has no Prisma DB, so fall back to the base
  // "mentor" tier instead of crashing the route when Prisma is unavailable.
  try {
    const roles = await prisma.userRole.findMany({
      where: { userId, roleCode: { startsWith: "mentor" } },
      select: { roleCode: true },
    });

    if (roles.some((r) => r.roleCode === "mentor.lead")) return "mentor.lead";
    if (roles.some((r) => SENIOR_CODES.has(r.roleCode))) return "mentor.senior";
    if (roles.some((r) => r.roleCode === "mentor")) return "mentor";

    return "mentor";
  } catch {
    return "mentor";
  }
}

export function mentorRoleFromCodes(codes: string[]): MentorRole {
  if (codes.includes("mentor.lead")) return "mentor.lead";
  if (codes.some((c) => SENIOR_CODES.has(c))) return "mentor.senior";
  if (codes.includes("mentor")) return "mentor";
  return "mentor";
}

export function isSeniorMentorRole(role: MentorRole): boolean {
  return role === "mentor.senior" || role === "mentor.lead";
}

export function parseDemoMentorRole(raw: string | null): MentorRole | null {
  return isMentorRole(raw) ? raw : null;
}
