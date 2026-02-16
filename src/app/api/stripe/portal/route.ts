import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request using the Convex auth token
    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    convex.setAuth(token);

    // Verify the authenticated user's identity
    const profile = await convex.query(api.profiles.getMyProfile, {});
    if (!profile || !profile.userId) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { stripeCustomerId } = body as { stripeCustomerId: string };

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "Missing stripeCustomerId" },
        { status: 400 }
      );
    }

    // Verify the stripeCustomerId belongs to the authenticated user
    const subscription = await convex.query(
      api.subscriptions.getSubscriptionByUserId,
      { userId: profile.userId as any }
    );
    if (!subscription || subscription.stripeCustomerId !== stripeCustomerId) {
      return NextResponse.json(
        { error: "Stripe customer ID does not belong to authenticated user" },
        { status: 403 }
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
