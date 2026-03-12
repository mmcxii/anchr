import { LinkList } from "@/components/dashboard/link-list";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { auth } from "@clerk/nextjs/server";
import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import * as React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
};

const DashboardPage: React.FC = async () => {
  //* State
  const { userId } = await auth();

  //* Variables
  const links =
    userId != null
      ? await db.select().from(linksTable).where(eq(linksTable.userId, userId)).orderBy(asc(linksTable.position))
      : [];

  if (userId == null) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <LinkList links={links} />
    </div>
  );
};

export default DashboardPage;
