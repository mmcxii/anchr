import { requireApiAuth, requirePro } from "@/lib/api/require-auth";
import { apiOptions, apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db/client";
import { clicksTable } from "@/lib/db/schema/click";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
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

  const dateConditions = [eq(clicksTable.userId, user.id)];
  if (start != null) {
    dateConditions.push(gte(clicksTable.createdAt, start));
  }
  if (end != null) {
    dateConditions.push(lte(clicksTable.createdAt, end));
  }

  const dateExpr = sql<string>`to_char(${clicksTable.createdAt}, 'YYYY-MM-DD')`;

  const rows = await db
    .select({ clicks: count(), date: dateExpr })
    .from(clicksTable)
    .where(and(...dateConditions))
    .groupBy(dateExpr)
    .orderBy(dateExpr);

  return apiSuccess(rows);
}

export function OPTIONS() {
  return apiOptions();
}
