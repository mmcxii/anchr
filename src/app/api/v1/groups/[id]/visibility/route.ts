import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth, requirePro } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db/client";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { and, eq, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;

  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const { id } = await params;

  const [updated] = await db
    .update(linkGroupsTable)
    .set({ visible: not(linkGroupsTable.visible) })
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .returning({ id: linkGroupsTable.id, visible: linkGroupsTable.visible });

  if (updated == null) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess({ id: updated.id, visible: updated.visible });
}

export function OPTIONS() {
  return apiOptions();
}
