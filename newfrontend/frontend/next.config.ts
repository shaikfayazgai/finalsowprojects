import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://192.168.1.36:3000",
    "http://localhost:3000",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
