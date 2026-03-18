import type { SessionUser } from "./auth";

export type Tier = "free" | "pro";

export const FREE_LINK_LIMIT = 5;

export function isProUser(user: SessionUser): boolean {
  return user.tier === "pro";
}
