import { API_ERROR_CODES } from "@/lib/api/errors";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { isProUser } from "@/lib/tier";
import { and, asc, eq, isNull } from "drizzle-orm";

type RouteParams = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { username } = await params;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);

  if (user == null) {
    return apiError(API_ERROR_CODES.NOT_FOUND, "User not found.", 404);
  }

  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;
  const profileUrl =
    user.customDomain != null && user.customDomainVerified
      ? `https://${user.customDomain}`
      : `${baseUrl}/${user.username}`;

  // Fetch visible ungrouped links
  const ungroupedLinks = await db
    .select({
      id: linksTable.id,
      platform: linksTable.platform,
      position: linksTable.position,
      slug: linksTable.slug,
      title: linksTable.title,
      url: linksTable.url,
      visible: linksTable.visible,
    })
    .from(linksTable)
    .where(and(eq(linksTable.userId, user.id), eq(linksTable.visible, true), isNull(linksTable.groupId)))
    .orderBy(asc(linksTable.position));

  // Fetch visible groups (excluding Quick Links) and their links
  const groups = [];

  if (isProUser(user)) {
    const visibleGroups = await db
      .select({
        id: linkGroupsTable.id,
        slug: linkGroupsTable.slug,
        title: linkGroupsTable.title,
      })
      .from(linkGroupsTable)
      .where(
        and(
          eq(linkGroupsTable.userId, user.id),
          eq(linkGroupsTable.visible, true),
          eq(linkGroupsTable.isQuickLinks, false),
        ),
      )
      .orderBy(asc(linkGroupsTable.position));

    for (const group of visibleGroups) {
      const groupLinks = await db
        .select({
          id: linksTable.id,
          platform: linksTable.platform,
          position: linksTable.position,
          slug: linksTable.slug,
          title: linksTable.title,
          url: linksTable.url,
          visible: linksTable.visible,
        })
        .from(linksTable)
        .where(and(eq(linksTable.userId, user.id), eq(linksTable.visible, true), eq(linksTable.groupId, group.id)))
        .orderBy(asc(linksTable.position));

      groups.push({
        groupUrl: group.slug != null ? `${profileUrl}/${group.slug}` : null,
        links: groupLinks,
        name: group.title,
        slug: group.slug,
      });
    }
  }

  return apiSuccess({
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    displayName: user.displayName,
    groups,
    links: ungroupedLinks,
    profileUrl,
    username: user.username,
  });
}

export function OPTIONS() {
  return apiOptions();
}
