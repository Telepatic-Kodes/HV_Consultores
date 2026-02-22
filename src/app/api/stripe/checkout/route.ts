export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, PlanKey } from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, userId, email } = body as {
      plan: PlanKey;
      userId: string;
      email: string;
    };

    if (!plan || !userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: plan, userId, email" },
        { status: 400 }
      );
    }

    const planConfig = PLANS[plan];
    if (!planConfig || plan === "free" || !planConfig.priceId) {
      return NextResponse.json(
        { error: "Invalid plan or free plan selected" },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    let customerId: string;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { convexUserId: userId },
      });
      customerId = customer.id;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/configuracion?billing=success&plan=${plan}`,
      cancel_url: `${appUrl}/dashboard/configuracion?billing=canceled`,
      metadata: {
        convexUserId: userId,
        plan,
      },
      subscription_data: {
        metadata: {
          convexUserId: userId,
          plan,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe Checkout Error]", error.message);
    return NextResponse.json(
      { error: error.message || "Error creating checkout session" },
      { status: 500 }
    );
  }
}
