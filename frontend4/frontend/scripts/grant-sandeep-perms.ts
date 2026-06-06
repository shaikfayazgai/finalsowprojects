import "./load-env";
/**
 * Grant Sandeep the role(s) holding `read.sow` etc. so /api/sow stops
 * returning 403. The Role table is keyed by `code`, not `id`.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const u = await prisma.user.findUnique({ where: { email: "sandeep@acme.com" } });
  if (!u) { console.error("Run scripts/ensure-enterprise.ts first"); process.exit(1); }

  const roles = await prisma.role.findMany({
    where: { rolePermissions: { some: { permissionCode: "read.sow" } } },
    select: {
      code: true, scope: true,
      rolePermissions: { select: { permissionCode: true } },
    },
  });
  if (roles.length === 0) {
    console.error("No Role grants read.sow. seed.sql may not have been applied.");
    process.exit(1);
  }
  console.log("Roles with read.sow:");
  for (const r of roles) console.log(` · ${r.code} (${r.scope}) — ${r.rolePermissions.length} perms`);

  const pick = roles.find((r) => r.code === "ent.admin")
    ?? roles.find((r) => r.scope === "enterprise")
    ?? roles[0]!;
  console.log(`Picking ${pick.code}`);

  const existing = await prisma.userRole.findFirst({ where: { userId: u.id, roleCode: pick.code } as never });
  if (existing) {
    console.log("UserRole already exists:", existing.id);
  } else {
    const ur = await prisma.userRole.create({
      data: { userId: u.id, roleCode: pick.code, tenantId: u.tenantId } as never,
    });
    console.log("Created UserRole:", ur.id);
  }

  const perms = await prisma.userRole.findMany({
    where: { userId: u.id },
    select: { role: { select: { code: true, rolePermissions: { select: { permissionCode: true } } } } },
  });
  const codes = new Set<string>();
  for (const r of perms) for (const p of r.role.rolePermissions) codes.add(p.permissionCode);
  console.log(`Sandeep now holds ${codes.size} permissions; has read.sow:`, codes.has("read.sow"));
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
