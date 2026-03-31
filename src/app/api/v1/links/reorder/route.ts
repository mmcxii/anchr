import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { reorderLinksSchema } from "@/lib/api/schemas/link";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

  const parsed = reorderLinksSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const { items } = parsed.data;
  const ids = items.map((item) => item.id);

  // Verify ownership
  const owned = await db
    .select({ id: linksTable.id })
    .from(linksTable)
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, user.id)));

  if (owned.length !== ids.length) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "One or more links not found.", 403);
  }

  const sqlChunks = [sql`CASE`];
  for (const item of items) {
    sqlChunks.push(sql`WHEN ${linksTable.id} = ${item.id} THEN ${item.position}`);
  }
  sqlChunks.push(sql`ELSE ${linksTable.position} END`);

  await db
    .update(linksTable)
    .set({ position: sql.join(sqlChunks, sql` `) })
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess(null);
}

export function OPTIONS() {
  return apiOptions();
}
