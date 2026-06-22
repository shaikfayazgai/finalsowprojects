import "./load-env";
/**
 * Mint a NextAuth v5 / Auth.js session cookie for local browser audit.
 * Uses the library's own encode() so the kid/HKDF params match exactly.
 */
import { encode } from "@auth/core/jwt";

async function main() {
  const SECRET = process.env.AUTH_SECRET;
  if (!SECRET) { console.error("AUTH_SECRET missing"); process.exit(1); }

  const token = await encode({
    salt: "authjs.session-token",
    secret: SECRET,
    maxAge: 30 * 24 * 60 * 60,
    token: {
      sub: "cmpo4v7no0000pypg1xp99yu8",
      email: "admin@glimmora.ai",
      name: "Aishwarya Rao",
      role: "super_admin",
      provider: "credentials",
    },
  });
  console.log(token);
}

main().catch((e) => { console.error(e); process.exit(1); });
