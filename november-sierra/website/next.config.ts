import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "anchr.to" }],
  },
  reactCompiler: true,
};

export default nextConfig;
