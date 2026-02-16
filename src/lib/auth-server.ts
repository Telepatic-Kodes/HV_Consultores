'use server'

import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Get the profile ID of the currently authenticated user from server actions.
 * Uses the auth token from the Next.js cookie to query Convex.
 */
export async function getServerProfileId(): Promise<Id<"profiles">> {
  const token = await convexAuthNextjsToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  convex.setAuth(token);

  const profile = await convex.query(api.profiles.getMyProfile, {});
  if (!profile) {
    throw new Error("Profile not found");
  }

  return profile._id;
}

/**
 * Get a ConvexHttpClient pre-configured with the current user's auth token.
 */
export async function getAuthenticatedConvex(): Promise<ConvexHttpClient> {
  const token = await convexAuthNextjsToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  convex.setAuth(token);
  return convex;
}
