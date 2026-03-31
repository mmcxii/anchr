import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth, requirePro } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { and, eq } from "drizzle-orm";
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

  const [link] = await db
    .select({ id: linksTable.id, isFeatured: linksTable.isFeatured })
    .from(linksTable)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .limit(1);

  if (link == null) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Link not found.", 404);
  }

  if (link.isFeatured) {
    // Unfeature
    await db
      .update(linksTable)
      .set({ isFeatured: false })
      .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)));
  } else {
    // Unfeature current, then feature this one
    await db
      .update(linksTable)
      .set({ isFeatured: false })
      .where(and(eq(linksTable.userId, user.id), eq(linksTable.isFeatured, true)));

    await db
      .update(linksTable)
      .set({ isFeatured: true })
      .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)));
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess({ id: link.id, isFeatured: !link.isFeatured });
}

export function OPTIONS() {
  return apiOptions();
}
