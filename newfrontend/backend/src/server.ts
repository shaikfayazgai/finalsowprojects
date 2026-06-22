import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

const corsOrigins = (process.env.BACKEND_CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

app.get("/api/v1/health", (c) =>
  c.json({
    ok: true,
    service: "glimmora-backend",
    status: "scaffold",
    message: "Backend team: implement routes documented in README.md",
  }),
);

const port = Number(process.env.BACKEND_PORT ?? 4000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Glimmora backend scaffold listening on http://localhost:${port}`);
});
