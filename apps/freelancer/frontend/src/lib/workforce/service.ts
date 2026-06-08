/**
 * Organization workforce directory — internal contributors (CSV import).
 */

import { Prisma } from "@/generated/prisma/client";
import type { ListWorkforceOptions, ListWorkforceResult, WorkforceMember } from "./types";

type Tx = Prisma.TransactionClient;

export class WorkforceServiceError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "validation" | "forbidden" | "invalid_state",
  ) {
    super(message);
    this.name = "WorkforceServiceError";
  }
}

function departmentLabel(profile: {
  departmentCategory: string;
  departmentOther: string | null;
}): string {
  if (profile.departmentOther?.trim()) return profile.departmentOther.trim();
  return profile.departmentCategory.replace(/_/g, " ");
}

export async function listOrganizationWorkforce(
  tx: Tx,
  options: ListWorkforceOptions,
): Promise<ListWorkforceResult> {
  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const where: Prisma.UserWhereInput = {
    tenantId: options.tenantId,
    role: "contributor",
    contributorProfile: {
      is: {
        contribType: "internal",
        departmentCategory: { not: "inactive" },
        ...(options.department
          ? {
              OR: [
                { departmentCategory: options.department },
                {
                  departmentOther: {
                    contains: options.department,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
    },
    ...(options.search
      ? {
          OR: [
            { email: { contains: options.search, mode: "insensitive" } },
            { firstName: { contains: options.search, mode: "insensitive" } },
            { lastName: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    tx.user.count({ where }),
    tx.user.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: offset,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        contributorProfile: {
          select: {
            contribType: true,
            departmentCategory: true,
            departmentOther: true,
            primarySkills: true,
            availability: true,
          },
        },
      },
    }),
  ]);

  const items: WorkforceMember[] = rows
    .filter((r) => r.contributorProfile)
    .map((r) => {
      const p = r.contributorProfile!;
      return {
        userId: r.id,
        email: r.email,
        displayName: `${r.firstName} ${r.lastName}`.trim(),
        department: departmentLabel(p),
        contribType: p.contribType,
        primarySkills: p.primarySkills,
        availability: p.availability,
        employeeId: r.email.split("@")[0] ?? null,
      };
    });

  return { items, total };
}
