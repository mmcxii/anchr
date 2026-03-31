import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth, requirePro } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { createGroupSchema } from "@/lib/api/schemas/group";
import { db } from "@/lib/db/client";
import { generateUniqueGroupSlug, isSlugAvailable } from "@/lib/db/queries/slug";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;

  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const groups = await db
    .select({
      createdAt: linkGroupsTable.createdAt,
      id: linkGroupsTable.id,
      isQuickLinks: linkGroupsTable.isQuickLinks,
      position: linkGroupsTable.position,
      slug: linkGroupsTable.slug,
      title: linkGroupsTable.title,
      visible: linkGroupsTable.visible,
    })
    .from(linkGroupsTable)
    .where(eq(linkGroupsTable.userId, user.id))
    .orderBy(asc(linkGroupsTable.position));

  return apiSuccess(groups);
}

export async function POST(request: Request) {
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

  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const { slug: customSlug, title } = parsed.data;

  const slug =
    customSlug != null && customSlug.length > 0
      ? customSlug.toLowerCase()
      : await generateUniqueGroupSlug(user.id, title);

  if (customSlug != null && customSlug.length > 0 && !(await isSlugAvailable(user.id, slug))) {
    return apiError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This path is already in use.", 409);
  }

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linkGroupsTable.position}), -1)` })
    .from(linkGroupsTable)
    .where(eq(linkGroupsTable.userId, user.id));

  const [created] = await db
    .insert(linkGroupsTable)
    .values({
      position: (maxPosition[0]?.max ?? -1) + 1,
      slug,
      title,
      userId: user.id,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess(
    {
      createdAt: created.createdAt.toISOString(),
      id: created.id,
      isQuickLinks: created.isQuickLinks,
      position: created.position,
      slug: created.slug,
      title: created.title,
      visible: created.visible,
    },
    201,
  );
}

export function OPTIONS() {
  return apiOptions();
}
