import "./load-env";
/**
 * Seed local Postgres with enough enterprise data to make the portal
 * feel populated: a tenant, the Sandeep enterprise user attached to it,
 * a handful of SOWs across approval stages, plus the decomposition
 * plan + milestones + tasks for the approved one.
 *
 * Idempotent — re-running just upserts the same rows.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TENANT_ID = "tnt-acme-corp";
const ENT_USER_EMAIL = "sandeep@acme.com";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // 1. Tenant
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {
      name: "Acme Corp",
      slug: "acme-corp",
      subscriptionTier: "enterprise",
      status: "active",
    },
    create: {
      id: TENANT_ID,
      name: "Acme Corp",
      slug: "acme-corp",
      status: "active",
      subscriptionTier: "enterprise",
      defaultCurrency: "INR",
      defaultRegion: "asia-south",
      createdAt: new Date("2026-01-12T10:00:00Z"),
      updatedAt: new Date(),
    } as never, // schema may have extra required fields — fall through
  } as never).catch(async () => {
    // If schema needs different fields, fall back to a minimal create
    await prisma.$executeRaw`
      INSERT INTO "Tenant" (id, name, slug, status, "subscriptionTier", "createdAt", "updatedAt")
      VALUES (${TENANT_ID}, 'Acme Corp', 'acme-corp', 'active', 'enterprise', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = 'Acme Corp',
        slug = 'acme-corp',
        status = 'active',
        "subscriptionTier" = 'enterprise',
        "updatedAt" = NOW()
    `;
  });

  // 2. Attach Sandeep + the admin to this tenant via TenantMember rows
  const ent = await prisma.user.findUnique({ where: { email: ENT_USER_EMAIL } });
  if (!ent) { console.error("Run scripts/ensure-enterprise.ts first"); process.exit(1); }

  await prisma.$executeRaw`
    INSERT INTO "TenantMember" (id, "tenantId", "userId", role, "createdAt", "updatedAt")
    VALUES (${`tm-${ent.id}`}, ${TENANT_ID}, ${ent.id}, 'ent.admin', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'ent.admin', "updatedAt" = NOW()
  `.catch(() => undefined);

  // 3. SOWs across stages
  const sows = [
    { id: "sow-acme-1",  title: "API redesign — Acme platform v3", status: "approved" as const, stage: "Final" as const, approvedAt: new Date("2026-05-12") },
    { id: "sow-acme-2",  title: "Customer onboarding redesign",     status: "in_approval" as const, stage: "Legal" as const, approvedAt: null },
    { id: "sow-acme-3",  title: "Helios mobile companion app",      status: "in_approval" as const, stage: "Business" as const, approvedAt: null },
    { id: "sow-acme-4",  title: "Q4 marketing site refresh",        status: "draft" as const, stage: "Business" as const, approvedAt: null },
    { id: "sow-acme-5",  title: "Internal HR portal v2",            status: "approved" as const, stage: "Final" as const, approvedAt: new Date("2026-04-22") },
    { id: "sow-acme-6",  title: "Vendor reconciliation automation", status: "rejected" as const, stage: "Security" as const, approvedAt: null },
  ];

  for (const s of sows) {
    await prisma.$executeRaw`
      INSERT INTO "Sow" (id, "tenantId", title, status, stage, "activeVersion", "ownerId", confidentiality, "submittedForApprovalAt", "approvedAt", "createdAt", "updatedAt")
      VALUES (${s.id}, ${TENANT_ID}, ${s.title}, ${s.status}, ${s.stage}, 1, ${ent.id}, 'internal', NOW() - INTERVAL '12 days', ${s.approvedAt}, NOW() - INTERVAL '20 days', NOW())
      ON CONFLICT (id) DO UPDATE SET status = ${s.status}, stage = ${s.stage}, "approvedAt" = ${s.approvedAt}, "updatedAt" = NOW()
    `.catch((e: Error) => console.warn("sow insert:", s.id, e.message));

    await prisma.$executeRaw`
      INSERT INTO "SowVersion" (id, "sowId", version, "tenantId", payload, body, "changeNote", "createdBy", "createdAt")
      VALUES (${`${s.id}-v1`}, ${s.id}, 1, ${TENANT_ID}, '{"summary":"Auto-generated for demo"}'::jsonb, ${`# ${s.title}\n\nScope details and acceptance criteria.`}, 'initial', ${ent.id}, NOW() - INTERVAL '20 days')
      ON CONFLICT (id) DO NOTHING
    `.catch(() => undefined);
  }

  // 4. Approval stages on the in-flight SOW
  for (const [stage, decision] of [
    ["Business", "approved"], ["Glimmora Commercial", "approved"],
    ["Legal", "pending"], ["Security", "pending"], ["Final", "pending"],
  ] as const) {
    await prisma.$executeRaw`
      INSERT INTO "Approval" (id, "sowId", "sowVersion", "tenantId", stage, "approverId", decision, comment, "decidedAt", "createdAt", "slaDeadline")
      VALUES (${`appr-acme-2-${stage}`}, 'sow-acme-2', 1, ${TENANT_ID}, ${stage}, ${ent.id}, ${decision}, ${decision === "approved" ? "Looks good" : null}, ${decision === "approved" ? new Date() : null}, NOW(), NOW() + INTERVAL '7 days')
      ON CONFLICT (id) DO NOTHING
    `.catch(() => undefined);
  }

  // 5. Decomposition plans for the two approved SOWs
  const plans = [
    { id: "plan-acme-1", sowId: "sow-acme-1", status: "approved" as const, summary: "8 milestones · 24 tasks · ~520 hours" },
    { id: "plan-acme-5", sowId: "sow-acme-5", status: "active" as const, summary: "6 milestones · 18 tasks · ~360 hours" },
  ];
  for (const p of plans) {
    await prisma.$executeRaw`
      INSERT INTO "DecompositionPlan" (id, "sowId", "tenantId", version, status, summary, "defaultWorkforceSourcing", "defaultReviewPath", "twoStageReviewEnabled", "createdBy", "createdAt", "updatedAt")
      VALUES (${p.id}, ${p.sowId}, ${TENANT_ID}, 1, ${p.status}, ${p.summary}, 'hybrid', 'internal', false, ${ent.id}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = ${p.status}, summary = ${p.summary}, "defaultWorkforceSourcing" = 'hybrid', "updatedAt" = NOW()
    `.catch((e: Error) => console.warn("plan insert:", p.id, e.message));
  }

  await prisma.$executeRaw`
    UPDATE "Tenant"
    SET "workforcePolicy" = '{"defaultSourcing":"hybrid","allowOpenMarket":true,"requireMentorForInternal":false}'::jsonb,
        "rateCards" = COALESCE("rateCards", '{"currency":"INR","default":1200,"bySegment":{"internal":900,"student":600,"general_workforce":1200,"women_workforce":1100}}'::jsonb)
    WHERE id = ${TENANT_ID}
  `.catch(() => undefined);

  // 6. Milestones + tasks for plan-acme-1
  const milestones = [
    { id: "ms-acme-1-m1", order: 1, name: "Discovery & inventory",     desc: "Crawl existing endpoints, document v2 contracts.", status: "completed" as const },
    { id: "ms-acme-1-m2", order: 2, name: "v3 contract design",         desc: "Versioned OpenAPI 3.1 + error codes.",            status: "in_progress" as const },
    { id: "ms-acme-1-m3", order: 3, name: "Deprecation pilot",          desc: "10% traffic shift + monitoring.",                  status: "queued" as const },
  ];
  for (const m of milestones) {
    await prisma.$executeRaw`
      INSERT INTO "Milestone" (id, "planId", "tenantId", "order", name, description, "startDate", "endDate", status, "createdAt", "updatedAt")
      VALUES (${m.id}, 'plan-acme-1', ${TENANT_ID}, ${m.order}, ${m.name}, ${m.desc}, NOW() - INTERVAL '14 days', NOW() + INTERVAL '20 days', ${m.status}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = ${m.status}, "updatedAt" = NOW()
    `.catch((e: Error) => console.warn("milestone insert:", m.id, e.message));
  }

  const tasks = [
    { id: "task-acme-1-t1", ms: "ms-acme-1-m1", key: "T-1",  name: "Audit v2 endpoint usage",       skills: ["api", "analytics"],    hours: 18, status: "completed" as const, sourcing: null, review: null },
    { id: "task-acme-1-t2", ms: "ms-acme-1-m1", key: "T-2",  name: "Capture undocumented behaviors", skills: ["api"],                hours: 12, status: "completed" as const, sourcing: null, review: null },
    { id: "task-acme-1-t3", ms: "ms-acme-1-m2", key: "T-3",  name: "Draft v3 resource schemas",     skills: ["openapi", "typescript"], hours: 24, status: "in_progress" as const, sourcing: "external_only", review: "mentor" },
    { id: "task-acme-1-t4", ms: "ms-acme-1-m2", key: "T-4",  name: "Pagination + error model",      skills: ["api"],                hours: 16, status: "in_progress" as const, sourcing: "external_only", review: "mentor" },
    { id: "task-acme-1-t5", ms: "ms-acme-1-m3", key: "T-5",  name: "UI polish — dashboard filters", skills: ["figma", "react"],     hours: 20, status: "ready" as const, sourcing: "internal_only", review: "internal" },
    { id: "task-acme-1-t6", ms: "ms-acme-1-m3", key: "T-6",  name: "Rollback runbook",              skills: ["sre"],                hours: 8,  status: "ready" as const, sourcing: "internal_first", review: "internal" },
  ];
  for (const t of tasks) {
    await prisma.$executeRaw`
      INSERT INTO "TaskDefinition" (id, "planId", "milestoneId", "tenantId", "externalKey", title, description, "requiredSkills", "estimatedHours", "acceptanceCriteria", complexity, "order", status, "workforceSourcing", "reviewPath", "aiConfidence", "pmoEdited", "createdAt", "updatedAt")
      VALUES (${t.id}, 'plan-acme-1', ${t.ms}, ${TENANT_ID}, ${t.key}, ${t.name}, 'Auto-generated task for demo.', ${t.skills}, ${t.hours}, 'Acceptance criteria documented in plan.', 'medium', 1, ${t.status}, ${t.sourcing}, ${t.review}, 82, false, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = ${t.status}, "workforceSourcing" = ${t.sourcing}, "reviewPath" = ${t.review}, "updatedAt" = NOW()
    `.catch((e: Error) => console.warn("task insert:", t.id, e.message));
  }

  console.log("OK · seeded Acme tenant with 6 SOWs, 2 decomposition plans, 3 milestones, 6 tasks");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
