import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { count, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  pageDarkTheme: text("page_dark_theme").default("dark-depths").notNull(),
  pageLightTheme: text("page_light_theme").default("stateroom").notNull(),
  proExpiresAt: timestamp("pro_expires_at"),
  tier: text("tier").default("free").notNull(),
  username: text("username").unique().notNull(),
});

const customThemesTable = pgTable("custom_themes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
});

/** Create a Drizzle client using the DATABASE_URL environment variable. */
function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl == null) {
    throw new Error("DATABASE_URL is required for E2E DB helpers");
  }
  return drizzle(neon(databaseUrl));
}

/**
 * Set a user's tier directly in the database. Useful for testing
 * downgrade/upgrade flows without going through Stripe.
 */
export async function setUserTier(username: string, tier: "free" | "pro") {
  const db = getDb();
  await db.update(usersTable).set({ proExpiresAt: null, tier }).where(eq(usersTable.username, username));
}

/**
 * Delete all custom themes for a user and reset their theme slots to defaults.
 * Used to ensure a clean state when serial tests retry.
 */
export async function resetCustomThemes(username: string) {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    return;
  }
  await db.execute(sql`DELETE FROM custom_themes WHERE user_id = ${user.id}`);
  await db.execute(
    sql`UPDATE users SET page_dark_theme = 'dark-depths', page_light_theme = 'stateroom' WHERE id = ${user.id}`,
  );
}

/**
 * Read the user's current theme slot values directly from the database.
 */
export async function getUserThemeSlots(username: string) {
  const db = getDb();
  const [user] = await db
    .select({ pageDarkTheme: usersTable.pageDarkTheme, pageLightTheme: usersTable.pageLightTheme })
    .from(usersTable)
    .where(eq(usersTable.username, username));
  return user ?? null;
}

/**
 * Count custom themes for a user directly from the database.
 */
export async function countCustomThemes(username: string) {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    return 0;
  }
  const [result] = await db
    .select({ count: count() })
    .from(customThemesTable)
    .where(eq(customThemesTable.userId, user.id));
  return result?.count ?? 0;
}

/**
 * Assign a custom theme to both dark and light slots directly in the database.
 */
export async function assignThemeSlotsDirectly(username: string, themeId: string) {
  const db = getDb();
  await db
    .update(usersTable)
    .set({ pageDarkTheme: themeId, pageLightTheme: themeId })
    .where(eq(usersTable.username, username));
}

/**
 * Get the first custom theme ID for a user.
 */
export async function getFirstCustomThemeId(username: string) {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    return null;
  }
  const [theme] = await db
    .select({ id: customThemesTable.id })
    .from(customThemesTable)
    .where(eq(customThemesTable.userId, user.id));
  return theme?.id ?? null;
}
