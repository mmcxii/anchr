import { requireApiAuth, requirePro } from "@/lib/api/require-auth";
import { apiOptions, apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db/client";
import { clicksTable } from "@/lib/db/schema/click";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
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

  const conditions = and(...dateConditions);

  const [browsers, devices, operatingSystems] = await Promise.all([
    db
      .select({ browser: clicksTable.browser, clicks: count() })
      .from(clicksTable)
      .where(conditions)
      .groupBy(clicksTable.browser)
      .orderBy(desc(count())),

    db
      .select({ clicks: count(), device: clicksTable.device })
      .from(clicksTable)
      .where(conditions)
      .groupBy(clicksTable.device)
      .orderBy(desc(count())),

    db
      .select({ clicks: count(), os: clicksTable.os })
      .from(clicksTable)
      .where(conditions)
      .groupBy(clicksTable.os)
      .orderBy(desc(count())),
  ]);

  return apiSuccess({ browsers, devices, operatingSystems });
}

export function OPTIONS() {
  return apiOptions();
}
