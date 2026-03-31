import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { updateProfileSchema } from "@/lib/api/schemas/profile";
import { db } from "@/lib/db/client";
import { clicksTable } from "@/lib/db/schema/click";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { isValidThemeId } from "@/lib/themes";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;

  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);

  if (dbUser == null) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "User not found.", 404);
  }

  const [[linkResult], [groupResult], [clickResult]] = await Promise.all([
    db.select({ count: count() }).from(linksTable).where(eq(linksTable.userId, user.id)),
    db.select({ count: count() }).from(linkGroupsTable).where(eq(linkGroupsTable.userId, user.id)),
    db.select({ count: count() }).from(clicksTable).where(eq(clicksTable.userId, user.id)),
  ]);

  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  return apiSuccess({
    avatarUrl: dbUser.avatarUrl,
    bio: dbUser.bio,
    createdAt: dbUser.createdAt.toISOString(),
    customDomain: dbUser.customDomain,
    displayName: dbUser.displayName,
    groupCount: groupResult?.count ?? 0,
    linkCount: linkResult?.count ?? 0,
    pageDarkTheme: dbUser.pageDarkTheme,
    pageLightTheme: dbUser.pageLightTheme,
    profileUrl:
      dbUser.customDomain != null && dbUser.customDomainVerified
        ? `https://${dbUser.customDomain}`
        : `${baseUrl}/${dbUser.username}`,
    tier: user.tier,
    totalClicks: clickResult?.count ?? 0,
    username: dbUser.username,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }

  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const { bio, displayName, pageDarkTheme, pageLightTheme } = parsed.data;

  // Validate theme IDs if provided
  if (pageDarkTheme != null && !isValidThemeId(pageDarkTheme)) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid dark theme ID.", 400);
  }

  if (pageLightTheme != null && !isValidThemeId(pageLightTheme)) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid light theme ID.", 400);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (displayName !== undefined) {
    updates.displayName = displayName.trim().length > 0 ? displayName.trim() : null;
  }

  if (bio !== undefined) {
    updates.bio = bio.trim().length > 0 ? bio.trim() : null;
  }

  if (pageDarkTheme !== undefined) {
    updates.pageDarkTheme = pageDarkTheme;
  }

  if (pageLightTheme !== undefined) {
    updates.pageLightTheme = pageLightTheme;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning({
    avatarUrl: usersTable.avatarUrl,
    bio: usersTable.bio,
    displayName: usersTable.displayName,
    pageDarkTheme: usersTable.pageDarkTheme,
    pageLightTheme: usersTable.pageLightTheme,
    username: usersTable.username,
  });

  if (updated == null) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "User not found.", 404);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${updated.username}`);

  return apiSuccess({
    avatarUrl: updated.avatarUrl,
    bio: updated.bio,
    displayName: updated.displayName,
    pageDarkTheme: updated.pageDarkTheme,
    pageLightTheme: updated.pageLightTheme,
    username: updated.username,
  });
}

export function OPTIONS() {
  return apiOptions();
}
