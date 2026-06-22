/**
 * GET /api/contributor/account-auth
 *
 * Sign-in method summary for contributor Settings (password vs OAuth vs enterprise SSO).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRequest } from "@/lib/api/request-context";
import {
  connectedProvidersFromProvider,
  resolveContributorAuthMode,
  type ContributorAccountAuth,
} from "@/lib/contributor/account-auth";
import type { ContribType } from "@/lib/contributor/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireRequest({ allowedRoles: ["contributor"] });
  if (ctx instanceof NextResponse) return ctx;

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      passwordHash: true,
      provider: true,
      tenantId: true,
      tenant: { select: { name: true } },
      contributorProfile: { select: { contribType: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ detail: "User not found." }, { status: 404 });
  }

  const contribType =
    user.contributorProfile?.contribType &&
    user.contributorProfile.contribType.length > 0
      ? (user.contributorProfile.contribType as ContribType)
      : null;

  const hasPassword = !!user.passwordHash;
  const authMode = resolveContributorAuthMode({
    hasPassword,
    provider: user.provider,
    contribType,
    tenantId: user.tenantId,
  });

  const payload: ContributorAccountAuth = {
    authMode,
    hasPassword,
    provider: user.provider,
    connectedProviders: connectedProvidersFromProvider(user.provider),
    organizationName: user.tenant?.name ?? null,
  };

  return NextResponse.json(payload);
}
