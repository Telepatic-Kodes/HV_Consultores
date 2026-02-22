export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stripeCustomerId } = body as { stripeCustomerId: string };

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "Missing stripeCustomerId" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/dashboard/configuracion`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe Portal Error]", error.message);
    return NextResponse.json(
      { error: error.message || "Error creating portal session" },
      { status: 500 }
    );
  }
}
