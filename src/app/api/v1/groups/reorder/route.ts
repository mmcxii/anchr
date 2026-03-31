import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth, requirePro } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { reorderGroupsSchema } from "@/lib/api/schemas/group";
import { db } from "@/lib/db/client";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;

  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }

  const parsed = reorderGroupsSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const { items } = parsed.data;
  const ids = items.map((item) => item.id);

  const owned = await db
    .select({ id: linkGroupsTable.id })
    .from(linkGroupsTable)
    .where(and(inArray(linkGroupsTable.id, ids), eq(linkGroupsTable.userId, user.id)));

  if (owned.length !== ids.length) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "One or more groups not found.", 403);
  }

  const sqlChunks = [sql`CASE`];
  for (const item of items) {
    sqlChunks.push(sql`WHEN ${linkGroupsTable.id} = ${item.id} THEN ${item.position}`);
  }
  sqlChunks.push(sql`ELSE ${linkGroupsTable.position} END`);

  await db
    .update(linkGroupsTable)
    .set({ position: sql.join(sqlChunks, sql` `) })
    .where(and(inArray(linkGroupsTable.id, ids), eq(linkGroupsTable.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess(null);
}

export function OPTIONS() {
  return apiOptions();
}
