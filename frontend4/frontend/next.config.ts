import path from "path";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "..");

// On Vercel the Root Directory is already this app's folder; pointing the file-
// tracing / turbopack root at the monorepo parent shifts output paths and breaks
// the build (ENOENT .next/routes-manifest-deterministic.json). Only apply the
// parent root for LOCAL dev, where the monorepo layout needs it.
const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(isVercel
    ? {}
    : {
        outputFileTracingRoot: repoRoot,
        turbopack: {
          root: repoRoot,
        },
      }),
  allowedDevOrigins: [
    "http://192.168.1.36:3000",
    "http://localhost:3000",
  ],
};

export default nextConfig;
