import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { createLinkSchema } from "@/lib/api/schemas/link";
import { db } from "@/lib/db/client";
import { generateUniqueSlug } from "@/lib/db/queries/link";
import { isSlugAvailable } from "@/lib/db/queries/slug";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { detectPlatform } from "@/lib/platforms";
import { FREE_LINK_LIMIT } from "@/lib/tier";
import { ensureProtocol, isSafeUrl, urlResolves } from "@/lib/utils/url";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;

  const links = await db
    .select({
      copyValue: linksTable.copyValue,
      createdAt: linksTable.createdAt,
      groupId: linksTable.groupId,
      icon: linksTable.icon,
      id: linksTable.id,
      isFeatured: linksTable.isFeatured,
      platform: linksTable.platform,
      position: linksTable.position,
      slug: linksTable.slug,
      title: linksTable.title,
      url: linksTable.url,
      visible: linksTable.visible,
    })
    .from(linksTable)
    .where(eq(linksTable.userId, user.id))
    .orderBy(asc(linksTable.position));

  return apiSuccess(links);
}

export async function POST(request: Request) {
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

  const parsed = createLinkSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const { groupId, slug: customSlug, title, url } = parsed.data;

  // Enforce free tier link limit
  if (user.tier !== "pro") {
    const [{ count: linkCount }] = await db
      .select({ count: count() })
      .from(linksTable)
      .where(eq(linksTable.userId, user.id));

    if (linkCount >= FREE_LINK_LIMIT) {
      return apiError(
        API_ERROR_CODES.LINK_LIMIT_REACHED,
        "Free tier is limited to 5 links. Upgrade to Pro for unlimited links.",
        403,
      );
    }
  }

  const fullUrl = ensureProtocol(url);

  if (!isSafeUrl(fullUrl)) {
    return apiError(API_ERROR_CODES.UNSAFE_URL, "This URL is not allowed.", 400);
  }

  if (!(await urlResolves(fullUrl))) {
    return apiError(API_ERROR_CODES.URL_UNREACHABLE, "This URL could not be reached.", 400);
  }

  // Validate group ownership
  const resolvedGroupId = groupId != null && groupId.length > 0 ? groupId : null;

  if (resolvedGroupId != null) {
    const [group] = await db
      .select({ id: linkGroupsTable.id })
      .from(linkGroupsTable)
      .where(and(eq(linkGroupsTable.id, resolvedGroupId), eq(linkGroupsTable.userId, user.id)))
      .limit(1);

    if (group == null) {
      return apiError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
    }
  }

  // Generate or validate slug
  const slug = customSlug != null && customSlug.length > 0 ? customSlug : await generateUniqueSlug(user.id, fullUrl);

  if (customSlug != null && customSlug.length > 0 && !(await isSlugAvailable(user.id, slug))) {
    return apiError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This path is already in use.", 409);
  }

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linksTable.position}), -1)` })
    .from(linksTable)
    .where(eq(linksTable.userId, user.id));

  const platform = detectPlatform(fullUrl);

  const [created] = await db
    .insert(linksTable)
    .values({
      groupId: resolvedGroupId,
      platform,
      position: (maxPosition[0]?.max ?? -1) + 1,
      slug,
      title,
      url: fullUrl,
      userId: user.id,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess(
    {
      createdAt: created.createdAt.toISOString(),
      groupId: created.groupId,
      id: created.id,
      isFeatured: created.isFeatured,
      platform: created.platform,
      position: created.position,
      slug: created.slug,
      title: created.title,
      url: created.url,
      visible: created.visible,
    },
    201,
  );
}

export function OPTIONS() {
  return apiOptions();
}
