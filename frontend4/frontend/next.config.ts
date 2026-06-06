import path from "path";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  allowedDevOrigins: [
    "http://192.168.1.36:3000",
    "http://localhost:3000",
  ],
};

export default nextConfig;
