import "./load-env";
/**
 * Mint a NextAuth session JWT for a user email (local browser QA).
 * Creates a durable Session row and embeds sessionId + id in the JWT.
 *
 * Usage: npx tsx --tsconfig frontend/tsconfig.json frontend/scripts/mint-session-for-user.ts user@example.com
 */
import crypto from "node:crypto";
import { encode } from "@auth/core/jwt";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSessionToken } from "@/lib/session";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: mint-session-for-user.ts <email>");
    process.exit(1);
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("AUTH_SECRET missing");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await prisma.$disconnect();
    console.error("User not found:", email);
    process.exit(1);
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      tenantId: user.tenantId,
      tokenHash: hashSessionToken(sessionId),
      expiresAt,
    },
  });
  await prisma.$disconnect();

  const name = `${user.firstName} ${user.lastName}`.trim() || email;
  const token = await encode({
    salt: "authjs.session-token",
    secret,
    maxAge: SESSION_MAX_AGE,
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name,
      role: user.role,
      provider: user.provider ?? "credentials",
      sessionId,
    },
  });

  console.log(token);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
