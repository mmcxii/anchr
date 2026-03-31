import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { updateLinkSchema } from "@/lib/api/schemas/link";
import { db } from "@/lib/db/client";
import { generateUniqueSlug } from "@/lib/db/queries/link";
import { isSlugAvailable } from "@/lib/db/queries/slug";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { detectPlatform } from "@/lib/platforms";
import { ensureProtocol, generateSlug, isSafeUrl, urlResolves } from "@/lib/utils/url";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }

  const parsed = updateLinkSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  // Fetch existing link
  const [existing] = await db
    .select()
    .from(linksTable)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .limit(1);

  if (existing == null) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Link not found.", 404);
  }

  const { groupId, slug: customSlug, title, url } = parsed.data;
  const updates: Record<string, unknown> = {};

  if (title !== undefined) {
    updates.title = title;
  }

  if (url !== undefined) {
    const fullUrl = ensureProtocol(url);

    if (!isSafeUrl(fullUrl)) {
      return apiError(API_ERROR_CODES.UNSAFE_URL, "This URL is not allowed.", 400);
    }

    if (!(await urlResolves(fullUrl))) {
      return apiError(API_ERROR_CODES.URL_UNREACHABLE, "This URL could not be reached.", 400);
    }

    updates.url = fullUrl;
    updates.platform = detectPlatform(fullUrl);

    // Regenerate slug if domain changed and no custom slug provided
    if (customSlug === undefined) {
      const oldSlug = generateSlug(existing.url);
      const newSlug = generateSlug(fullUrl);
      if (oldSlug !== newSlug) {
        updates.slug = await generateUniqueSlug(user.id, fullUrl);
      }
    }
  }

  if (customSlug !== undefined && customSlug.length > 0) {
    if (customSlug !== existing.slug && !(await isSlugAvailable(user.id, customSlug, { linkId: id }))) {
      return apiError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This path is already in use.", 409);
    }
    updates.slug = customSlug;
  }

  if (groupId !== undefined) {
    if (groupId != null && groupId.length > 0) {
      const [group] = await db
        .select({ id: linkGroupsTable.id })
        .from(linkGroupsTable)
        .where(and(eq(linkGroupsTable.id, groupId), eq(linkGroupsTable.userId, user.id)))
        .limit(1);

      if (group == null) {
        return apiError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
      }
      updates.groupId = groupId;
    } else {
      updates.groupId = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return apiSuccess({
      createdAt: existing.createdAt.toISOString(),
      groupId: existing.groupId,
      id: existing.id,
      isFeatured: existing.isFeatured,
      platform: existing.platform,
      position: existing.position,
      slug: existing.slug,
      title: existing.title,
      url: existing.url,
      visible: existing.visible,
    });
  }

  const [updated] = await db
    .update(linksTable)
    .set(updates)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess({
    createdAt: updated.createdAt.toISOString(),
    groupId: updated.groupId,
    id: updated.id,
    isFeatured: updated.isFeatured,
    platform: updated.platform,
    position: updated.position,
    slug: updated.slug,
    title: updated.title,
    url: updated.url,
    visible: updated.visible,
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;
  const { id } = await params;

  const deleted = await db.delete(linksTable).where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)));

  if (deleted.rowCount === 0) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "Link not found.", 404);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess(null);
}

export function OPTIONS() {
  return apiOptions();
}
