import { requireApiAuth, requirePro } from "@/lib/api/require-auth";
import { apiOptions, apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db/client";
import { clicksTable } from "@/lib/db/schema/click";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { parseDateRange } from "../../_utils";

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

  const { end, start } = parseDateRange(new URL(request.url));

  const dateConditions = [eq(clicksTable.userId, user.id), sql`${clicksTable.referrer} is not null`];
  if (start != null) {
    dateConditions.push(gte(clicksTable.createdAt, start));
  }
  if (end != null) {
    dateConditions.push(lte(clicksTable.createdAt, end));
  }

  const rows = await db
    .select({ clicks: count(), referrer: clicksTable.referrer })
    .from(clicksTable)
    .where(and(...dateConditions))
    .groupBy(clicksTable.referrer)
    .orderBy(desc(count()));

  return apiSuccess(rows);
}

export function OPTIONS() {
  return apiOptions();
}
