import { defineConfig } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: process.env.CI != null ? 2 : 0,
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer:
    process.env.SMOKE_BASE_URL != null
      ? undefined
      : {
          command: "pnpm next dev",
          port: 3000,
          reuseExistingServer: true,
          timeout: 60_000,
        },
});
