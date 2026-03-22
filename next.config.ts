import type { NextConfig } from "next";
import { envSchema } from "./src/lib/env";

const nextConfig: NextConfig = {
  /* config options here */
  env: envSchema,
  images: {
    remotePatterns: [{ hostname: "img.clerk.com" }, { hostname: "utfs.io" }],
  },
  reactCompiler: true,
};

export default nextConfig;
