import type { NextConfig } from "next";

// Standalone per-role app: this folder IS the root. Do NOT point the
// tracing/turbopack root at a parent — that breaks .next/routes-manifest.
const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  allowedDevOrigins: ["http://localhost:3104"],
};

export default nextConfig;
