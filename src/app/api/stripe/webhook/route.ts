import { db } from "@/lib/db/client";
import { ensureQuickLinksGroup } from "@/lib/db/queries/quick-links";
import { usersTable } from "@/lib/db/schema/user";
import { stripe } from "@/lib/stripe";
import { removeDomain } from "@/lib/vercel";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

async function handleDowngrade(customerId: string): Promise<void> {
  const [user] = await db
    .select({ customDomain: usersTable.customDomain, id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);

  if (user?.customDomain != null) {
    try {
      await removeDomain(user.customDomain);
    } catch (error) {
      console.error("[stripe webhook] failed to remove domain from Vercel:", error);
    }
  }

  await db
    .update(usersTable)
    .set({
      customDomain: null,
      customDomainVerified: false,
      stripeSubscriptionId: null,
      tier: "free",
      updatedAt: new Date(),
    })
    .where(eq(usersTable.stripeCustomerId, customerId));
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Missing stripe-signature header or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;

      if (userId == null) {
        break;
      }

      await db
        .update(usersTable)
        .set({
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          tier: "pro",
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId));

      await ensureQuickLinksGroup(userId);

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      if (subscription.status === "active") {
        const [updatedUser] = await db
          .update(usersTable)
          .set({ tier: "pro", updatedAt: new Date() })
          .where(eq(usersTable.stripeCustomerId, customerId))
          .returning({ id: usersTable.id });

        if (updatedUser != null) {
          await ensureQuickLinksGroup(updatedUser.id);
        }
      } else if (["canceled", "past_due", "unpaid"].includes(subscription.status)) {
        await handleDowngrade(customerId);
      }

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await handleDowngrade(customerId);

      break;
    }
  }

  return new Response("OK", { status: 200 });
}
