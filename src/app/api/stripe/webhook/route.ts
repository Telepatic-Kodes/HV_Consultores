import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function mapPriceIdToPlan(priceId: string): "free" | "pro" | "enterprise" {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return "enterprise";
  return "free";
}

type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "unpaid";

function mapStripeStatus(status: string): SubscriptionStatus {
  const validStatuses: SubscriptionStatus[] = [
    "active",
    "canceled",
    "past_due",
    "trialing",
    "incomplete",
    "unpaid",
  ];
  if (validStatuses.includes(status as SubscriptionStatus)) {
    return status as SubscriptionStatus;
  }
  return "incomplete";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(
      "[Stripe Webhook] Signature verification failed:",
      err.message
    );
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    // Idempotency check: skip if this event was already processed
    const alreadyProcessed = await convex.query(
      api.subscriptions.isBillingEventProcessed,
      { stripeEventId: event.id }
    );
    if (alreadyProcessed) {
      console.log(
        `[Stripe Webhook] Event ${event.id} already processed, skipping.`
      );
      return NextResponse.json({ received: true, skipped: true });
    }

    // Use raw event data to avoid Stripe SDK type version issues
    const eventData = event.data.object as Record<string, any>;

    switch (event.type) {
      case "checkout.session.completed": {
        if (eventData.mode !== "subscription") break;

        const userId = eventData.metadata?.convexUserId;
        const plan = eventData.metadata?.plan as "pro" | "enterprise";
        if (!userId || !plan) break;

        const subscription = await stripe.subscriptions.retrieve(
          eventData.subscription as string
        );
        const subData = subscription as unknown as Record<string, any>;

        await convex.mutation(api.subscriptions.upsertSubscription, {
          userId: userId as any,
          stripeCustomerId: eventData.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subData.items?.data?.[0]?.price?.id,
          plan,
          status: mapStripeStatus(subData.status),
          currentPeriodStart: subData.start_date
            ? new Date(subData.start_date * 1000).toISOString()
            : new Date().toISOString(),
          currentPeriodEnd: subData.current_period_end
            ? new Date(subData.current_period_end * 1000).toISOString()
            : undefined,
          cancelAtPeriodEnd: subData.cancel_at_period_end ?? false,
        });
        break;
      }

      case "customer.subscription.updated": {
        const priceId = eventData.items?.data?.[0]?.price?.id;
        const plan = priceId ? mapPriceIdToPlan(priceId) : "free";
        const userId = eventData.metadata?.convexUserId;

        if (userId) {
          await convex.mutation(api.subscriptions.upsertSubscription, {
            userId: userId as any,
            stripeCustomerId: eventData.customer as string,
            stripeSubscriptionId: eventData.id,
            stripePriceId: priceId,
            plan,
            status: mapStripeStatus(eventData.status),
            currentPeriodStart: eventData.start_date
              ? new Date(eventData.start_date * 1000).toISOString()
              : undefined,
            currentPeriodEnd: eventData.current_period_end
              ? new Date(eventData.current_period_end * 1000).toISOString()
              : undefined,
            cancelAtPeriodEnd: eventData.cancel_at_period_end ?? false,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        await convex.mutation(api.subscriptions.updateSubscriptionStatus, {
          stripeSubscriptionId: eventData.id,
          status: "canceled",
          cancelAtPeriodEnd: false,
        });
        break;
      }

      case "invoice.payment_failed": {
        const subId =
          eventData.subscription_details?.subscription ||
          eventData.subscription;
        if (subId) {
          await convex.mutation(api.subscriptions.updateSubscriptionStatus, {
            stripeSubscriptionId: subId as string,
            status: "past_due",
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    // Return 200 to acknowledge receipt and prevent Stripe retries on
    // permanent processing failures. The error is logged for investigation.
    console.error("[Stripe Webhook] Processing error:", error.message, error.stack);
    return NextResponse.json(
      { received: true, error: "Webhook processing error" },
      { status: 200 }
    );
  }
}
