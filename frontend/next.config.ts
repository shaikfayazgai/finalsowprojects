import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: [
    "http://192.168.1.36:3000",
    "http://localhost:3000",
  ],
};

export default nextConfig;
