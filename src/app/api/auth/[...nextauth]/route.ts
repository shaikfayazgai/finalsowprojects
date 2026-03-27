import { handlers } from "@/auth";

// bcryptjs requires Node.js crypto — must not run in Edge runtime
export const runtime = "nodejs";

export const { GET, POST } = handlers;
