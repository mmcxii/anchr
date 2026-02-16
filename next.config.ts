import type { NextConfig } from "next";
import { envSchema } from "./src/lib/env";

const nextConfig: NextConfig = {
  /* config options here */
  env: envSchema,
  reactCompiler: true,
};

export default nextConfig;
