import { clerkSetup } from "@clerk/testing/playwright";
import { execSync } from "node:child_process";

const setup = async () => {
  await clerkSetup();
  execSync("node --no-warnings e2e/scripts/seed.ts", { stdio: "inherit" });
};

export default setup;
