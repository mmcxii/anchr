import { type ApiKeyRow, ApiKeysClient } from "@/components/dashboard/api-keys/api-keys-client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { apiKeysTable } from "@/lib/db/schema/api-key";
import { initTranslations } from "@/lib/i18n/server";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "API",
};

const ApiPage: React.FC = async () => {
  const user = await requireUser();
  const { t } = await initTranslations();

  const keys = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.userId, user.id))
    .orderBy(desc(apiKeysTable.createdAt));

  const serializedKeys: ApiKeyRow[] = keys.map((key) => ({
    createdAt: key.createdAt.toISOString(),
    id: key.id,
    keyPrefix: key.keyPrefix,
    keySuffix: key.keySuffix,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    name: key.name,
    revokedAt: key.revokedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("api")}</h1>
      <ApiKeysClient keys={serializedKeys} />
    </div>
  );
};

export default ApiPage;
