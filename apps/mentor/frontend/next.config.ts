import type { NextConfig } from "next";

// Standalone per-role app: this folder IS the root. Do NOT point the
// tracing/turbopack root at a parent — that shifts output paths and breaks the
// build (ENOENT .next/routes-manifest.json).
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    "http://localhost:3101",
  ],
};

export default nextConfig;
