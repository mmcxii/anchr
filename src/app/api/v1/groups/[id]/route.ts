import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth, requirePro } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { updateGroupSchema } from "@/lib/api/schemas/group";
import { db } from "@/lib/db/client";
import { isSlugAvailable } from "@/lib/db/queries/slug";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }

  const parsed = updateGroupSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const [existing] = await db
    .select()
    .from(linkGroupsTable)
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .limit(1);

  if (existing == null) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
  }

  if (existing.isQuickLinks) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Quick Links group cannot be modified.", 403);
  }

  const { slug: customSlug, title } = parsed.data;
  const updates: Record<string, unknown> = {};

  if (title !== undefined) {
    updates.title = title;
  }

  if (customSlug !== undefined && customSlug.length > 0) {
    const slug = customSlug.toLowerCase();
    if (slug !== existing.slug && !(await isSlugAvailable(user.id, slug, { groupId: id }))) {
      return apiError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This path is already in use.", 409);
    }
    updates.slug = slug;
  }

  if (Object.keys(updates).length === 0) {
    return apiSuccess({
      createdAt: existing.createdAt.toISOString(),
      id: existing.id,
      isQuickLinks: existing.isQuickLinks,
      position: existing.position,
      slug: existing.slug,
      title: existing.title,
      visible: existing.visible,
    });
  }

  const [updated] = await db
    .update(linkGroupsTable)
    .set(updates)
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess({
    createdAt: updated.createdAt.toISOString(),
    id: updated.id,
    isQuickLinks: updated.isQuickLinks,
    position: updated.position,
    slug: updated.slug,
    title: updated.title,
    visible: updated.visible,
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

  const [group] = await db
    .select({ id: linkGroupsTable.id, isQuickLinks: linkGroupsTable.isQuickLinks })
    .from(linkGroupsTable)
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .limit(1);

  if (group == null) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
  }

  if (group.isQuickLinks) {
    return apiError(API_ERROR_CODES.FORBIDDEN, "Quick Links group cannot be deleted.", 403);
  }

  // Ungroup links before deleting the group
  await db
    .update(linksTable)
    .set({ groupId: null })
    .where(and(eq(linksTable.groupId, id), eq(linksTable.userId, user.id)));

  await db.delete(linkGroupsTable).where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess(null);
}

export function OPTIONS() {
  return apiOptions();
}
