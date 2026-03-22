"use server";

import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { isDarkTheme, isValidThemeId } from "@/lib/themes";
import { isValidDomain } from "@/lib/utils/url";
import { addDomain, getDomainConfig, removeDomain, verifyDomain } from "@/lib/vercel";
import { auth } from "@clerk/nextjs/server";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string; success: false } | { success: true; url?: string };

async function updatePageTheme(field: "pageDarkTheme" | "pageLightTheme", theme: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isValidThemeId(theme)) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db
    .update(usersTable)
    .set({ [field]: theme, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning({ username: usersTable.username });

  if (user?.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}

export async function updatePageDarkTheme(theme: string): Promise<ActionResult> {
  if (!isValidThemeId(theme) || !isDarkTheme(theme)) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  return updatePageTheme("pageDarkTheme", theme);
}

export async function updatePageLightTheme(theme: string): Promise<ActionResult> {
  if (!isValidThemeId(theme) || isDarkTheme(theme)) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  return updatePageTheme("pageLightTheme", theme);
}

export async function updateHideBranding(hide: boolean): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || user.tier !== "pro") {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await db.update(usersTable).set({ hideBranding: hide, updatedAt: new Date() }).where(eq(usersTable.id, userId));

  if (user.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}

export async function createCheckoutSession(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      client_reference_id: userId,
      ...(user.stripeCustomerId != null && { customer: user.stripeCustomerId }),
      cancel_url: `${envSchema.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
      line_items: [{ price: envSchema.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      success_url: `${envSchema.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=success`,
    });

    if (session.url == null) {
      return { error: "somethingWentWrongPleaseTryAgain", success: false };
    }

    return { success: true, url: session.url };
  } catch (error) {
    console.error("[createCheckoutSession]", error);
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }
}

export async function createPortalSession(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user?.stripeCustomerId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${envSchema.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("[createPortalSession]", error);
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }
}

// ─── Custom Domain Actions ───────────────────────────────────────────────────

export type VerifyDomainResult =
  | { error: string; status: "error"; success: false }
  | { status: "connected" | "dns_pending" | "ssl_pending"; success: true };

export async function addCustomDomain(domain: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || user.tier !== "pro") {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const normalized = domain.trim().toLowerCase();

  if (!isValidDomain(normalized)) {
    return { error: "pleaseEnterAValidUrl", success: false };
  }

  // Check if domain is already used by another user
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.customDomain, normalized), ne(usersTable.id, userId)))
    .limit(1);

  if (existing != null) {
    return { error: "thisDomainIsAlreadyInUse", success: false };
  }

  // If user already has a different domain, remove it from Vercel first
  if (user.customDomain != null && user.customDomain !== normalized) {
    await removeDomain(user.customDomain);
  }

  const result = await addDomain(normalized);

  if (!result.ok) {
    console.error("[addCustomDomain]", result.error);
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await db
    .update(usersTable)
    .set({ customDomain: normalized, customDomainVerified: false, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  revalidatePath("/dashboard/settings");

  return { success: true };
}

export async function verifyCustomDomain(): Promise<VerifyDomainResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", status: "error", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || user.customDomain == null) {
    return { error: "somethingWentWrongPleaseTryAgain", status: "error", success: false };
  }

  const configResult = await getDomainConfig(user.customDomain);

  if (!configResult.ok || configResult.data.misconfigured) {
    return { error: "dnsNotConfiguredYetPleaseAddTheCnameRecordAndTryAgain", status: "error", success: false };
  }

  const verifyResult = await verifyDomain(user.customDomain);

  if (!verifyResult.ok || !verifyResult.data.verified) {
    return { error: "sslIsBeingProvisionedPleaseWaitAFewMinutesAndTryAgain", status: "error", success: false };
  }

  await db
    .update(usersTable)
    .set({ customDomainVerified: true, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  revalidatePath("/dashboard/settings");
  if (user.username) {
    revalidatePath(`/${user.username}`);
  }

  return { status: "connected", success: true };
}

export async function removeCustomDomain(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || user.customDomain == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await removeDomain(user.customDomain);

  await db
    .update(usersTable)
    .set({ customDomain: null, customDomainVerified: false, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  revalidatePath("/dashboard/settings");
  if (user.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}
