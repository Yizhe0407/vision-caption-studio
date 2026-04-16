import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.20.118"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
