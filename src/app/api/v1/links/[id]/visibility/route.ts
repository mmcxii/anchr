import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { and, eq, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;
  const { id } = await params;

  const [updated] = await db
    .update(linksTable)
    .set({ visible: not(linksTable.visible) })
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .returning({ id: linksTable.id, visible: linksTable.visible });

  if (updated == null) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Link not found.", 404);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess({ id: updated.id, visible: updated.visible });
}

export function OPTIONS() {
  return apiOptions();
}
