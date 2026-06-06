import { handlers } from "@/auth";

// bcryptjs requires Node.js crypto — must not run in Edge runtime
export const runtime = "nodejs";

// NextAuth endpoints are cookie-driven and must never be statically optimized/cached.
export const dynamic = "force-dynamic";

// Avoid destructured exports here; explicit exports are more robust across bundlers.
export const GET = handlers.GET;
export const POST = handlers.POST;
