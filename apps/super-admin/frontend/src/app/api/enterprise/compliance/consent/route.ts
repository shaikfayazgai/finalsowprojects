/**
 * GET /api/enterprise/compliance/consent
 *
 * Tenant-scoped consent inventory (spec doc 02 §5.I.2). Lists every
 * contributor who has been assigned to a TaskDefinition under this
 * tenant, along with each consent flag captured on ContributorProfile
 * at registration: T&Cs, code of conduct, privacy, fee schedule,
 * AHP, NDA, marketing opt-in.
 *
 * Query params:
 *   - search    free-text on name / email
 *   - missing   "true" → only contributors missing one or more required consents
 *   - format    "json" (default) | "csv"
 *   - limit     1–500 (json only; default 100)
 *
 * Permissions:
 *   - format=json → read.consent
 *   - format=csv  → export.consent
 *
 * "Required" set: tos + privacy + coc + nda. (Fee/AHP/marketing are
 * informational.)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_CONSENTS = ["acceptTos", "acceptCoc", "acceptPrivacy", "ndaAccepted"] as const;

interface ConsentRow {
  contributorId: string;
  email: string;
  name: string;
  ndaAccepted: boolean;
  acceptTos: boolean;
  acceptCoc: boolean;
  acceptPrivacy: boolean;
  acceptFee: boolean;
  acceptAhp: boolean;
  marketingOptIn: boolean;
  profileUpdatedAt: string | null;
  missingRequired: string[];
  isComplete: boolean;
}

function toCsv(rows: ConsentRow[]): string {
  const header = [
    "contributor_id",
    "email",
    "name",
    "nda",
    "tos",
    "coc",
    "privacy",
    "fee",
    "ahp",
    "marketing_opt_in",
    "profile_updated_at",
    "missing_required",
    "is_complete",
  ];
  const esc = (v: string): string => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.contributorId,
        r.email,
        r.name,
        r.ndaAccepted,
        r.acceptTos,
        r.acceptCoc,
        r.acceptPrivacy,
        r.acceptFee,
        r.acceptAhp,
        r.marketingOptIn,
        r.profileUpdatedAt ?? "",
        r.missingRequired.join("|"),
        r.isComplete,
      ]
        .map((v) => esc(String(v)))
        .join(","),
    );
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();
  if (format !== "json" && format !== "csv") {
    return NextResponse.json({ error: "format must be 'json' or 'csv'" }, { status: 400 });
  }

  const requiredPerm = format === "csv" ? "export.consent" : "read.consent";
  if (!(await userHasPermission(ctx.userId, requiredPerm))) {
    return NextResponse.json(
      { error: "forbidden", reason: `missing_permission:${requiredPerm}` },
      { status: 403 },
    );
  }

  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
  const onlyMissing = url.searchParams.get("missing") === "true";
  const limitRaw = Number(url.searchParams.get("limit") ?? "100");
  const limit = format === "csv" ? 5000 : Math.min(Math.max(1, limitRaw || 100), 500);

  const rows = await ctx.withTx(async (tx) => {
    const taskRows = await tx.taskDefinition.findMany({
      where: { assignedContributorId: { not: null } },
      select: {
        assignedContributor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            contributorProfile: {
              select: {
                ndaAccepted: true,
                acceptTos: true,
                acceptCoc: true,
                acceptPrivacy: true,
                acceptFee: true,
                acceptAhp: true,
                marketingOptIn: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    const seen = new Map<string, ConsentRow>();
    for (const t of taskRows) {
      const c = t.assignedContributor;
      if (!c || seen.has(c.id)) continue;
      const p = c.contributorProfile;
      const baseFlags = {
        ndaAccepted: p?.ndaAccepted ?? false,
        acceptTos: p?.acceptTos ?? false,
        acceptCoc: p?.acceptCoc ?? false,
        acceptPrivacy: p?.acceptPrivacy ?? false,
        acceptFee: p?.acceptFee ?? false,
        acceptAhp: p?.acceptAhp ?? false,
        marketingOptIn: p?.marketingOptIn ?? false,
      };
      const missingRequired = REQUIRED_CONSENTS.filter((k) => !baseFlags[k]);
      const row: ConsentRow = {
        contributorId: c.id,
        email: c.email,
        name: `${c.firstName} ${c.lastName}`.trim(),
        ...baseFlags,
        profileUpdatedAt: p?.updatedAt.toISOString() ?? null,
        missingRequired,
        isComplete: missingRequired.length === 0,
      };
      seen.set(c.id, row);
    }
    return Array.from(seen.values());
  });

  let filtered = rows;
  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.email.toLowerCase().includes(search) ||
        r.name.toLowerCase().includes(search) ||
        r.contributorId.toLowerCase().includes(search),
    );
  }
  if (onlyMissing) filtered = filtered.filter((r) => !r.isComplete);
  filtered.sort((a, b) => a.name.localeCompare(b.name));
  const total = filtered.length;
  const paged = filtered.slice(0, limit);

  if (format === "csv") {
    const csv = toCsv(paged);
    const filename = `glimmora_consent_${ctx.tenant.id}_${Date.now()}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Consent-Row-Count": String(paged.length),
      },
    });
  }

  const completed = filtered.filter((r) => r.isComplete).length;
  return NextResponse.json(
    {
      tenantId: ctx.tenant.id,
      total,
      complete: completed,
      missing: total - completed,
      rows: paged,
    },
    { status: 200 },
  );
}
